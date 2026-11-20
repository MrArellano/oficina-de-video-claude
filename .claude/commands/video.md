---
description: Crear o editar un vídeo de un perfil, de punta a punta. Empieza SIEMPRE con el brief (preguntas al creador) y termina con el MP4 revisado por Claude.
argument-hint: "[perfil] [slug o idea]"
---
Pedido: $ARGUMENTS

## 0. Revisión técnica de la PC (SIEMPRE, cada vídeo) y brief
Si comun/yo.md o perfiles/*/ficha.md siguen con los `{{...}}` de la plantilla, primero corre `/configurar`.
**Antes de nada, lanza el agente `tecnico` en segundo plano** con el encargo "revisión antes del vídeo" (modelo
haiku para la revisión). Él corre `python pipeline/revisar_equipo.py --video` y, si falta algo para editar
(programas, paquetes, motor de vídeo, espacio en disco, ffmpeg que no codifica), lo instala o lo arregla.
Mientras trabaja, tú haces el brief. **No pases al paso 2 (producción) sin su resultado**:
- "LISTA" → di al creador una línea ("✅ PC lista: voces gratis, render en modo ahorro") y sigue.
- Lo arregló → dilo en una línea y sigue.
- No se pudo (necesita reiniciar, contraseña, liberar disco) → explica al creador qué hacer en palabras sencillas
  y espera. El guion y los textos sí se pueden adelantar.
Después lee .equipo.json (el técnico lo deja al día). Sus "modos" mandan:
- voces = "edge-tts" → en dialogo.json usa voces edge-tts (las de la ficha o las gratis por defecto) aunque la ficha
  pida ElevenLabs, y díselo al creador en una línea ("sin ElevenLabs: uso voz gratis").
- imagenes_ia = "ninguna" → no propongas imágenes IA: fotos/clips propios, Wikimedia Commons o motion graphics.
- render → las variables de Remotion para esa RAM.
- Si "listo" es false, di qué falta instalar (comando del informe) antes de producir.
Lee plantillas/brief-video.md, comun/yo.md y perfiles/<perfil>/ficha.md.
- Deduce todo lo que puedas del pedido, de la ficha, de la idea en ideas/ y de los clips ya subidos
  (si hay clips/, mira sus fotogramas con ffmpeg antes de preguntar: lugar, gente, menores, luz).
- Pregunta al creador SOLO lo que falte, con AskUserQuestion: máx. 4 preguntas por tanda, con opciones concretas y la
  recomendada primero. Mínimo siempre confirmado: perfil, creación o edición, de qué trata / qué debe sentir, y estilo.
- Estilo: ofrece 2–3 de los "estilos listos para usar" del último perfiles/<perfil>/tendencias/diseno-*.md
  (con preview corto: gancho, títulos, color, transición, keyframe/sonido). Si no hay recetario de esta semana o tiene
  más de 14 días, lanza antes `investigador-tendencias` con el perfil para que lo haga.
- Si el creador pasa un vídeo de referencia: `python pipeline/analizar_referencia.py <archivo> --perfil <perfil>`,
  mira gancho.jpg y hoja.jpg y escribe analisis.md con plantillas/analisis-diseno.md.
- Si es edición y faltan clips: dale el comando para subirlos desde el celular
  (`python pipeline/recibir_videos.py --perfil <perfil> --video <slug>`, con PYTHONIOENCODING=utf-8) o que los copie a
  perfiles/<perfil>/edicion/<slug>/clips/, y espera.
- Briefs de un colaborador (alguien de casa que no usa Claude Code y llena el brief en la página de subida en modo
  `--fijo`): están en perfiles/<perfil>/edicion/<slug>/brief.md + brief-colaborador.json (busca los de estado "nuevo");
  sus clips ya están en <slug>/clips/ (o _bandeja/: muévelos). Pregunta al creador solo lo que falte y cambia el
  estado del json a "en-produccion" al empezar y a "listo" al entregar.
Guarda las respuestas en perfiles/<perfil>/<creacion|edicion>/<slug>/brief.md. No sigas hasta tener el brief.

## 1. Guion y plan de edición
Lanza `guionista` con la carpeta de la pieza (lee brief, ficha y recetario). En paralelo, cuando haya guion:
`adaptador-plataforma` (→ plataformas.md, redes del perfil) y, si hacen falta imágenes, `curador-imagenes`.
Después `editor-calidad` (sonnet; opus solo si la pieza es destacada). Aplica sus cambios.

## 2. Producción
**Edición (clips propios) — POR DEFECTO con el kit de edición** (plantillas/kit-edicion.md): letras Bangers/Anton,
transiciones, emojis Twemoji y efectos de sonido CON MODERACIÓN, en la composición VlogVideo de video-studio:
1. Transcripción por palabra → <pieza>/palabras.json (faster-whisper con el audio pasado como numpy; ver video-studio/CLAUDE.md).
2. Proxies H.264 1080x1920 CRF 16 de cada clip → video-studio/public/<slug>/cNNNN.mp4.
3. El guionista deja el "Plan técnico (VlogVideo)" en guion.md → escribe video-studio/projects/<slug>/armar_vlog.py
   (copiar video-studio/ejemplos/armar_vlog_ejemplo.py) → vlog.json.
4. `python pipeline/vlog.py <slug> --prueba t1,t2,...` (desde video-studio; fotogramas de prueba) → corrige → render completo
   en segundo plano y **la barra de progreso SIEMPRE en el chat** (Monitor sobre
   `python pipeline/progreso.py <slug> --una-vez`). Pon "salida" en vlog.json hacia la carpeta de la pieza.
5. Si solo cambian efectos o música: `vlog.py <slug> --audio` y une ese audio al MP4 (sin renderizar la imagen otra vez).
Solo para estilo cine horizontal, o si el creador lo pide, se monta con ffmpeg directo (un montar.py en la carpeta de la pieza):
- Cuadro completo 16:9, sin franjas ni recortes; menores o personas sin permiso → difuminado que las sigue.
- Aplica el plan de edición: color/filtro, cámara lenta, transiciones, keyframes (zoom, paneo), títulos en pantalla con
  el estilo elegido y subtítulos con contorno. Si los títulos animados o keyframes complejos no salen bien con ffmpeg,
  hazlos en Remotion (video-studio).
- Narración: solo si el brief la pide. Voz gratis con edge-tts, o ElevenLabs si la ficha trae un voice_id y hay
  ELEVENLABS_API_KEY en video-studio/.env.local.
- Entregas: un solo vertical 1080x1920 para TikTok y Facebook (Reel) salvo que el brief pida horizontal.
**Creación** — video-studio (leer su CLAUDE.md): diálogo avatar + IA con `dialog.py` (estilo "cine"), o
motion graphics con `build.py`. Escribe video-studio/projects/<slug>/dialogo.json desde el guion (voces de la ficha del
perfil; por defecto edge-tts gratis); sin familia ni menores; anécdotas no confirmadas como ejemplo o
"Recreación". Imágenes IA solo con permiso del creador (`generar_imagen.py`, etiqueta "Imagen creada con IA").
**PC con poca RAM (8 GB)**: un vídeo a la vez; Remotion con `REMOTION_CONCURRENCY=1 REMOTION_CHUNK=300`, en segundo plano, y
`python pipeline/progreso.py <slug>` (desde video-studio) para que el creador vea la barra. Antes del render completo,
3 fotogramas de prueba.

## 3. Revisión de Claude (el creador solo recibe vídeos terminados)
- `python pipeline/analizar_referencia.py <mp4> --perfil <perfil> --nombre revision-<slug>` y mira gancho.jpg y hoja.jpg:
  ¿el gancho frena el scroll? ¿el ritmo es el del estilo? Texto cortado, faltas de ortografía, etiqueta IA visible,
  caras de menores, cuadro recortado. Corrige y vuelve a renderizar. Luego borra esa carpeta revision-<slug>.
- Escribe post.txt en la carpeta de la pieza con los textos finales de cada red (de plataformas.md,
  ajustados a lo que dice el vídeo, con el crédito de Twemoji si lleva emojis).
- `python pipeline/estado.py`.

Entrega: tabla perfil | slug | duración | rutas de los MP4 | lo único que el creador debe confirmar (una línea, o "nada").
Nunca publiques ni programes nada.
