---
description: Guion + textos + revisión para uno o varios slugs aprobados (de cualquier perfil). Se detiene para que el creador apruebe. El vídeo se hace después con /video.
argument-hint: "<slug> [slug ...]"
---
Slugs aprobados: $ARGUMENTS (vacío = las ★ no vetadas de la semana actual en perfiles/*/ideas/).

Por cada slug, averigua su perfil (la idea está en perfiles/<perfil>/ideas/) y si es creación o edición.
Carpeta de la pieza: perfiles/<perfil>/<creacion|edicion>/<slug>/ (créala si no existe).
Lanza en paralelo, en un solo mensaje, todo lo que no dependa de otra cosa:

1. Guion: si no existe guion.md, lanza `guionista` con la carpeta de la pieza y la ruta de la idea
   (todos los slugs en paralelo). Él lee la ficha del perfil y el recetario de diseño por ruta.
2. Con guion: en paralelo `curador-imagenes` (→ imagenes.md) y `adaptador-plataforma` (→ plataformas.md, las redes del
   perfil). Ninguno reescribe el guion.
3. Con los dos: `editor-calidad` sobre la carpeta (sonnet; opus solo si la pieza es destacada) → revision.md.
4. Si sale NO APTA: corrige una sola vez con el agente que toque y vuelve a revisar. Si sigue mal, repórtalo.

Al final, tabla: perfil | slug | tipo | veredicto | qué falta (tomas por grabar, permisos, datos sin fuente).
DETENTE. El vídeo se hace con `/video <perfil> <slug>`, que primero le hace al creador las preguntas del brief.
No generes imágenes IA de pago sin permiso. Nunca publiques ni programes nada.
