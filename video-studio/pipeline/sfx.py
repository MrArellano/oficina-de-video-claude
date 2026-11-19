"""Efectos de sonido sintetizados (numpy, sin derechos de terceros) para VlogVideo.

python pipeline/sfx.py <carpeta_salida>   → escribe <nombre>.wav de cada efecto de EFECTOS.
Nombres: whoosh, swoosh, pop, ding, boing, tic, tictac, scratch, tuc, caja, impacto, click, obturador, brillo, error, tada, laser.
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
rng = np.random.default_rng(11)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(d, ataque=0.005, caida=0.2):
    t = t_(d)
    return np.minimum(1, t / max(ataque, 1e-4)) * np.exp(-t / caida)


def ruido(d):
    return rng.standard_normal(int(d * SR))


def pasabanda(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def barrido(f0, f1, d, forma="sin"):
    t = t_(d)
    f = f0 * (f1 / f0) ** (t / d)
    fase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(fase) if forma == "sin" else np.sign(np.sin(fase))


def whoosh(d=0.45, sube=True):
    n = ruido(d)
    t = t_(d)
    out = np.zeros_like(n)
    pasos = 24
    for k in range(pasos):
        a, b = int(k * len(n) / pasos), int((k + 1) * len(n) / pasos)
        c = (k / pasos) if sube else 1 - k / pasos
        out[a:b] = pasabanda(n, 300 + 4000 * c, 900 + 6000 * c)[a:b]
    return out * np.sin(np.pi * t / d) ** 1.5


EFECTOS = {
    "whoosh": lambda: whoosh(0.45),
    "swoosh": lambda: whoosh(0.3, False),
    "pop": lambda: barrido(900, 250, 0.09) * env(0.09, 0.001, 0.03),
    "ding": lambda: sum(np.sin(2 * np.pi * f * t_(1.2)) * a for f, a in [(1318.5, 1), (2637, 0.35), (3951, 0.12)]) * env(1.2, 0.002, 0.35),
    "boing": lambda: np.sin(2 * np.pi * np.cumsum(220 + 120 * np.sin(2 * np.pi * 9 * t_(0.6)) * np.exp(-t_(0.6) / 0.3)) / SR) * env(0.6, 0.003, 0.25),
    "tic": lambda: pasabanda(ruido(0.03), 2500, 7000) * env(0.03, 0.0005, 0.006),
    "tictac": lambda: np.concatenate([np.pad(pasabanda(ruido(0.03), 2500 if i % 2 else 1600, 7000) * env(0.03, 0.0005, 0.006), (0, int(0.22 * SR))) for i in range(8)]),
    "scratch": lambda: pasabanda(ruido(0.35), 400, 3500) * np.abs(np.sin(2 * np.pi * 7 * t_(0.35))) * env(0.35, 0.005, 0.2) + 0.4 * barrido(1200, 200, 0.35) * env(0.35, 0.005, 0.15),
    "tuc": lambda: (np.sin(2 * np.pi * 180 * t_(0.12)) + 0.5 * pasabanda(ruido(0.12), 800, 2500)) * env(0.12, 0.001, 0.025),
    "caja": lambda: np.concatenate([
        sum(np.sin(2 * np.pi * f * t_(0.08)) for f in (2200, 3300)) * env(0.08, 0.001, 0.02) * 0.6,
        np.zeros(int(0.05 * SR)),
        sum(np.sin(2 * np.pi * f * t_(1.0)) * a for f, a in [(2093, 1), (4186, 0.4), (3136, 0.3)]) * env(1.0, 0.002, 0.3)]),
    "impacto": lambda: (barrido(110, 38, 0.7) * env(0.7, 0.002, 0.25) * 1.2 + pasabanda(ruido(0.7), 60, 900) * env(0.7, 0.001, 0.08)),
    "click": lambda: pasabanda(ruido(0.015), 1500, 9000) * env(0.015, 0.0003, 0.003),
    "obturador": lambda: np.concatenate([pasabanda(ruido(0.04), 1200, 8000) * env(0.04, 0.0005, 0.01), np.zeros(int(0.06 * SR)),
                                         pasabanda(ruido(0.06), 800, 6000) * env(0.06, 0.0005, 0.015)]),
    "brillo": lambda: sum(np.sin(2 * np.pi * f * t_(0.9)) * env(0.9, 0.002, 0.18 + 0.05 * k) * (np.arange(int(0.9 * SR)) > int(k * 0.06 * SR))
                          for k, f in enumerate([1568, 2093, 2637, 3136, 4186])),
    "error": lambda: np.concatenate([barrido(220, 210, 0.18, "sq") * env(0.18, 0.003, 0.5), np.zeros(int(0.05 * SR)),
                                     barrido(180, 170, 0.3, "sq") * env(0.3, 0.003, 0.5)]) * 0.35,
    "tada": lambda: sum(np.pad(sum(np.sin(2 * np.pi * f * h * t_(0.9)) / h for h in (1, 2, 3)) * env(0.9, 0.003, 0.35),
                               (int(i * 0.11 * SR), int(1.4 * SR)))[: int(1.4 * SR)]
                        for i, f in enumerate([523.3, 659.3, 784, 1046.5])),
    "bip": lambda: np.concatenate([np.sin(2 * np.pi * 880 * t_(0.08)) * env(0.08, 0.002, 0.05), np.zeros(int(0.06 * SR)),
                                   np.sin(2 * np.pi * 880 * t_(0.08)) * env(0.08, 0.002, 0.05)]),
    "silbato": lambda: barrido(1800, 350, 0.7) * np.minimum(1, t_(0.7) / 0.03) * np.minimum(1, (0.7 - t_(0.7)) / 0.1),
    "zip": lambda: barrido(200, 2500, 0.25, "sq") * 0.3 * env(0.25, 0.01, 0.2) + 0.5 * whoosh(0.25),
    "clack": lambda: np.concatenate([pasabanda(ruido(0.05), 1500, 8000) * env(0.05, 0.0005, 0.008), np.zeros(int(0.07 * SR)),
                                     (pasabanda(ruido(0.08), 600, 5000) + 0.6 * np.sin(2 * np.pi * 2900 * t_(0.08))) * env(0.08, 0.0005, 0.02)]),
    **{f"nota{int(f)}": (lambda f=f: (np.sin(2 * np.pi * f * t_(0.16)) + 0.3 * np.sin(4 * np.pi * f * t_(0.16))) * env(0.16, 0.002, 0.06))
       for f in (523, 587, 659, 784, 880, 1047)},
    "laser": lambda: barrido(3000, 300, 0.35) * env(0.35, 0.002, 0.15) + 0.4 * barrido(3200, 320, 0.35, "sq") * env(0.35, 0.002, 0.1),
}


def guardar(x, ruta):
    x = np.asarray(x, float)
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    fin = min(len(x), int(0.01 * SR))
    if fin:
        x[-fin:] *= np.linspace(1, 0, fin)
    pcm = (np.stack([x, x], 1) * 32767).astype(np.int16)
    with wave.open(str(ruta), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


def main():
    out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
    for nombre, f in EFECTOS.items():
        guardar(f(), out / f"{nombre}.wav")
    print(f"{len(EFECTOS)} efectos en {out}")


if __name__ == "__main__":
    main()
