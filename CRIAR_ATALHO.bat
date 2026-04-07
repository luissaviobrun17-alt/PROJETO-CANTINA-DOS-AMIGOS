@echo off
chcp 65001 >nul
echo ========================================
echo   CRIAR ATALHO - CANTINA DOS AMIGOS
echo ========================================
echo.

REM Copia o arquivo cantina.html para o projeto
xcopy /Y "%~dp0cantina.html" "%USERPROFILE%\Desktop\cantina\"

REM Cria um atalho na área de trabalho
set SCRIPT="%TEMP%\CreateShortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = "%USERPROFILE%\Desktop\🍽️ Cantina dos Amigos.url" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%USERPROFILE%\Desktop\cantina\cantina.html" >> %SCRIPT%
echo oLink.IconLocation = "%USERPROFILE%\Desktop\cantina\cantina.html" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

cscript /nologo %SCRIPT%
del %SCRIPT%

echo.
echo ✅ Atalho criado na área de trabalho!
echo.
echo Nome: 🍽️ Cantina dos Amigos
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
