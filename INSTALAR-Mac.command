#!/bin/bash
# Instalador para Mac: doble clic (la primera vez: clic derecho → Abrir). Pide tu contraseña de la Mac: es normal.
# Instala con Homebrew lo que falte (Python, Node, ffmpeg) y Claude Code; luego los paquetes de la oficina.
cd "$(dirname "$0")" || exit 1
echo "Oficina de vídeo con Claude Code - instalador para Mac"
echo "Puede tardar 10-20 minutos la primera vez."

if ! command -v brew >/dev/null 2>&1; then
  echo "==> Instalando Homebrew (te pedirá tu contraseña de la Mac)"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  [ -x /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"
  [ -x /usr/local/bin/brew ] && eval "$(/usr/local/bin/brew shellenv)"
fi

echo "==> Programas básicos"
for p in python node ffmpeg git; do
  if brew list "$p" >/dev/null 2>&1 || command -v "$p" >/dev/null 2>&1; then echo "    [listo] $p"; else brew install "$p"; fi
done

if ! command -v claude >/dev/null 2>&1; then
  echo "==> Instalando Claude Code"
  curl -fsSL https://claude.ai/install.sh | bash
  export PATH="$HOME/.local/bin:$PATH"
fi

echo "==> Paquetes de la oficina"
python3 -m pip install --user numpy edge-tts faster-whisper requests 2>/dev/null \
  || python3 -m pip install --user --break-system-packages numpy edge-tts faster-whisper requests
python3 pipeline/revisar_equipo.py --instalar --sin-red

chmod +x ABRIR-OFICINA.command 2>/dev/null
echo ""
echo "Listo. Para abrir la oficina: doble clic a ABRIR-OFICINA.command (puedes arrastrarlo al Dock)."
echo "La primera vez Claude te pide iniciar sesión (necesitas un plan de pago de Claude: Pro o Max)."
echo "Después escribe:  /configurar"
read -r -p "Presiona Enter para cerrar"
