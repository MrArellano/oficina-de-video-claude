# Oficina de vídeo con Claude Code

Una "oficina" de agentes para [Claude Code](https://claude.com/claude-code) que te ayuda a hacer vídeos cortos para
TikTok y Facebook de punta a punta: investiga tendencias y **cómo están diseñados** los vídeos que pegan, te hace el
brief, escribe el guion, monta tus clips con letras animadas, transiciones, emojis y efectos de sonido, revisa la
calidad y te entrega el MP4 con los textos del post. **Tú solo grabas, eliges y publicas.**

Hecho por [@mikes_vlogs](https://www.tiktok.com/@mikes_vlogs) para sus propios vídeos. Lo comparto porque a mucha gente
le gustó cómo quedan.

> Funciona con **tu propia cuenta de Claude Code**. Cada quien usa su suscripción, sus claves y sus archivos: nada
> se comparte con nadie.

## Qué trae
- **6 agentes** (`.claude/agents/`): investigador de tendencias y diseño, guionista, curador de imágenes,
  adaptador a cada red, editor de calidad y analista de métricas. Cada uno con el modelo más barato que le alcanza.
- **Comandos** (`.claude/commands/`): `/configurar`, `/semana`, `/producir`, `/video`, `/cierre` y `/lote-semanal`.
- **video-studio/**: motor de vídeo con [Remotion](https://www.remotion.dev): vlogs con tus clips (VlogVideo), diálogos
  con un avatar 3D y un robot de IA en estilo "cine", motion graphics y promos.
- **pipeline/**: subir clips desde el celular por Wi-Fi (sin internet), desarmar un vídeo de referencia para estudiar su
  ritmo y gancho, estado de todas tus piezas e imágenes IA etiquetadas (opcional).
- **Kit de edición**: rótulos Bangers/Anton, transiciones, emojis Twemoji y efectos de sonido sintetizados (sin derechos
  de autor), todo **con moderación**.

## Requisitos
- Claude Code con tu cuenta ([instalación](https://docs.claude.com/en/docs/claude-code/setup))
- Python 3.10+ · Node.js 18+ · ffmpeg
- Probado en Windows 11 con 8 GB de RAM. En macOS y Linux también debería funcionar (los `.ps1` son solo para Windows).

Windows, en una terminal:
```powershell
winget install Python.Python.3.12 OpenJS.NodeJS.LTS Gyan.FFmpeg
pip install numpy edge-tts faster-whisper requests
```

## Empezar
```bash
git clone https://github.com/MrArellano/oficina-de-video-claude.git
cd oficina-de-video-claude/video-studio && npm install && cd ..
claude
```
La primera vez que abres `claude` en la carpeta, la oficina **revisa tu PC sola** (`pipeline/revisar_equipo.py`):
qué tienes instalado, qué falta y con qué comando instalarlo, y si tienes acceso a los servicios de pago. Donde no lo
tienes, te avisa y usa la alternativa gratis. Puedes correrla cuando quieras:
```bash
python pipeline/revisar_equipo.py            # informe
python pipeline/revisar_equipo.py --instalar # además instala lo gratis que falte (pip, npm, navegador de Remotion)
```

| Para | De pago (si tienes cuenta) | Gratis (lo que se usa si no) |
|---|---|---|
| Voces del diálogo y narración | ElevenLabs | edge-tts (voces de Microsoft, necesitan internet) |
| Imágenes de apoyo | Gemini (Vertex AI o API de Gemini) | Tus fotos y clips, o Wikimedia Commons con su crédito |
| Música y efectos | — | Sintetizados por la oficina, sin derechos de autor |

Si una clave falla a medio vídeo (sin saldo, clave vencida), la voz cambia sola a edge-tts y te avisa.

Dentro de Claude Code:
1. `/configurar`: te pregunta quién eres, tus perfiles (cuentas, voz, pilares) y deja listas tus herramientas.
2. `/semana`: tendencias, recetario de diseño e ideas de la semana. Tú vetas.
3. `/video <perfil> <idea>`: te hace el brief y te entrega el MP4 revisado y el texto del post.

Para subir clips desde el celular (misma red Wi-Fi):
```bash
python pipeline/recibir_videos.py --perfil <perfil> --video <slug>
```
Abre en el celular la dirección que imprime y escribe el código de 6 dígitos. En Windows, la primera vez quizá tengas
que correr `pipeline/abrir_firewall.ps1` como administrador (marca tu Wi-Fi como red privada y abre el puerto 8000 solo
para tu red local).

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
