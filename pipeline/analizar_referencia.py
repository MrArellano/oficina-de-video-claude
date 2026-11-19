r"""Desarma un vídeo de referencia (uno que esté pegando) para estudiar cómo está editado.

Uso:
  python pipeline/analizar_referencia.py <video.mp4> --perfil <perfil> [--nombre slug] [--umbral 0.3]
  (también sirve para revisar un vídeo nuestro antes de entregarlo: ritmo y gancho)

Deja en perfiles/<perfil>/tendencias/referencias/<nombre>/:
  cortes.json   duración, cortes detectados, duración media de toma y ritmo por tramo
  gancho.jpg    los primeros 3 s, un fotograma cada 0,25 s (cómo frena el scroll)
  hoja.jpg      un fotograma por toma (estructura, títulos, color, transiciones)
Luego Claude mira las dos imágenes y escribe analisis.md con plantillas/analisis-diseno.md.
El vídeo de referencia NO se publica ni se reutiliza: solo se estudia su diseño.
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from rutas import PERFILES  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
FUENTES = [Path("C:/Windows/Fonts/arial.ttf"), Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
           Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")]


def exe(nombre):
    """ffmpeg/ffprobe del PATH; si no, el que instala winget (Gyan.FFmpeg) en Windows."""
    hallado = shutil.which(nombre)
    if hallado:
        return hallado
    base = Path.home() / "AppData/Local/Microsoft/WinGet/Packages"
    for p in base.glob(f"Gyan.FFmpeg*/**/bin/{nombre}.exe"):
        return str(p)
    sys.exit(f"No encuentro {nombre}. Instálalo (Windows: winget install Gyan.FFmpeg) y vuelve a abrir la terminal.")


def fuente():
    """Opción fontfile= de drawtext con la primera fuente que exista (o nada: ffmpeg usa la de fontconfig)."""
    for f in FUENTES:
        if f.exists():
            return "fontfile='" + f.as_posix().replace(":", "\\:") + "':"
    return ""


def duracion(video):
    r = subprocess.run([exe("ffprobe"), "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", str(video)], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def cortes(video, umbral=None):
    """Cortes y fundidos. Compara fotogramas separados 0,25 s (fps=4), así también salen los fundidos.
    Sin umbral, se adapta al vídeo: picos por encima de media + 2,5 desviaciones (mínimo 0,06),
    porque un vídeo oscuro con fundidos suaves nunca pasa de ~0,13 y uno de cortes secos llega a 0,5+."""
    r = subprocess.run([exe("ffmpeg"), "-hide_banner", "-v", "error", "-i", str(video), "-vf",
                        "fps=4,scale=320:-2,select='gte(scene,0)',metadata=print:key=lavfi.scene_score:file=-",
                        "-an", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    ts = [float(t) for t in re.findall(r"pts_time:([\d.]+)", r.stdout)]
    sc = [float(s) for s in re.findall(r"scene_score=([\d.]+)", r.stdout)]
    if not sc:
        return [], 0
    if umbral is None:
        media = sum(sc) / len(sc)
        dev = (sum((x - media) ** 2 for x in sc) / len(sc)) ** 0.5
        umbral = max(0.06, media + 2.5 * dev)
    salida = []
    for i, (t, s) in enumerate(zip(ts, sc)):
        pico = s >= umbral and s >= max(sc[max(0, i - 2):i + 3])  # máximo local: un fundido cuenta una vez
        if pico and t > 0.3 and (not salida or t - salida[-1] > 0.6):
            salida.append(round(t, 2))
    return salida, round(umbral, 3)


def hoja(video, tiempos, salida, ancho=6, escala=240):
    """Un mosaico con un fotograma en cada tiempo."""
    tmp = salida.parent / "_tmp"
    tmp.mkdir(exist_ok=True)
    for i, t in enumerate(tiempos):
        subprocess.run([exe("ffmpeg"), "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", str(video), "-frames:v", "1",
                        "-vf", f"scale={escala}:-2,drawtext={fuente()}"
                               f"text='{t:.1f}s':x=6:y=6:fontsize=18:fontcolor=white:"
                               "box=1:boxcolor=black@0.6", str(tmp / f"{i:03d}.jpg")], check=True)
    filas = max(1, -(-len(tiempos) // ancho))
    subprocess.run([exe("ffmpeg"), "-v", "error", "-y", "-i", str(tmp / "%03d.jpg"),
                    "-vf", f"tile={ancho}x{filas}:padding=4:color=black", "-frames:v", "1", str(salida)], check=True)
    shutil.rmtree(tmp)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser()
    p.add_argument("video", type=Path)
    p.add_argument("--perfil", required=True, choices=list(PERFILES))
    p.add_argument("--nombre")
    p.add_argument("--umbral", type=float, help="fijo (0.3 = solo cortes secos); sin él se adapta al vídeo")
    a = p.parse_args()

    nombre = a.nombre or re.sub(r"[^a-z0-9-]+", "-", a.video.stem.lower()).strip("-")[:50]
    dest = RAIZ / "perfiles" / a.perfil / "tendencias" / "referencias" / nombre
    dest.mkdir(parents=True, exist_ok=True)

    dur = duracion(a.video)
    cs, umbral = cortes(a.video, a.umbral)
    inicios = [0.0] + cs
    tomas = [round(b - x, 2) for x, b in zip(inicios, cs + [dur])]
    tramos = {}
    for nombre_t, (x, b) in {"gancho 0-3 s": (0, 3), "desarrollo": (3, max(3, dur - 5)), "cierre (últimos 5 s)": (max(3, dur - 5), dur)}.items():
        n = sum(1 for c in cs if x <= c < b)
        tramos[nombre_t] = {"cortes": n, "cortes_por_segundo": round(n / (b - x), 2) if b > x else 0}
    datos = {"video": str(a.video), "duracion_s": round(dur, 2), "umbral": umbral, "cortes": cs, "num_tomas": len(tomas),
             "toma_media_s": round(sum(tomas) / len(tomas), 2), "toma_mas_larga_s": max(tomas),
             "toma_mas_corta_s": min(tomas), "ritmo": tramos}
    (dest / "cortes.json").write_text(json.dumps(datos, ensure_ascii=False, indent=1), encoding="utf-8")

    hoja(a.video, [i * 0.25 for i in range(12) if i * 0.25 < dur], dest / "gancho.jpg", ancho=6, escala=200)
    muestras = [round(x + min(0.4, t / 2), 2) for x, t in zip(inicios, tomas)][:60]
    hoja(a.video, muestras, dest / "hoja.jpg")

    print(f"{dur:.1f} s · {len(tomas)} tomas · toma media {datos['toma_media_s']} s")
    for k, v in tramos.items():
        print(f"  {k}: {v['cortes']} cortes ({v['cortes_por_segundo']}/s)")
    print(f"Listo -> {dest}")


if __name__ == "__main__":
    main()
