# Lote semanal desatendido (opcional). Prepara ideas, guiones y textos de la semana siguiente con tu cuenta de Claude Code.
# Ejecución manual: powershell -ExecutionPolicy Bypass -File pipeline\lote_semanal.ps1
# Programarlo (sábados 17:20), en PowerShell:
#   $a = New-ScheduledTaskAction -Execute powershell.exe -Argument "-ExecutionPolicy Bypass -File `"$PWD\pipeline\lote_semanal.ps1`""
#   Register-ScheduledTask -TaskName "Oficina-LoteSemanal" -Action $a -Trigger (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Saturday -At 17:20)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

function SemanaIso([datetime]$d) {
    $jueves = $d.Date.AddDays(3 - (([int]$d.DayOfWeek + 6) % 7))
    $num = [math]::Floor(($jueves.DayOfYear - 1) / 7) + 1
    '{0}-{1:D2}' -f $jueves.Year, [int]$num
}

$hoy = Get-Date
$actual = SemanaIso $hoy
$siguiente = SemanaIso $hoy.AddDays(7)

New-Item -ItemType Directory -Force (Join-Path $raiz 'logs') | Out-Null
$log = Join-Path $raiz "logs\lote-$siguiente.log"

$claude = (Get-Command claude -ErrorAction SilentlyContinue).Source
if (-not $claude) { $claude = Join-Path $env:USERPROFILE '.local\bin\claude.exe' }
$prompt = "Lee y sigue .claude/commands/lote-semanal.md con los argumentos: $actual $siguiente"
$herramientas = 'Agent Read Write Edit Glob Grep WebSearch WebFetch Bash(date:*) Bash(ls:*)'

"=== $(Get-Date -Format s) inicio lote $actual -> $siguiente" | Out-File $log -Append -Encoding utf8
& $claude -p $prompt --permission-mode acceptEdits --allowedTools $herramientas 2>&1 |
    Out-File $log -Append -Encoding utf8
"=== $(Get-Date -Format s) fin (código $LASTEXITCODE)" | Out-File $log -Append -Encoding utf8
