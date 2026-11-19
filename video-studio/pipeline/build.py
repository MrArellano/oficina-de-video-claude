"""Build a video from projects/<name>/guion.json.
Usage: python pipeline/build.py <name> [--no-render]
guion.json:
{ "voice": "es-ES-AlvaroNeural", "rate": "+8%", "highlight": ["aspirina"],
  "scenes": [ {"text": "Frase que se dice mientras se ve la imagen.", "img": "01.png", "motion": "in"} ] }
Images live in projects/<name>/img/. Voice engine: edge (free) or elevenlabs (needs ELEVENLABS_API_KEY).
"""
import asyncio, base64, difflib, json, os, re, shutil, subprocess, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30

def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9ñ]", "", "".join(c for c in s if unicodedata.category(c) != "Mn"))

async def tts_edge(text, voice, rate, out):
    import edge_tts
    com = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    words = []
    with open(out, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                st = ch["offset"] / 1e7
                words.append({"w": ch["text"], "start": st, "end": st + ch["duration"] / 1e7})
    return words

def tts_eleven(text, voice_id, out):
    import requests
    r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps",
        headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"]},
        json={"text": text, "model_id": "eleven_multilingual_v2"}, timeout=300)
    r.raise_for_status(); d = r.json()
    Path(out).write_bytes(base64.b64decode(d["audio_base64"]))
    al = d["alignment"]; words, cur, st = [], "", None
    for c, s, e in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if c.isspace():
            if cur: words.append({"w": cur, "start": st, "end": last}); cur = ""
            continue
        if not cur: st = s
        cur += c; last = e
    if cur: words.append({"w": cur, "start": st, "end": last})
    return words

def align(tokens, timed):
    """Give every script token a time by aligning against TTS words."""
    a = [norm(t) for t in tokens]; b = [norm(w["w"]) for w in timed]
    times = [None] * len(tokens)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            times[blk.a + k] = (timed[blk.b + k]["start"], timed[blk.b + k]["end"])
    known = [i for i, t in enumerate(times) if t]
    for i, t in enumerate(times):  # interpolate gaps
        if t: continue
        prev = max([k for k in known if k < i], default=None); nxt = min([k for k in known if k > i], default=None)
        s = times[prev][1] if prev is not None else 0.0
        e = times[nxt][0] if nxt is not None else s + 0.4
        n = (nxt if nxt is not None else len(tokens)) - (prev if prev is not None else -1)
        pos = i - (prev if prev is not None else -1)
        times[i] = (s + (e - s) * (pos - 1) / n, s + (e - s) * pos / n)
    return times

def main():
    name = sys.argv[1]; proj = ROOT / "projects" / name
    g = json.loads((proj / "guion.json").read_text(encoding="utf-8"))
    pub = ROOT / "public" / name; pub.mkdir(parents=True, exist_ok=True)
    full = " ".join(s["text"].strip() for s in g["scenes"])
    audio = pub / "voice.mp3"
    if g.get("engine") == "elevenlabs":
        timed = tts_eleven(full, g["voice_id"], audio)
    else:
        timed = asyncio.run(tts_edge(full, g.get("voice", "es-ES-AlvaroNeural"), g.get("rate", "+8%"), audio))
    hl = {norm(h) for h in g.get("highlight", [])}
    words, scenes, tokens, owner = [], [], [], []
    for si, s in enumerate(g["scenes"]):
        for t in s["text"].split():
            tokens.append(t); owner.append(si)
    times = align(tokens, timed)
    for t, (st, en) in zip(tokens, times):
        words.append({"w": t, "start": round(st, 3), "end": round(en, 3), "hl": norm(t) in hl})
    dur = words[-1]["end"] + g.get("tail", 0.8)
    for si, s in enumerate(g["scenes"]):
        idx = [i for i, o in enumerate(owner) if o == si]
        start = 0.0 if si == 0 else words[idx[0]]["start"] - 0.08
        sc = {k: v for k, v in s.items() if k != "text"}
        sc.update(start=round(start, 3), end=0)
        if s.get("img"):
            sc["img"] = f"{name}/{s['img']}"; shutil.copy(proj / "img" / s["img"], pub / s["img"])
        scenes.append(sc)
    for i, sc in enumerate(scenes):
        sc["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else dur
    props = {"fps": FPS, "duration": round(dur, 3), "audio": f"{name}/voice.mp3", "scenes": scenes, "words": words, "handle": g.get("handle", "")}
    if g.get("music"):
        shutil.copy(proj / g["music"], pub / g["music"]); props["music"] = f"{name}/{g['music']}"
    (proj / "props.json").write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"props ok: {len(scenes)} escenas, {len(words)} palabras, {dur:.1f}s")
    if "--no-render" in sys.argv: return
    out = proj / f"{name}.mp4"
    subprocess.run(f'npx remotion render src/index.ts MedVideo "{out}" --props="{proj / "props.json"}" --codec=h264 --crf=18',
                   cwd=ROOT, shell=True, check=True)
    print("VIDEO:", out)
    # Cover: first scene alone, no captions, fully animated in
    cover = dict(props, words=[], audio="", duration=3, scenes=[dict(scenes[0], start=0, end=3)])
    (proj / "cover.json").write_text(json.dumps(cover, ensure_ascii=False), encoding="utf-8")
    subprocess.run(f'npx remotion still src/index.ts MedVideo "{proj / "portada.png"}" --props="{proj / "cover.json"}" --frame=60',
                   cwd=ROOT, shell=True, check=True)
    print("PORTADA:", proj / "portada.png")

if __name__ == "__main__":
    main()
