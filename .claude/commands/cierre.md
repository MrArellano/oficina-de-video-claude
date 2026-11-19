---
description: Cierre de semana por perfil con métricas exportadas → repetir / cambiar / probar.
argument-hint: "[perfil | todos] [AAAA-WW opcional]"
---
Argumentos: $ARGUMENTS. Perfil vacío = todos los de perfiles/. Semana vacía = semana ISO actual.
Por cada perfil, lanza `analista-metricas` sobre perfiles/<perfil>/metricas/ → perfiles/<perfil>/metricas/semana-<sem>.md.
Si no hay datos exportados de ese perfil, pídeselos al creador y no inventes números.
Termina con 3 líneas por perfil: qué repetir, qué cambiar, qué probar la semana siguiente.
Si algo funcionó, anótalo en "Piezas que funcionaron" de perfiles/<perfil>/ficha.md.
Actualiza "Estado actual" en CLAUDE.md.
