# Oficina de vídeo con Claude Code

Una "oficina" de agentes para [Claude Code](https://claude.com/claude-code) que te ayuda a hacer vídeos cortos para
TikTok y Facebook de punta a punta: investiga tendencias y **cómo están diseñados** los vídeos que pegan, te hace el
brief, escribe el guion, monta tus clips con letras animadas, transiciones, emojis y efectos de sonido, revisa la
calidad y te entrega el MP4 con los textos del post. **Tú solo grabas, eliges y publicas.**

Hecho por [@mikes_vlogs](https://www.tiktok.com/@mikes_vlogs) para sus propios vídeos. Lo comparto porque a mucha gente
le gustó cómo quedan.

> Funciona con **tu propia cuenta de Claude Code**. Cada quien usa su suscripción, sus claves y sus archivos: nada
> se comparte con nadie.

**¿Primera vez?** Ve directo a [Instalación fácil](#instalación-fácil-no-necesitas-saber-de-computadoras) y luego a
[Cómo se usa](#cómo-se-usa-en-palabras-sencillas). No necesitas saber programar: le hablas a Claude como a una persona.

## Qué trae
- **7 agentes** (`.claude/agents/`): investigador de tendencias y diseño, guionista, curador de imágenes,
  adaptador a cada red, editor de calidad, analista de métricas y un técnico que instala y arregla tu PC. Cada uno con el modelo más barato que le alcanza.
- **Comandos** (`.claude/commands/`): `/configurar`, `/tecnico`, `/semana`, `/producir`, `/video`, `/cierre` y `/lote-semanal`.
- **video-studio/**: motor de vídeo con [Remotion](https://www.remotion.dev): vlogs con tus clips (VlogVideo), diálogos
  con un avatar 3D y un robot de IA en estilo "cine", motion graphics y promos.
- **pipeline/**: subir clips desde el celular por Wi-Fi (sin internet), desarmar un vídeo de referencia para estudiar su
  ritmo y gancho, estado de todas tus piezas e imágenes IA etiquetadas (opcional).
- **Kit de edición**: rótulos Bangers/Anton, transiciones, emojis Twemoji y efectos de sonido sintetizados (sin derechos
  de autor), todo **con moderación**.

## Instalación fácil (no necesitas saber de computadoras)
Necesitas una cuenta de Claude con plan de pago (Pro o Max) e internet. Lo demás se instala solo y es gratis.

**Windows 10/11**
1. Arriba en esta página: botón verde **Code → Download ZIP**. Descomprímelo (clic derecho → *Extraer todo*) en
   *Documentos*, por ejemplo.
2. Abre la carpeta y da **doble clic a `INSTALAR-Windows.bat`**. Si Windows dice "Windows protegió su PC", pulsa
   *Más información → Ejecutar de todas formas*. Si pregunta si permites cambios, di que sí. Tarda 10–20 minutos.
3. Abre **"Oficina de video"** en tu escritorio. La primera vez te pide iniciar sesión con tu cuenta de Claude en el
   navegador.
4. Escribe `/configurar` y contesta las preguntas. Listo.

**Mac**
1. Igual: **Code → Download ZIP** y descomprímelo.
2. **Clic derecho en `INSTALAR-Mac.command` → Abrir** (te pedirá la contraseña de tu Mac; es normal).
3. Doble clic a `ABRIR-OFICINA.command` y escribe `/configurar`.

**¿Algo falló o falta algo?** Dentro de la oficina escribe `/tecnico` (o simplemente "algo no funciona, ayúdame").
El agente técnico revisa tu computadora, instala lo que falte y te explica todo en palabras sencillas.

Probado en Windows 11 con 8 GB de RAM. El instalador de Mac aún no se ha probado en una Mac real.

<details>
<summary>Instalación manual (para quien sabe usar la terminal)</summary>

Requisitos: Claude Code, Git, Python 3.10+, Node.js 18+ y ffmpeg.
```powershell
winget install Git.Git Python.Python.3.12 OpenJS.NodeJS.LTS Gyan.FFmpeg Anthropic.ClaudeCode
git clone https://github.com/MrArellano/oficina-de-video-claude.git
cd oficina-de-video-claude
python pipeline/revisar_equipo.py --instalar   # paquetes de Python, npm install y navegador de Remotion
claude
```
</details>

## Qué revisa la oficina sola
Cada vez que pides un vídeo, el agente técnico revisa antes que tu computadora tenga todo para editar (programas,
espacio en disco, que ffmpeg funcione) y, si falta algo, lo arregla. Además, la primera vez que abres la oficina (y luego cada semana) revisa: qué tienes, qué falta y si
tienes acceso a los servicios de pago. Donde no lo tienes, te avisa y usa la alternativa gratis.

| Para | De pago (si tienes cuenta) | Gratis (lo que se usa si no) |
|---|---|---|
| Voces del diálogo y narración | ElevenLabs | edge-tts (voces de Microsoft, necesitan internet) |
| Imágenes de apoyo | Gemini (Vertex AI o API de Gemini) | Tus fotos y clips, o Wikimedia Commons con su crédito |
| Música y efectos | — | Sintetizados por la oficina, sin derechos de autor |

Si una clave falla a medio vídeo (sin saldo, clave vencida), la voz cambia sola a edge-tts y te avisa.

## Cómo se usa (en palabras sencillas)
Abre **"Oficina de video"** en tu escritorio. Se abre una ventana negra: es Claude. Ahí **escribes como si le
mandaras un mensaje a alguien** y presionas Enter. No tienes que aprender comandos; los que empiezan con `/` son atajos.

**La primera vez:** escribe `/configurar`. Claude te pregunta quién eres, qué cuentas tienes (TikTok, Facebook), de qué
tratan tus vídeos y cómo hablas. Contestas eligiendo opciones con las flechas y Enter. Solo se hace una vez.

**Para hacer un vídeo con tus clips:**
1. Escribe, por ejemplo: *"quiero editar un vídeo de mi viaje a la playa"*.
2. Antes de empezar, el técnico revisa que tu computadora esté lista (unos segundos).
3. Claude te hace unas preguntas: qué quieres que sienta la gente, qué estilo te gusta (te da 2–3 para elegir), etc.
4. Te da una dirección y un código para **subir los clips desde tu celular** (misma red Wi-Fi de tu casa). Abres la
   dirección en el celular, escribes el código y eliges los vídeos. También puedes copiarlos a la carpeta que te diga.
5. Claude edita: letras, transiciones, emojis, efectos de sonido. Ves una barra de progreso mientras se arma.
6. Te entrega el **MP4 terminado** y el **texto para el post**. Tú lo ves, pides cambios si quieres
   (*"el título más grande"*, *"quita el emoji del final"*) y **lo publicas tú**.

**Para un vídeo sin grabar nada** (un diálogo con un avatar y un robot, o animaciones): escribe
*"hazme un vídeo explicando…"* y Claude lo crea desde cero.

**Para ideas de la semana:** escribe `/semana`. Claude busca qué está pegando en tu tema, cómo están hechos esos
vídeos y te propone ideas. Tú eliges cuáles sí.

| Escribe… | Para… |
|---|---|
| `/configurar` | Darte de alta (la primera vez) |
| `/video` o *"hazme un vídeo de…"* | Hacer o editar un vídeo |
| `/semana` | Ideas y tendencias de la semana |
| `/tecnico` o *"algo no funciona"* | Que el técnico revise y arregle tu computadora |
| `/cierre` | Revisar cómo te fue (métricas) |

**Consejos:** un vídeo a la vez; cierra el navegador mientras se arma el vídeo si tu computadora es lenta; si algo
no se entiende, pregúntale a Claude *"explícamelo más fácil"*.

### Preguntas frecuentes
- **¿Cuánto cuesta?** Solo tu plan de Claude (Pro o Max). Todo lo demás es gratis. ElevenLabs y Gemini son opcionales.
- **¿Se publica solo?** No. Nunca. Tú decides y publicas.
- **¿Mis vídeos se suben a internet?** Tus clips y el MP4 se quedan en tu computadora. Lo que le escribes a Claude
  y algunas fotos sueltas de tus clips (para revisar el vídeo) van a tu cuenta de Claude, como en cualquier chat.
- **¿Necesito internet?** Sí, para hablar con Claude y para las voces gratis. Subir clips del celular solo usa tu Wi-Fi.
- **¿Funciona en mi computadora?** Probado en Windows 11 con 8 GB de RAM. Con menos memoria va más lento.

## Opcional (cuesta dinero, en tu propia cuenta)
- **Voces de ElevenLabs**: pon `ELEVENLABS_API_KEY=...` en `video-studio/.env.local`. Sin ella se usan voces gratis de edge-tts.
- **Imágenes IA con Gemini**, una de dos:
  - API de Gemini: `GEMINI_API_KEY=...` en `.env.local` (en la raíz). Necesita facturación activa en AI Studio: el
    nivel gratis no genera imágenes.
  - Vertex AI: `gcloud auth application-default login` y la variable `GOOGLE_CLOUD_PROJECT` con tu proyecto.
  Pon una alerta de presupuesto. Claude siempre pide permiso antes de generar una imagen.
- Después de poner una clave, corre otra vez `python pipeline/revisar_equipo.py`.
- **Lote del sábado**: `pipeline/lote_semanal.ps1` deja ideas, guiones y textos de la semana listos sin que estés
  presente (las instrucciones para programarlo vienen en el archivo). Gasta uso de tu plan de Claude.

## Reglas que trae de fábrica
- Ningún agente publica ni programa nada: **publicas tú**.
- Datos con fuente, o se quitan. Menores siempre difuminados. Nada de personas reconocibles sin permiso.
- Se estudia el diseño de lo que pega, pero nunca se copia material, música con derechos ni ideas exactas de otros.
- Toda imagen IA se etiqueta "Imagen creada con IA".
- Claves y tarjetas nunca se escriben en el chat.

## Privacidad
`.gitignore` deja fuera de git tus clips, MP4, audios, voces, claves (`.env*`), registros y los códigos de la página de
subida. Si haces tu propio fork **público**, recuerda que tus fichas de perfil, guiones y textos sí se suben: revisa
antes qué datos tuyos o de tu familia contienen.

## Licencias
- Código de esta oficina: [MIT](LICENSE).
- **Remotion** tiene su propia licencia: gratis para personas, organizaciones sin fines de lucro y empresas de hasta
  3 personas; las empresas más grandes necesitan una [licencia de empresa](https://www.remotion.dev/license).
- **Twemoji**: CC-BY 4.0. Pon "Emojis: Twemoji, CC-BY 4.0" en el texto del post (la oficina lo hace sola en post.txt).
- Fuentes Bangers y Anton: SIL Open Font License.
