"""Vlog vertical con clips propios (composición VlogVideo).

python pipeline/vlog.py <slug> [--prueba 1.0,24.3,47.9] [--sin-render]
Lee projects/<slug>/vlog.json (tomas, trans, subs, titulos, emojis con el carácter, sfx por nombre, fin, musica).
- Copia los emojis de Twemoji (node_modules/@twemoji/svg, CC-BY 4.0) a public/<slug>/emoji/.
- Efectos: public/<slug>/sfx/<nombre>.wav (pipeline/sfx.py, sintetizados).
- Cama musical sintetizada (sin derechos) que baja bajo la voz (tramos de subs) → public/<slug>/musica.wav.
- Escribe projects/<slug>/props.json y renderiza: vídeo por tramos (REMOTION_CHUNK, mudo) + audio WAV completo, y une.
--prueba: solo saca fotogramas fijos en esos segundos (projects/<slug>/prueba-*.png).
Log de progreso en projects/<slug>/render.log (lo lee pipeline/progreso.py).
"""
import json
import os
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
FF = shutil.which("ffmpeg") or "ffmpeg"
SR = 48000


def emoji_archivo(ch):
    cps = [f"{ord(c):x}" for c in ch if ord(c) != 0xFE0F]
    nombre = "-".join(cps)
    src = ROOT / "node_modules" / "@twemoji" / "svg" / f"{nombre}.svg"
    if not src.exists():
        src = ROOT / "node_modules" / "@twemoji" / "svg" / f"{'-'.join(f'{ord(c):x}' for c in ch)}.svg"
    if not src.exists():
        raise SystemExit(f"emoji sin archivo Twemoji: {ch} ({nombre})")
    return src, nombre


def cama(total, voz, ruta, nivel=0.10, bajo=0.06, alto=0.18, altos=()):
    """Pad cálido + pluck tipo marimba, C–Am–F–G a ~95 bpm. Sintetizado aquí: sin derechos de terceros."""
    n = int(total * SR); t = np.arange(n) / SR; out = np.zeros(n)
    golpe = 60 / 95; compas = golpe * 4
    acordes = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]]
    k = 0
    while k * compas < total:
        a = int(k * compas * SR); b = min(n, int((k + 1) * compas * SR) + int(0.3 * SR))
        tt = np.arange(b - a) / SR
        ac = acordes[k % 4]
        pad = sum(np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 1.003 * tt) for f in ac)
        pad *= np.minimum(1, tt / 0.4) * np.minimum(1, np.maximum(0, (compas + 0.3 - tt) / 0.4))
        out[a:b] += 0.08 * pad
        for j in range(8):  # corcheas de marimba
            ini = a + int(j * golpe / 2 * SR)
            if ini >= n:
                break
            f = ac[[0, 1, 2, 1, 2, 0, 1, 2][j]] * 2
            d = int(0.35 * SR); fin = min(n, ini + d); tp = np.arange(fin - ini) / SR
            out[ini:fin] += 0.22 * (np.sin(2 * np.pi * f * tp) + 0.25 * np.sin(2 * np.pi * 4 * f * tp) * np.exp(-tp / 0.02)) * np.exp(-tp / 0.12)
        k += 1
    out /= np.abs(out).max() + 1e-9
    lv = np.full(n, nivel)
    for a, b in voz:
        lv[(t >= a - 0.1) & (t < b + 0.15)] = bajo
    for a, b in altos:
        lv[(t >= a) & (t < b)] = alto
    k = int(0.25 * SR)  # promedio móvil rápido (cumsum)
    c = np.cumsum(np.concatenate([np.full(k // 2, lv[0]), lv, np.full(k - k // 2, lv[-1])]))
    lv = (c[k:] - c[:-k]) / k
    lv = lv[:n]
    out *= lv
    fo = t > total - 0.67
    out[fo] *= np.clip((total - t[fo]) / 0.67, 0, 1)
    pcm = (np.stack([out, out], 1) * 32767).astype(np.int16)
    with wave.open(str(ruta), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


def leer_audio(ruta, desde=0.0, dur=None, vel=1.0):
    """Audio estéreo float32 a 48 kHz con ffmpeg del sistema (con atempo si hay velocidad)."""
    cmd = [FF, "-v", "error", "-ss", f"{desde:.3f}"] + (["-t", f"{dur:.3f}"] if dur else []) + ["-i", str(ruta), "-vn"]
    if abs(vel - 1) > 1e-3:
        cmd += ["-af", f"atempo={vel}"]
    cmd += ["-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)


def mezclar(props, pub, dur_f, trans, fps, total, ruta):
    """Voz de cada toma (con su velocidad y fundidos cortos) + efectos + cama musical → WAV."""
    n = int(total * SR) + SR
    out = np.zeros((n, 2))
    ini = 0
    for i, tm in enumerate(props["tomas"]):
        d = dur_f[i]
        vol = tm.get("vol", 1)
        if vol > 0:
            a = leer_audio(ROOT / "public" / tm["src"], tm["desde"], tm["hasta"] - tm["desde"], tm.get("vel", 1)) * vol
            a = a[: int(d / fps * SR)]
            fi = int((tm.get("fadeIn", 1) / fps) * SR); fo = int(2 / fps * SR)
            if len(a) > fi + fo:
                a[:fi] *= np.linspace(0, 1, fi)[:, None]; a[-fo:] *= np.linspace(1, 0, fo)[:, None]
            s = int(ini / fps * SR); out[s:s + len(a)] += a[: n - s]
        x = trans[i] if i < len(trans) else None
        ini += d - (x["frames"] if x and x["tipo"] != "none" else 0)
    for x in props["sfx"]:
        a = leer_audio(ROOT / "public" / x["src"]) * x.get("vol", 0.4)
        s = int(x["t"] * SR); out[s:s + len(a)] += a[: max(0, n - s)]
    m = leer_audio(ROOT / "public" / props["musica"]["src"])[:n]
    out[: len(m)] += m
    out = out[: int(total * SR)]
    pico = np.abs(out).max()
    if pico > 0.98:
        out *= 0.98 / pico
    pcm = (out * 32767).astype(np.int16)
    with wave.open(str(ruta), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


def main():
    slug = sys.argv[1]
    proj = ROOT / "projects" / slug; pub = ROOT / "public" / slug
    g = json.loads((proj / "vlog.json").read_text(encoding="utf-8"))
    fps = g.get("fps", 30)
    (pub / "emoji").mkdir(parents=True, exist_ok=True)
    if not (pub / "sfx").exists():
        subprocess.run([sys.executable, str(ROOT / "pipeline" / "sfx.py"), str(pub / "sfx")], check=True)

    # Duración: tomas + fin − solapes.
    dur_f = [max(1, round((t["hasta"] - t["desde"]) / t.get("vel", 1) * fps)) for t in g["tomas"]]
    if g.get("fin"):
        dur_f.append(g["fin"]["frames"])
    sol = sum(x["frames"] for x in g["trans"][: len(dur_f) - 1] if x["tipo"] != "none")
    total_f = sum(dur_f) - sol
    total = total_f / fps

    def emo(ch):
        src, nombre = emoji_archivo(ch)
        dst = pub / "emoji" / f"{nombre}.svg"
        if not dst.exists():
            shutil.copy(src, dst)
        return f"{slug}/emoji/{nombre}.svg"

    emojis = [{**e, "img": emo(e["emoji"])} for e in g["emojis"]]
    for e in emojis:
        e.pop("emoji", None)
    fin = dict(g["fin"]) if g.get("fin") else None
    if fin and fin.get("emoji"):
        fin["emoji"] = emo(fin["emoji"])
    sfx = []
    for x in g["sfx"]:
        f = pub / "sfx" / f"{x['efecto']}.wav"
        if not f.exists():
            raise SystemExit(f"efecto que no existe: {x['efecto']}")
        sfx.append({"t": x["t"], "src": f"{slug}/sfx/{x['efecto']}.wav", "vol": x.get("vol", 0.4)})
    m = g.get("musica", {})
    cama(total, [(s["s"], s["e"]) for s in g["subs"]], pub / "musica.wav", m.get("nivel", 0.10), m.get("bajo", 0.06),
         m.get("alto", 0.18), [tuple(x) for x in m.get("altos", [])])
    tomas = [{**t, "src": f"{slug}/{t['src']}"} for t in g["tomas"]]
    props = {"fps": fps, "duration": total, "tomas": tomas, "trans": g["trans"], "subs": g["subs"], "titulos": g["titulos"],
             "emojis": emojis, "sfx": sfx, "musica": {"src": f"{slug}/musica.wav", "vol": 1.0}, "fin": fin, "flash": g.get("flash", [])}
    (proj / "props.json").write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"props.json: {total_f} fotogramas = {total:.2f} s")
    if "--sin-render" in sys.argv:
        return
    base = f'npx remotion {{}} src/index.ts VlogVideo {{}} --props="{proj / "props.json"}" --gl=angle'
    if "--audio" in sys.argv:  # solo la mezcla, para revisarla
        mezclar(props, pub, dur_f, g["trans"], fps, total, proj / "audio-prueba.wav"); print("audio listo"); return
    if "--prueba" in sys.argv:
        for s in sys.argv[sys.argv.index("--prueba") + 1].split(","):
            fr = int(float(s) * fps)
            subprocess.run(base.format("still", f'"{proj / f"prueba-{float(s):05.1f}.png"}"') + f" --frame={fr}", cwd=ROOT, shell=True, check=True)
        print("pruebas listas"); return

    conc = os.environ.get("REMOTION_CONCURRENCY", "1"); chunk = int(os.environ.get("REMOTION_CHUNK", "300"))
    crf = g.get("crf", 14)
    log = open(proj / "render.log", "w", encoding="utf-8")
    tmp = proj / "_tramos"; tmp.mkdir(exist_ok=True); partes = []
    for a in range(0, total_f, chunk):
        b = min(total_f, a + chunk) - 1; parte = tmp / f"t{a:06d}.mp4"; partes.append(parte)
        if parte.exists():
            continue
        cmd = base.format("render", "") + f' --codec=h264 --crf={crf} --x264-preset=slow --muted --concurrency={conc} --frames={a}-{b} --output="{parte}"'
        subprocess.run(cmd, cwd=ROOT, shell=True, check=True, stdout=log, stderr=subprocess.STDOUT)
    audio = tmp / "audio.wav"
    mezclar(props, pub, dur_f, g["trans"], fps, total, audio)
    lst = tmp / "lista.txt"; lst.write_text("".join(f"file '{x.as_posix()}'\n" for x in partes), encoding="utf-8")
    mudo = tmp / "video.mp4"
    subprocess.run([FF, "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(mudo)], check=True)
    salida = Path(g.get("salida", proj / f"{slug}.mp4"))
    subprocess.run([FF, "-v", "error", "-y", "-i", str(mudo), "-i", str(audio), "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.89:level=false", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest",
                    "-movflags", "+faststart", str(salida)], check=True)
    log.write(f"\nVIDEO: {salida}\nPORTADA: -\n"); log.close()
    shutil.rmtree(tmp)
    print(f"listo: {salida}")


if __name__ == "__main__":
    main()
