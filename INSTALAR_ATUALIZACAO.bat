@echo off
echo ========================================
echo  INSTALANDO ATUALIZACAO - CANTINA DOS AMIGOS
echo ========================================
echo.

REM Define o diretorio de destino
set "DESTINO=%USERPROFILE%\Desktop\cantina-dos-amigos"

REM Verifica se o diretorio existe
if not exist "%DESTINO%" (
    echo [ERRO] Diretorio nao encontrado: %DESTINO%
    echo.
    pause
    exit /b 1
)

echo [1/2] Copiando arquivos atualizados...
xcopy /Y /Q "%~dp0index.html" "%DESTINO%\"

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao copiar arquivos!
    pause
    exit /b 1
)

echo [2/2] Instalacao concluida com sucesso!
echo.
echo ========================================
echo  ALTERACOES APLICADAS:
echo ========================================
echo  - Botao COMPRAS restaurado ao modelo padrao
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
