# Kit de edición: letras, transiciones, emojis y efectos de sonido

Se usa en TODAS las piezas de EDICIÓN (clips propios) de cualquier perfil. Motor: composición **VlogVideo** de video-studio,
`python pipeline/vlog.py <slug>` desde video-studio (detalle técnico en video-studio/CLAUDE.md). Ejemplo completo:
video-studio/ejemplos/armar_vlog_ejemplo.py (genera el vlog.json desde el "Plan técnico" del guionista).

## Formato
- Vertical 1080x1920, 30 fps, alta calidad (CRF 14, AAC 320k, −14 LUFS). Por defecto UN solo archivo vertical para
  TikTok y Facebook (Reel). Si el brief pide horizontal, se hace aparte.
- Zonas seguras de TikTok: los rótulos van en y=200–850, los subtítulos en y≈1290; nada en y>1560 ni en la franja
  derecha x>900, salvo en la tarjeta final.

## Letras
- Rótulos: **Bangers**. Subtítulos: **Anton** en MAYÚSCULAS, crema con trazo café, palabra clave en naranja (`*clave*`).
- Colores por defecto: naranja #FF7A1A, naranja quemado #E8590C, café #2B1A10, crema #FFF3DC, tierra #6B4423.
  Para otra paleta, cambia las constantes NARANJA, TIERRA, CREMA y QUEMADO al inicio de video-studio/src/VlogVideo.tsx.
- Estilos de rótulo: `gancho` (frase de 0–3 s, visible desde el fotograma 0, que sirve de portada), `grande`, `rotulo` (tarjeta
  crema con sombra naranja), `sello` (golpe, se usa para el remate), `banner` (franjas, para seguridad o avisos), `chip` (píldora para el modelo o un dato).
- Animaciones: `pop`, `slam` (para el remate), `shake`, `maquina` (tecleo), `sube`, `izq`. Rótulos cortos (contador) salen en seco.

## Transiciones (@remotion/transitions)
- `slide`, `wipe`, `flip`, `clockWipe`, `fade` de 3–9 fotogramas, más `none` (corte seco entre tomas del mismo clip).
- Una transición por cambio de escena, no en cada corte. El solape va en el silencio entre frases (0.12–0.2 s).
- Zooms de golpe (1.12–1.2) y vibración en el remate; zoom lento (ken) para dar vida a las tomas largas; chip "x1.5 ⏩" cuando hay velocidad.

## Emojis (Twemoji, CC-BY 4.0)
- Se escribe el emoji Unicode en el plan y vlog.py copia el SVG. Crédito obligatorio en post.txt: "Emojis: Twemoji, CC-BY 4.0".
- **CON MODERACIÓN (aprendido a la mala: con más, el vídeo se ve saturado)**: máximo unos **9–10 por minuto**, solo en
  momentos clave (gancho, chiste, remate, aviso de seguridad, CTA) y **nunca dos a la vez** (la única excepción es un par que
  forma un solo chiste, como 📖 + 🚫). No pongas uno por cada rótulo ni lluvias de emojis (p. ej. 6 tornillos cayendo).
- Van junto al rótulo y sin tapar caras ni el objeto. Animaciones: `pop`, `rebote`, `gira`, `flota`, `cae`, `cruza`, `pulso`.
- Sin banderas. Sin emojis dentro del texto de los rótulos (van aparte).

## Efectos de sonido: CON MODERACIÓN (los efectos de más cansan rápido)
- Sintetizados por la oficina (video-studio/pipeline/sfx.py), sin derechos: impacto, caja, boing, scratch, error, silbato,
  ding, tada, clack, whoosh, notaNNN, pop, tic, etc.
- **Máximo unos 12 efectos por minuto** (más una secuencia rítmica si hay contador), y **solo en momentos clave**: gancho, remate,
  giro de "expectativa vs. realidad", dato estrella, cierre.
- **Prohibido:** un whoosh en cada transición, un pop en cada rótulo, efectos encima de la voz en una frase importante,
  dos efectos en el mismo segundo.
- Volumen 0.25–0.4 frente a la voz (1.0). La cama musical sintetizada va baja (0.10) y se aparta a 0.06 cuando hay voz.

## Tarjeta final (2–3 s)
- "PRÓXIMO VIDEO" + gancho del siguiente, píldora con el tema, botón de CTA, una pregunta para los comentarios y la firma de la cuenta del perfil.
