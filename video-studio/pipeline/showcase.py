"""Product showcase promo (photos + kinetic titles + voice-over).
Usage: python pipeline/showcase.py <name> [--no-render]
projects/<name>/escaparate.json:
{ "voice": {"engine": "elevenlabs", "voice_id": "..."}, "gap": 0.35, "tail": 0.5,
  "theme": {"bg": "#0f3d2e", "accent": "#c8102e", "accent2": "#d4a24c"},
  "scenes": [ {"text": "voz en off", "imgs": ["img/a.png"], "fit": "cover|contain", "kicker": "...", "title": "...",
               "accent": "palabra del título en letra manuscrita", "tag": "Imagen ilustrativa creada con IA", "kb": "in|out|left|right|up"} ],
  "outro": {"text": "voz del cierre", "kicker": "...", "title": "...", "script": "...", "chips": [...], "line": "...", "cta": "...", "tag": "...", "dur": 5} }
Images are relative to the project folder and copied to public/<name>/. Voices are cached like dialog.py.
Low-RAM render: REMOTION_CONCURRENCY=1 REMOTION_CHUNK=300.
"""
import asyncio, json, os, shutil, subprocess, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from dialog import FF, FPS, ROOT, duration, load_env, tts, tts_elevenlabs  # noqa: E402


def voice(text, v, f, cache):
    prev = json.loads(cache.read_text(encoding="utf-8")) if cache.exists() else None
    if prev and f.exists() and prev.get("text") == text and prev.get("voice") == v:
        return [tuple(w) for w in prev["words"]]
    words = tts_elevenlabs(text, v, f) if v.get("engine") == "elevenlabs" else asyncio.run(tts(text, v, f))
    cache.write_text(json.dumps({"text": text, "voice": v, "words": [list(w) for w in words]}, ensure_ascii=False), encoding="utf-8")
    return words


def render(comp, proj, out, end):
    conc = os.environ.get("REMOTION_CONCURRENCY", "50%"); chunk = int(os.environ.get("REMOTION_CHUNK", "0"))
    base = f'npx remotion render src/index.ts {comp} --props="{proj / "props.json"}" --codec=h264 --crf=18 --gl=angle --concurrency={conc}'
    if not chunk:
        subprocess.run(f'{base} --output="{out}"', cwd=ROOT, shell=True, check=True); return
    total = int(round(end * FPS)); tmp = proj / "_tramos"; tmp.mkdir(exist_ok=True); parts = []
    for a in range(0, total, chunk):
        b = min(total, a + chunk) - 1; part = tmp / f"t{a:06d}.mp4"; parts.append(part)
        if not part.exists():
            subprocess.run(f'{base} --muted --frames={a}-{b} --output="{part}"', cwd=ROOT, shell=True, check=True)
    lst = tmp / "lista.txt"; lst.write_text("".join(f"file '{x.as_posix()}'" + chr(10) for x in parts), encoding="utf-8")
    silent = tmp / "video.mp4"
    subprocess.run([str(FF), "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(silent)], check=True)
    subprocess.run([str(FF), "-v", "error", "-y", "-i", str(silent), "-i", str(ROOT / "public" / proj.name / "voice.mp3"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)], check=True)
    shutil.rmtree(tmp)


def main():
    load_env()
    name = sys.argv[1]; proj = ROOT / "projects" / name
    g = json.loads((proj / "escaparate.json").read_text(encoding="utf-8"))
    pub = ROOT / "public" / name; pub.mkdir(parents=True, exist_ok=True)
    gap = g.get("gap", 0.35); t = 0.3; v = g["voice"]; scenes, files = [], []
    items = list(g["scenes"]) + ([g["outro"]] if g.get("outro") else [])
    for i, sc in enumerate(items):
        f = pub / f"s{i:02d}.mp3"
        words = voice(sc["text"], v, f, pub / f"s{i:02d}.json")
        d = duration(f); files.append((f, t))
        row = {"start": round(t, 3), "end": round(t + d, 3), "text": sc["text"],
               "words": [{"start": round(t + a, 3), "end": round(t + b, 3)} for a, b in words]}
        if i < len(g["scenes"]):
            imgs = []
            for im in sc["imgs"]:
                src = proj / im; dst = pub / src.name
                if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime: shutil.copy(src, dst)
                imgs.append(f"{name}/{src.name}")
            row.update({k: sc[k] for k in ("fit", "kicker", "title", "accent", "tag", "kb") if k in sc}); row["imgs"] = imgs
            scenes.append(row)
        else:
            outro_start = t - 0.2; outro_voice = row
        t += d + gap
    for i, s in enumerate(scenes):  # each scene lasts until the next one starts
        s["end"] = round((scenes[i + 1]["start"] if i + 1 < len(scenes) else (outro_start if g.get("outro") else s["end"] + g.get("tail", 0.5))), 3)
    end = t - gap + g.get("tail", 0.5)
    outro = None
    if g.get("outro"):
        o = g["outro"]; outro = {k: o[k] for k in ("kicker", "title", "script", "chips", "line", "cta", "tag") if k in o}
        outro["start"] = round(outro_start, 3); end = max(end, outro_start + o.get("dur", 5.0))
        scenes.append({"start": outro_voice["start"], "end": outro_voice["end"], "text": o["text"], "words": outro_voice["words"], "imgs": scenes[-1]["imgs"][-1:]})
    cmd = [str(FF), "-v", "error", "-y"]
    for f, _ in files: cmd += ["-i", str(f)]
    fc = "".join(f"[{i}:a]adelay={int(s*1000)}|{int(s*1000)}[a{i}];" for i, (_, s) in enumerate(files))
    fc += "".join(f"[a{i}]" for i in range(len(files))) + f"amix=inputs={len(files)}:normalize=0,apad=whole_dur={end:.2f}[out]"
    subprocess.run(cmd + ["-filter_complex", fc, "-map", "[out]", "-t", f"{end:.2f}", str(pub / "voice.mp3")], check=True)
    props = {"fps": FPS, "duration": round(end, 3), "audio": f"{name}/voice.mp3", "scenes": scenes, "outro": outro, "theme": g.get("theme", {})}
    (proj / "props.json").write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"props ok: {len(scenes)} escenas, {end:.1f}s", flush=True)
    if "--no-render" in sys.argv: return
    out = proj / f"{name}.mp4"
    render("ShowcaseVideo", proj, out, end)
    print("VIDEO:", out, flush=True)
    subprocess.run(f'npx remotion still src/index.ts ShowcaseVideo "{proj / "portada.png"}" --props="{proj / "props.json"}" --frame=45 --gl=angle', cwd=ROOT, shell=True, check=True)
    print("PORTADA:", proj / "portada.png", flush=True)


if __name__ == "__main__":
    main()
