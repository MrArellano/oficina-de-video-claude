"""Genera una imagen con Gemini en Vertex AI y la guarda con su registro de origen.

Uso:
  python pipeline/generar_imagen.py <slug> <nombre_archivo> "<prompt>" [--aspecto 9:16] [--perfil <perfil>] [--sobrescribir]
  (--carpeta <ruta>: guarda en <ruta>/img en vez de en una pieza, p. ej. comun/recursos/fondos-dialogo)

Guarda en la carpeta de la pieza (perfiles/<perfil>/<creacion|edicion>/<slug>/img/).
Si la pieza aún no existe, --perfil dice dónde crearla (como pieza de creación).

Ejemplo:
  python pipeline/generar_imagen.py ia-ahorra-tiempo 01 "Ilustración de una familia cenando, estilo plano, sin texto" --aspecto 4:5

El formato (--aspecto) se envía al modelo. Por defecto 9:16, el de video-studio.
Si ya existe <nombre_archivo>.png en la pieza, se detiene (usa --sobrescribir para reemplazarla).

Requiere pip install google-genai y UNA de estas dos cuentas (las dos cobran por imagen: pon una alerta de presupuesto):
  A) Vertex AI (Google Cloud): gcloud auth application-default login, gcloud services enable aiplatform.googleapis.com
     y tu proyecto con facturación en GOOGLE_CLOUD_PROJECT (o --proyecto). Opcional: GOOGLE_CLOUD_LOCATION (us-central1).
  B) API de Gemini (AI Studio): GEMINI_API_KEY en .env.local (raíz de la oficina) o en el entorno. El nivel gratis
     no genera imágenes: activa la facturación en AI Studio.
Si no hay ninguna, sale con código 3 y el aviso de usar fotos propias o imágenes libres (Wikimedia Commons).
Corre `python pipeline/revisar_equipo.py` para saber cuál tienes.
"""
import argparse
import datetime
import json
import os
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
_env = RAIZ / ".env.local"
if _env.exists():  # sin imprimir nada
    for _l in _env.read_text(encoding="utf-8", errors="ignore").splitlines():
        if "=" in _l and not _l.strip().startswith("#"):
            _k, _v = _l.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))

# Modelo por defecto (económico, para borradores y escenas). Probado en Vertex us-central1.
MODELO = "gemini-2.5-flash-image"
PROYECTO = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
UBICACION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
ASPECTOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("slug")
    p.add_argument("nombre")
    p.add_argument("prompt")
    p.add_argument("--aspecto", default="9:16", choices=ASPECTOS)
    p.add_argument("--modelo", default=MODELO)
    p.add_argument("--sobrescribir", action="store_true",
                   help="Reemplaza la imagen y su registro si ya existen")
    p.add_argument("--perfil", help="perfil de la pieza (solo si aún no existe)")
    p.add_argument("--carpeta", help="guardar en <carpeta>/img en vez de en una pieza")
    p.add_argument("--proyecto", default=PROYECTO, help="proyecto de Google Cloud (por defecto GOOGLE_CLOUD_PROJECT)")
    a = p.parse_args()
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not a.proyecto and not api_key:
        print("SIN ACCESO A IMÁGENES IA: no hay GOOGLE_CLOUD_PROJECT (Vertex) ni GEMINI_API_KEY.\n"
              "Alternativa gratis: fotos o clips propios, o imágenes libres de Wikimedia Commons (registra la licencia en "
              "comun/creditos.md). Para activarlas, ver la ayuda de este script.")
        sys.exit(3)

    from rutas import carpeta
    destino = (RAIZ / a.carpeta if a.carpeta else carpeta(a.slug, a.perfil)) / "img"
    archivo = destino / f"{a.nombre}.png"
    if archivo.exists() and not a.sobrescribir:
        sys.exit(f"Ya existe {archivo}. Usa otro nombre o --sobrescribir.")

    from google import genai
    from google.genai import types

    if a.proyecto:
        # Vertex AI con Application Default Credentials. Cobra a la facturación del proyecto.
        cliente = genai.Client(vertexai=True, project=a.proyecto, location=UBICACION)
        via = "vertex"
    else:
        # API de Gemini (AI Studio) con clave. Cobra a la facturación de AI Studio.
        cliente = genai.Client(api_key=api_key)
        via = "gemini-api"
    respuesta = cliente.models.generate_content(
        model=a.modelo,
        contents=a.prompt,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(aspect_ratio=a.aspecto),
        ),
    )

    datos = None
    for parte in respuesta.candidates[0].content.parts:
        if getattr(parte, "inline_data", None) and parte.inline_data.data:
            datos = parte.inline_data.data
            break
    if datos is None:
        sys.exit("El modelo no devolvió imagen. Revisa el prompt o la cuota.")

    destino.mkdir(parents=True, exist_ok=True)
    archivo.write_bytes(datos)

    # Registro de origen: toda imagen IA queda etiquetada y trazable.
    registro = {
        "archivo": archivo.name,
        "tipo": "IA",
        "etiqueta": "Imagen creada con IA",
        "modelo": a.modelo,
        "via": via,
        "prompt": a.prompt,
        "aspecto": a.aspecto,
        "fecha": datetime.date.today().isoformat(),
    }
    (destino / f"{a.nombre}.json").write_text(
        json.dumps(registro, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Listo: {archivo}")


if __name__ == "__main__":
    main()
