@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo.
  echo [BorderBridge] The required Python environment was not found.
  echo Run the setup command in README.md once, then double-click this file again.
  echo.
  pause
  exit /b 1
)

echo Starting BorderBridge Culture AI...
echo Keep this window open while using the app. Press Ctrl+C to stop it.
echo.
".venv\Scripts\python.exe" -m streamlit run app.py

if errorlevel 1 (
  echo.
  echo BorderBridge could not start. Please check the message above.
  pause
)
