$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$pythonPath = Join-Path $scriptDir "..\.venv\Scripts\python.exe"

if (-not (Test-Path $pythonPath)) {
    Write-Error "Python virtual environment not found at $pythonPath"
    exit 1
}

& $pythonPath "run.py"
