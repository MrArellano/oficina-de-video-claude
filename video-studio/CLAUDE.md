# video-studio: el motor de vídeo de la oficina (Remotion + Python + ffmpeg)

Todo vertical 1080x1920 a 30 fps salvo que el brief diga otra cosa. Se corre desde esta carpeta (`cd video-studio`).
Solo el código va a git: projects/, public/, out/, node_modules/ y .env* se quedan en tu PC.

## Instalación
- `npm install` (Remotion 4, three.js, @remotion/transitions, @twemoji/svg)
- Python 3.10+: `pip install numpy edge-tts faster-whisper requests`
- ffmpeg y ffprobe en el PATH (Windows: `winget install Gyan.FFmpeg`; dialog.py también lo busca en la carpeta de winget)
- Voces de pago opcionales: `ELEVENLABS_API_KEY=...` en video-studio/.env.local (nunca la pegues en el chat)

## Composiciones (src/Root.tsx)
| Composición | Script | Para qué |
|---|---|---|
| VlogVideo | pipeline/vlog.py | Tus clips con letras, transiciones, emojis, SFX y cama musical (piezas de EDICIÓN) |
| CineVideo | pipeline/dialog.py | Diálogo avatar + IA en escena nocturna 3D (por defecto en CREACIÓN) |
| DialogVideo | pipeline/dialog.py con `"look": "clasico"` | Diálogo sobre fondos de imagen (public/fondos/) |
| MedVideo | pipeline/build.py | Escenas con imágenes o motion graphics y voz en off |
| ShowcaseVideo | pipeline/showcase.py | Promo de producto: fotos con Ken Burns, títulos y voz en off |

## Vlogs con clips propios (VlogVideo)
- `python pipeline/vlog.py <slug>` lee projects/<slug>/vlog.json: tomas (velocidad, zooms, shake, ken), trans (una por toma;
  la última entra a la tarjeta final), subs con *clave*, titulos (estilo gancho|grande|rotulo|sello|banner|chip|simple,
  y/x en px), emojis por carácter, sfx por nombre, fin, musica, flash, salida.
  `--prueba 1.0,25.2` saca fotogramas; `--audio` solo la mezcla; `--sin-render` solo props.json.
- Ejemplo completo y comentado: ejemplos/armar_vlog_ejemplo.py (cópialo a projects/<slug>/armar_vlog.py).
- Clips: proxies H.264 1080x1920 CRF 16 en public/<slug>/cNNNN.mp4, hechos con ffmpeg desde tus originales (4K, .mov…).
- Transcripción por palabra con faster-whisper → palabras.json: pásale el audio como numpy (ffmpeg → s16le 16 kHz mono),
  porque leer el archivo directo con PyAV falla en algunos equipos.
- VlogVideo usa Html5Video mudo y el audio (voz con atempo + sfx + cama) lo mezcla vlog.py con ffmpeg/numpy, con loudnorm
  −14 LUFS y limitador. (En algunos Windows el compositor de Remotion falla con "spawn UNKNOWN"; así se evita.)
- Fuentes: Bangers (rótulos) y Anton (subtítulos). Emojis: Twemoji (@twemoji/svg 15.0.0, CC-BY 4.0 → crédito en post.txt).
- Efectos sintetizados sin derechos: pipeline/sfx.py (whoosh, pop, ding, boing, caja, impacto, scratch, error, silbato,
  clack, notaNNN, tada…). La cama musical también se sintetiza en vlog.py: nada con derechos de terceros.
- Paleta: constantes NARANJA, TIERRA, CREMA y QUEMADO al inicio de src/VlogVideo.tsx.

## Diálogos con avatar (CineVideo / DialogVideo)
- `python pipeline/dialog.py <slug>` lee projects/<slug>/dialogo.json: voces `yo`/`ia`, líneas con cam me|ia|two, cards, outro.
  Ejemplo de voces gratis (edge-tts):
  `"voices": {"yo": {"voice": "es-MX-JorgeNeural", "rate": "+5%"}, "ia": {"voice": "es-US-AlonsoNeural", "rate": "+8%", "pitch": "+8Hz"}}`
  ElevenLabs: `{"engine": "elevenlabs", "voice_id": "<tu voz>"}` (necesita ELEVENLABS_API_KEY). Las voces se guardan en caché
  (public/<slug>/l##.json) y no se vuelven a pagar si el texto no cambia.
- Personajes en src/Characters.tsx: Avatar low-poly y Robot de IA. **Personaliza el avatar** (colores SKIN, HAIR, BEARD,
  SHIRT y las formas) para que se parezca a ti. No subas fotos de nadie a servicios externos sin permiso.
- "screens": tarjetas tipo app `{"from","to","chip","title","rows":[{"k","v","color"}],"items":[{"text","line","stamp"}],"footer","accent"}`.
  "pics": imagen enmarcada `{"from","to","img","label"}`. Durante una pantalla o imagen la escena se desenfoca.
- "phones" (src/Phone.tsx): celulares animados para promos; colores y textos en "brand".
- Render 3D con `--gl=angle`.

## Escenas con imágenes o motion graphics (MedVideo, build.py)
- projects/<slug>/guion.json; imágenes en projects/<slug>/img/. `python pipeline/build.py <slug>` → voz + tiempos + render.
- Tipos de escena (campo "type"): hook {emoji,title,sub} · icon {emoji,title,sub} · stat {value,prefix,suffix,label} ·
  chat {prompt, reply[]} · list {title, items[], already} · compare {title, a:{title,items,good}, b:{...}} ·
  cta {emoji,title,sub} · img {img,motion}.
- Evita emojis de bandera (Windows los pinta como letras). Portada = 1ª escena sin subtítulos.

## Render y RAM
- PC con 8 GB: `REMOTION_CONCURRENCY=1 REMOTION_CHUNK=300` (tramos de 300 fotogramas que se unen con ffmpeg; si uno
  falla, reintenta desde el que faltó). Un vídeo a la vez. Con más RAM puedes subir la concurrencia.
- Barra de progreso: `python pipeline/progreso.py <slug>` (o `--una-vez`); lee projects/<slug>/render.log.
- Antes del render completo, siempre 3 fotogramas de prueba.

## Licencias de terceros
- Remotion tiene su propia licencia: gratis para personas, organizaciones sin fines de lucro y empresas de hasta 3 personas;
  empresas más grandes necesitan una licencia de empresa (https://www.remotion.dev/license).
- Twemoji: CC-BY 4.0 (crédito "Emojis: Twemoji, CC-BY 4.0" en el post). Bangers y Anton: SIL Open Font License.
