@echo off
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

set PYTHON_PATH=%SCRIPT_DIR%..\.venv\Scripts\python.exe
if not exist "%PYTHON_PATH%" (
  echo Python virtual environment not found at %PYTHON_PATH%
  exit /b 1
)

"%PYTHON_PATH%" run.py
