@echo off
chcp 65001 >nul
title ATUALIZADOR DE SISTEMA - CANTINA DOS AMIGOS

echo ========================================================
echo   RESTAURAÇÃO E ATUALIZAÇÃO DO SISTEMA
echo ========================================================
echo.
echo Identificamos arquivos desatualizados. Iniciando reparo...
echo.

call "%~dp0ATUALIZAR_NO_PC.bat"

echo.
echo ========================================================
echo   PROCESSO CONCLUÍDO!
echo ========================================================
echo   O sistema foi atualizado e os bugs corrigidos.
echo   Seus dados devem reaparecer automaticamente.
echo.
pause
