@echo off
setlocal
cd /d "%~dp0"

echo Starting Electron (local binary)...
REM -> Vermijdt npm/PowerShell/Path-issues door rechtstreeks de lokale electron.cmd te starten
if exist "%~dp0node_modules\.bin\electron.cmd" (
  "%~dp0node_modules\.bin\electron.cmd" .
) else (
  echo Electron not found. Installing locally...
  call "%ProgramFiles%\nodejs\npm.cmd" i -D electron
  if exist "%~dp0node_modules\.bin\electron.cmd" (
    "%~dp0node_modules\.bin\electron.cmd" .
  ) else (
    echo Failed to install Electron. Check Node/npm installation.
    pause
    exit /b 1
  )
)

echo.
echo Done. Press any key to close.
pause >nul
endlocal
