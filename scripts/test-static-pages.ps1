# ============================================================
# scripts/test-static-pages.ps1
# ------------------------------------------------------------
# 跑 next build 并验证核心页面在 Route Table 中显示为 ○ (Static)
# 用法（项目根目录）：
#   powershell -ExecutionPolicy Bypass -File scripts\test-static-pages.ps1
# ============================================================

$ErrorActionPreference = 'Stop'

$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path
$Pages = @(
  '/guan/lifecode'
  '/wen/zen'
  '/wen/light-solution'
  '/guan/wealth'
  '/guan/family'
)
$LogFile = Join-Path $ProjectRoot '.next\build-test.log'

Set-Location $ProjectRoot

Write-Host ""
Write-Host "==> Project: $ProjectRoot" -ForegroundColor Cyan
Write-Host "==> Target pages: $($Pages -join ', ')" -ForegroundColor Cyan
Write-Host ""

# 1) 清理
if (Test-Path '.next') {
  Write-Host "[1/3] Cleaning .next/ ..." -ForegroundColor Yellow
  Remove-Item -Recurse -Force '.next' | Out-Null
}

# 2) 跑 build
Write-Host "[2/3] Running npm run build (log -> $LogFile) ..." -ForegroundColor Yellow
$buildStart = Get-Date
$proc = Start-Process -FilePath 'npm.cmd' `
  -ArgumentList 'run','build','--','--no-lint' `
  -WorkingDirectory $ProjectRoot `
  -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$LogFile.out" `
  -RedirectStandardError  "$LogFile.err"
$buildMs = (Get-Date) - $buildStart
Write-Host ("==> build took: {0:N1}s  exit: {1}" -f $buildMs.TotalSeconds, $proc.ExitCode) -ForegroundColor Cyan

if ($proc.ExitCode -ne 0) {
  Write-Host "[!] build failed, see $LogFile.err" -ForegroundColor Red
  exit 1
}

# 3) 解析 Route Table
$log = (Get-Content "$LogFile.out" -Raw -ErrorAction SilentlyContinue) + "`n" + (Get-Content "$LogFile.err" -Raw -ErrorAction SilentlyContinue)

# Next.js Route 行格式：
#   "○ /wen/zen                                       87.2 kB         100 kB"
#   "λ /wen/zen                                       ..."
# 正则：开头是符号，紧跟着一个空格 + path
$rx = [regex]'^\s*([○λƒ★])\s+(\S+)\s+(.*)$'

$found = @{}
foreach ($line in $log -split "`n") {
  $m = $rx.Match($line)
  if ($m.Success) {
    $sym = $m.Groups[1].Value
    $path = $m.Groups[2].Value
    $detail = $m.Groups[3].Trim()
    $found[$path] = @{ Sym = $sym; Detail = $detail }
  }
}

Write-Host ""
Write-Host "[3/3] Route Table summary:" -ForegroundColor Yellow
Write-Host ("{0,-32} {1,-12} {2,-8} {3}" -f 'Route','Symbol','Status','Detail') -ForegroundColor White
Write-Host ("{0,-32} {1,-12} {2,-8} {3}" -f '-----','------','------','------') -ForegroundColor DarkGray

# 静态圆圈符号 ○ 用 char 码以兼容 PowerShell 5.1 + 非 UTF-8 控制台
$StaticSymbol = [char]0x25CB   # '○'

$allPass = $true
foreach ($p in $Pages) {
  if ($found.ContainsKey($p)) {
    $entry = $found[$p]
    $isStatic = $entry.Sym -eq $StaticSymbol
    $mark = 'FAIL'
    if ($isStatic) { $mark = 'PASS' }
    $color = 'Red'
    if ($isStatic) { $color = 'Green' }
    Write-Host ("{0,-32} {1,-12} {2,-8} {3}" -f $p, $entry.Sym, $mark, $entry.Detail) -ForegroundColor $color
    if (-not $isStatic) { $allPass = $false }
  } else {
    Write-Host ("{0,-32} {1,-12} {2,-8} {3}" -f $p, '?', 'FAIL', 'NOT IN ROUTE TABLE') -ForegroundColor Red
    $allPass = $false
  }
}

# 列出其它动态页面（仅警告）
Write-Host ""
Write-Host "==> Other dynamic pages (informational only):" -ForegroundColor DarkGray
$dynamic = $found.GetEnumerator() |
  Where-Object { $_.Value.Sym -ne $StaticSymbol -and ($_.Key -notmatch '^/api') } |
  Select-Object -First 20
foreach ($d in $dynamic) {
  Write-Host ("    {0,-30} {1}" -f $d.Key, $d.Value.Sym) -ForegroundColor DarkGray
}

Write-Host ""
if ($allPass) {
  Write-Host "OK All 5 core pages marked as Static" -ForegroundColor Green
  exit 0
} else {
  Write-Host "FAIL Some pages are not static. Check page.tsx exports." -ForegroundColor Red
  exit 1
}
