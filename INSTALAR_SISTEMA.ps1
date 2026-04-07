# Script de Instalação Profissional - CANTINA DOS AMIGOS
# Este script copia os arquivos do projeto para uma pasta local e cria um atalho no Desktop.

$projectName = "CantinaDosAmigos"
$installPath = "C:\$projectName"
$sourcePath = $PSScriptRoot

Write-Host "================================================" -ForegroundColor Gold
Write-Host "   INSTALADOR - CANTINA DOS AMIGOS" -ForegroundColor Gold
Write-Host "================================================" -ForegroundColor Gold
Write-Host ""

# 1. Criar pasta de instalação
if (!(Test-Path $installPath)) {
    Write-Host "[1/3] Criando pasta de instalação em $installPath..."
    New-Item -ItemType Directory -Path $installPath -Force | Out-Null
}

# 2. Copiar arquivos (HTML, CSS, JS, Assets)
Write-Host "[2/3] Copiando arquivos do sistema..."
xcopy /E /Y /I "$sourcePath\*" "$installPath\" | Out-Null

# 3. Criar Atalho no Desktop
Write-Host "[3/3] Criando atalho no Desktop..."
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Cantina dos Amigos.lnk")
$Shortcut.TargetPath = "$installPath\index.html"
$Shortcut.IconLocation = "$installPath\assets\logo_3d.png" # Usando o logo como ícone
$Shortcut.WorkingDirectory = $installPath
$Shortcut.Save()

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "   INSTALAÇÃO CONCLUÍDA COM SUCESSO! :)" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "Você já pode abrir o sistema pelo atalho no seu Desktop."
Write-Host ""
pause
