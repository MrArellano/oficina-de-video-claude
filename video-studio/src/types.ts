export type Word = { w: string; start: number; end: number; hl?: boolean; brk?: boolean };
export type Col = { title: string; items: string[]; good?: boolean };
export type Scene = {
  type?: "img" | "hook" | "chat" | "list" | "stat" | "icon" | "compare" | "cta";
  start: number; end: number;
  img?: string; motion?: "in" | "out" | "left" | "right" | "up";
  emoji?: string; title?: string; sub?: string;
  prompt?: string; reply?: string[];
  items?: string[]; already?: number;
  value?: number; prefix?: string; suffix?: string; label?: string;
  a?: Col; b?: Col;
};
export type VideoProps = { fps: number; duration: number; audio: string; music?: string; handle?: string; scenes: Scene[]; words: Word[] };
