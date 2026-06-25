@echo off
echo ========================================
echo   Life Manager - Personal Life System
echo ========================================
echo.
echo Starting with Docker Compose...
echo.

docker-compose up --build -d

echo.
echo ========================================
echo  Services starting...
echo  Frontend: http://localhost:3000
echo  Backend API: http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo ========================================
echo.
echo Default credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo Press any key to view logs...
pause > nul
docker-compose logs -f
