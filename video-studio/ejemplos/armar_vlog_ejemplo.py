"""EJEMPLO: genera projects/<slug>/vlog.json desde el "Plan técnico (VlogVideo)" del guion.

Cópialo a projects/<slug>/armar_vlog.py y cambia los datos. Los tiempos salen de palabras.json (transcripción por
palabra de tus clips). Este ejemplo es un unboxing de ~20 s con un solo clip (c0001.mp4) y un contador.
Los clips van como proxies en public/<slug>/c0001.mp4, c0002.mp4… (ver CLAUDE.md de video-studio).

Luego: python armar_vlog.py  →  python ../../pipeline/vlog.py <slug> --prueba 0.5,8,15  →  render completo.
"""
import json
from pathlib import Path

D = Path(__file__).resolve().parent


def T(src, a, b, vel=1, vol=1, **k):
    """Toma: clip, segundo de inicio y fin en el clip, velocidad, volumen y extras (base, ken, zooms, fadeIn)."""
    return {"src": src, "desde": a, "hasta": b, "vel": vel, "vol": vol, **k}


def Z(t, e, dur=0.15, shake=0):
    """Zoom de golpe: t relativo al inicio de la toma (s del vídeo final), escala, duración y vibración."""
    z = {"t": round(t, 3), "escala": e, "dur": dur}
    if shake:
        z["shake"] = shake
    return z


tomas = [
    T("c0001.mp4", 2.10, 7.40, base=1.10, ken=0.05, zooms=[Z(0, 1.0, 0.27), Z(4.1, 1.12)]),   # gancho + presentación
    T("c0001.mp4", 12.00, 16.50, 1.15, ken=0.06, zooms=[Z(2.6, 1.15, 0.12, 4)]),              # remate con vibración
    T("c0001.mp4", 30.20, 35.00, ken=0.04),                                                    # contador
    T("c0001.mp4", 41.00, 44.50, vol=0, base=1.1, ken=0, zooms=[Z(0, 1.0, 2.5)]),              # cierre mudo
]


def tr(tipo, fr, d=None):
    """Transición entre tomas: slide | wipe | flip | clockWipe | fade | none, en fotogramas."""
    x = {"tipo": tipo, "frames": fr}
    if d:
        x["dir"] = d
    return x


# Una por cada toma: la de la toma i va entre ella y la siguiente; la última entra a la tarjeta final ("fin").
trans = [tr("slide", 6, "from-right"), tr("none", 0), tr("fade", 8), tr("slide", 9, "from-bottom")]

# Subtítulos: inicio fin TEXTO (palabra clave entre *asteriscos*), en segundos del vídeo final.
S = """0.10 0.90 POR FIN LLEGÓ
0.90 1.80 LA *CAFETERA*
2.20 3.40 QUE ME PROMETIÓ
3.40 4.60 CAMBIARME LA *VIDA*
5.30 6.80 Y TRAE *CERO* INSTRUCCIONES
9.80 10.40 UNO,
10.60 11.10 DOS,
11.30 11.90 *TRES* PIEZAS
12.40 14.00 Y YA ESTÁ *LISTA*"""
subs = []
for l in S.splitlines():
    a, b, *t = l.split(" ")
    subs.append({"s": float(a), "e": float(b), "texto": " ".join(t)})
for i in range(len(subs) - 1):  # huecos cortos: que el subtítulo no parpadee
    if 0 < subs[i + 1]["s"] - subs[i]["e"] < 0.35:
        subs[i]["e"] = subs[i + 1]["s"]

CREMA = "#FFF3DC"


def Ti(s, e, texto, estilo="grande", y=300, anim="pop", **k):
    """Rótulo. estilo: gancho | grande | rotulo | sello | banner | chip | simple. anim: pop | slam | shake | maquina | sube | izq."""
    return {"s": s, "e": e, "texto": texto, "estilo": estilo, "y": y, "anim": anim, **k}


cuenta = [9.80, 10.60, 11.30]
titulos = [
    Ti(0.0, 2.6, "LA CAFETERA QUE\nME CAMBIARÁ LA *VIDA*", "gancho", 330, "pop", tam=110, rot=-4, sub="(SEGÚN LA CAJA)"),
    Ti(5.3, 6.9, "INSTRUCCIONES:", "rotulo", 320, "maquina", tam=72),
    Ti(6.2, 6.9, "0", "grande", 520, "slam", tam=240),
    Ti(7.0, 8.6, "EXPECTATIVA:\nINGENIERÍA AVANZADA", "grande", 360, "maquina", tam=80),
]
for i, t in enumerate(cuenta):
    titulos.append(Ti(t, cuenta[i + 1] if i < len(cuenta) - 1 else 12.3, str(i + 1), "grande", 560, "pop", tam=320))
titulos += [
    Ti(12.4, 14.0, "LISTA", "sello", 820, "slam", tam=180),
    Ti(14.2, 16.0, "PRÓXIMO VIDEO:", "chip", 460, "izq", tam=64, fondo=CREMA),
]


def E(s, e, em, x, y, anim="pop", tam=200):
    """Emoji Twemoji (CC-BY 4.0). anim: pop | rebote | gira | flota | cae | cruza | pulso. Con moderación."""
    return {"s": s, "e": e, "emoji": em, "x": x, "y": y, "anim": anim, "tam": tam}


emojis = [E(0.15, 2.6, "☕", 860, 580, "flota"),    # gancho
          E(6.2, 6.9, "🚫", 860, 760, "pop", 240),   # cero instrucciones
          E(12.4, 14.0, "✅", 180, 820, "pop", 220)]  # lista


def X(t, ef, v=0.4):
    """Efecto sintetizado (pipeline/sfx.py): impacto, caja, boing, scratch, error, silbato, ding, tada, clack, whoosh, pop, tic, notaNNN."""
    return {"t": t, "efecto": ef, "vol": v}


sfx = [X(0, "impacto", .4), X(6.2, "error", .3)]
sfx += [X(t, f"nota{n}", .25) for t, n in zip(cuenta, (523, 659, 784))]  # contador 1–3
sfx += [X(12.4, "ding", .35)]

fin = {"frames": 90, "pre": "PRÓXIMO VIDEO", "titulo": "EL PRIMER CAFÉ", "emoji": "☕", "pildora": "UNBOXING",
       "cta": "SÍGUEME PARA VERLO", "sub": "¿QUÉ LE PRUEBO PRIMERO?", "firma": "@tu_cuenta"}

g = {"fps": 30, "crf": 14, "tomas": tomas, "trans": trans, "subs": subs, "titulos": titulos, "emojis": emojis, "sfx": sfx, "fin": fin,
     "flash": [6.2, 12.4], "musica": {"nivel": 0.10, "bajo": 0.06, "alto": 0.18, "altos": []},
     # "salida": ruta del MP4 final (p. ej. la carpeta de la pieza en perfiles/<perfil>/edicion/<slug>/<slug>.mp4)
     }
(D / "vlog.json").write_text(json.dumps(g, ensure_ascii=False, indent=1), encoding="utf-8")
print("vlog.json listo")
