@echo off
REM --- GaoGamer Full Application Starter ---

echo Starting Backend Server...
start "Backend" cmd /k "cd /d g:\Web\2026\Games\GaoGamer\backend && if exist .\venv\Scripts\activate.bat (call .\venv\Scripts\activate.bat) else (echo [ERROR] ไม่พบ venv ที่ backend\venv & echo โปรดสร้าง venv และติดตั้ง requirements.txt) && set FLASK_APP=app.py && set FLASK_ENV=development && flask run --host=0.0.0.0 --port=5000"

echo Starting Frontend Server...
start "Frontend" cmd /k "cd /d g:\Web\2026\Games\GaoGamer\frontend && npm start"

echo Waiting for servers to be ready...
timeout /t 15 /nobreak

echo Opening application in Chrome...
start chrome http://localhost:3000

echo All processes started.
