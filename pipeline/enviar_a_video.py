r"""Copia las imágenes de una pieza a su proyecto de video-studio.

Uso:
  python pipeline/enviar_a_video.py <slug> [nombre_proyecto] [--sobrescribir]

Copia <carpeta de la pieza>/img/*.png (perfiles/<perfil>/<creacion|edicion>/<slug>/img, y sus registros .json) a
video-studio/projects/<nombre_proyecto>/img/. Si no se da nombre, usa el slug.
No reemplaza archivos que ya existan en el destino salvo con --sobrescribir.
"""
import argparse
import pathlib
import shutil
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
VIDEO_STUDIO = RAIZ / "video-studio"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("slug")
    p.add_argument("proyecto", nargs="?")
    p.add_argument("--sobrescribir", action="store_true")
    a = p.parse_args()

    from rutas import carpeta
    origen = carpeta(a.slug) / "img"
    if not origen.is_dir():
        sys.exit(f"No existe {origen}")
    destino = VIDEO_STUDIO / "projects" / (a.proyecto or a.slug) / "img"
    destino.mkdir(parents=True, exist_ok=True)

    copiadas, saltadas = 0, []
    for f in sorted(origen.iterdir()):
        if f.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp", ".json"):
            continue
        d = destino / f.name
        if d.exists() and not a.sobrescribir:
            saltadas.append(f.name)
            continue
        shutil.copy2(f, d)
        copiadas += 1

    print(f"Copiados {copiadas} archivos a {destino}")
    if saltadas:
        print("Ya existían (no se tocaron): " + ", ".join(saltadas))


if __name__ == "__main__":
    main()
