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

## 3. Herramientas y servicios de pago
Corre `python pipeline/revisar_equipo.py` y muestra su informe en una tabla corta.
- Lo gratis que falte (paquetes de Python, `npm install`, navegador de Remotion): ofrece instalarlo con
  `python pipeline/revisar_equipo.py --instalar`. Python, Node y ffmpeg los instala el creador con el comando winget
  que da el informe (y abre otra terminal).
- Servicios de pago: pregunta si tiene cuenta de ElevenLabs (voces) o de Gemini (imágenes IA). Si sí, dile en qué
  archivo va cada clave (ELEVENLABS_API_KEY en video-studio/.env.local; GEMINI_API_KEY en .env.local de la raíz, o
  Vertex con `! gcloud auth application-default login` + GOOGLE_CLOUD_PROJECT) y vuelve a correr el revisor.
  Si no, dile claro qué se usará en su lugar: voces gratis de edge-tts y, en vez de imágenes IA, sus fotos y clips
  o imágenes libres de Wikimedia Commons. La oficina funciona completa sin pagar nada extra.

## 4. Cierre
Corre `python pipeline/estado.py`, marca en "Estado actual" de CLAUDE.md "Oficina configurada (fecha)" y sugiere
el primer paso: `/semana <perfil>` o `/video <perfil> <idea>`.
