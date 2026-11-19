// Animated phone mock-ups for promo videos (example content, labelled "Negocio de ejemplo").
// kind: directorio | foto | menu | whatsapp | fidelidad. Colors come from "brand" (defaults: a sample business).
import { useCurrentFrame, useVideoConfig } from "remotion";

export type DPhone = {
  start: number; end: number; kind: "directorio" | "foto" | "menu" | "whatsapp" | "fidelidad";
  label?: string; brand?: { primary?: string; primary2?: string; accent?: string; site?: string; town?: string };
};

const UI = '"Segoe UI", system-ui, Arial, sans-serif';
const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji"';
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (k: number) => 1 - Math.pow(1 - clamp(k), 3);

type B = Required<NonNullable<DPhone["brand"]>>;
const DEF: B = { primary: "#0066cc", primary2: "#0096e6", accent: "#2ecc71", site: "minegocio.com", town: "Mi ciudad" };

const MENU = [
  { e: "🌮", n: "Tacos de pastor", d: "Orden de 3, con piña", p: 54 },
  { e: "🧀", n: "Quesadilla", d: "De queso o de chicharrón", p: 35 },
  { e: "🥤", n: "Agua de jamaica", d: "Vaso de medio litro", p: 25 },
  { e: "🍮", n: "Flan casero", d: "Rebanada", p: 30 },
];

const Bar: React.FC<{ b: B; title: string; sub?: string }> = ({ b, title, sub }) => (
  <div style={{ background: `linear-gradient(135deg, ${b.primary}, ${b.primary2})`, color: "#fff", padding: "70px 34px 30px" }}>
    <div style={{ fontWeight: 800, fontSize: 38, lineHeight: 1.1 }}>{title}</div>
    {sub ? <div style={{ fontSize: 24, opacity: 0.9, marginTop: 8 }}>{sub}</div> : null}
  </div>
);

const Directorio: React.FC<{ b: B; t: number }> = ({ b, t }) => {
  const q = "tacos".slice(0, Math.floor(clamp((t - 0.6) / 1.0) * 5));
  const cards = [
    { e: "🌮", n: "Taquería Ejemplo", c: "Comida", open: true },
    { e: "💈", n: "Barbería Ejemplo", c: "Belleza", open: true },
    { e: "🔧", n: "Taller Ejemplo", c: "Servicios", open: false },
  ];
  const hi = t > 2.4;
  return (
    <>
      <Bar b={b} title={`Directorio ${b.town}`} sub="Todo lo local, en un solo lugar" />
      <div style={{ padding: "24px 26px 0" }}>
        <div style={{ background: "#f5f7fa", border: "2px solid #e3e7ed", borderRadius: 18, padding: "16px 22px", fontSize: 28, color: q ? "#333" : "#9aa3ad" }}>
          🔎 {q || "Busca un negocio…"}<span style={{ opacity: Math.sin(t * 8) > 0 ? 1 : 0 }}>|</span>
        </div>
        <div style={{ display: "flex", gap: 10, margin: "18px 0", flexWrap: "wrap" }}>
          {["Comida", "Belleza", "Servicios", "Tiendas"].map((c, i) => (
            <span key={c} style={{ fontSize: 22, fontWeight: 700, padding: "8px 16px", borderRadius: 20, background: i === 0 ? b.primary : "#e6f1fc", color: i === 0 ? "#fff" : b.primary }}>{c}</span>
          ))}
        </div>
        {cards.map((c, i) => {
          const a = ease((t - 0.3 - i * 0.25) / 0.4); const on = hi && i === 0;
          return (
            <div key={c.n} style={{ opacity: a, transform: `translateY(${(1 - a) * 30}px) scale(${on ? 1.03 : 1})`, background: "#fff", border: `2px solid ${on ? b.primary : "#e3e7ed"}`, borderRadius: 20, padding: 18, marginBottom: 16, boxShadow: on ? "0 10px 30px rgba(0,102,204,.25)" : "0 2px 10px rgba(20,40,80,.08)" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ width: 74, height: 74, borderRadius: 16, background: "#e6f1fc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: EMOJI, fontSize: 40 }}>{c.e}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 28, color: "#222" }}>{c.n}</div>
                  <div style={{ fontSize: 21, color: "#6c6c6c" }}>{c.c} · <span style={{ color: c.open ? "#1c8c4c" : "#d6342c", fontWeight: 700 }}>{c.open ? "Abierto ahora" : "Cerrado"}</span></div>
                </div>
              </div>
              {on ? (
                <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
                  <span style={{ flex: 1, textAlign: "center", background: b.accent, color: "#fff", fontWeight: 800, fontSize: 22, padding: "12px 0", borderRadius: 14 }}>💬 WhatsApp</span>
                  <span style={{ flex: 1, textAlign: "center", background: "#e6f1fc", color: b.primary, fontWeight: 800, fontSize: 22, padding: "12px 0", borderRadius: 14 }}>📍 Cómo llegar</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
};

const Foto: React.FC<{ b: B; t: number }> = ({ b, t }) => {
  const scan = clamp((t - 0.5) / 2.2); const rows = MENU.slice(0, 3);
  return (
    <>
      <Bar b={b} title="Sube la foto de tu menú" sub="Pizarrón, hoja, impresión o imagen" />
      <div style={{ padding: 26 }}>
        <div style={{ position: "relative", height: 420, borderRadius: 18, overflow: "hidden", background: "#24392b", border: "14px solid #8a5a33", transform: "rotate(-1.5deg)" }}>
          <div style={{ padding: "22px 30px", fontFamily: '"Segoe Print","Comic Sans MS",cursive', color: "#f3f0e4", fontSize: 32, lineHeight: 1.55 }}>
            <div style={{ fontSize: 40, textAlign: "center", marginBottom: 6 }}>~ MENÚ ~</div>
            {rows.map((r) => <div key={r.n} style={{ display: "flex", justifyContent: "space-between" }}><span>{r.n}</span><span>${r.p}</span></div>)}
          </div>
          {scan > 0 && scan < 1 ? <div style={{ position: "absolute", left: 0, right: 0, top: `${scan * 100}%`, height: 6, background: "#ffb066", boxShadow: "0 0 30px 10px rgba(255,176,102,.6)" }} /> : null}
        </div>
        <div style={{ margin: "24px 0 12px", fontWeight: 800, fontSize: 26, color: "#d97757" }}>✳ {scan < 1 ? "Claude está leyendo tu menú…" : "¡Listo! Revisa y publica"}</div>
        {rows.map((r, i) => {
          const a = ease((t - 0.9 - i * 0.65) / 0.35);
          return (
            <div key={r.n} style={{ opacity: a, transform: `translateX(${(1 - a) * 40}px)`, display: "flex", alignItems: "center", gap: 14, background: "#f5f7fa", borderRadius: 16, padding: "14px 18px", marginBottom: 12 }}>
              <span style={{ fontFamily: EMOJI, fontSize: 32 }}>{r.e}</span>
              <span style={{ flex: 1, fontWeight: 700, fontSize: 26, color: "#222" }}>{r.n}</span>
              <span style={{ fontWeight: 800, fontSize: 26, color: "#222" }}>${r.p}</span>
              <span style={{ color: "#1c8c4c", fontSize: 26, fontWeight: 800 }}>✓</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

const Menu: React.FC<{ b: B; t: number }> = ({ b, t }) => {
  const adds = [1.2, 2.0, 2.8].filter((x) => t >= x).length;
  const cart = [0, 0, 2].slice(0, adds); const total = cart.reduce((s, i) => s + MENU[i].p, 0);
  return (
    <>
      <div style={{ background: `linear-gradient(135deg, ${b.primary}, ${b.primary2})`, color: "#fff", padding: "70px 34px 26px", display: "flex", gap: 18, alignItems: "center" }}>
        <div style={{ width: 84, height: 84, borderRadius: 42, background: "#fff", fontFamily: EMOJI, fontSize: 46, display: "flex", alignItems: "center", justifyContent: "center" }}>🌮</div>
        <div><div style={{ fontWeight: 800, fontSize: 36 }}>Taquería Ejemplo</div><div style={{ fontSize: 22, opacity: 0.9 }}>● Abierto · Pedidos por WhatsApp</div></div>
      </div>
      <div style={{ display: "flex", gap: 10, padding: "18px 26px" }}>
        {["Tacos", "Quesadillas", "Bebidas", "Postres"].map((c, i) => (
          <span key={c} style={{ fontSize: 22, fontWeight: 700, padding: "8px 16px", borderRadius: 20, background: i === 0 ? "#222" : "#f0f2f5", color: i === 0 ? "#fff" : "#444" }}>{c}</span>
        ))}
      </div>
      <div style={{ padding: "0 26px" }}>
        {MENU.map((m, i) => {
          const a = ease((t - 0.2 - i * 0.15) / 0.35); const n = cart.filter((x) => x === i).length;
          return (
            <div key={m.n} style={{ opacity: a, display: "flex", gap: 16, alignItems: "center", padding: "16px 0", borderBottom: "2px solid #eef0f3" }}>
              <div style={{ width: 96, height: 96, borderRadius: 18, background: "#fff4e8", fontFamily: EMOJI, fontSize: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>{m.e}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 28, color: "#222" }}>{m.n}</div>
                <div style={{ fontSize: 21, color: "#6c6c6c" }}>{m.d}</div>
                <div style={{ fontWeight: 800, fontSize: 26, color: "#222", marginTop: 4 }}>${m.p}</div>
              </div>
              <div style={{ width: 58, height: 58, borderRadius: 29, background: n ? b.accent : b.primary, color: "#fff", fontWeight: 800, fontSize: n ? 28 : 36, display: "flex", alignItems: "center", justifyContent: "center" }}>{n ? `×${n}` : "+"}</div>
            </div>
          );
        })}
      </div>
      {adds ? (
        <div style={{ position: "absolute", left: 22, right: 22, bottom: 34, background: b.accent, color: "#fff", borderRadius: 22, padding: "22px 26px", display: "flex", justifyContent: "space-between", whiteSpace: "nowrap", fontWeight: 800, fontSize: 25, boxShadow: "0 10px 30px rgba(46,204,113,.45)", transform: `scale(${1 + 0.06 * Math.max(0, 1 - (t - [1.2, 2.0, 2.8][adds - 1]) / 0.2)})` }}>
          <span>{adds} {adds === 1 ? "producto" : "productos"} · ${total}</span><span>Pedir por WhatsApp →</span>
        </div>
      ) : null}
    </>
  );
};

const Whatsapp: React.FC<{ b: B; t: number }> = ({ t }) => {
  const a1 = ease((t - 0.4) / 0.35); const a2 = ease((t - 2.6) / 0.35);
  return (
    <>
      <div style={{ background: "#1f6f5c", color: "#fff", padding: "70px 30px 24px", display: "flex", gap: 18, alignItems: "center" }}>
        <div style={{ width: 70, height: 70, borderRadius: 35, background: "#fff", fontFamily: EMOJI, fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>🌮</div>
        <div><div style={{ fontWeight: 800, fontSize: 32 }}>Taquería Ejemplo</div><div style={{ fontSize: 22, opacity: 0.85 }}>en línea</div></div>
      </div>
      <div style={{ background: "#ece5dd", position: "absolute", top: 164, bottom: 0, left: 0, right: 0, padding: 26 }}>
        <div style={{ opacity: a1, transform: `translateY(${(1 - a1) * 40}px)`, marginLeft: 70, background: "#dcf8c6", borderRadius: "22px 4px 22px 22px", padding: "22px 24px", fontSize: 27, color: "#1d2a22", lineHeight: 1.45, boxShadow: "0 2px 4px rgba(0,0,0,.1)" }}>
          <b>¡Hola! Quiero pedir:</b><br />• 2 × Tacos de pastor — $108<br />• 1 × Agua de jamaica — $25<br /><b>Total: $133</b><br /><span style={{ fontSize: 22, color: "#5b6b60" }}>Pedido desde el menú digital</span>
        </div>
        <div style={{ opacity: a2, transform: `translateY(${(1 - a2) * 40}px)`, marginRight: 140, marginTop: 22, background: "#fff", borderRadius: "4px 22px 22px 22px", padding: "18px 24px", fontSize: 27, color: "#1d2a22", boxShadow: "0 2px 4px rgba(0,0,0,.1)" }}>
          ¡Con gusto! En 15 min está listo 👍
        </div>
      </div>
    </>
  );
};

const QR: React.FC<{ size: number }> = ({ size }) => {
  const n = 21; const c = size / n; const cells: React.ReactElement[] = [];
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let on = ((x * 7 + y * 13 + x * y) % 5) < 2;
    if (finder(x, y)) { const fx = x >= n - 7 ? x - (n - 7) : x; const fy = y >= n - 7 ? y - (n - 7) : y; on = fx === 0 || fy === 0 || fx === 6 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4); }
    if (on) cells.push(<div key={x + "-" + y} style={{ position: "absolute", left: x * c, top: y * c, width: c + 0.5, height: c + 0.5, background: "#111" }} />);
  }
  return <div style={{ position: "relative", width: size, height: size }}>{cells}</div>;
};

const Fidelidad: React.FC<{ b: B; t: number }> = ({ b, t }) => {
  const meta = 8; const sellos = Math.min(meta, Math.floor(clamp((t - 0.8) / 3.0) * (meta + 0.99)));
  const regalo = sellos >= meta; const pr = regalo ? ease((t - 3.9) / 0.35) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${b.primary}, ${b.primary2})`, color: "#fff", textAlign: "center", padding: "90px 40px 0" }}>
      <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: 3 }}>TARJETA DE FIDELIDAD</div>
      <div style={{ fontWeight: 800, fontSize: 46, marginTop: 10 }}>Café Ejemplo</div>
      <div style={{ background: "#fff", borderRadius: 26, padding: 22, width: 340, margin: "30px auto 0" }}><QR size={296} /></div>
      <div style={{ fontSize: 24, opacity: 0.9, marginTop: 14 }}>Muestra este QR en cada compra</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, width: 400, margin: "30px auto 0" }}>
        {Array.from({ length: meta }).map((_, i) => {
          const on = i < sellos; const pop = on ? 1 + 0.3 * Math.max(0, 1 - (t - (0.8 + (i + 1) * 3.0 / (meta + 0.99))) / 0.15) : 1;
          return <div key={i} style={{ width: 82, height: 82, borderRadius: 41, border: "4px solid rgba(255,255,255,.8)", background: on ? "#fff" : "transparent", color: b.primary, fontFamily: EMOJI, fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pop})` }}>{on ? "☕" : ""}</div>;
        })}
      </div>
      {regalo ? (
        <div style={{ position: "absolute", left: 40, right: 40, bottom: 70, background: b.accent, borderRadius: 24, padding: "22px 0", whiteSpace: "nowrap", fontWeight: 800, fontSize: 29, opacity: pr, transform: `scale(${0.7 + 0.3 * pr})`, boxShadow: "0 10px 40px rgba(0,0,0,.3)" }}>
          🎁 ¡La siguiente va de regalo!
        </div>
      ) : null}
    </div>
  );
};

export const Phone: React.FC<{ c: DPhone }> = ({ c }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const T = f / fps;
  if (T < c.start || T > c.end) return null;
  const t = T - c.start; const k = ease(t / 0.4); const out = clamp((c.end - T) / 0.2);
  const b: B = { ...DEF, ...(c.brand ?? {}) };
  const body = { directorio: Directorio, foto: Foto, menu: Menu, whatsapp: Whatsapp, fidelidad: Fidelidad }[c.kind];
  const Body = body;
  return (
    <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: Math.min(k, out), perspective: 2000 }}>
      <div style={{ width: 600, height: 1110, borderRadius: 74, background: "#0b0d14", padding: 16, boxShadow: "0 50px 140px rgba(0,0,0,.8), 0 0 0 3px #2a2f3f inset", transform: `translateY(${(1 - k) * 120}px) rotateX(${(1 - k) * 12}deg) rotateY(${-4 + 4 * k}deg)` }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 60, overflow: "hidden", background: "#fff", fontFamily: UI }}>
          <Body b={b} t={t} />
          <div style={{ position: "absolute", top: 18, left: "50%", marginLeft: -70, width: 140, height: 36, borderRadius: 18, background: "#0b0d14" }} />
        </div>
      </div>
      <div style={{ marginTop: 16, fontFamily: UI, fontWeight: 700, fontSize: 24, color: "rgba(255,255,255,.7)" }}>{c.label ?? "Negocio de ejemplo"}</div>
    </div>
  );
};
