@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
if errorlevel 1 goto directory_error

set "WIKI_RUNTIME="
set "WIKI_RUNTIME_ARGS="

if defined WIKI_PYTHON goto custom_python

py -3 -c "import sys" >nul 2>nul
if not errorlevel 1 goto launcher_python

python -c "import sys" >nul 2>nul
if not errorlevel 1 goto path_python
goto missing_python

:custom_python
if not exist "%WIKI_PYTHON%" goto custom_python_error
set "WIKI_RUNTIME=%WIKI_PYTHON%"
goto check_python

:launcher_python
set "WIKI_RUNTIME=py"
set "WIKI_RUNTIME_ARGS=-3"
goto check_python

:path_python
set "WIKI_RUNTIME=python"
goto check_python

:check_python
"%WIKI_RUNTIME%" %WIKI_RUNTIME_ARGS% -c "import os, sys; custom = os.environ.get('WIKI_PYTHON', ''); sys.exit('ERROR: WIKI_PYTHON must be an absolute executable path.' if custom and not os.path.isabs(custom) else 0)"
if errorlevel 1 goto python_error
"%WIKI_RUNTIME%" %WIKI_RUNTIME_ARGS% -c "import sys; print('Python ' + sys.version.split()[0]); raise SystemExit(0 if sys.version_info >= (3, 10) else 1)"
if errorlevel 1 goto version_error

if not exist "requirements.txt" goto requirements_error
if exist ".venv\Scripts\python.exe" goto check_environment

echo Creating the local Python environment...
"%WIKI_RUNTIME%" %WIKI_RUNTIME_ARGS% -m venv ".venv"
if errorlevel 1 goto environment_error

:check_environment
".venv\Scripts\python.exe" -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)"
if errorlevel 1 goto environment_error
".venv\Scripts\python.exe" -m pip --version >nul 2>nul
if not errorlevel 1 goto install_dependencies
echo Preparing pip inside the local environment...
".venv\Scripts\python.exe" -m ensurepip --upgrade
if errorlevel 1 goto pip_error

:install_dependencies
echo Installing project dependencies. Internet access is required for the first installation.
".venv\Scripts\python.exe" -m pip install --disable-pip-version-check -r "requirements.txt"
if errorlevel 1 goto dependencies_error

echo.
echo Installation completed successfully.
echo Run start.cmd, then open http://127.0.0.1:8000/ in your browser.
call :pause_if_needed
exit /b 0

:directory_error
echo ERROR: Cannot open the project folder. Extract the full ZIP before running this script.
goto failed

:missing_python
echo ERROR: Python was not found. Install Python 3.10 or newer, preferably Python 3.12.
echo Add Python to PATH during installation, or set WIKI_PYTHON to its absolute python.exe path.
goto failed

:custom_python_error
echo ERROR: The executable specified by WIKI_PYTHON does not exist.
echo Set WIKI_PYTHON to the absolute path of an installed python.exe and retry.
goto failed

:python_error
echo ERROR: The selected Python executable could not run or WIKI_PYTHON is not an absolute path.
goto failed

:version_error
echo ERROR: Python 3.10 or newer is required. Python 3.12 is recommended.
echo Install a supported version, or set WIKI_PYTHON to its absolute python.exe path.
goto failed

:requirements_error
echo ERROR: requirements.txt is missing. Extract the complete project folder and retry.
goto failed

:environment_error
echo ERROR: The local .venv environment could not be created or is not usable with Python 3.10 or newer.
echo Check that this folder is writable and that Python includes the venv module.
echo If this .venv came from another computer, move it out of the project and run install.cmd again.
goto failed

:pip_error
echo ERROR: pip could not be prepared inside .venv. Check the Python installation and retry.
goto failed

:dependencies_error
echo ERROR: Project dependencies could not be installed. Check your network connection and retry.
echo No global Python packages were installed by this script.
goto failed

:failed
echo.
call :pause_if_needed
exit /b 1

:pause_if_needed
if not "%WIKI_NO_PAUSE%"=="1" pause
exit /b
