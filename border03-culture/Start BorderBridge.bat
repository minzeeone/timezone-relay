@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo The app's Python environment is missing.
  echo Run the setup steps in README.md once, then try again.
  pause
  exit /b 1
)

start "BorderBridge" /min ".venv\Scripts\python.exe" -m streamlit run "app.py" --server.port 8501
timeout /t 2 /nobreak >nul
start "" "http://localhost:8501"
