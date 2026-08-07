# ============================================================
# scripts/check-static-config.ps1
# ------------------------------------------------------------
# 轻量烟雾测试：无需跑 build，直接检查 page.tsx 是否符合
# "静态壳 + 动态块" SSG 模板（不保证 build 一定成功，但能
# 在编码阶段提前发现漏写 force-static 的页面）。
# 用法：
#   powershell -ExecutionPolicy Bypass -File scripts\check-static-config.ps1
# ------------------------------------------------------------
# 注意：禁止使用 $a/$b/$c/$d 单字母变量，会被 $args[0..3] 覆盖
# ============================================================

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $ProjectRoot

$PAGES = @(
  @{ Path = 'src\app\guan\lifecode\page.tsx';      Route = '/guan/lifecode' }
  @{ Path = 'src\app\wen\zen\page.tsx';            Route = '/wen/zen' }
  @{ Path = 'src\app\wen\light-solution\page.tsx'; Route = '/wen/light-solution' }
  @{ Path = 'src\app\guan\wealth\page.tsx';        Route = '/guan/wealth' }
  @{ Path = 'src\app\guan\family\page.tsx';        Route = '/guan/family' }
)

Write-Host ""
Write-Host "==> SSG 配置烟雾测试" -ForegroundColor Cyan
Write-Host ("{0,-32} {1,-12} {2,-14} {3,-20} {4}" -f 'Route','force-static','revalidate','generateStaticParams','Shell') -ForegroundColor White
Write-Host ("{0,-32} {1,-12} {2,-14} {3,-20} {4}" -f '-----','-------------','-----------','------------------','-----') -ForegroundColor DarkGray

$allPass = $true
foreach ($p in $PAGES) {
  $abs = Join-Path $ProjectRoot $p.Path
  if (-not (Test-Path $abs)) {
    Write-Host ("{0,-32} {1}" -f $p.Route, 'FILE NOT FOUND') -ForegroundColor Red
    $allPass = $false
    continue
  }

  $content = Get-Content $abs -Raw

  # 用 .Contains() 做子串匹配：绕开 -match 在 PowerShell 5.1 上
  # 解析某些含连字符 pattern 时的怪异行为
  $hasDyn         = $content.Contains('force-static')
  $hasRev         = $content.Contains('revalidate')
  $hasParams      = $content.Contains('generateStaticParams')
  $hasShellClient = $content.Contains('next/dynamic') -or $content.Contains('Shell') -or $content.Contains('PageClient')
  $hasLegacy      = $content.Contains('force-dynamic')

  # PowerShell 5.1 不支持 if-else 作表达式，这里用 5.1 兼容写法
  $markDyn = 'MISS'; if ($hasDyn) { $markDyn = 'OK' }
  $markRev = 'OPT';  if ($hasRev) { $markRev = 'OK' }
  $markPar = 'OPT';  if ($hasParams) { $markPar = 'OK' }
  $markShl = 'MISS'; if ($hasShellClient) { $markShl = 'OK' }

  $color = 'Red'
  if (($markDyn -eq 'OK') -and ($markShl -eq 'OK') -and (-not $hasLegacy)) { $color = 'Green' }
  Write-Host ("{0,-32} {1,-12} {2,-14} {3,-20} {4}" -f $p.Route, $markDyn, $markRev, $markPar, $markShl) -ForegroundColor $color

  if ($color -eq 'Red') { $allPass = $false }
}

Write-Host ""
if ($allPass) {
  Write-Host "OK smoke test passed (run scripts\test-static-pages.ps1 for real build verification)" -ForegroundColor Green
  exit 0
} else {
  Write-Host "FAIL some page missing force-static or Shell/Client" -ForegroundColor Red
  exit 1
}
