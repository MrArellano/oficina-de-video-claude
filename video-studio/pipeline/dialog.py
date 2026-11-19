"""Comedy dialogue video: two 3D characters talking.
Usage: python pipeline/dialog.py <name> [--no-render]
projects/<name>/dialogo.json:
{ "voices": {"yo": {"voice": "es-MX-JorgeNeural", "rate": "+5%", "pitch": "+0Hz"},
             "ia": {"voice": "es-US-AlonsoNeural", "rate": "+8%", "pitch": "+8Hz"}},
  "gap": 0.28, "tail": 0.6,
  "lines": [ {"who": "yo", "text": "...", "cam": "me|ia|two", "brow": 0.8} ],
  "cards": [ {"from": 1, "to": 3, "text": "IA = SÍ A TODO", "emoji": "🤖", "color": "#ffd23f"} ],
  "outro": {"title": "...", "sub": "...", "dur": 3.0} }
"""
import asyncio, json, os, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30

def find_ffmpeg():
    """ffmpeg del PATH; si no, el que instala winget (Gyan.FFmpeg) en Windows."""
    if shutil.which("ffmpeg"):
        return Path(shutil.which("ffmpeg"))
    base = Path.home() / "AppData/Local/Microsoft/WinGet/Packages"
    for p in base.glob("Gyan.FFmpeg*/**/bin/ffmpeg.exe"):
        return p
    return Path("ffmpeg")

FF = find_ffmpeg()
FFPROBE = FF.with_name("ffprobe.exe" if FF.suffix == ".exe" else "ffprobe") if FF.parent != Path(".") else Path("ffprobe")

# Voces gratis de respaldo (edge-tts) si ElevenLabs no está disponible. Cámbialas con "edge" en cada voz de dialogo.json.
EDGE_RESPALDO = {"yo": {"voice": "es-MX-JorgeNeural", "rate": "+5%"},
                 "ia": {"voice": "es-US-AlonsoNeural", "rate": "+8%", "pitch": "+8Hz"}}

def load_env():
    """Load .env.local into os.environ without printing its contents."""
    env = ROOT / ".env.local"
    if not env.exists():
        return
    import os
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

def tts_elevenlabs(text, v, out):
    """ElevenLabs TTS with character timestamps -> (start, end) per word, in seconds."""
    import base64, os, requests
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        raise RuntimeError("Falta ELEVENLABS_API_KEY en .env.local")
    if not v.get("voice_id") or v["voice_id"].startswith("PEGAR_"):
        raise RuntimeError("Falta el voice_id de ElevenLabs en dialogo.json")
    r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{v['voice_id']}/with-timestamps",
        headers={"xi-api-key": key},
        json={"text": text, "model_id": v.get("model", "eleven_multilingual_v2")}, timeout=300)
    r.raise_for_status(); d = r.json()
    Path(out).write_bytes(base64.b64decode(d["audio_base64"]))
    al = d["alignment"]; words, cur, st, last = [], "", None, 0.0
    for c, s, e in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if c.isspace():
            if cur: words.append((st, last)); cur = ""
            continue
        if not cur: st = s
        cur += c; last = e
    if cur: words.append((st, last))
    return words

async def tts(text, v, out):
    import edge_tts
    com = edge_tts.Communicate(text, v["voice"], rate=v.get("rate", "+0%"), pitch=v.get("pitch", "+0Hz"), boundary="WordBoundary")
    words = []
    with open(out, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                s = ch["offset"] / 1e7
                words.append((s, s + ch["duration"] / 1e7))
    return words

def hay_elevenlabs():
    return bool(os.environ.get("ELEVENLABS_API_KEY"))


def hablar(text, v, out, who="yo"):
    """Voz de una línea -> (palabras con tiempos, respaldo usado). ElevenLabs si se pidió y funciona; si no, edge-tts gratis."""
    if v.get("engine") == "elevenlabs":
        try:
            return tts_elevenlabs(text, v, out), False
        except Exception as e:
            motivo = str(e).splitlines()[0][:120]
            if hasattr(e, "response") and getattr(e.response, "status_code", None) in (401, 402, 429):
                motivo = f"ElevenLabs respondió {e.response.status_code} (clave, saldo o límite)"
            edge = v.get("edge") or EDGE_RESPALDO.get(who, EDGE_RESPALDO["yo"])
            print(f"  AVISO: sin ElevenLabs ({motivo}). Uso la voz gratis {edge['voice']} (edge-tts).", flush=True)
            return asyncio.run(tts(text, edge, out)), True
    return asyncio.run(tts(text, v, out)), False


def duration(path):
    r = subprocess.run([str(FFPROBE), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                       capture_output=True, text=True)
    return float(r.stdout.strip())

def main():
    load_env()
    name = sys.argv[1]; proj = ROOT / "projects" / name
    g = json.loads((proj / "dialogo.json").read_text(encoding="utf-8"))
    pub = ROOT / "public" / name; pub.mkdir(parents=True, exist_ok=True)
    gap = g.get("gap", 0.28); t = 0.25
    lines, files = [], []
    for i, ln in enumerate(g["lines"]):
        f = pub / f"l{i:02d}.mp3"
        v = g["voices"][ln["who"]]
        cache = pub / f"l{i:02d}.json"  # reuse the voice if the text and voice did not change (saves TTS credits)
        prev = json.loads(cache.read_text(encoding="utf-8")) if cache.exists() else None
        # Se reutiliza si no cambió; una voz de respaldo se rehace cuando ya hay clave de ElevenLabs.
        if prev and f.exists() and prev.get("text") == ln["text"] and prev.get("voice") == v                 and not (prev.get("respaldo") and hay_elevenlabs()):
            words = [tuple(w) for w in prev["words"]]
            print(f"  l{i:02d}: voz reutilizada")
        else:
            words, respaldo = hablar(ln["text"], v, f, ln["who"])
            cache.write_text(json.dumps({"text": ln["text"], "voice": v, "respaldo": respaldo, "words": [list(w) for w in words]}, ensure_ascii=False), encoding="utf-8")
        d = duration(f)
        bg = ln.get("bg") or g.get("bg")
        lines.append({"who": ln["who"], "text": ln["text"], "cam": ln.get("cam", "me" if ln["who"] == "yo" else "ia"),
                      "start": round(t, 3), "end": round(t + d, 3), "brow": ln.get("brow"),
                      "words": [{"start": round(t + a, 3), "end": round(t + b, 3)} for a, b in words]})
        if bg: lines[-1]["bg"] = bg
        files.append((f, t)); t += d + gap
    for i, l in enumerate(lines):
        l["shotEnd"] = lines[i + 1]["start"] if i + 1 < len(lines) else l["end"] + g.get("tail", 0.6)
        if l["brow"] is None: del l["brow"]
    end = lines[-1]["shotEnd"]
    outro = None
    if g.get("outro"):
        o = g["outro"]; outro = {"start": round(end, 3), "title": o["title"], "sub": o.get("sub")}
        end += o.get("dur", 3.0)
    cards = [{"start": lines[c["from"]]["start"], "end": lines[c["to"]]["end"], "text": c["text"], "emoji": c.get("emoji"), "color": c.get("color")}
             for c in g.get("cards", [])]
    pics = []
    for c in g.get("pics", []):  # {"from","to","img" (relative to project),"label"}
        import shutil; src = proj / c["img"]; shutil.copy(src, pub / src.name)
        pics.append({"start": lines[c["from"]]["start"], "end": lines[c["to"]]["shotEnd"], "img": f"{name}/{src.name}", "label": c.get("label")})
    # mix all line audio at their offsets
    cmd = [str(FF), "-v", "error", "-y"]
    for f, _ in files: cmd += ["-i", str(f)]
    fc = "".join(f"[{i}:a]adelay={int(s*1000)}|{int(s*1000)}[a{i}];" for i, (_, s) in enumerate(files))
    fc += "".join(f"[a{i}]" for i in range(len(files))) + f"amix=inputs={len(files)}:normalize=0,apad=whole_dur={end:.2f}[out]"
    cmd += ["-filter_complex", fc, "-map", "[out]", "-t", f"{end:.2f}", str(pub / "voice.mp3")]
    subprocess.run(cmd, check=True)
    props = {"fps": FPS, "duration": round(end, 3), "audio": f"{name}/voice.mp3", "lines": lines, "cards": cards,
             "outro": outro, "handle": g.get("handle", "")}
    if g.get("aiLabel"): props["aiLabel"] = g["aiLabel"]
    if pics: props["pics"] = pics
    # "screens": app-style cards. {"from","to","chip","title","rows":[{"k","v","color"}],"items":[{"text","line","stamp"}],"footer","accent"}
    screens = []
    for c in g.get("screens", []):
        sc = {k: c[k] for k in ("chip", "title", "rows", "footer", "accent") if k in c}
        sc["start"] = lines[c["from"]]["start"]; sc["end"] = lines[c["to"]]["shotEnd"] - 0.05
        if c.get("items"):
            sc["items"] = [{"text": it["text"], "stamp": it.get("stamp"), "at": lines[it["line"]]["start"] + it.get("delay", 0.4)} for it in c["items"]]
        screens.append(sc)
    if screens: props["screens"] = screens
    # "phones": animated phone mock-ups. {"from","to","kind":"directorio|foto|menu|whatsapp|fidelidad","label","brand"}
    phones = [{**{k: v for k, v in c.items() if k not in ("from", "to")}, "start": lines[c["from"]]["start"], "end": lines[c["to"]]["shotEnd"] - 0.05}
              for c in g.get("phones", [])]
    if phones: props["phones"] = phones
    COMP = "DialogVideo" if g.get("look") == "clasico" else "CineVideo"  # default look: cine (night 3D set)
    if g.get("music"):
        import shutil; shutil.copy(proj / g["music"], pub / g["music"]); props["music"] = f"{name}/{g['music']}"
    (proj / "props.json").write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"props ok: {len(lines)} lineas, {end:.1f}s")
    if "--no-render" in sys.argv: return
    out = proj / f"{name}.mp4"
    conc = os.environ.get("REMOTION_CONCURRENCY", "50%")
    chunk = int(os.environ.get("REMOTION_CHUNK", "0"))  # >0: render in chunks of N frames (fresh browser each) for low-RAM PCs
    base = f'npx remotion render src/index.ts {COMP} --props="{proj / "props.json"}" --codec=h264 --crf=18 --gl=angle --concurrency={conc}'
    if not chunk:
        subprocess.run(f'{base} --output="{out}"', cwd=ROOT, shell=True, check=True)
    else:
        total = int(round(end * FPS)); tmp = proj / "_tramos"; tmp.mkdir(exist_ok=True)
        parts = []
        for a in range(0, total, chunk):
            b = min(total, a + chunk) - 1; part = tmp / f"t{a:06d}.mp4"; parts.append(part)
            if part.exists(): print(f"  tramo {a}-{b}: ya estaba"); continue
            subprocess.run(f'{base} --muted --frames={a}-{b} --output="{part}"', cwd=ROOT, shell=True, check=True)
            print(f"  tramo {a}-{b} ok")
        lst = tmp / "lista.txt"; lst.write_text("".join(f"file '{x.as_posix()}'" + chr(10) for x in parts), encoding="utf-8")
        silent = tmp / "video.mp4"
        subprocess.run([str(FF), "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(silent)], check=True)
        cmd = [str(FF), "-v", "error", "-y", "-i", str(silent), "-i", str(pub / "voice.mp3")]
        if props.get("music"):
            cmd += ["-i", str(ROOT / "public" / props["music"]), "-filter_complex",
                    "[2:a]volume=0.07[m];[1:a][m]amix=inputs=2:normalize=0:duration=first[a]", "-map", "0:v", "-map", "[a]"]
        else:
            cmd += ["-map", "0:v", "-map", "1:a"]
        cmd += ["-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)]
        subprocess.run(cmd, check=True)
        import shutil; shutil.rmtree(tmp)
    print("VIDEO:", out)
    subprocess.run(f'npx remotion still src/index.ts {COMP} "{proj / "portada.png"}" --props="{proj / "props.json"}" --frame={int(lines[0]["start"]*FPS)+8} --gl=angle',
                   cwd=ROOT, shell=True, check=True)
    print("PORTADA:", proj / "portada.png")

if __name__ == "__main__":
    main()
