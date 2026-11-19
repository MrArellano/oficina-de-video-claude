import { AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { Avatar, Robot } from "./Characters";

const { fontFamily } = loadFont("normal", { weights: ["500", "800"], subsets: ["latin", "latin-ext"] });
const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji"';

export type DWord = { start: number; end: number };
export type DLine = { who: "yo" | "ia"; text: string; start: number; end: number; words: DWord[]; cam: "me" | "ia" | "two"; shotEnd: number; brow?: number; bg?: string };
export type DCard = { start: number; end: number; text: string; emoji?: string; color?: string };
export type DPic = { start: number; end: number; img: string; label?: string };
export type DialogProps = {
  fps: number; duration: number; audio: string; music?: string; lines: DLine[]; cards: DCard[]; pics?: DPic[];
  outro?: { start: number; title: string; sub?: string }; handle?: string; aiLabel?: string;
};

const A = { x: -1.55, y: 0.2 };
const R = { x: 1.55, y: 0.05 };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const Rig: React.FC<{ lines: DLine[] }> = ({ lines }) => {
  const { camera } = useThree();
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const s = lines.find((l) => t >= l.start - 0.001 && t < l.shotEnd) ?? lines[lines.length - 1];
  const k = clamp((t - s.start) / Math.max(0.1, s.shotEnd - s.start));
  const punch = 1 + 0.05 * Math.max(0, 1 - (t - s.start) / 0.2); // quick zoom punch on each cut
  let px = 0, py = 0.2, pz = 14.5, lx = 0, ly = -0.3;
  if (s.cam === "me") { px = A.x + 1.0 + 0.2 * k; py = A.y + 0.25; pz = (7.4 - 1.0 * k) * punch; lx = A.x - 0.05; ly = A.y + 0.05; }
  if (s.cam === "ia") { px = R.x - 1.0 - 0.2 * k; py = R.y + 0.35; pz = (7.4 - 1.0 * k) * punch; lx = R.x + 0.05; ly = R.y + 0.15; }
  if (s.cam === "two") { px = 0.3 * (k - 0.5); pz = (14.8 - 1.0 * k) * punch; }
  camera.position.set(px, py, pz);
  camera.lookAt(lx, ly, 0);
  return null;
};

const Bg: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#04060f 0%,#0a1236 55%,#1a2656 100%)" }}>
      {Array.from({ length: 46 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: `${(i * 137) % 100}%`, top: `${(i * 59) % 52}%`, width: 4, height: 4, borderRadius: 2, background: "#fff", opacity: 0.15 + 0.2 * Math.abs(Math.sin(f / 40 + i)) }} />
      ))}
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={"b" + i} style={{ position: "absolute", left: `${(i * 71) % 100}%`, top: `${55 + ((i * 13) % 30)}%`, width: 46 + (i % 4) * 22, height: 46 + (i % 4) * 22, borderRadius: "50%", background: i % 3 ? "rgba(255,190,110,.28)" : "rgba(120,160,255,.25)", filter: "blur(14px)" }} />
      ))}
    </AbsoluteFill>
  );
};

// Optional per-line background image (public/ path), crossfading on each change.
const PhotoBg: React.FC<{ lines: DLine[] }> = ({ lines }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const idx = Math.max(0, lines.findIndex((l) => t >= l.start - 0.001 && t < l.shotEnd));
  const cur = (idx >= 0 ? lines[idx] : lines[lines.length - 1]);
  let prevBg: string | undefined; let changeAt = 0;
  for (let i = Math.min(idx, lines.length - 1); i > 0; i--) {
    if (lines[i - 1].bg !== lines[i].bg) { prevBg = lines[i - 1].bg; changeAt = lines[i].start; break; }
  }
  const k = clamp((t - changeAt) / 0.4);
  const zoom = 1.06 + 0.04 * Math.sin(t / 6);
  const layer = (src: string, o: number) => (
    <AbsoluteFill style={{ opacity: o }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, filter: "blur(3px) saturate(1.05)" }} />
    </AbsoluteFill>
  );
  if (!cur?.bg) return null;
  return (
    <AbsoluteFill>
      {prevBg && k < 1 ? layer(prevBg, 1) : null}
      {layer(cur.bg, prevBg ? k : 1)}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(4,6,15,.25) 0%, rgba(4,6,15,.15) 45%, rgba(4,6,15,.55) 100%)" }} />
    </AbsoluteFill>
  );
};

const Stage: React.FC<{ lines: DLine[] }> = ({ lines }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const cur = lines.find((l) => t >= l.start && t < l.end + 0.1);
  const mouthOf = (who: "yo" | "ia") => {
    for (const l of lines) {
      if (l.who !== who) continue;
      for (const w of l.words) if (t >= w.start && t <= w.end) return 0.3 + 0.7 * Math.abs(Math.sin((t - w.start) * 20));
    }
    return 0;
  };
  const speaking = cur?.who;
  const blink = (ph: number) => ((t * 0.9 + ph) % 3.2 < 0.13 ? 1 : 0);
  const sway = (ph: number, who: "yo" | "ia") => Math.sin(t * 1.4 + ph) * 0.03 + (speaking === who ? Math.sin(t * 5) * 0.015 : 0);
  const browA = cur?.who === "ia" ? (cur.brow ?? 0.3) : cur?.brow ?? 0;
  return (
    <>
      <Rig lines={lines} />
      <ambientLight intensity={0.95} color="#9fb0e8" />
      <directionalLight position={[3, 2.5, 8]} intensity={1.7} color="#ffdcb3" />
      <directionalLight position={[-6, 1, -2]} intensity={1.2} color="#7f9bff" />
      {lines.some((l) => l.bg) ? null : <mesh position={[0, -2.62, 0.2]}><boxGeometry args={[12, 0.5, 3.6]} /><meshStandardMaterial color="#1c2552" flatShading roughness={0.7} /></mesh>}
      <Avatar position={[A.x, A.y, 0]} rotY={0.42} scale={0.95} look={-0.1} mouth={mouthOf("yo")} blink={blink(0)} tilt={sway(0, "yo")} brow={browA} />
      <Robot position={[R.x, R.y, 0]} rotY={-0.42} scale={0.88} look={0.1} mouth={mouthOf("ia")} blink={blink(1.3)} tilt={sway(2, "ia")} glow={speaking === "ia" ? 1.3 : 0.9} />
    </>
  );
};

const Subtitle: React.FC<{ lines: DLine[]; hide: boolean }> = ({ lines, hide }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const l = [...lines].reverse().find((x) => t >= x.start - 0.02);
  if (!l || hide) return null;
  const a = clamp((t - l.start) / 0.12);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1390, textAlign: "center", fontFamily, opacity: a, transform: `translateY(${(1 - a) * 12}px)` }}>
      {l.who === "ia" ? <div style={{ fontSize: 36, fontWeight: 800, color: "#d97757", marginBottom: 8, letterSpacing: 1 }}>Claude</div> : null}
      <span style={{ display: "inline-block", fontSize: 58, lineHeight: 1.22, fontWeight: 800, color: l.who === "yo" ? "#ffe9c7" : "#bfe0ff", background: "rgba(4,8,24,.62)", padding: "16px 30px", borderRadius: 28, textShadow: "0 2px 12px rgba(0,0,0,.6)" }}>{l.text}</span>
    </div>
  );
};

const Card: React.FC<{ c: DCard }> = ({ c }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const k = clamp((t - c.start) / 0.2); const out = clamp((c.end - t) / 0.15);
  if (t < c.start || t > c.end) return null;
  const pop = 0.6 + 0.4 * (1 - Math.pow(1 - k, 3));
  return (
    <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(k, out) }}>
      <div style={{ transform: `scale(${pop}) rotate(-4deg)`, background: c.color ?? "#ffd23f", color: "#1a1405", fontFamily, fontWeight: 800, fontSize: 70, lineHeight: 1.1, padding: "22px 38px", borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,.5)", textAlign: "center" }}>
        {c.emoji ? <span style={{ fontFamily: EMOJI, marginRight: 14 }}>{c.emoji}</span> : null}{c.text}
      </div>
    </div>
  );
};

// Optional framed picture shown over the scene (e.g. an AI result being discussed).
const Pic: React.FC<{ c: DPic }> = ({ c }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  if (t < c.start || t > c.end) return null;
  const k = clamp((t - c.start) / 0.25); const out = clamp((c.end - t) / 0.2);
  const pop = 0.7 + 0.3 * (1 - Math.pow(1 - k, 3));
  return (
    <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: Math.min(k, out) }}>
      <div style={{ transform: `scale(${pop}) rotate(2deg)`, background: "#fff", padding: 18, borderRadius: 22, boxShadow: "0 24px 70px rgba(0,0,0,.6)" }}>
        <Img src={staticFile(c.img)} style={{ width: 620, height: 820, objectFit: "cover", borderRadius: 12, display: "block" }} />
        {c.label ? <div style={{ fontFamily, fontWeight: 800, fontSize: 32, color: "#1a1405", textAlign: "center", marginTop: 12 }}>{c.label}</div> : null}
      </div>
    </div>
  );
};

export const DialogVideo: React.FC<DialogProps> = (p) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const outroK = p.outro ? clamp((t - p.outro.start) / 0.35) : 0;
  return (
    <AbsoluteFill style={{ background: "#04060f" }}>
      <Bg />
      <PhotoBg lines={p.lines} />
      <ThreeCanvas width={1080} height={1920} camera={{ position: [0, 0.2, 14.5], fov: 38 }} style={{ position: "absolute" }}>
        <Stage lines={p.lines} />
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(4,6,15,.0) 70%, rgba(4,6,15,.5) 100%)" }} />
      {(p.pics ?? []).map((c, i) => <Pic key={"p" + i} c={c} />)}
      {p.cards.map((c, i) => <Card key={i} c={c} />)}
      <Subtitle lines={p.lines} hide={!!p.outro && t >= p.outro.start} />
      {p.outro && outroK > 0 ? (
        <AbsoluteFill style={{ background: `rgba(6,10,32,${0.88 * outroK})`, alignItems: "center", justifyContent: "center", padding: 70 }}>
          <div style={{ opacity: outroK, transform: `translateY(${(1 - outroK) * 40}px)`, textAlign: "center", fontFamily }}>
            <div style={{ fontFamily: EMOJI, fontSize: 200 }}>💡</div>
            <div style={{ fontWeight: 800, fontSize: 92, color: "#eef2ff", lineHeight: 1.08, marginTop: 30 }}>{p.outro.title}</div>
            {p.outro.sub ? <div style={{ marginTop: 40, display: "inline-block", padding: "24px 54px", borderRadius: 60, background: "#4f8dff", color: "#fff", fontWeight: 800, fontSize: 50, boxShadow: "0 0 60px rgba(79,141,255,.6)" }}>{p.outro.sub}</div> : null}
          </div>
        </AbsoluteFill>
      ) : null}
      {p.handle ? <div style={{ position: "absolute", bottom: 90, width: "100%", textAlign: "center", fontFamily, fontWeight: 800, fontSize: 34, color: "rgba(255,255,255,.55)" }}>{p.handle}</div> : null}
      {p.aiLabel ? <div style={{ position: "absolute", top: 70, right: 50, fontFamily, fontWeight: 500, fontSize: 26, color: "rgba(255,255,255,.8)", background: "rgba(4,8,24,.55)", padding: "8px 18px", borderRadius: 14 }}>{p.aiLabel}</div> : null}
      {p.audio ? <Audio src={staticFile(p.audio)} /> : null}
      {p.music ? <Audio src={staticFile(p.music)} volume={0.07} /> : null}
    </AbsoluteFill>
  );
};
