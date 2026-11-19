// VlogVideo: vlog vertical con tus clips (piezas de EDICIÓN).
// Tomas con velocidad, zooms de golpe y vibración, transiciones, subtítulos con palabra clave (*así*),
// rótulos animados, emojis Twemoji, efectos de sonido, cama musical y tarjeta final.
// Props: projects/<slug>/props.json (las arma pipeline/vlog.py). Vídeo con Html5Video (el compositor de Remotion lo
// bloquea Windows); el audio lo mezcla vlog.py con ffmpeg/numpy, por eso aquí los clips y el audio van mudos al render. Tiempos de subs/títulos/emojis/sfx = vídeo final (s).
// Zooms: t relativo al inicio de la toma (s del vídeo final).
import React from "react";
import {
  AbsoluteFill, Audio, Img, Html5Video, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { loadFont as loadBangers } from "@remotion/google-fonts/Bangers";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";

const { fontFamily: BANGERS } = loadBangers("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });

const NARANJA = "#FF7A1A";
const TIERRA = "#2B1A10";
const CREMA = "#FFF3DC";
const QUEMADO = "#E8590C";

type Zoom = { t: number; escala: number; dur?: number; shake?: number };
type Toma = { src: string; desde: number; hasta: number; vel?: number; vol?: number; zooms?: Zoom[]; ken?: number; base?: number; grado?: string; fadeIn?: number };
type Trans = { tipo: "fade" | "slide" | "wipe" | "flip" | "clockWipe" | "none"; frames: number; dir?: string };
type Sub = { s: number; e: number; texto: string };
type Titulo = {
  s: number; e: number; texto: string; estilo?: "gancho" | "rotulo" | "grande" | "chip" | "sello" | "banner" | "simple";
  anim?: "pop" | "slam" | "shake" | "maquina" | "sube" | "izq" | "cae"; color?: string; rot?: number; y?: number; x?: number;
  tam?: number; clave?: string; fondo?: string; sub?: string;
};
type Emoji = { s: number; e: number; img: string; x: number; y: number; tam?: number; anim?: "pop" | "rebote" | "gira" | "flota" | "cae" | "cruza" | "pulso"; rot?: number };
type Sfx = { t: number; src: string; vol?: number };
type Fin = { frames: number; pre?: string; titulo: string; pildora?: string; cta?: string; sub?: string; firma?: string; emoji?: string };
export type VlogProps = {
  fps: number; duration: number; tomas: Toma[]; trans: Trans[]; subs: Sub[]; titulos: Titulo[];
  emojis: Emoji[]; sfx: Sfx[]; musica?: { src: string; vol: number }; fin?: Fin; flash?: number[];
};

const presen = (t: Trans) => {
  const d = (t.dir || "from-right") as any;
  switch (t.tipo) {
    case "slide": return slide({ direction: d });
    case "wipe": return wipe({ direction: d });
    case "flip": return flip({ direction: d });
    case "clockWipe": return clockWipe({ width: 1080, height: 1920 });
    default: return fade();
  }
};

// Texto con *clave* en otro color.
const conClave = (texto: string, color: string) =>
  texto.split(/(\*[^*]+\*)/g).filter(Boolean).map((x, i) =>
    x.startsWith("*") ? <span key={i} style={{ color }}>{x.slice(1, -1)}</span> : <span key={i}>{x}</span>);

const TomaClip: React.FC<{ tm: Toma }> = ({ tm }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vel = tm.vel ?? 1;
  const total = Math.max(1, ((tm.hasta - tm.desde) / vel) * fps);
  const ken = 1 + (tm.ken ?? 0.04) * (f / total);
  let nivel = tm.base ?? 1;
  let dx = 0, dy = 0;
  for (const z of tm.zooms ?? []) {
    const a = z.t * fps;
    if (f < a) break;
    const p = spring({ frame: f - a, fps, config: { damping: 14, stiffness: 260, mass: 0.6 }, durationInFrames: Math.max(3, (z.dur ?? 0.15) * fps) });
    nivel = nivel + (z.escala - nivel) * p;
    if (z.shake && f - a < z.shake) { dx = Math.sin((f - a) * 2.7) * 16; dy = Math.cos((f - a) * 3.1) * 12; }
  }
  const vol = vel > 1.6 ? 0 : (tm.vol ?? 1) * (tm.fadeIn ? Math.min(1, f / tm.fadeIn) : 1);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Html5Video
        src={staticFile(tm.src)}
        trimBefore={Math.round(tm.desde * fps)}
        playbackRate={vel}
        muted
        volume={vol}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translate(${dx}px,${dy}px) scale(${ken * nivel})`,
                 filter: tm.grado ?? "contrast(1.08) saturate(1.18) brightness(1.03) sepia(0.06)" }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(30,12,0,.45) 100%)" }} />
      {vel > 1.05 && <div style={{ position: "absolute", top: 150, left: 50, padding: "8px 24px", borderRadius: 40, background: "rgba(43,26,16,.7)",
        color: CREMA, fontFamily: ANTON, fontSize: 46, letterSpacing: 2 }}>x{vel} ⏩</div>}
    </AbsoluteFill>
  );
};

// Subtítulo: Anton crema con trazo café; *clave* en naranja; entra con escala 0.85→1.
const Subtitulo: React.FC<{ sb: Sub }> = ({ sb }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f, fps, config: { damping: 12, stiffness: 400 }, durationInFrames: 4 });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1290, display: "flex", justifyContent: "center", transform: "translateY(-50%)" }}>
      <div style={{ transform: `scale(${0.85 + 0.15 * p})`, textAlign: "center", maxWidth: 940, fontFamily: ANTON,
        fontSize: 92, lineHeight: 1.05, color: CREMA, textTransform: "uppercase", letterSpacing: 1,
        WebkitTextStroke: `20px ${TIERRA}`, paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(0,0,0,.4)" }}>
        {conClave(sb.texto, NARANJA)}
      </div>
    </div>
  );
};

const TituloG: React.FC<{ t: Titulo }> = ({ t }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = (t.e - t.s) * fps;
  const est = t.estilo ?? "grande";
  const anim = t.anim ?? "pop";
  const p = spring({ frame: f, fps, config: { damping: anim === "slam" ? 9 : 12, stiffness: 320 }, durationInFrames: 10 });
  // Rótulos cortos (contador, golpes) salen en seco; los largos se desvanecen 5 fotogramas.
  const salida = dur > 24 ? interpolate(f, [dur - 5, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  let tr = "";
  if (anim === "slam") tr = `scale(${interpolate(p, [0, 1], [2.2, 1])})`;
  else if (anim === "sube") tr = `translateY(${interpolate(p, [0, 1], [-260, 0])}px)`;
  else if (anim === "izq") tr = `translateX(${interpolate(p, [0, 1], [-1100, 0])}px)`;
  else if (anim === "shake") tr = `scale(${0.6 + 0.4 * p}) translateX(${Math.sin(f * 1.9) * 12 * Math.max(0, 1 - f / 14)}px)`;
  else if (anim === "cae") tr = `scale(${0.6 + 0.4 * p})`;
  else if (est === "gancho") tr = `scale(${1.3 - 0.3 * p})`;
  else tr = `scale(${0.3 + 0.7 * p})`;
  tr += ` rotate(${t.rot ?? 0}deg)`;
  const visible = est === "gancho" || dur <= 24 ? 1 : Math.min(1, p * 3);
  let texto = t.texto;
  if (anim === "maquina") {
    const n = Math.floor(interpolate(f, [0, 12], [0, texto.length], { extrapolateRight: "clamp" }));
    texto = texto.slice(0, n);
  }
  const lineas = texto.split("\n");
  const color = t.color ?? (est === "rotulo" || est === "banner" || est === "simple" ? CREMA : NARANJA);
  const clave = t.clave ?? (color === NARANJA ? CREMA : NARANJA);
  const tam = t.tam ?? ({ gancho: 130, grande: 130, rotulo: 90, chip: 64, sello: 100, banner: 110, simple: 90 } as any)[est];
  const trazo = Math.max(10, tam * 0.16);
  const letras: React.CSSProperties = { fontFamily: BANGERS, fontSize: tam, lineHeight: 0.98, color, letterSpacing: 2,
    WebkitTextStroke: `${trazo}px ${TIERRA}`, paintOrder: "stroke fill", textShadow: `0 ${tam * 0.09}px 0 ${TIERRA}` };
  let cuerpo: React.ReactNode;
  const lin = lineas.map((l, i) => <div key={i}>{conClave(l, clave)}</div>);
  if (est === "chip") {
    cuerpo = <div style={{ background: t.fondo ?? NARANJA, color: TIERRA, fontFamily: ANTON, fontSize: tam, padding: "10px 34px",
      borderRadius: 60, boxShadow: "0 8px 0 rgba(0,0,0,.35)", letterSpacing: 1 }}>{lineas.map((l, i) => <div key={i}>{l}</div>)}</div>;
  } else if (est === "rotulo") {
    cuerpo = <div style={{ ...letras, WebkitTextStroke: "0px", textShadow: "none", color: t.color ?? TIERRA, background: t.fondo ?? CREMA,
      padding: "14px 40px 6px", borderRadius: 16, border: `7px solid ${TIERRA}`, boxShadow: `12px 12px 0 ${NARANJA}` }}>{lineas.map((l, i) => <div key={i}>{conClave(l, NARANJA)}</div>)}</div>;
  } else if (est === "sello") {
    cuerpo = <div style={{ ...letras, color: CREMA, WebkitTextStroke: "0px", textShadow: "none", background: t.fondo ?? QUEMADO,
      padding: "16px 40px 8px", borderRadius: 18, border: `8px solid ${CREMA}`, outline: `6px solid ${TIERRA}`, boxShadow: "0 14px 0 rgba(0,0,0,.4)" }}>{lin}</div>;
  } else if (est === "banner") {
    cuerpo = <div style={{ textAlign: "center", padding: "18px 46px 10px", borderRadius: 14, border: `6px solid ${TIERRA}`,
      background: `repeating-linear-gradient(-45deg, ${NARANJA} 0 34px, ${TIERRA} 34px 68px)` }}>
      <div style={{ ...letras }}>{lin}</div>
      {t.sub && <div style={{ fontFamily: ANTON, fontSize: 40, color: CREMA, background: TIERRA, padding: "6px 18px", marginTop: 8, borderRadius: 10 }}>{t.sub}</div>}
    </div>;
  } else {
    cuerpo = <div style={letras}>{lin}{t.sub && <div style={{ fontFamily: ANTON, fontSize: tam * 0.45, color: CREMA, WebkitTextStroke: `10px ${TIERRA}`, marginTop: 8 }}>{t.sub}</div>}</div>;
  }
  const y = t.y ?? 300;
  const dx = (t.x ?? 540) - 540;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center",
      transform: `translate(${dx}px, -50%)`, textAlign: "center" }}>
      <div style={{ transform: tr, opacity: salida * visible }}>{cuerpo}</div>
    </div>
  );
};

const EmojiG: React.FC<{ em: Emoji }> = ({ em }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = (em.e - em.s) * fps;
  const tam = em.tam ?? 200;
  const p = spring({ frame: f, fps, config: { damping: 8, stiffness: 220 }, durationInFrames: 14 });
  const salida = interpolate(f, [dur - 4, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const anim = em.anim ?? "pop";
  let x = em.x, y = em.y;
  let tr = `scale(${p * salida})`;
  if (anim === "rebote") tr += ` translateY(${-Math.abs(Math.sin(f / 5)) * 40}px)`;
  if (anim === "gira") tr += ` rotate(${interpolate(p, [0, 1], [-360, 0])}deg)`;
  if (anim === "flota") tr += ` translateY(${Math.sin(f / 9) * 18}px) rotate(${Math.sin(f / 7) * 8}deg)`;
  if (anim === "pulso") tr += ` scale(${1 + 0.08 * Math.sin(f / 4)})`;
  if (anim === "cae") tr = `translateY(${interpolate(p, [0, 1], [-600, 0])}px) rotate(${(1 - p) * 40}deg) scale(${salida})`;
  if (anim === "cruza") { x = interpolate(f, [0, dur], [-tam, 1080 + tam]); tr = `rotate(${Math.sin(f / 2) * 10}deg)`; }
  tr += ` rotate(${em.rot ?? 0}deg)`;
  return (
    <Img src={staticFile(em.img)} style={{ position: "absolute", width: tam, height: tam, left: x - tam / 2, top: y - tam / 2,
      transform: tr, filter: "drop-shadow(0 12px 10px rgba(0,0,0,.45))" }} />
  );
};

const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [0, 5], [0.8, 0], { extrapolateRight: "clamp" }) }} />;
};

const Final: React.FC<{ fin: Fin }> = ({ fin }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = (d: number) => spring({ frame: f - d, fps, config: { damping: 11, stiffness: 220 } });
  const [a, b, c, d] = [sp(9), sp(20), sp(35), sp(50)];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 35%, #6B4423 0%, #3B2616 60%, ${QUEMADO} 140%)`, alignItems: "center",
      justifyContent: "center", gap: 34, padding: "0 60px", textAlign: "center" }}>
      <AbsoluteFill style={{ opacity: 0.12, backgroundImage: "radial-gradient(rgba(255,255,255,.6) 1px, transparent 1px)", backgroundSize: "6px 6px" }} />
      {fin.emoji && <Img src={staticFile(fin.emoji)} style={{ width: 220, height: 220, transform: `scale(${a}) rotate(${Math.sin(f / 7) * 8}deg)` }} />}
      {fin.pre && <div style={{ transform: `translateX(${(1 - a) * -900}px)`, fontFamily: ANTON, fontSize: 64, color: CREMA, letterSpacing: 3 }}>{fin.pre}</div>}
      <div style={{ transform: `scale(${a})`, fontFamily: BANGERS, fontSize: 116, color: NARANJA, lineHeight: 0.95,
        WebkitTextStroke: `18px ${TIERRA}`, paintOrder: "stroke fill", textShadow: `0 10px 0 ${TIERRA}` }}>
        {fin.titulo.split("\n").map((l, i) => <div key={i}>{l}</div>)}</div>
      {fin.pildora && <div style={{ transform: `scale(${b})`, fontFamily: ANTON, fontSize: 60, color: TIERRA, background: NARANJA,
        padding: "8px 34px", borderRadius: 60 }}>{fin.pildora}</div>}
      {fin.cta && <div style={{ transform: `scale(${c * (1 + 0.04 * Math.sin(f / 4))})`, fontFamily: BANGERS, fontSize: 88, color: TIERRA,
        background: NARANJA, padding: "16px 46px 8px", borderRadius: 26, border: `6px solid ${CREMA}`, boxShadow: `0 12px 0 ${TIERRA}` }}>{fin.cta}</div>}
      {fin.sub && <div style={{ opacity: c, fontFamily: ANTON, fontSize: 52, color: CREMA }}>{fin.sub}</div>}
      {fin.firma && <div style={{ opacity: d * 0.9, fontFamily: ANTON, fontSize: 44, color: CREMA }}>{fin.firma}</div>}
    </AbsoluteFill>
  );
};

export const VlogVideo: React.FC<VlogProps> = (p) => {
  const { fps } = p;
  const fr = (s: number) => Math.round(s * fps);
  const hijos: React.ReactNode[] = [];
  const n = p.tomas.length + (p.fin ? 1 : 0);
  for (let i = 0; i < n; i++) {
    if (i < p.tomas.length) {
      const tm = p.tomas[i];
      const d = Math.max(1, Math.round(((tm.hasta - tm.desde) / (tm.vel ?? 1)) * fps));
      hijos.push(<TransitionSeries.Sequence key={`t${i}`} durationInFrames={d}><TomaClip tm={tm} /></TransitionSeries.Sequence>);
    } else {
      hijos.push(<TransitionSeries.Sequence key="fin" durationInFrames={p.fin!.frames}><Final fin={p.fin!} /></TransitionSeries.Sequence>);
    }
    const tr = p.trans[i];
    if (i < n - 1 && tr && tr.tipo !== "none" && tr.frames > 0)
      hijos.push(<TransitionSeries.Transition key={`x${i}`} presentation={presen(tr) as any} timing={linearTiming({ durationInFrames: tr.frames })} />);
  }
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>{hijos}</TransitionSeries>
      {(p.flash ?? []).map((t, i) => <Sequence key={`f${i}`} from={fr(t)} durationInFrames={6}><Flash /></Sequence>)}
      {p.emojis.map((em, i) => <Sequence key={`e${i}`} from={fr(em.s)} durationInFrames={Math.max(1, fr(em.e - em.s))}><EmojiG em={em} /></Sequence>)}
      {p.titulos.map((t, i) => <Sequence key={`ti${i}`} from={fr(t.s)} durationInFrames={Math.max(1, fr(t.e - t.s))}><TituloG t={t} /></Sequence>)}
      {p.subs.map((sb, i) => <Sequence key={`s${i}`} from={fr(sb.s)} durationInFrames={Math.max(1, fr(sb.e - sb.s))}><Subtitulo sb={sb} /></Sequence>)}
      {p.sfx.map((x, i) => <Sequence key={`a${i}`} from={fr(x.t)}><Audio src={staticFile(x.src)} volume={x.vol ?? 0.8} /></Sequence>)}
      {p.musica && <Audio src={staticFile(p.musica.src)} volume={p.musica.vol} />}
    </AbsoluteFill>
  );
};
