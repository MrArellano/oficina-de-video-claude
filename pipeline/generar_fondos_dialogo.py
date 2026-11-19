"""Genera los 4 fondos para los vídeos de diálogo (avatar + robot, look "clasico") con Gemini en Vertex AI.
Cuesta 4 imágenes en tu proyecto de Google Cloud (ver generar_imagen.py). Pide permiso antes de correrlo.
Cambia las escenas de FONDOS por lugares que vayan con tu perfil.
Uso: python pipeline/generar_fondos_dialogo.py
Deja las imágenes en comun/recursos/fondos-dialogo/img/; cópialas a video-studio/public/fondos/ para usarlas.
No sobrescribe fondos que ya existan (generar_imagen.py se detiene si el archivo existe).
"""
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ESTILO = (
    "Ilustración digital estilo cálido semi-realista, vertical 9:16, desenfoque suave de fondo "
    "(profundidad de campo) para que personajes 3D resalten delante, paleta de naranjas y tonos tierra "
    "con acentos azul noche, iluminación de atardecer, centro de la imagen despejado y tercio inferior "
    "más oscuro para subtítulos. Sin personas, sin texto, sin letreros legibles, sin logotipos ni marcas."
)
FONDOS = {
    "01-escritorio": "Escritorio de trabajo en casa: monitor encendido con brillo azul, "
                     "taza de café humeante, plantas en macetas de barro, ventana con luz de atardecer.",
    "02-mercado": "Mercado al aire libre visto de frente: puestos con lonas de colores naranja, rosa y azul, "
                  "fruta y cajas de madera, banderines sin texto.",
    "03-sala": "Sala familiar acogedora: sillón con cojines tejidos, lámpara cálida, "
               "librero, mesa de centro con juegos de mesa.",
    "04-calle-pueblo": "Calle de un pueblo genérico al anochecer: fachadas de colores con portones de madera, "
                       "faroles encendidos, cables y bugambilias. No es un lugar real identificable.",
}

for nombre, escena in FONDOS.items():
    print(f"== {nombre}")
    r = subprocess.run([sys.executable, str(RAIZ / "pipeline" / "generar_imagen.py"),
                        "fondos-dialogo", nombre, f"{escena} {ESTILO}", "--aspecto", "9:16",
                        "--carpeta", "comun/recursos/fondos-dialogo"])
    if r.returncode != 0:
        print(f"   {nombre}: no se generó (ya existe o hubo un error). Sigo con el siguiente.")
print("Listo. Imágenes en comun/recursos/fondos-dialogo/img/")
