#!/bin/bash
# Abre la oficina en Mac (doble clic).
cd "$(dirname "$0")" || exit 1
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
command -v claude >/dev/null 2>&1 || { echo "Falta Claude Code: da doble clic a INSTALAR-Mac.command primero."; read -r; exit 1; }
claude
