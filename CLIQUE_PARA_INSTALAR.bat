@echo off
chcp 65001 >nul
echo ========================================
2: echo   INICIANDO INSTALADOR...
echo ========================================
powershell -ExecutionPolicy Bypass -File "%~dp0INSTALAR_SISTEMA.ps1"
pause
