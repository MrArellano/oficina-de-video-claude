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

Requiere:
  - pip install google-genai
  - Credenciales ADC: gcloud auth application-default login
  - API habilitada: gcloud services enable aiplatform.googleapis.com
  - Tu proyecto de Google Cloud (con facturación) en la variable GOOGLE_CLOUD_PROJECT, o con --proyecto
    (opcional: GOOGLE_CLOUD_LOCATION, por defecto us-central1)
No usa ninguna clave de API: la autenticación va por ADC. Cada imagen cuesta dinero en tu cuenta de Google Cloud:
pon una alerta de presupuesto.
"""
import argparse
import datetime
import json
import os
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent

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
    if not a.proyecto:
        sys.exit("Falta el proyecto de Google Cloud: define GOOGLE_CLOUD_PROJECT o pasa --proyecto.")

    from rutas import carpeta
    destino = (RAIZ / a.carpeta if a.carpeta else carpeta(a.slug, a.perfil)) / "img"
    archivo = destino / f"{a.nombre}.png"
    if archivo.exists() and not a.sobrescribir:
        sys.exit(f"Ya existe {archivo}. Usa otro nombre o --sobrescribir.")

    from google import genai
    from google.genai import types

    # Vertex AI con Application Default Credentials (gcloud auth application-default login).
    # Cobra contra la cuenta de facturación vinculada al proyecto.
    cliente = genai.Client(
        vertexai=True,
        project=a.proyecto,
        location=UBICACION,
    )
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
