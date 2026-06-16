$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Set-Location "c:\Users\lujie\Documents\trae_projects\lingjingge"

# Use 52b5cd3 (initial commit) for all the user-facing pages
$commit = "52b5cd3f9ce1f7d92f6cee9541826d657352a2de"

$files = @(
    "src/app/ai-zen-master/page.tsx",
    "src/app/health/page.tsx",
    "src/app/name/page.tsx",
    "src/app/mind/page.tsx",
    "src/app/meditation/page.tsx",
    "src/app/login/page.tsx",
    "src/app/library/page.tsx",
    "src/app/library/[slug]/page.tsx",
    "src/app/profile/page.tsx",
    "src/app/profile/subscriptions/page.tsx",
    "src/app/pricing/page.tsx",
    "src/app/pricing/PricingPage.tsx"
)

foreach ($f in $files) {
    $dir = Split-Path $f -Parent
    if ($dir -and -not (Test-Path $dir)) {
        $null = New-Item -ItemType Directory -Force -Path $dir
    }

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "git.exe"
    $psi.Arguments = "cat-file -p `"$commit`:$f`""
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.EnvironmentVariables["GIT_PAGER"] = "cat"

    $p = [System.Diagnostics.Process]::Start($psi)
    $p.WaitForExit()
    $ms = New-Object System.IO.MemoryStream
    $p.StandardOutput.BaseStream.CopyTo($ms)
    $bytes = $ms.ToArray()
    $err = $p.StandardError.ReadToEnd()

    if ($bytes.Length -lt 10 -or $err.Length -gt 0) {
        Write-Host "MISS  $f  err=$err  len=$($bytes.Length)"
        continue
    }

    [System.IO.File]::WriteAllBytes($f, $bytes)
    Write-Host ("OK   {0,6}  {1}" -f $bytes.Length, $f)
}

Remove-Item "_raw_ai.bin","_orig_ai.bin","_restore.ps1","_raw.bin" -ErrorAction SilentlyContinue
Write-Host "DONE"
