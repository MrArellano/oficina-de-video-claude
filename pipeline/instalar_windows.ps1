# Instalador para Windows: deja la PC lista para la oficina (lo llama INSTALAR-Windows.bat con doble clic).
# Instala con winget lo que falte: Git, Python, Node.js, ffmpeg y Claude Code. Despues los paquetes de Python,
# los de video-studio y el navegador de Remotion. Al final crea el acceso "Oficina de video" en el escritorio.
# Nunca pide ni guarda claves. Se puede correr las veces que quieras: lo que ya esta instalado se salta.
param([switch]$SoloRevisar)

$ErrorActionPreference = "Continue"
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

function Escribir-Paso($texto) { Write-Host ""; Write-Host "==> $texto" -ForegroundColor Cyan }
function Escribir-Ok($texto) { Write-Host "    [listo] $texto" -ForegroundColor Green }
function Escribir-Aviso($texto) { Write-Host "    [ojo] $texto" -ForegroundColor Yellow }

function Actualizar-Path {
    $m = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $u = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$m;$u"
}

function Probar-Comando($exe, $arg) {
    # Ojo: en Windows nuevo, "python" puede ser un atajo que abre la Tienda. Por eso se prueba que responda.
    try {
        $salida = & $exe $arg 2>$null
        if ($LASTEXITCODE -eq 0 -and $salida) { return ($salida | Select-Object -First 1).ToString().Trim() }
    } catch {}
    return $null
}

Write-Host "Oficina de video con Claude Code - instalador" -ForegroundColor White
Write-Host "Carpeta: $raiz"
Write-Host "Esto puede tardar 10-20 minutos la primera vez. Si Windows pregunta si permites cambios, di que Si."

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Escribir-Aviso "Falta 'winget' (Instalador de aplicaciones de Microsoft)."
    Write-Host "    Abre la Microsoft Store, busca 'Instalador de aplicacion' (App Installer), actualizalo y vuelve a correr esto."
    Start-Process "ms-windows-store://pdp/?ProductId=9NBLGGH4NNS1"
    exit 1
}

$programas = @(
    @{ Nombre = "Git (lo necesita Claude Code)"; Id = "Git.Git";           Exe = "git";    Arg = "--version" },
    @{ Nombre = "Python";                        Id = "Python.Python.3.12"; Exe = "python"; Arg = "--version" },
    @{ Nombre = "Node.js";                       Id = "OpenJS.NodeJS.LTS";  Exe = "node";   Arg = "--version" },
    @{ Nombre = "ffmpeg (video y audio)";        Id = "Gyan.FFmpeg";        Exe = "ffmpeg"; Arg = "-version" },
    @{ Nombre = "Claude Code";                   Id = "Anthropic.ClaudeCode"; Exe = "claude"; Arg = "--version" }
)

Escribir-Paso "1/4 Programas basicos"
$faltaron = @()
foreach ($p in $programas) {
    $v = Probar-Comando $p.Exe $p.Arg
    if ($v) { Escribir-Ok "$($p.Nombre): $v"; continue }
    if ($SoloRevisar) { Escribir-Aviso "$($p.Nombre): no esta"; $faltaron += $p.Nombre; continue }
    Write-Host "    Instalando $($p.Nombre)..."
    winget install --id $p.Id -e --silent --accept-package-agreements --accept-source-agreements --scope user 2>$null
    if ($LASTEXITCODE -ne 0) {
        # Algunos paquetes no aceptan "--scope user": se reintenta sin el.
        winget install --id $p.Id -e --silent --accept-package-agreements --accept-source-agreements
    }
    Actualizar-Path
    $v = Probar-Comando $p.Exe $p.Arg
    if (-not $v -and $p.Id -eq "Anthropic.ClaudeCode") {
        Write-Host "    Probando el instalador oficial de Claude Code..."
        try { Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression } catch {}
        $env:Path = "$env:Path;$env:USERPROFILE\.local\bin"
        $v = Probar-Comando $p.Exe $p.Arg
    }
    if ($v) { Escribir-Ok "$($p.Nombre): $v" } else { Escribir-Aviso "$($p.Nombre) se instalo pero aun no responde (se arregla al reiniciar la PC)"; $faltaron += $p.Nombre }
}

if ($SoloRevisar) {
    Escribir-Paso "Solo revision: no se instalo nada."
    if ($faltaron.Count -gt 0) { Write-Host "    Faltan: $($faltaron -join ', ')" }
    exit 0
}

if (-not (Probar-Comando "python" "--version") -or -not (Probar-Comando "node" "--version")) {
    Escribir-Aviso "Python o Node aun no responden. Reinicia la PC y vuelve a dar doble clic a INSTALAR-Windows.bat."
    exit 1
}

Escribir-Paso "2/4 Paquetes de la oficina (voces gratis, transcripcion, motor de video)"
python pipeline/revisar_equipo.py --instalar --sin-red | Out-Host

Escribir-Paso "3/4 Acceso directo en el escritorio"
$abrir = Join-Path $raiz "ABRIR-OFICINA.bat"
try {
    $escritorio = [Environment]::GetFolderPath("Desktop")
    $sh = New-Object -ComObject WScript.Shell
    $acceso = $sh.CreateShortcut((Join-Path $escritorio "Oficina de video.lnk"))
    $acceso.TargetPath = $abrir
    $acceso.WorkingDirectory = $raiz
    $acceso.Save()
    Escribir-Ok "En tu escritorio: 'Oficina de video'"
} catch { Escribir-Aviso "No pude crear el acceso. Usa ABRIR-OFICINA.bat dentro de la carpeta." }

Escribir-Paso "4/4 Listo"
if ($faltaron.Count -gt 0) {
    Escribir-Aviso "Quedaron pendientes: $($faltaron -join ', '). Reinicia la PC y vuelve a correr el instalador."
} else {
    Write-Host "    Todo instalado." -ForegroundColor Green
}
Write-Host ""
Write-Host "Ahora abre 'Oficina de video' en tu escritorio."
Write-Host "La primera vez Claude te pide iniciar sesion en el navegador (necesitas un plan de pago de Claude: Pro o Max)."
Write-Host "Despues escribe:  /configurar"
