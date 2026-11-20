# Oficina de vídeo con Claude Code

Objetivo: contenido que aporte algo bueno, a la vanguardia en diseño y a bajo costo de tokens. Que la tecnología sirva
a la vida (más tiempo con la familia y los hobbies), no que la sustituya.

**Primera vez:** si comun/yo.md o alguna perfiles/*/ficha.md todavía tiene `{{...}}`, corre `/configurar` antes de nada.

**Equipo y servicios de pago:** al abrir la sesión, un hook corre `python pipeline/revisar_equipo.py --hook` (solo la
primera vez o cada 7 días). Si su informe aparece en el contexto, resúmeselo al creador al empezar: qué falta instalar
y qué alternativa gratis se usará; si falta algo, ofrece `/tecnico` (lo instala por él). El resultado queda en .equipo.json; sus "modos" mandan:
voces elevenlabs | edge-tts (gratis) · imagenes_ia vertex | gemini-api | ninguna (fotos propias / Wikimedia) · render.
Nunca propongas un servicio de pago que .equipo.json marque sin acceso; ofrece la alternativa gratis.

## Perfiles (nunca se mezclan: cada pieza es de uno solo)
Cada carpeta de perfiles/ con ficha.md es un perfil (pipeline/rutas.py los detecta solo).
| Perfil | Carpeta | Contenido | Voz |
|---|---|---|---|
| (lo llena /configurar) | perfiles/mi-perfil | | |
Antes de cualquier pieza: leer comun/yo.md (quién es el creador, límites, equipo) y perfiles/<perfil>/ficha.md
(cuentas, voz, pilares, prueba de aporte, estilo visual).

## Carpetas
```
comun/            yo.md · creditos.md · recursos/ (fondos de diálogo, etc.)
perfiles/<perfil>/
  ficha.md
  tendencias/     semana-AAAA-WW.md · diseno-AAAA-WW.md (recetario de diseño) · referencias/<nombre>/
  ideas/          semana-AAAA-WW.md
  creacion/<slug>/  lo que Claude crea desde cero: brief, guion, imagenes, plataformas, revision, img/, post.txt
                    (el render vive en video-studio/projects/<slug>/)
  edicion/<slug>/   vídeos con tus clips: brief, guion, clips/ (lo que subes), plataformas, revision, MP4 final, post.txt
  edicion/_bandeja/ clips subidos que aún no tienen vídeo
  metricas/
plantillas/       brief-video.md · guion.md · analisis-diseno.md · kit-edicion.md
calendario/       estado.md (todos los perfiles) · estado-manual.json · resumen-AAAA-WW.md
pipeline/         scripts de la oficina (rutas.py dice dónde está cada cosa)
video-studio/     motor de vídeo (Remotion, avatar, voces); tiene su propio CLAUDE.md
```
Creación y edición van separadas: los clips del creador nunca se mezclan con lo que genera Claude.

## Regla de oro: antes de cada vídeo, la REVISIÓN TÉCNICA y el BRIEF
Lo pida con `/video` o con sus palabras ("hazme un vídeo de…", "edita estos clips"), sigue .claude/commands/video.md:
primero el agente `tecnico` revisa en segundo plano que la PC tenga todo para editar (y lo arregla si falta),
mientras tú haces el brief. No se produce nada hasta que el técnico diga que la PC está lista.
Cada vez que el creador pida hacer o editar un vídeo, Claude le pregunta lo necesario (plantillas/brief-video.md) con
AskUserQuestion: perfil, creación o edición, de qué trata y qué debe sentir, material, audio, personas y permisos,
datos, y el estilo de diseño (Claude propone 2–3 del recetario de tendencias). Solo pregunta lo que no pueda deducir.
Sin brief no se produce. Excepción: el lote desatendido (/lote-semanal), que no hace vídeos.

## Vanguardia en diseño
investigador-tendencias no solo busca qué pega: analiza CÓMO están hechos esos vídeos (gancho 0–3 s, historia,
ritmo, títulos en pantalla, filtros, transiciones, keyframes, sonido) y deja un recetario por perfil
(tendencias/diseno-AAAA-WW.md). No puede ver vídeos: si el creador pasa uno de referencia,
`python pipeline/analizar_referencia.py <vídeo> --perfil <perfil>` lo desarma (cortes, ritmo, hoja de fotogramas) y
Claude lo analiza. El mismo script sirve para revisar nuestros vídeos antes de entregarlos.

## Kit de edición
Toda pieza de EDICIÓN lleva el kit de plantillas/kit-edicion.md: letras llamativas (Bangers/Anton), transiciones,
emojis Twemoji CON MODERACIÓN (unos 9–10 por minuto, nunca dos a la vez; crédito CC-BY en post.txt) y efectos de sonido
sintetizados CON MODERACIÓN (unos 12 por minuto, solo momentos clave). Motor: VlogVideo + pipeline/vlog.py en video-studio.
Por defecto un solo vertical 1080x1920 para TikTok y Facebook. Durante el render, la barra de progreso SIEMPRE en el chat.

## Agentes (.claude/agents/) y modelo por tarea
| Agente | Tarea | Modelo |
|---|---|---|
| investigador-tendencias | Tendencias + análisis de diseño + ideas, por perfil | haiku |
| guionista | Guion + plan de edición (textos, transiciones, keyframes, audio) | sonnet |
| curador-imagenes | Imágenes por escena: propias, libres con licencia o IA etiquetada | haiku |
| adaptador-plataforma | Guion → textos de cada red del perfil | haiku |
| editor-calidad | Veracidad, voz del perfil, diseño, gancho y privacidad | sonnet (opus solo en destacadas) |
| analista-metricas | Métricas por perfil → repetir / cambiar / probar | haiku |
| tecnico | Antes de cada vídeo revisa la PC; instala lo que falte y arregla errores, sin jerga | haiku (revisión) / sonnet (arreglos) |
Los agentes solo cargan si Claude Code se abre en esta carpeta; si no, se lanzan como general-purpose leyendo su .md
con el modelo de la tabla.
Ahorro: trabajar por lotes, lo estable vive en comun/, perfiles/*/ficha.md y plantillas/ (los agentes lo leen por
ruta), un guion sirve para todas las redes, reciclar lo que funcionó antes de investigar desde cero.

## Flujo y comandos (.claude/commands/)
Claude arma el contenido de punta a punta; el creador veta ideas, contesta el brief, aprueba el vídeo final y publica.
0. `/configurar` → quién eres, tus perfiles y tus herramientas (la primera vez). `/tecnico` → instalar o arreglar la PC.
   El creador puede no saber nada de sistemas: no le pidas abrir terminales ni editar archivos si tú puedes hacerlo.
1. `/semana [perfil]` → tendencias, recetario de diseño e ideas con ★ por perfil. Se detiene para vetos.
2. `/producir <slugs>` → guion + plan de edición, textos de cada red, revisión. Se detiene.
3. `/video [perfil] [slug o idea]` → brief (preguntas) → guion si falta → producción → revisión de Claude → MP4 + post.txt.
   - Edición: subes los clips desde el celular con `python pipeline/recibir_videos.py --perfil <perfil> --video <slug>`
     (Wi-Fi, puerto 8000, código de 6 dígitos; PYTHONIOENCODING=utf-8) o los copias a la carpeta clips/ de la pieza.
   - Creación: video-studio (dialog.py estilo "cine" o build.py).
4. Publicación: LA HACE EL CREADOR. Ningún agente publica ni programa nada.
5. `/cierre [perfil]` → métricas de perfiles/<perfil>/metricas/.
Estado: `python pipeline/estado.py` → calendario/estado.md. Aprobaciones y publicaciones van en calendario/estado-manual.json.

## Límites
- Datos, cifras y noticias: con fuente verificable (URL y fecha). Si no la hay, se quitan o van como opinión.
- Fotos y vídeos de personas: no subirlos a servicios externos sin permiso. Menores: no se muestran (se difuminan).
- No revelar ubicación de casas particulares ni datos de vecinos; persona reconocible = con permiso.
- La IA en la vida del creador: uso real y honesto, con errores y límites. Nada de productividad mágica.
- Diseño: inspirarse en lo que pega, nunca copiar material, música con derechos ni ideas exactas de otros creadores.
- Sin política partidista, sin insultos, sin promesas de dinero fácil. Idioma y tono: los de comun/yo.md.
- Imágenes IA (cuestan dinero): solo con permiso del creador en el chat, etiquetadas "Imagen creada con IA" y con su .json.

## Reglas de trabajo
- Nunca mostrar ni pedir valores de claves o tarjetas en el chat. Solo nombres de variables y en qué archivo van.
- Comandos interactivos (logins) los corre el creador con `!`.
- Ningún agente publica ni programa nada automáticamente.
- PC con poca RAM: un render a la vez con `REMOTION_CONCURRENCY=1 REMOTION_CHUNK=300`.

## Estado actual (actualizar al cerrar cada sesión)
### Hecho
- (vacío: corre /configurar)
### Pendiente
1. /configurar
2. Primer recetario de diseño de cada perfil (/semana).
