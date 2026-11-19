# Brief de vídeo — se llena ANTES de crear o editar cualquier vídeo

Regla: cada vez que el creador pide un vídeo, Claude le pregunta lo necesario (con AskUserQuestion, máx. 4 preguntas
por tanda, con opciones y una recomendada). Solo se pregunta lo que NO se puede deducir del pedido, de la ficha del
perfil o de los clips. Lo que el creador no conteste se decide con el valor por defecto de la ficha y se anota aquí.
Se guarda como perfiles/<perfil>/<creacion|edicion>/<slug>/brief.md.

## 1. Siempre (si no está claro en el pedido)
- Perfil: (uno de perfiles/)
- Tipo: creación (Claude lo hace desde cero: avatar, motion, imágenes) | edición (con clips que sube el creador)
- De qué trata y qué debe sentir o llevarse quien lo ve (una frase)
- Plataformas: Facebook, TikTok o ambas (por defecto las de la ficha, en un solo vertical 1080x1920)

## 2. Si es EDICIÓN (clips propios)
- ¿Ya subió los clips? Si no: `python pipeline/recibir_videos.py --perfil <perfil> --video <slug>`
- Lugar, fecha y contexto de lo grabado (nombre del lugar, fiesta, negocio, quién sale)
- ¿Sale alguien reconocible? ¿Tiene permiso? ¿Salen menores (se difuminan)?
- Audio: narración (voz de la ficha) · su propia voz grabada · sonido ambiente + música · combinación
- Tomas imprescindibles o que NO deben salir
- Datos que deben aparecer (nombre del lugar, horario, precio, cómo llegar) y si están verificados

## 3. Si es CREACIÓN
- Formato: diálogo avatar + Claude · tip con motion graphics · imágenes (IA cuesta dinero: pedir permiso)
- ¿Hay una anécdota real detrás? (si no, se cuenta como ejemplo o recreación)

## 4. Diseño (proponer, no preguntar en blanco)
Claude propone 2–3 estilos sacados de perfiles/<perfil>/tendencias/diseno-*.md (lo que está pegando) y el creador elige:
- Gancho de los primeros 3 s · títulos en pantalla (tipografía, animación) · filtro / color · transiciones · keyframes
  (zooms, paneos, velocidad) · música o sonido en tendencia · duración objetivo · historia (arco en 3 tiempos)
- ¿Tiene un vídeo de referencia que le guste? → `python pipeline/analizar_referencia.py`

- Kit de edición (plantillas/kit-edicion.md), activo por defecto en edición: letras llamativas, transiciones, emojis y
  efectos de sonido CON MODERACIÓN (unos 12 por minuto). Solo se pregunta si el creador quiere más, menos o nada de alguno.

## 5. Entrega
- Fecha en que quiere publicarlo (solo para priorizar; Claude nunca publica)

---
## Respuestas (Claude las llena)
Perfil: · Tipo: · Slug:
Tema / sentimiento:
Plataformas y formato:
Audio:
Personas y permisos:
Datos a mostrar (con fuente):
Estilo elegido (de diseno-*.md):
Referencia:
Duración:
Fecha deseada:
Decidido por defecto (sin preguntar):
