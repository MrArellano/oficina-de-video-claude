import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Avatar, Robot } from "./Characters";

export const NightBg: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg,#05070f 0%,#0a1236 55%,#17224f 100%)" }}>
    {Array.from({ length: 40 }).map((_, i) => (
      <div key={i} style={{ position: "absolute", left: `${(i * 137) % 100}%`, top: `${(i * 59) % 55}%`, width: 4, height: 4, borderRadius: 2, background: "#fff", opacity: 0.2 + ((i * 7) % 5) * 0.12 }} />
    ))}
  </AbsoluteFill>
);

export const AvatarTest: React.FC = () => (
  <AbsoluteFill>
    <NightBg />
    <ThreeCanvas width={1080} height={1920} camera={{ position: [0, 0.3, 14], fov: 38 }} style={{ position: "absolute" }}>
      <ambientLight intensity={0.9} color="#9fb0e8" />
      <directionalLight position={[3, 2.5, 8]} intensity={1.7} color="#ffdcb3" />
      <directionalLight position={[-6, 1, -2]} intensity={1.2} color="#7f9bff" />
      
      <Avatar position={[-1.1, 0.9, 0]} rotY={0.3} scale={0.95} look={0.1} />
      <Robot position={[1.5, 0.5, 0]} rotY={-0.35} scale={0.9} look={-0.1} />
    </ThreeCanvas>
  </AbsoluteFill>
);

export const AvatarClose: React.FC = () => (
  <AbsoluteFill>
    <NightBg />
    <ThreeCanvas width={1080} height={1920} camera={{ position: [0, 0.2, 6.5], fov: 38 }} style={{ position: "absolute" }}>
      <ambientLight intensity={0.9} color="#9fb0e8" />
      <directionalLight position={[3, 2.5, 8]} intensity={1.7} color="#ffdcb3" />
      <directionalLight position={[-6, 1, -2]} intensity={1.2} color="#7f9bff" />
      <Avatar position={[0, 0.2, 0]} rotY={0.25} scale={1} look={0.15} />
    </ThreeCanvas>
  </AbsoluteFill>
);
