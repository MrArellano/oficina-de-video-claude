---
description: Lote semanal desatendido (lo lanza una tarea programada, p. ej. el sábado). Cierre de la semana que termina + tendencias, recetario de diseño, ideas, guiones y textos de la siguiente, para todos los perfiles. Nada de vídeos ni publicaciones.
argument-hint: "<semana-actual AAAA-WW> <semana-siguiente AAAA-WW>"
---
Argumentos: $ARGUMENTS → primera = semana que termina, segunda = semana que se prepara.
Corres SIN el creador presente: no hagas preguntas, no esperes respuestas y no te detengas a pedir vetos.

Para cada perfil de perfiles/ (salta las carpetas que empiezan con _):
1. Cierre: sigue .claude/commands/cierre.md para ese perfil. Si perfiles/<perfil>/metricas/ no tiene datos de esa
   semana, sáltalo y anótalo. No inventes números.
2. Tendencias, diseño e ideas: sigue el paso 1 de .claude/commands/semana.md (cuántas ★: el "Ritmo" de la ficha) y toma
   las ★ tal cual.
3. Guion y textos: sigue .claude/commands/producir.md con esas ★, sin detenerte. Si la carpeta de la pieza ya tiene
   guion.md, no la rehagas. En las de edición que necesitan grabar, el guion incluye la lista de tomas.

Escribe calendario/resumen-<semana-siguiente>.md con una tabla por perfil:
perfil | slug | pilar | tipo | estilo de diseño | veredicto | qué falta (tomas por grabar, permisos, datos sin fuente),
lo que se saltó y por qué, y lo que el creador tiene que decidir (vetos, qué vídeos hacer con /video).

Prohibido en este modo: hacer vídeos (dialog.py, build.py, vlog.py), preguntar el brief, publicar o programar,
generar imágenes IA de pago, gastar dinero, tocar archivos .env y borrar archivos.
