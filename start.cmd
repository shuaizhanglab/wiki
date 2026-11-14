@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Python environment is missing. Run install.cmd first.
  if not defined WIKI_NO_PAUSE pause
  exit /b 1
)
".venv\Scripts\python.exe" -c "import mkdocs" >nul 2>&1
if errorlevel 1 (
  echo Dependencies are missing. Run install.cmd first.
  if not defined WIKI_NO_PAUSE pause
  exit /b 1
)
if not defined WIKI_PORT set "WIKI_PORT=8000"
".venv\Scripts\python.exe" -c "import os,sys; p=os.environ['WIKI_PORT']; sys.exit(0 if p.isdecimal() and int(p) in range(1,65536) else 1)" >nul 2>&1
if errorlevel 1 (
  echo WIKI_PORT must be a number between 1 and 65535.
  if not defined WIKI_NO_PAUSE pause
  exit /b 1
)
set "WIKI_OPEN_FLAG=--open"
if defined WIKI_NO_OPEN set "WIKI_OPEN_FLAG="
echo Open http://127.0.0.1:%WIKI_PORT%/ in your browser. Press Ctrl+C to stop.
".venv\Scripts\python.exe" -m mkdocs serve --dev-addr "127.0.0.1:%WIKI_PORT%" %WIKI_OPEN_FLAG%
set "WIKI_EXIT_CODE=%ERRORLEVEL%"
if not "%WIKI_EXIT_CODE%"=="0" if not defined WIKI_NO_PAUSE pause
exit /b %WIKI_EXIT_CODE%

