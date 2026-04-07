@echo off
chcp 65001 >nul
echo ========================================
echo   ATUALIZADOR - CANTINA DOS AMIGOS
echo ========================================
echo.
echo Copiando arquivos atualizados...
echo.

REM Copia TODOS os arquivos JavaScript atualizados
xcopy /Y "%~dp0js\*.js" "%USERPROFILE%\Desktop\cantina\js\"

REM Copia o arquivo CSS atualizado
xcopy /Y "%~dp0css\style.css" "%USERPROFILE%\Desktop\cantina\css\"

REM Copia a pasta assets (imagens)
xcopy /Y /I /E "%~dp0assets" "%USERPROFILE%\Desktop\cantina\assets"

REM Copia todos os HTMLs e Scripts de Instalação
xcopy /Y "%~dp0*.html" "%USERPROFILE%\Desktop\cantina\"
xcopy /Y "%~dp0*.bat" "%USERPROFILE%\Desktop\cantina\"
xcopy /Y "%~dp0*.ps1" "%USERPROFILE%\Desktop\cantina\"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Arquivos atualizados com sucesso!
    echo.
    echo Alterações aplicadas:
    echo - Botão COMPRAS restaurado
    echo - Assinaturas fixas no final da página A4
    echo - 20 itens por página
    echo - Ícones de editar/excluir maiores
    echo - Impressão limpa (sem bordas coloridas)
    echo.
) else (
    echo ❌ Erro ao copiar arquivos!
    echo.
    echo Tentando caminho alternativo...
    
    REM Tenta outros caminhos possíveis
    xcopy /Y "%~dp0js\app.js" "C:\cantina\js\"
    xcopy /Y "%~dp0css\style.css" "C:\cantina\css\"
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Arquivos atualizados em C:\cantina\
    ) else (
        echo ❌ Não foi possível encontrar a pasta do projeto.
        echo.
        echo Por favor, copie manualmente os arquivos:
        echo ORIGEM: %~dp0js\app.js
        echo ORIGEM: %~dp0css\style.css
        echo DESTINO: [pasta do projeto]\js\ e \css\
    )
)

echo.
echo Pressione qualquer tecla para fechar...
pause >nul
