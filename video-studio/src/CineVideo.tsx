// "Cine" look for dialogue videos: night 3D set, dramatic lighting, close-ups, app-style screens.
// Same data as DialogVideo (dialogo.json -> props.json) plus optional "screens".
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { Avatar, Robot } from "./Characters";
import type { DialogProps, DLine, DCard, DPic } from "./DialogVideo";
import { Phone, type DPhone } from "./Phone";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "800"], subsets: ["latin", "latin-ext"] });
const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji"';
const ORANGE = "#d97757";

export type DScreenItem = { text: string; at: number; stamp?: string };
export type DScreen = {
  start: number; end: number; chip?: string; title: string; accent?: string; footer?: string;
  rows?: { k: string; v: string; color?: string }[]; items?: DScreenItem[];
};
export type CineProps = DialogProps & { screens?: DScreen[]; phones?: DPhone[] };

const A = { x: -1.55, y: 0.2 };
const R = { x: 1.55, y: 0.05 };
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (k: number) => 1 - Math.pow(1 - clamp(k), 3);
const useT = () => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return f / fps; };

// Camera as a pure function of time, so the 2D backdrop can follow it (parallax).
const camAt = (lines: DLine[], t: number) => {
  const s = lines.find((l) => t >= l.start - 0.001 && t < l.shotEnd) ?? lines[lines.length - 1];
  const k = clamp((t - s.start) / Math.max(0.1, s.shotEnd - s.start));
  const punch = 1 + 0.06 * Math.max(0, 1 - (t - s.start) / 0.18);
  let px = 0, py = 0.1, pz = 13.8, lx = 0, ly = -0.45;
  if (s.cam === "me") { px = A.x + 1.25 + 0.25 * k; py = A.y - 0.25; pz = (6.5 - 0.8 * k) * punch; lx = A.x - 0.02; ly = A.y - 0.05; }
  if (s.cam === "ia") { px = R.x - 1.25 - 0.25 * k; py = R.y - 0.2; pz = (7.9 - 0.8 * k) * punch; lx = R.x + 0.02; ly = R.y - 0.2; }
  if (s.cam === "two") { px = 0.5 * (k - 0.5); py = 0.3; pz = (14.6 - 0.9 * k) * punch; ly = 0.25; }
  px += 0.05 * Math.sin(t * 0.9); py += 0.035 * Math.sin(t * 1.3 + 1); // handheld drift
  return { px, py, pz, lx, ly };
};

const Rig: React.FC<{ lines: DLine[] }> = ({ lines }) => {
  const { camera } = useThree(); const t = useT();
  const c = camAt(lines, t);
  camera.position.set(c.px, c.py, c.pz);
  camera.lookAt(c.lx, c.ly, 0);
  return null;
};

// 2D night city behind the 3D set, blurred like an out-of-focus background.
const Backdrop: React.FC<{ lines: DLine[] }> = ({ lines }) => {
  const t = useT(); const c = camAt(lines, t);
  const shift = -c.px * 26; const near = c.pz < 9 ? 1.18 : 1.05;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#01020a 0%,#050a26 34%,#0f1f63 58%,#2440a3 70%,#3350b8 74%)" }}>
      {Array.from({ length: 60 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: `${(i * 137) % 100}%`, top: `${(i * 59) % 46}%`, width: 3 + (i % 3), height: 3 + (i % 3), borderRadius: 3, background: "#fff", opacity: 0.12 + 0.25 * Math.abs(Math.sin(t / 2 + i)) }} />
      ))}
      <AbsoluteFill style={{ transform: `translateX(${shift}px) scale(${near})`, filter: "blur(7px)" }}>
        {Array.from({ length: 16 }).map((_, i) => {
          const w = 90 + ((i * 53) % 110), h = 260 + ((i * 97) % 420), left = -80 + i * 82;
          return (
            <div key={i} style={{ position: "absolute", left, bottom: 430, width: w, height: h, background: i % 2 ? "#070b22" : "#0a1030" }}>
              {Array.from({ length: Math.floor(h / 46) * 3 }).map((_, j) => ((i * 7 + j * 13) % 5 < 2 ? (
                <div key={j} style={{ position: "absolute", left: 12 + (j % 3) * (w / 3.4), top: 16 + Math.floor(j / 3) * 46, width: 14, height: 18, background: (i + j) % 4 ? "#ffcf8a" : "#9fc0ff", opacity: 0.9 }} />
              ) : null))}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: -200, right: -200, bottom: 0, height: 440, background: "#060918" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${shift * 1.6}px)` }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: `${(i * 71 + 5) % 100}%`, top: `${44 + ((i * 13) % 22)}%`, width: 40 + (i % 4) * 26, height: 40 + (i % 4) * 26, borderRadius: "50%", background: i % 3 ? "rgba(255,196,120,.34)" : "rgba(130,170,255,.3)", filter: "blur(16px)" }} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Glow: React.FC<{ position: [number, number, number]; color: string; r: number }> = ({ position, color, r }) => (
  <group position={position}>
    <mesh><sphereGeometry args={[r, 14, 12]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
    {Array.from({ length: 14 }).map((_, i) => (
      <mesh key={i}><sphereGeometry args={[r * (1.25 + i * 0.32), 16, 12]} /><meshBasicMaterial color={color} transparent opacity={0.045} depthWrite={false} toneMapped={false} /></mesh>
    ))}
  </group>
);

const Set: React.FC = () => (
  <>
    {/* floor + desk ledge */}
    <mesh position={[0, -3.1, -4]}><boxGeometry args={[40, 0.4, 18]} /><meshStandardMaterial color="#10163a" flatShading roughness={0.9} /></mesh>
    <mesh position={[0, -2.62, 0.2]}><boxGeometry args={[13, 0.5, 3.8]} /><meshStandardMaterial color="#2a2242" flatShading roughness={0.75} /></mesh>
    <mesh position={[0, -2.36, 2.05]}><boxGeometry args={[13, 0.06, 0.1]} /><meshStandardMaterial color="#d97757" emissive="#d97757" emissiveIntensity={0.5} /></mesh>
    {/* window frame */}
    {[-7.5, -2.5, 2.5, 7.5].map((x) => <mesh key={x} position={[x, 2, -5]}><boxGeometry args={[0.28, 14, 0.28]} /><meshStandardMaterial color="#080b1e" flatShading /></mesh>)}
    {[5.2, -1.4].map((y) => <mesh key={y} position={[0, y, -5]}><boxGeometry args={[22, 0.28, 0.28]} /><meshStandardMaterial color="#080b1e" flatShading /></mesh>)}
    {/* lamp */}
    <mesh position={[3.9, -0.4, -2.6]}><cylinderGeometry args={[0.06, 0.09, 5, 6]} /><meshStandardMaterial color="#1b1f3a" flatShading /></mesh>
    <mesh position={[3.9, -2.8, -2.6]}><cylinderGeometry args={[0.5, 0.6, 0.2, 8]} /><meshStandardMaterial color="#1b1f3a" flatShading /></mesh>
    <Glow position={[3.9, 2.25, -2.6]} color="#ffd9a0" r={0.24} />
    <pointLight position={[3.9, 2.2, -2.2]} color="#ffc98a" intensity={26} distance={16} decay={1.6} />
    {/* monitor */}
    <group position={[-4.1, -0.9, -2.4]} rotation={[0, 0.55, 0]}>
      <mesh><boxGeometry args={[2.6, 1.7, 0.14]} /><meshStandardMaterial color="#0c0f22" flatShading /></mesh>
      <mesh position={[0, 0, 0.08]}><planeGeometry args={[2.4, 1.5]} /><meshBasicMaterial color="#16306e" toneMapped={false} /></mesh>
      {[0.5, 0.3, 0.1, -0.1, -0.3, -0.5].map((y, i) => (
        <mesh key={y} position={[-1.0 + (0.5 + ((i * 37) % 9) * 0.1) / 2, y, 0.09]}><planeGeometry args={[0.5 + ((i * 37) % 9) * 0.1, 0.07]} /><meshBasicMaterial color={i % 3 === 1 ? "#ffb37a" : "#8fb6ff"} toneMapped={false} /></mesh>
      ))}
      <mesh position={[0, -1.25, 0]}><boxGeometry args={[0.2, 0.9, 0.12]} /><meshStandardMaterial color="#0c0f22" flatShading /></mesh>
    </group>
    <pointLight position={[-3.4, -0.6, -1.2]} color="#5f8dff" intensity={10} distance={9} decay={1.6} />
    {/* coffee mug */}
    <group position={[-0.15, -2.14, 1.25]}>
      <mesh><cylinderGeometry args={[0.2, 0.17, 0.44, 10]} /><meshStandardMaterial color="#efe6d6" flatShading roughness={0.5} /></mesh>
      <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.165, 0.165, 0.03, 10]} /><meshStandardMaterial color="#3a2114" /></mesh>
      <mesh position={[0.24, 0, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.11, 0.035, 6, 10]} /><meshStandardMaterial color="#efe6d6" flatShading /></mesh>
    </group>
  </>
);

const Stage: React.FC<{ lines: DLine[] }> = ({ lines }) => {
  const t = useT();
  const cur = lines.find((l) => t >= l.start && t < l.end + 0.1);
  const mouthOf = (who: "yo" | "ia") => {
    for (const l of lines) {
      if (l.who !== who) continue;
      for (const w of l.words) if (t >= w.start && t <= w.end) return 0.25 + 0.75 * Math.abs(Math.sin((t - w.start) * 19));
    }
    return 0;
  };
  const speaking = cur?.who;
  const blink = (ph: number) => ((t * 0.9 + ph) % 3.4 < 0.13 ? 1 : 0);
  const sway = (ph: number, who: "yo" | "ia") => Math.sin(t * 1.4 + ph) * 0.03 + (speaking === who ? Math.sin(t * 5) * 0.018 : 0);
  const nod = (who: "yo" | "ia") => (speaking === who ? Math.sin(t * 6.5) * 0.035 : speaking ? 0.04 + Math.sin(t * 2.2) * 0.03 : 0);
  const bob = (ph: number) => Math.sin(t * 1.7 + ph) * 0.025;
  // the listener turns a bit towards the speaker
  const lookA = speaking === "ia" ? 0.22 : -0.08;
  const lookR = speaking === "yo" ? -0.22 : 0.08;
  const browA = cur?.who === "yo" ? cur.brow ?? 0.15 : 0.35;
  const g = speaking === "ia" ? 1.3 : 0.85;
  return (
    <>
      <Rig lines={lines} />
      <fog attach="fog" args={["#0a1238", 14, 46]} />
      <ambientLight intensity={0.5} color="#6f84d8" />
      <directionalLight position={[4, 3.5, 7]} intensity={1.75} color="#ffd6a8" />
      <directionalLight position={[-5, 3, -6]} intensity={2.6} color="#5f86ff" />
      <directionalLight position={[6, 1, -5]} intensity={1.1} color="#ff9a5a" />
      <pointLight position={[R.x - 1.6, R.y - 1.2, 1.6]} color="#bcd6ff" intensity={4 * g} distance={6} decay={1.5} />
      <Set />
      <Avatar cine position={[A.x, A.y + bob(0), 0]} rotY={0.42} scale={0.95} look={lookA} mouth={mouthOf("yo")} blink={blink(0)} tilt={sway(0, "yo")} brow={browA} nod={nod("yo")} />
      <Robot cine position={[R.x, R.y + bob(1.7), 0]} rotY={-0.42} scale={0.88} look={lookR} mouth={mouthOf("ia")} blink={blink(1.3)} tilt={sway(2, "ia")} glow={g} nod={nod("ia")} />
    </>
  );
};

// Subtitles in short groups, current word highlighted.
const groupsOf = (l: DLine) => {
  const ws = l.text.split(/\s+/).filter(Boolean); const out: { i0: number; words: string[] }[] = [];
  let cur: string[] = [], i0 = 0;
  ws.forEach((w, i) => {
    cur.push(w);
    const brk = cur.length >= 7 || (cur.length >= 3 && /[.,;:!?…»]$/.test(w) && ws.length - i - 1 >= 2);
    if (brk || i === ws.length - 1) { out.push({ i0, words: cur }); cur = []; i0 = i + 1; }
  });
  return out;
};

const Subtitle: React.FC<{ lines: DLine[]; hide: boolean }> = ({ lines, hide }) => {
  const t = useT();
  const l = [...lines].reverse().find((x) => t >= x.start - 0.02);
  if (!l || hide || t > l.end + 0.35) return null;
  let wi = l.words.findIndex((w) => t < w.end);
  if (wi < 0) wi = l.words.length - 1;
  const gs = groupsOf(l); const g = [...gs].reverse().find((x) => x.i0 <= wi) ?? gs[0];
  const gStart = l.words[g.i0]?.start ?? l.start; const a = clamp((t - gStart + 0.05) / 0.1);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1345, textAlign: "center", fontFamily, opacity: 0.4 + 0.6 * a, transform: `translateY(${(1 - a) * 8}px)` }}>
      {l.who === "ia" ? <div style={{ display: "inline-block", fontSize: 28, fontWeight: 800, color: "#fff", background: ORANGE, padding: "4px 18px", borderRadius: 20, marginBottom: 10, letterSpacing: 2 }}>CLAUDE</div> : null}
      <div style={{ fontSize: 60, lineHeight: 1.2, fontWeight: 800, color: "#fff", textShadow: "0 3px 6px rgba(0,0,0,.95), 0 0 26px rgba(0,0,0,.85)" }}>
        {g.words.map((w, j) => {
          const idx = g.i0 + j; const on = idx === wi && t >= (l.words[idx]?.start ?? 0) - 0.03;
          return <span key={j} style={{ color: on ? "#ffb066" : idx < wi ? "#fff" : "rgba(255,255,255,.82)", display: "inline-block", margin: "0 0.14em" }}>{w}</span>;
        })}
      </div>
    </div>
  );
};

const Pill: React.FC<{ c: DCard }> = ({ c }) => {
  const t = useT();
  if (t < c.start || t > c.end) return null;
  const k = ease((t - c.start) / 0.3); const out = clamp((c.end - t) / 0.15);
  return (
    <div style={{ position: "absolute", top: 215, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(k, out) }}>
      <div style={{ transform: `translateY(${(1 - k) * -30}px)`, display: "flex", alignItems: "center", gap: 16, background: "rgba(8,11,30,.82)", border: `3px solid ${c.color ?? ORANGE}`, color: "#fff", fontFamily, fontWeight: 800, fontSize: 46, padding: "18px 34px", borderRadius: 60, boxShadow: "0 16px 50px rgba(0,0,0,.55)", maxWidth: 940, textAlign: "center" }}>
        {c.emoji ? <span style={{ fontFamily: EMOJI, fontSize: 48 }}>{c.emoji}</span> : null}<span>{c.text}</span>
      </div>
    </div>
  );
};

const Pic: React.FC<{ c: DPic }> = ({ c }) => {
  const t = useT();
  if (t < c.start || t > c.end) return null;
  const k = ease((t - c.start) / 0.3); const out = clamp((c.end - t) / 0.2);
  return (
    <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(k, out), perspective: 1600 }}>
      <div style={{ transform: `translateY(${(1 - k) * 60}px) rotateY(-5deg) rotate(1.5deg)`, background: "#f4f1ea", padding: 18, borderRadius: 30, boxShadow: "0 30px 90px rgba(0,0,0,.7)" }}>
        <Img src={staticFile(c.img)} style={{ width: 640, height: 850, objectFit: "cover", borderRadius: 16, display: "block" }} />
        {c.label ? <div style={{ fontFamily, fontWeight: 800, fontSize: 30, color: "#3a3226", textAlign: "center", marginTop: 12 }}>{c.label}</div> : null}
      </div>
    </div>
  );
};

// App-style card (agenda, checklist, reminder...) that the characters "show" on screen.
const Screen: React.FC<{ c: DScreen }> = ({ c }) => {
  const t = useT();
  if (t < c.start || t > c.end) return null;
  const k = ease((t - c.start) / 0.35); const out = clamp((c.end - t) / 0.2);
  const accent = c.accent ?? ORANGE;
  return (
    <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(k, out), perspective: 1800 }}>
      <div style={{ width: 800, transform: `translateY(${(1 - k) * 80}px) rotateY(${-6 + 2 * k}deg) scale(${0.94 + 0.06 * k})`, background: "#f4f1ea", borderRadius: 44, padding: "44px 48px 36px", fontFamily, boxShadow: "0 40px 120px rgba(0,0,0,.75), 0 0 0 2px rgba(255,255,255,.4) inset" }}>
        {c.chip ? <div style={{ display: "inline-block", background: accent, color: "#fff", fontWeight: 800, fontSize: 26, letterSpacing: 1.5, padding: "8px 20px", borderRadius: 30, textTransform: "uppercase" }}>{c.chip}</div> : null}
        <div style={{ fontWeight: 800, fontSize: 64, color: "#1b1712", margin: "22px 0 18px", lineHeight: 1.1 }}>{c.title}</div>
        <div style={{ height: 2, background: "#ddd6c8", marginBottom: 10 }} />
        {(c.rows ?? []).map((r, i) => {
          const a = ease((t - c.start - 0.25 - i * 0.18) / 0.3);
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "20px 0", borderBottom: "2px solid #e8e2d6", opacity: a, transform: `translateX(${(1 - a) * 30}px)` }}>
              <span style={{ fontWeight: 600, fontSize: 40, color: "#857c6c" }}>{r.k}</span>
              <span style={{ fontWeight: 800, fontSize: 50, color: r.color ?? "#1b1712" }}>{r.v}</span>
            </div>
          );
        })}
        {(c.items ?? []).map((it, i) => {
          const a = ease((t - it.at) / 0.3); const on = t >= it.at;
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, padding: "22px 0", borderBottom: "2px solid #e8e2d6", opacity: on ? 1 : 0.28 }}>
              <span style={{ fontWeight: 800, fontSize: 42, color: "#1b1712", lineHeight: 1.15 }}>{it.text}</span>
              <span style={{ flexShrink: 0, opacity: a, transform: `scale(${1.6 - 0.6 * a}) rotate(-6deg)`, border: "4px solid #2f9e6a", color: "#2f9e6a", fontWeight: 800, fontSize: 26, padding: "6px 14px", borderRadius: 10, letterSpacing: 1 }}>{it.stamp ?? "OK"}</span>
            </div>
          );
        })}
        {c.footer ? <div style={{ marginTop: 26, fontWeight: 600, fontSize: 30, color: "#857c6c" }}><span style={{ color: ORANGE, fontWeight: 800 }}>✳ </span>{c.footer}</div> : null}
      </div>
    </div>
  );
};

export const CineVideo: React.FC<CineProps> = (p) => {
  const t = useT();
  const outroK = p.outro ? ease((t - p.outro.start) / 0.4) : 0;
  const scr = (p.screens ?? []).find((s) => t >= s.start && t <= s.end);
  const pic = (p.pics ?? []).find((s) => t >= s.start && t <= s.end);
  const ph = (p.phones ?? []).find((s) => t >= s.start && t <= s.end);
  const over = scr ?? pic ?? ph;
  const dim = over ? Math.min(ease((t - over.start) / 0.3), clamp((over.end - t) / 0.2)) : 0;
  return (
    <AbsoluteFill style={{ background: "#02030a" }}>
      <AbsoluteFill style={{ filter: dim > 0 ? `blur(${9 * dim}px) brightness(${1 - 0.45 * dim})` : undefined }}>
        <Backdrop lines={p.lines} />
        <ThreeCanvas width={1080} height={1920} camera={{ position: [0, 0.1, 13.8], fov: 36 }} style={{ position: "absolute" }}>
          <Stage lines={p.lines} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 52%, rgba(1,2,10,.62) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(2,3,10,.35) 0%, rgba(2,3,10,0) 16%, rgba(2,3,10,0) 62%, rgba(2,3,10,.72) 100%)" }} />
      {(p.pics ?? []).map((c, i) => <Pic key={"p" + i} c={c} />)}
      {(p.screens ?? []).map((c, i) => <Screen key={"s" + i} c={c} />)}
      {(p.phones ?? []).map((c, i) => <Phone key={"f" + i} c={c} />)}
      {over ? null : p.cards.map((c, i) => <Pill key={i} c={c} />)}
      <Subtitle lines={p.lines} hide={!!p.outro && t >= p.outro.start} />
      {p.outro && outroK > 0 ? (
        <AbsoluteFill style={{ background: `rgba(3,5,18,${0.9 * outroK})`, alignItems: "center", justifyContent: "center", padding: 80 }}>
          <div style={{ opacity: outroK, transform: `translateY(${(1 - outroK) * 40}px)`, textAlign: "center", fontFamily }}>
            <div style={{ width: 120, height: 8, borderRadius: 4, background: ORANGE, margin: "0 auto 46px" }} />
            <div style={{ fontWeight: 800, fontSize: 96, color: "#fff", lineHeight: 1.08 }}>{p.outro.title}</div>
            {p.outro.sub ? <div style={{ marginTop: 50, display: "inline-block", padding: "26px 52px", borderRadius: 60, background: ORANGE, color: "#fff", fontFamily: `${fontFamily}, ${EMOJI}`, fontWeight: 800, fontSize: 44, boxShadow: "0 0 70px rgba(217,119,87,.55)" }}>{p.outro.sub}</div> : null}
            {p.handle ? <div style={{ marginTop: 60, fontWeight: 800, fontSize: 44, color: "rgba(255,255,255,.75)" }}>{p.handle}</div> : null}
          </div>
        </AbsoluteFill>
      ) : null}
      {p.handle && outroK === 0 ? <div style={{ position: "absolute", top: 120, left: 54, fontFamily, fontWeight: 800, fontSize: 30, color: "rgba(255,255,255,.6)", textShadow: "0 2px 8px rgba(0,0,0,.8)" }}>{p.handle}</div> : null}
      {p.aiLabel ? <div style={{ position: "absolute", top: 120, right: 54, fontFamily, fontWeight: 500, fontSize: 24, color: "rgba(255,255,255,.75)", background: "rgba(4,8,24,.5)", padding: "6px 16px", borderRadius: 12 }}>{p.aiLabel}</div> : null}
      {p.audio ? <Audio src={staticFile(p.audio)} /> : null}
      {p.music ? <Audio src={staticFile(p.music)} volume={0.07} /> : null}
    </AbsoluteFill>
  );
};
