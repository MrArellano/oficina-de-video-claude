---
description: Tendencias + recetario de diseño + ideas de la semana para un perfil (o todos). Se detiene para que el creador vete.
argument-hint: "[perfil | todos] [AAAA-WW opcional]"
---
Argumentos: $ARGUMENTS. Perfil vacío = todos los de perfiles/ (sin las carpetas que empiezan con _). Semana vacía = semana ISO actual (`date +%G-%V`).

Por cada perfil (en paralelo, un agente por perfil):
1. Si ya existen perfiles/<perfil>/tendencias/semana-<sem>.md, diseno-<sem>.md e ideas/semana-<sem>.md, NO vuelvas a
   investigar: léelos. Si no, lanza `investigador-tendencias` con el perfil y la semana. Que marque ★ tantas ideas
   como diga el "Ritmo" de la ficha del perfil (por defecto 3).
2. Muestra al creador una tabla corta por perfil: slug propuesto, pilar, ángulo en una línea, estilo de diseño, si es
   creación o edición (y si hay que grabar), riesgo.
   Comprueba el reparto de pilares de la ficha del perfil y la prueba de aporte.
3. DETENTE. Pregunta qué veta o cambia. No escribas guiones aquí.
   Lo siguiente es `/producir <slugs>` (guion y textos) o directamente `/video <perfil> <slug>`.
