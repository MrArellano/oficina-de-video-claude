"""Barra de progreso (0-100 %) de los renders de video-studio.

Uso:
  python pipeline/progreso.py                  # vigila los proyectos que tienen render.log reciente
  python pipeline/progreso.py slug1 slug2 ...  # vigila esos proyectos
  python pipeline/progreso.py --una-vez        # imprime una vez y sale

Lee projects/<slug>/render.log (lo escribe dialog.py) y props.json. Ctrl+C para salir.
"""
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
ANCHO = 40


def estado(slug):
    proj = ROOT / "projects" / slug
    log = proj / "render.log"
    props = proj / "props.json"
    if not props.exists():
        return 0, 1, "esperando"
    total = max(1, int(round(json.loads(props.read_text(encoding="utf-8"))["duration"] * FPS)))
    txt = log.read_text(encoding="utf-8", errors="ignore") if log.exists() else ""
    if "VIDEO:" in txt:
        return total, total, "listo" if "PORTADA:" in txt else "portada…"
    if "Traceback" in txt or "Error:" in txt:
        return 0, total, "ERROR (ver render.log)"
    if not txt:
        return 0, total, "en cola"
    # Each chunk prints "Rendered a/b" from 1 upwards; a drop in "a" means a new chunk started.
    hecho, prev, maxa = 0, -1, 0
    for a, b in re.findall(r"Rendered (\d+)/(\d+)", txt):
        a = int(a)
        if a < prev:
            hecho += maxa; maxa = 0
        maxa = max(maxa, a); prev = a
    hecho += maxa
    if hecho == 0:
        return 0, total, "voces…" if "remotion" not in txt.lower() else "preparando…"
    return min(hecho, total), total, "renderizando" if hecho < total else "uniendo…"


def barra(p):
    llenos = int(p * ANCHO)
    return "█" * llenos + "░" * (ANCHO - llenos)


def proyectos():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if args:
        return args
    hace = time.time() - 6 * 3600
    logs = sorted((p for p in (ROOT / "projects").glob("*/render.log") if p.stat().st_mtime > hace), key=lambda p: p.stat().st_mtime)
    return [p.parent.name for p in logs]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    una = "--una-vez" in sys.argv
    t0 = time.time()
    while True:
        slugs = proyectos()
        filas, H, T = [], 0, 0
        for s in slugs:
            h, t, e = estado(s)
            H += h; T += t
            filas.append(f"  {s[:30]:<30} {barra(h / t)} {100 * h / t:5.1f} %  {e}")
        p = H / T if T else 0
        out = ["", "  RENDER DE VÍDEOS — video-studio", ""] + filas + ["", f"  {'TOTAL':<30} {barra(p)} {100 * p:5.1f} %", ""]
        if una:
            print("\n".join(out)); return
        print("\033[2J\033[H" + "\n".join(out) + f"  (se actualiza cada 3 s · {int(time.time() - t0)} s · Ctrl+C para salir)", flush=True)
        if T and H >= T:
            print("\n  ✔ Todos los vídeos están listos."); return
        time.sleep(3)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
