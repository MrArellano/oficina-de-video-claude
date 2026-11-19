# Permite que el teléfono abra la página de subida (pipeline/recibir_videos.py).
# Se corre una sola vez, como administrador.
# 1) Marca el Wi-Fi actual como red Privada (red de casa).
# 2) Abre el puerto TCP 8000 solo en redes privadas y solo para equipos de la misma red local.
$ErrorActionPreference = 'Stop'

Get-NetConnectionProfile | Where-Object { $_.InterfaceAlias -eq 'Wi-Fi' } |
    Set-NetConnectionProfile -NetworkCategory Private

$nombre = 'Oficina - subida de clips (puerto 8000)'
Get-NetFirewallRule -DisplayName $nombre -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule -DisplayName $nombre -Direction Inbound -Action Allow -Protocol TCP `
    -LocalPort 8000 -Profile Private -RemoteAddress LocalSubnet | Out-Null

Write-Host 'Listo: red en Privada y puerto 8000 abierto solo en tu red de casa.'
Start-Sleep -Seconds 4
