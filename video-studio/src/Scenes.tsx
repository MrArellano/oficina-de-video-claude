import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Col, Scene } from "./types";

export const C = { bg: "#081233", card: "rgba(18,28,62,.92)", line: "rgba(120,150,230,.25)", blue: "#4f8dff", green: "#22c55e", red: "#ef4444", text: "#eef2ff", mute: "#9aa6c7" };
export const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji"';

type P = { s: Scene; font: string; len: number };

const useT = () => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return { f, fps, t: f / fps }; };
const useIn = (delay = 0) => { const { f, fps } = useT(); return spring({ frame: f - delay * fps, fps, config: { damping: 14, mass: 0.7 } }); };

// Content area below the captions, vertically centred (top prop kept for API compatibility)
const Center: React.FC<{ children: React.ReactNode; top?: number }> = ({ children }) => (
  <AbsoluteFill style={{ top: 380, height: 1340, paddingLeft: 64, paddingRight: 64, alignItems: "center", justifyContent: "center" }}>{children}</AbsoluteFill>
);

export const Hook: React.FC<P> = ({ s, font }) => {
  const k = useIn(0); const k2 = useIn(0.25); const k3 = useIn(0.5); const { t } = useT();
  return (
    <Center top={560}>
      <div style={{ fontFamily: EMOJI, fontSize: 260, transform: `scale(${k}) rotate(${Math.sin(t * 3) * 4}deg)` }}>{s.emoji}</div>
      <div style={{ fontFamily: font, fontWeight: 800, fontSize: 92, color: C.text, textAlign: "center", lineHeight: 1.05, marginTop: 40, opacity: k2, transform: `translateY(${(1 - k2) * 40}px)` }}>{s.title}</div>
      {s.sub && <div style={{ fontFamily: font, fontWeight: 800, fontSize: 62, color: C.blue, textAlign: "center", marginTop: 26, opacity: k3 }}>{s.sub}</div>}
    </Center>
  );
};

export const Icon: React.FC<P> = ({ s, font }) => {
  const k = useIn(0); const k2 = useIn(0.2); const k3 = useIn(0.45); const { t } = useT();
  return (
    <Center top={600}>
      <div style={{ width: 380, height: 380, borderRadius: 100, background: "radial-gradient(circle at 30% 25%, #2d4fae, #101d4a)", border: `3px solid ${C.line}`, boxShadow: "0 30px 90px rgba(40,90,255,.35)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${k}) translateY(${Math.sin(t * 2.5) * 8}px)` }}>
        <span style={{ fontFamily: EMOJI, fontSize: 210 }}>{s.emoji}</span>
      </div>
      <div style={{ fontFamily: font, fontWeight: 800, fontSize: 78, color: C.text, textAlign: "center", lineHeight: 1.1, marginTop: 60, opacity: k2, transform: `translateY(${(1 - k2) * 30}px)` }}>{s.title}</div>
      {s.sub && <div style={{ fontFamily: font, fontWeight: 500, fontSize: 50, color: C.mute, textAlign: "center", marginTop: 20, opacity: k3 }}>{s.sub}</div>}
    </Center>
  );
};

export const Chat: React.FC<P> = ({ s, font, len }) => {
  const { t, fps } = useT();
  const dur = len / fps;
  const prompt = s.prompt ?? "";
  const typeEnd = Math.min(dur * 0.42, 0.35 + prompt.length * 0.03);
  const shown = Math.floor(interpolate(t, [0.25, typeEnd], [0, prompt.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const sent = t > typeEnd + 0.15;
  const k = useIn(0);
  const reply = s.reply ?? [];
  const step = Math.min(1.0, (dur - typeEnd - 1.0) / Math.max(1, reply.length));
  return (
    <Center top={430}>
      <div style={{ width: "100%", background: C.card, border: `2px solid ${C.line}`, borderRadius: 40, padding: 40, fontFamily: font, boxShadow: "0 40px 120px rgba(0,0,0,.5)", transform: `scale(${0.9 + 0.1 * k})`, opacity: k }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 30 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 20, height: 20, borderRadius: 10, background: c }} />)}
          <div style={{ flex: 1, textAlign: "center", color: C.mute, fontSize: 34, fontWeight: 800, marginRight: 80 }}>✦ Asistente IA</div>
        </div>
        {!sent ? (
          <div style={{ border: `3px solid ${C.blue}`, borderRadius: 26, padding: "28px 30px", minHeight: 200, color: C.text, fontSize: 50, lineHeight: 1.3, boxShadow: "0 0 40px rgba(79,141,255,.35)" }}>
            {prompt.slice(0, shown)}<span style={{ opacity: Math.floor(t * 3) % 2 ? 1 : 0, color: C.blue }}>|</span>
          </div>
        ) : (
          <>
            <div style={{ marginLeft: 100, background: "#2a3a70", borderRadius: "28px 28px 6px 28px", padding: "26px 30px", color: C.text, fontSize: 42, lineHeight: 1.3 }}>{prompt}</div>
            <div style={{ marginTop: 30 }}>
              {reply.map((r, i) => {
                const a = interpolate(t, [typeEnd + 0.6 + i * step, typeEnd + 0.9 + i * step], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                return <div key={i} style={{ opacity: a, transform: `translateY(${(1 - a) * 20}px)`, background: "rgba(79,141,255,.10)", border: `2px solid ${C.line}`, borderRadius: 22, padding: "20px 26px", marginBottom: 18, color: C.text, fontSize: 44, lineHeight: 1.3, fontFamily: `${font},${EMOJI}` }}>{r}</div>;
              })}
              {reply.length > 0 && t < typeEnd + 0.6 && <div style={{ color: C.blue, fontSize: 40 }}>✦ pensando…</div>}
            </div>
          </>
        )}
      </div>
    </Center>
  );
};

export const List: React.FC<P> = ({ s, font, len }) => {
  const { t, fps } = useT();
  const items = s.items ?? []; const already = s.already ?? 0;
  const fresh = items.length - already;
  const step = Math.min(0.9, (len / fps - 0.6) / Math.max(1, fresh));
  return (
    <Center top={470}>
      {s.title && <div style={{ fontFamily: `${font},${EMOJI}`, fontWeight: 800, fontSize: 66, color: C.text, textAlign: "center", marginBottom: 50 }}>{s.title}</div>}
      {items.map((it, i) => {
        const d = i < already ? -1 : 0.2 + (i - already) * step;
        const a = d < 0 ? 1 : interpolate(t, [d, d + 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const isNew = d >= 0;
        return (
          <div key={i} style={{ width: "100%", display: "flex", alignItems: "center", gap: 28, padding: "30px 36px", marginBottom: 26, borderRadius: 34, background: isNew ? "rgba(34,197,94,.16)" : "rgba(34,197,94,.07)", border: `3px solid ${isNew ? C.green : "rgba(34,197,94,.4)"}`, boxShadow: isNew ? "0 0 50px rgba(34,197,94,.35)" : "none", opacity: a, transform: `translateX(${(1 - a) * -60}px) scale(${0.95 + 0.05 * a})` }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", color: "#04210f", fontSize: 40, fontWeight: 900, flexShrink: 0, fontFamily: font }}>✓</div>
            <div style={{ fontFamily: `${font},${EMOJI}`, fontWeight: 800, fontSize: 50, color: C.text, lineHeight: 1.15 }}>{it}</div>
          </div>
        );
      })}
    </Center>
  );
};

export const Stat: React.FC<P> = ({ s, font }) => {
  const { t } = useT(); const k = useIn(0); const k2 = useIn(0.3);
  const target = s.value ?? 0;
  const v = interpolate(t, [0, 0.9], [0, target], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const dec = target % 1 !== 0 ? 1 : 0;
  return (
    <Center top={680}>
      <div style={{ fontFamily: font, fontWeight: 800, fontSize: 300, color: "#ffd23f", lineHeight: 1, textShadow: "0 0 80px rgba(255,210,63,.4)", transform: `scale(${0.7 + 0.3 * k})` }}>
        {s.prefix}{v.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec })}{s.suffix}
      </div>
      <div style={{ fontFamily: font, fontWeight: 800, fontSize: 64, color: C.text, textAlign: "center", marginTop: 30, opacity: k2 }}>{s.label}</div>
    </Center>
  );
};

const CompareCol: React.FC<{ c: Col; font: string; d: number }> = ({ c, font, d }) => {
  const k = useIn(d); const col = c.good ? C.green : c.good === false ? C.red : C.blue;
  return (
    <div style={{ flex: 1, background: C.card, border: `3px solid ${col}`, borderRadius: 34, padding: 34, opacity: k, transform: `translateY(${(1 - k) * 60}px)` }}>
      <div style={{ fontFamily: `${font},${EMOJI}`, fontWeight: 800, fontSize: 46, color: col, marginBottom: 24 }}>{c.title}</div>
      {c.items.map((x, i) => <div key={i} style={{ fontFamily: `${font},${EMOJI}`, fontWeight: 500, fontSize: 38, color: C.text, marginBottom: 16, lineHeight: 1.25 }}>{x}</div>)}
    </div>
  );
};

export const Compare: React.FC<P> = ({ s, font }) => (
  <Center top={520}>
    {s.title && <div style={{ fontFamily: font, fontWeight: 800, fontSize: 64, color: C.text, marginBottom: 46, textAlign: "center" }}>{s.title}</div>}
    <div style={{ display: "flex", gap: 30, width: "100%" }}>
      {s.a && <CompareCol c={s.a} font={font} d={0.1} />}
      {s.b && <CompareCol c={s.b} font={font} d={0.6} />}
    </div>
  </Center>
);

export const Cta: React.FC<P> = ({ s, font }) => {
  const k = useIn(0); const k2 = useIn(0.4); const { t } = useT();
  return (
    <Center top={620}>
      <div style={{ fontFamily: EMOJI, fontSize: 220, transform: `scale(${k * (1 + Math.sin(t * 5) * 0.04)})` }}>{s.emoji ?? "👉"}</div>
      <div style={{ fontFamily: font, fontWeight: 800, fontSize: 88, color: C.text, textAlign: "center", marginTop: 40, lineHeight: 1.08 }}>{s.title}</div>
      {s.sub && <div style={{ marginTop: 50, padding: "26px 56px", borderRadius: 60, background: C.blue, fontFamily: font, fontWeight: 800, fontSize: 52, color: "white", opacity: k2, boxShadow: "0 0 60px rgba(79,141,255,.6)" }}>{s.sub}</div>}
    </Center>
  );
};

export const ImgScene: React.FC<P> = ({ s, len }) => {
  const f = useCurrentFrame();
  const ease = Easing.inOut(Easing.quad)(interpolate(f, [0, len], [0, 1], { extrapolateRight: "clamp" }));
  const m = s.motion ?? "in";
  const scale = m === "out" ? 1.18 - 0.12 * ease : 1.06 + 0.12 * ease;
  const tx = m === "left" ? 40 - 80 * ease : m === "right" ? -40 + 80 * ease : 0;
  return <Img src={staticFile(s.img!)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translateX(${tx}px) scale(${scale})` }} />;
};
