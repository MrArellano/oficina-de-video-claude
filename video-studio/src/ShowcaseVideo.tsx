// Product showcase promo: full-bleed photos with Ken Burns, kinetic titles, voice-over subtitles, outro CTA.
// Data: projects/<name>/escaparate.json -> pipeline/showcase.py -> props.json
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadScript } from "@remotion/google-fonts/GreatVibes";

const { fontFamily } = loadFont("normal", { weights: ["500", "700", "800"], subsets: ["latin", "latin-ext"] });
const { fontFamily: script } = loadScript("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji"';

export type SWord = { start: number; end: number };
export type SScene = {
  start: number; end: number; text: string; words: SWord[]; imgs: string[]; fit?: "cover" | "contain";
  kicker?: string; title?: string; accent?: string; tag?: string; kb?: "in" | "out" | "left" | "right" | "up";
};
export type ShowcaseProps = {
  fps: number; duration: number; audio: string; music?: string; scenes: SScene[];
  theme?: { bg?: string; accent?: string; accent2?: string };
  outro?: { start: number; kicker?: string; title: string; script?: string; chips?: string[]; line?: string; cta?: string; tag?: string };
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (k: number) => 1 - Math.pow(1 - clamp(k), 3);
const useT = () => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return f / fps; };

const Photo: React.FC<{ src: string; k: number; kb: SScene["kb"]; fit?: SScene["fit"]; o: number }> = ({ src, k, kb = "in", fit = "cover", o }) => {
  const z = kb === "out" ? 1.18 - 0.12 * k : 1.04 + 0.14 * k;
  const x = kb === "left" ? 40 - 80 * k : kb === "right" ? -40 + 80 * k : 0;
  const y = kb === "up" ? 40 - 80 * k : 0;
  const tr = `translate(${x}px, ${y}px) scale(${z})`;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {fit === "contain" ? (
        <>
          <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(.55) saturate(1.2)", transform: "scale(1.2)" }} />
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
            <Img src={staticFile(src)} style={{ width: "100%", objectFit: "contain", transform: tr, boxShadow: "0 40px 120px rgba(0,0,0,.6)" }} />
          </AbsoluteFill>
        </>
      ) : (
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: tr }} />
      )}
    </AbsoluteFill>
  );
};

// One scene may cycle through several images.
const SceneLayer: React.FC<{ s: SScene; next?: SScene }> = ({ s }) => {
  const t = useT();
  const XF = 0.45;
  if (t < s.start - XF || t > s.end + XF) return null;
  const n = s.imgs.length; const seg = (s.end - s.start) / n;
  const i = clamp(Math.floor((t - s.start) / seg), 0, n - 1);
  const local = (t - (s.start + i * seg)) / seg;
  const fadeIn = clamp((t - s.start + XF) / XF);
  const prev = i > 0 && t - (s.start + i * seg) < 0.35 ? i - 1 : -1;
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      {prev >= 0 ? <Photo src={s.imgs[prev]} k={1} kb={s.kb} fit={s.fit} o={1} /> : null}
      <Photo src={s.imgs[i]} k={clamp(local)} kb={s.kb} fit={s.fit} o={prev >= 0 ? clamp((t - (s.start + i * seg)) / 0.35) : 1} />
    </AbsoluteFill>
  );
};

const Snow: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 34 }).map((_, i) => {
        const sp = 40 + (i * 37) % 60; const y = ((t * sp + i * 173) % 2100) - 100;
        const x = (i * 211) % 1080 + Math.sin(t * 0.8 + i) * 30; const r = 3 + (i % 4) * 2;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, background: "#fff", opacity: 0.25 + (i % 3) * 0.12, filter: "blur(1px)" }} />;
      })}
    </AbsoluteFill>
  );
};

const Title: React.FC<{ s: SScene; accent: string }> = ({ s, accent }) => {
  const t = useT();
  if (t < s.start || t > s.end + 0.1 || !s.title) return null;
  const out = clamp((s.end + 0.1 - t) / 0.25);
  const ka = ease((t - s.start) / 0.35);
  const words = s.title.split(" ");
  return (
    <div style={{ position: "absolute", top: 190, left: 70, right: 70, fontFamily, opacity: out }}>
      {s.kicker ? (
        <div style={{ display: "inline-block", opacity: ka, transform: `translateX(${(1 - ka) * -40}px)`, background: accent, color: "#fff", fontWeight: 800, fontSize: 30, letterSpacing: 3, padding: "10px 24px", borderRadius: 40, marginBottom: 24 }}>{s.kicker}</div>
      ) : null}
      <div style={{ fontWeight: 800, fontSize: 96, lineHeight: 1.02, color: "#fff", textShadow: "0 6px 30px rgba(0,0,0,.75), 0 2px 6px rgba(0,0,0,.6)" }}>
        {words.map((w, i) => {
          const a = ease((t - s.start - 0.12 - i * 0.09) / 0.35);
          const acc = s.accent && w.replace(/[¿?¡!,.]/g, "") === s.accent;
          return (
            <span key={i} style={{ display: "inline-block", marginRight: "0.24em", opacity: a, transform: `translateY(${(1 - a) * 50}px)`, ...(acc ? { fontFamily: script, fontWeight: 400, fontSize: 132, color: "#ffd88a", lineHeight: 0.8 } : {}) }}>{w}</span>
          );
        })}
      </div>
    </div>
  );
};

const groupsOf = (text: string) => {
  const ws = text.split(/\s+/).filter(Boolean); const out: { i0: number; words: string[] }[] = [];
  let cur: string[] = [], i0 = 0;
  ws.forEach((w, i) => {
    cur.push(w);
    const brk = cur.length >= 5 || (cur.length >= 3 && /[.,;:!?…]$/.test(w) && ws.length - i - 1 >= 2);
    if (brk || i === ws.length - 1) { out.push({ i0, words: cur }); cur = []; i0 = i + 1; }
  });
  return out;
};

const Subs: React.FC<{ scenes: SScene[]; accent: string; hide: boolean }> = ({ scenes, accent, hide }) => {
  const t = useT();
  const s = scenes.find((x) => t >= x.start - 0.02 && t <= x.end + 0.25);
  if (!s || hide || !s.words.length) return null;
  let wi = s.words.findIndex((w) => t < w.end); if (wi < 0) wi = s.words.length - 1;
  const gs = groupsOf(s.text); const g = [...gs].reverse().find((x) => x.i0 <= wi) ?? gs[0];
  return (
    <div style={{ position: "absolute", left: 60, right: 60, bottom: 300, textAlign: "center", fontFamily }}>
      <span style={{ display: "inline-block", maxWidth: 900, whiteSpace: "normal", background: "rgba(10,14,12,.55)", borderRadius: 26, padding: "14px 26px", fontWeight: 800, fontSize: 50, lineHeight: 1.22, color: "#fff" }}>
        {g.words.map((w, j) => {
          const idx = g.i0 + j; const on = idx === wi && t >= (s.words[idx]?.start ?? 0) - 0.03;
          return <span key={j} style={{ margin: "0 0.13em", color: on ? accent : "#fff" }}>{w}</span>;
        })}
      </span>
    </div>
  );
};

const Tag: React.FC<{ scenes: SScene[] }> = ({ scenes }) => {
  const t = useT();
  const s = scenes.find((x) => t >= x.start && t <= x.end);
  if (!s?.tag) return null;
  return <div style={{ position: "absolute", top: 90, right: 50, fontFamily, fontWeight: 700, fontSize: 24, color: "rgba(255,255,255,.9)", background: "rgba(0,0,0,.45)", padding: "8px 18px", borderRadius: 14 }}>{s.tag}</div>;
};

const Outro: React.FC<{ o: NonNullable<ShowcaseProps["outro"]>; bg: string; accent: string; accent2: string }> = ({ o, bg, accent, accent2 }) => {
  const t = useT();
  if (t < o.start) return null;
  const k = ease((t - o.start) / 0.5); const d = (x: number) => ease((t - o.start - x) / 0.4);
  return (
    <AbsoluteFill style={{ opacity: k, background: `radial-gradient(ellipse at 50% 35%, ${bg}ee 0%, ${bg} 70%)`, alignItems: "center", justifyContent: "center", fontFamily, textAlign: "center", padding: 70 }}>
      <div style={{ width: 560, height: 560, borderRadius: 280, border: `6px solid ${accent2}`, position: "absolute", top: 260, opacity: 0.35 * k, transform: `scale(${0.9 + 0.1 * k}) rotate(${t * 6}deg)`, borderStyle: "dashed" }} />
      {o.kicker ? <div style={{ opacity: d(0.1), color: accent2, fontWeight: 800, fontSize: 32, letterSpacing: 4 }}>{o.kicker}</div> : null}
      <div style={{ opacity: d(0.2), transform: `translateY(${(1 - d(0.2)) * 40}px)`, color: "#fff", fontWeight: 800, fontSize: 104, lineHeight: 1.02, marginTop: 20 }}>{o.title}</div>
      {o.script ? <div style={{ opacity: d(0.35), fontFamily: script, color: "#ffd88a", fontSize: 150, lineHeight: 1, marginTop: 4 }}>{o.script}</div> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginTop: 40 }}>
        {(o.chips ?? []).map((c, i) => <span key={c} style={{ opacity: d(0.5 + i * 0.12), transform: `scale(${0.8 + 0.2 * d(0.5 + i * 0.12)})`, border: "3px solid rgba(255,255,255,.75)", color: "#fff", fontWeight: 700, fontSize: 36, padding: "12px 26px", borderRadius: 40 }}>{c}</span>)}
      </div>
      {o.line ? <div style={{ opacity: d(1.0), color: "#fff", fontWeight: 700, fontSize: 44, marginTop: 50, fontFamily: `${fontFamily}, ${EMOJI}` }}>{o.line}</div> : null}
      {o.cta ? <div style={{ opacity: d(1.2), marginTop: 40, background: accent, color: "#fff", fontWeight: 800, fontSize: 48, padding: "26px 56px", borderRadius: 60, fontFamily: `${fontFamily}, ${EMOJI}`, boxShadow: `0 0 70px ${accent}88`, transform: `scale(${1 + 0.03 * Math.sin(t * 5)})` }}>{o.cta}</div> : null}
      {o.tag ? <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, color: "rgba(255,255,255,.55)", fontSize: 24, fontWeight: 500 }}>{o.tag}</div> : null}
    </AbsoluteFill>
  );
};

export const ShowcaseVideo: React.FC<ShowcaseProps> = (p) => {
  const t = useT();
  const bg = p.theme?.bg ?? "#0f3d2e"; const accent = p.theme?.accent ?? "#c8102e"; const accent2 = p.theme?.accent2 ?? "#d4a24c";
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {p.scenes.map((s, i) => <SceneLayer key={i} s={s} />)}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 34%, rgba(0,0,0,0) 62%, rgba(0,0,0,.6) 100%)" }} />
      <Snow />
      {p.scenes.map((s, i) => <Title key={i} s={s} accent={accent} />)}
      <Tag scenes={p.scenes} />
      <Subs scenes={p.scenes} accent="#ffd88a" hide={!!p.outro && t >= p.outro.start + 0.4} />
      {p.outro ? <Outro o={p.outro} bg={bg} accent={accent} accent2={accent2} /> : null}
      {p.audio ? <Audio src={staticFile(p.audio)} /> : null}
      {p.music ? <Audio src={staticFile(p.music)} volume={0.1} /> : null}
    </AbsoluteFill>
  );
};
