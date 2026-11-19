import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { Scene, VideoProps, Word } from "./types";
import { C, Chat, Compare, Cta, Hook, Icon, ImgScene, List, Stat } from "./Scenes";

const { fontFamily } = loadFont("normal", { weights: ["500", "800"], subsets: ["latin", "latin-ext"] });
const FADE = 0.3;

const SceneView: React.FC<{ s: Scene; len: number }> = ({ s, len }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const fin = s.already ? 1 : interpolate(f, [0, 0.18 * fps], [0, 1], { extrapolateRight: "clamp" });
  const fout = interpolate(f, [len - FADE * fps, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = Math.min(fin, fout);
  const p = { s, font: fontFamily, len };
  const map = { hook: Hook, icon: Icon, chat: Chat, list: List, stat: Stat, compare: Compare, cta: Cta, img: ImgScene };
  const Comp = map[s.type ?? "img"];
  return <AbsoluteFill style={{ opacity: op }}><Comp {...p} /></AbsoluteFill>;
};

function phrases(words: Word[]): Word[][] {
  const out: Word[][] = []; let cur: Word[] = [];
  for (const w of words) { cur.push(w); if (w.brk || /[.,:;?!»]$/.test(w.w) || cur.length >= 5) { out.push(cur); cur = []; } }
  if (cur.length) out.push(cur);
  return out;
}

const Captions: React.FC<{ words: Word[] }> = ({ words }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const ph = phrases(words);
  const idx = ph.findIndex((p, i) => t >= p[0].start - 0.05 && (i === ph.length - 1 || t < ph[i + 1][0].start - 0.05));
  if (idx < 0) return null;
  const p = ph[idx];
  if (t > p[p.length - 1].end + 0.8) return null;
  return (
    <div style={{ position: "absolute", top: 190, left: 60, right: 60, textAlign: "center", fontFamily, fontSize: 66, lineHeight: 1.18, textShadow: "0 4px 24px rgba(0,0,0,.65)" }}>
      {p.map((w, i) => {
        if (t < w.start - 0.05) return null;
        const active = i === p.length - 1 || t < p[i + 1].start - 0.05;
        const pop = interpolate(t, [w.start - 0.05, w.start + 0.1], [0.85, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const color = w.hl ? C.blue : active ? "#ffffff" : "rgba(205,212,228,.65)";
        return <span key={i} style={{ display: "inline-block", marginRight: 16, fontWeight: active || w.hl ? 800 : 500, color, transform: `scale(${pop})` }}>{w.w}</span>;
      })}
    </div>
  );
};

const Bg: React.FC = () => {
  const f = useCurrentFrame();
  const x = 50 + Math.sin(f / 90) * 12, y = 45 + Math.cos(f / 110) * 8;
  return <AbsoluteFill style={{ background: `radial-gradient(circle at ${x}% ${y}%, #1d3a8f 0%, #0c1b4d 38%, ${C.bg} 75%)` }} />;
};

export const MedVideo: React.FC<VideoProps> = (p) => {
  const fps = p.fps;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Bg />
      {p.scenes.map((s, i) => {
        const from = Math.round(s.start * fps);
        const last = i === p.scenes.length - 1;
        const len = Math.max(1, Math.round((s.end + (last ? 0 : FADE)) * fps) - from);
        return <Sequence key={i} from={from} durationInFrames={len}><SceneView s={s} len={len} /></Sequence>;
      })}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,10,30,.7) 0%, rgba(5,10,30,0) 22%)" }} />
      <Captions words={p.words} />
      {p.handle ? <div style={{ position: "absolute", bottom: 90, width: "100%", textAlign: "center", fontFamily, fontWeight: 800, fontSize: 34, color: "rgba(255,255,255,.55)" }}>{p.handle}</div> : null}
      {p.audio ? <Audio src={staticFile(p.audio)} /> : null}
      {p.music ? <Audio src={staticFile(p.music)} volume={0.08} /> : null}
    </AbsoluteFill>
  );
};
