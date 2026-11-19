---
description: Primera vez. Da de alta la oficina - quién eres, tus perfiles, tus redes y qué herramientas tienes instaladas.
argument-hint: "[nuevo-perfil <slug>] (opcional: solo añade un perfil)"
---
Argumentos: $ARGUMENTS

Objetivo: dejar comun/yo.md y perfiles/<perfil>/ficha.md llenos (sin ningún `{{...}}`) y comprobar las herramientas.
Pregunta con AskUserQuestion (máx. 4 preguntas por tanda, opciones concretas, recomendada primero). No pidas nunca
claves, contraseñas ni tarjetas en el chat: solo di en qué archivo van.

## 1. Quién eres → comun/yo.md
Nombre o apodo con el que firmas, país/región e idioma de los vídeos, a qué te dedicas, equipo con el que grabas
(celular, cámara, dron, micrófono), qué temas NO tocas y quién de tu familia puede salir (los menores nunca salen sin
difuminar). Usa comun/yo.md como plantilla.

## 2. Perfiles → perfiles/<slug>/ficha.md
Por cada perfil (una cuenta o marca): nombre, slug en minúsculas con guiones, redes y @cuentas, de qué trata,
3–4 pilares con su %, la voz (2–3 adjetivos y un ejemplo de frase), la prueba de aporte, paleta y estilo visual,
voces del diálogo (por defecto edge-tts gratis) y el ritmo (piezas por semana).
- El primero se escribe sobre perfiles/mi-perfil/: renombra la carpeta al slug elegido (`git mv` si hay repo).
- Los siguientes: copia perfiles/mi-perfil/ (o la plantilla de la ficha) a perfiles/<slug>/ con las mismas subcarpetas.
- La tabla "Perfiles" de CLAUDE.md se actualiza con cada uno.

## 3. Herramientas (comprueba, no instales sin permiso)
Corre y reporta en una tabla qué hay y qué falta:
- `python --version` (3.10+), `node --version` (18+), `ffmpeg -version`, `ffprobe -version`
- Paquetes de Python: `python -c "import numpy, edge_tts, faster_whisper, requests"`
- video-studio/node_modules (si falta: `cd video-studio && npm install`)
- Opcional: `gcloud --version` (imágenes IA en Vertex) y GOOGLE_CLOUD_PROJECT; ELEVENLABS_API_KEY en
  video-studio/.env.local (voces de pago). Sin ellos la oficina funciona igual: voces gratis con edge-tts y sin imágenes IA.
Para lo que falte, da el comando exacto de instalación (winget / pip / npm) y deja que el creador lo corra.

## 4. Cierre
Corre `python pipeline/estado.py`, marca en "Estado actual" de CLAUDE.md "Oficina configurada (fecha)" y sugiere
el primer paso: `/semana <perfil>` o `/video <perfil> <idea>`.
