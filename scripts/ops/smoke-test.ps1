<#
.SYNOPSIS
    Post-deploy smoke test for Obliq-io -- verifies the web app and API are
    actually reachable and healthy right after a deploy, instead of trusting
    "the pipeline went green" alone.

.DESCRIPTION
    Hits a handful of cheap, unauthenticated endpoints on both apps and
    asserts they return 2xx within a timeout. Exits non-zero (and fails the
    calling CI job) on any failure, printing a pass/fail table.

.PARAMETER WebUrl
    Base URL of apps/web. Defaults to the local dev server.

.PARAMETER ApiUrl
    Base URL of apps/api. Defaults to the local dev server.

.PARAMETER TimeoutSeconds
    Per-request timeout.

.EXAMPLE
    ./scripts/ops/smoke-test.ps1
    Runs against http://localhost:3000 / http://localhost:4000.

.EXAMPLE
    ./scripts/ops/smoke-test.ps1 -WebUrl https://obliq.vercel.app -ApiUrl https://obliq-api.onrender.com
    Runs against a live deployment. This is the invocation used by
    .github/workflows/deploy.yml after a successful deploy.
#>
param(
    [string]$WebUrl = 'http://localhost:3000',
    [string]$ApiUrl = 'http://localhost:4000',
    [int]$TimeoutSeconds = 15
)

$ErrorActionPreference = 'Stop'

$checks = @(
    @{ Name = 'Web - landing page';   Url = $WebUrl },
    @{ Name = 'Web - login page';     Url = "$WebUrl/login" },
    @{ Name = 'API - health';         Url = "$ApiUrl/health" },
    @{ Name = 'API - docs (Swagger)'; Url = "$ApiUrl/docs" }
)

$results = @()
$failed = $false

foreach ($check in $checks) {
    $status = $null
    $ok = $false
    $errorMessage = $null

    try {
        $response = Invoke-WebRequest -Uri $check.Url -Method Get -TimeoutSec $TimeoutSeconds -UseBasicParsing
        $status = $response.StatusCode
        $ok = $status -ge 200 -and $status -lt 400
    }
    catch {
        # Invoke-WebRequest throws on non-2xx by default -- recover the real status code.
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
        }
        $errorMessage = $_.Exception.Message
    }

    if (-not $ok) { $failed = $true }

    $results += [PSCustomObject]@{
        Check  = $check.Name
        Url    = $check.Url
        Status = if ($status) { $status } else { 'ERROR' }
        Result = if ($ok) { 'PASS' } else { 'FAIL' }
    }

    if (-not $ok -and $errorMessage) {
        Write-Host "  -> $($check.Name): $errorMessage" -ForegroundColor DarkYellow
    }
}

Write-Host ''
$results | Format-Table -AutoSize | Out-String | Write-Host

if ($failed) {
    Write-Host 'Smoke test FAILED.' -ForegroundColor Red
    exit 1
}

Write-Host "Smoke test passed - $($results.Count)/$($results.Count) checks OK." -ForegroundColor Green
exit 0
