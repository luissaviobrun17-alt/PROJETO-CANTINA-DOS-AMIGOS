$Path = "c:\Users\luiss\.gemini\antigravity\playground\giant-universe\index.html"
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "CANTINA DOS AMIGOS.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $Path
$Shortcut.IconLocation = "shell32.dll,149"
$Shortcut.Save()

Write-Host "Atalho criado com sucesso na sua Área de Trabalho!"
