#!/usr/bin/env pwsh
# ============================================================
# 一键把 .env.local 里的 Dify 密钥同步到 Vercel
# ============================================================
# 适用：本地已有 DIFY_*_API_KEY，但部署到 Vercel 后看到的是 mock 回复
# 用法：
#   1. 先 `vercel login` 完成登录（一次性）
#   2. 在项目根目录执行： pwsh scripts/sync-dify-env-to-vercel.ps1
#   3. 脚本会逐个把 DIFY_*_API_KEY 推送到 Vercel 三套环境
# ============================================================

$ErrorActionPreference = 'Stop'

# 1. 读取 .env.local
$envFile = Join-Path $PSScriptRoot '..\.env.local'
if (-not (Test-Path $envFile)) {
  Write-Host "❌ 找不到 .env.local，请先在项目根目录创建并填入 DIFY_*_API_KEY" -ForegroundColor Red
  exit 1
}

Write-Host "📂 读取 $envFile ..." -ForegroundColor Cyan
$difyVars = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*#') { return }   # 跳过注释
  if ($_ -notmatch '^DIFY_[A-Z_]+\s*=') { return }  # 只关心 DIFY_* 变量
  $parts = $_ -split '=', 2
  $k = $parts[0].Trim()
  $v = $parts[1].Trim()
  # 跳过占位符
  if ($v -match '^__FILL_IN|^<.+>$|^your-') { return }
  $difyVars[$k] = $v
}

if ($difyVars.Count -eq 0) {
  Write-Host "❌ .env.local 里没有可用的 DIFY_*_API_KEY" -ForegroundColor Red
  exit 1
}

Write-Host "✅ 找到 $($difyVars.Count) 个 DIFY 密钥：" -ForegroundColor Green
$difyVars.Keys | Sort-Object | ForEach-Object {
  $v = $difyVars[$_]
  $mask = if ($v.Length -gt 14) { $v.Substring(0,12) + "..." } else { $v }
  Write-Host "   $_ = $mask"
}

# 2. 检查 vercel CLI 是否登录
Write-Host "`n🔐 检查 Vercel CLI 登录状态 ..." -ForegroundColor Cyan
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Vercel CLI 未登录，请先执行： vercel login" -ForegroundColor Red
  exit 1
}
Write-Host "✅ 已登录： $whoami" -ForegroundColor Green

# 3. 确保当前目录已 link 到 Vercel 项目
Write-Host "`n🔗 确认项目链接 ..." -ForegroundColor Cyan
$linkCheck = vercel link 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "⚠️  链接过程有警告（通常可忽略）" -ForegroundColor Yellow
}

# 4. 逐个把密钥添加到 Vercel（production / preview / development 三套环境）
$envs = @('production', 'preview', 'development')
$ok = 0
$fail = 0

foreach ($k in ($difyVars.Keys | Sort-Object)) {
  $v = $difyVars[$k]
  foreach ($env in $envs) {
    Write-Host "   ➕  $k -> $env ... " -NoNewline
    # 管道方式注入，避免交互
    $v | vercel env add $k $env --yes 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Write-Host "✓" -ForegroundColor Green
      $ok++
    } else {
      Write-Host "✗" -ForegroundColor Red
      $fail++
    }
  }
}

Write-Host "`n========== 同步结果 ==========" -ForegroundColor Cyan
Write-Host "成功： $ok" -ForegroundColor Green
Write-Host "失败： $fail" -ForegroundColor Red
if ($fail -eq 0) {
  Write-Host "`n🎉 全部同步完成！Vercel 下次部署即可使用真实 Dify。" -ForegroundColor Green
  Write-Host "   触发重新部署： vercel --prod  或 直接 git push 触发自动部署" -ForegroundColor Yellow
}
