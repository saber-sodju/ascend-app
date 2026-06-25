@echo off
title Life Manager - Backend
cd /d "%~dp0backend"
echo Starting backend on http://localhost:8000
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
