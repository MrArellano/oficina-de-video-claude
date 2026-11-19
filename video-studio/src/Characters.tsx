import { useMemo } from "react";
import * as THREE from "three";

// Avatar colors: change them so the avatar looks like you (skin, hair, beard, shirt).
export const SKIN = { lit: "#e0b088", base: "#d2a07a", shade: "#a8744e" };
export const HAIR = "#120c09";
export const BEARD = "#2a1710";
export const SHIRT = "#0e0c0a";
export const STRIPE = "#e9dfc4";

const Flat: React.FC<{ color: string; rough?: number }> = ({ color, rough = 0.85 }) => (
  <meshStandardMaterial color={color} flatShading roughness={rough} metalness={0.02} />
);

type Pose = { mouth?: number; look?: number; tilt?: number; blink?: number; brow?: number };

/** Low-poly avatar: short curly dark hair, full beard, warm skin, striped black tee. Edit the shapes/colors to make it yours. */
export const Avatar: React.FC<Pose & { position?: [number, number, number]; rotY?: number; scale?: number; cine?: boolean; nod?: number }> = ({
  mouth = 0, look = 0, tilt = 0, blink = 0, brow = 0, position = [0, 0, 0], rotY = 0, scale = 1, cine = false, nod = 0,
}) => {
  const curls = useMemo(() => {
    // curly top: ring of small icosahedra over the crown
    const out: [number, number, number, number][] = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = 0.62 + ((i * 37) % 7) * 0.02;
      out.push([Math.cos(a) * r, 0.78 + ((i * 53) % 5) * 0.03, Math.sin(a) * r, 0.2 + ((i * 29) % 4) * 0.02]);
    }
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      out.push([Math.cos(a) * 0.3, 1.02 + ((i * 17) % 3) * 0.03, Math.sin(a) * 0.3, 0.24]);
    }
    return out;
  }, []);

  const eyeY = 0.12, eyeX = 0.34;
  const lid = 1 - blink;
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={scale}>
      {/* torso */}
      <mesh position={[0, -1.55, 0]}><boxGeometry args={[2.3, 1.6, 1.2]} /><Flat color={SHIRT} /></mesh>
      {[-0.7, -0.35, 0, 0.35, 0.7].map((x) => (
        <mesh key={x} position={[x, -1.55, 0.61]}><boxGeometry args={[0.05, 1.5, 0.02]} /><Flat color={STRIPE} /></mesh>
      ))}
      <mesh position={[-1.4, -1.5, 0]} rotation={[0, 0, 0.12]}><boxGeometry args={[0.55, 1.5, 0.7]} /><Flat color={SHIRT} /></mesh>
      <mesh position={[1.4, -1.5, 0]} rotation={[0, 0, -0.12]}><boxGeometry args={[0.55, 1.5, 0.7]} /><Flat color={SHIRT} /></mesh>
      {/* neck */}
      <mesh position={[0, -0.78, 0]}><cylinderGeometry args={[0.42, 0.5, 0.5, 7]} /><Flat color={SKIN.shade} /></mesh>

      {/* head group */}
      <group position={[0, 0, 0]} rotation={[nod, look, tilt]}>
        {/* skull + face */}
        <mesh scale={[0.92, 1.05, 0.92]}><icosahedronGeometry args={[1, 1]} /><Flat color={SKIN.base} /></mesh>
        {/* strong jaw / cheeks */}
        <mesh position={[0, -0.42, 0.08]} scale={[0.86, 0.62, 0.84]}><icosahedronGeometry args={[1, 1]} /><Flat color={SKIN.base} /></mesh>
        {/* ears */}
        <mesh position={[-0.9, 0.02, 0]} scale={[0.16, 0.3, 0.2]}><icosahedronGeometry args={[1, 0]} /><Flat color={SKIN.shade} /></mesh>
        <mesh position={[0.9, 0.02, 0]} scale={[0.16, 0.3, 0.2]}><icosahedronGeometry args={[1, 0]} /><Flat color={SKIN.shade} /></mesh>

        {/* hair: dark cap + curls */}
        <mesh position={[0, 0.2, -0.05]} scale={[0.97, 0.98, 0.97]}>
          <sphereGeometry args={[1.0, 9, 6, 0, Math.PI * 2, 0, Math.PI * 0.46]} /><Flat color={HAIR} />
        </mesh>
        {curls.map((c, i) => (
          <mesh key={i} position={[c[0], c[1], c[2] - 0.04]}><icosahedronGeometry args={[c[3] + 0.12, 0]} /><Flat color={HAIR} /></mesh>
        ))}
        {/* short sides */}
        <mesh position={[-0.86, 0.34, -0.05]} scale={[0.14, 0.34, 0.6]}><icosahedronGeometry args={[1, 0]} /><Flat color={HAIR} /></mesh>
        <mesh position={[0.86, 0.34, -0.05]} scale={[0.14, 0.34, 0.6]}><icosahedronGeometry args={[1, 0]} /><Flat color={HAIR} /></mesh>

        {/* full beard + mustache */}
        <mesh position={[0, -0.5, 0.06]} scale={[0.9, 0.66, 0.88]}>
          <sphereGeometry args={[1.0, 9, 6, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.5]} /><Flat color={BEARD} />
        </mesh>
        <mesh position={[0, -0.9, 0.34]} scale={[0.5, 0.34, 0.45]}><icosahedronGeometry args={[1, 0]} /><Flat color={BEARD} /></mesh>
        <mesh position={[0, -0.28, 0.82]} scale={[0.42, 0.09, 0.14]}><icosahedronGeometry args={[1, 0]} /><Flat color={BEARD} /></mesh>

        {/* brows */}
        <mesh position={[-eyeX, eyeY + 0.26 + brow * 0.06, 0.82]} rotation={[0, 0, 0.12 + brow * 0.1]}><boxGeometry args={[0.36, 0.07, 0.08]} /><Flat color={HAIR} /></mesh>
        <mesh position={[eyeX, eyeY + 0.26 + brow * 0.06, 0.82]} rotation={[0, 0, -0.12 - brow * 0.1]}><boxGeometry args={[0.36, 0.07, 0.08]} /><Flat color={HAIR} /></mesh>
        {/* eyes */}
        {[-eyeX, eyeX].map((x) => cine ? (
          <group key={x} position={[x, eyeY, 0.78]}>
            <mesh scale={[1, Math.max(0.08, lid), 0.7]}><sphereGeometry args={[0.17, 12, 10]} /><meshStandardMaterial color="#fffaf0" roughness={0.3} emissive="#fffaf0" emissiveIntensity={0.18} /></mesh>
            <mesh position={[look * 0.12, -0.01, 0.1]} scale={[1, Math.max(0.08, lid), 0.6]}><sphereGeometry args={[0.095, 12, 10]} /><meshStandardMaterial color="#2a1608" roughness={0.2} /></mesh>
            {lid > 0.5 ? <mesh position={[look * 0.12 + 0.035, 0.04, 0.16]}><sphereGeometry args={[0.03, 8, 6]} /><meshBasicMaterial color="#ffffff" /></mesh> : null}
          </group>
        ) : (
          <group key={x} position={[x, eyeY, 0.8]}>
            <mesh scale={[1, Math.max(0.08, lid), 1]}><sphereGeometry args={[0.1, 8, 6]} /><meshStandardMaterial color="#fbf6ec" flatShading /></mesh>
            <mesh position={[look * 0.1, 0, 0.07]} scale={[1, Math.max(0.08, lid), 1]}><sphereGeometry args={[0.062, 7, 5]} /><meshStandardMaterial color="#1a0e08" flatShading /></mesh>
          </group>
        ))}
        {/* nose */}
        <mesh position={[0, -0.08, 0.92]} scale={[0.15, 0.24, 0.2]} rotation={[0.2, 0, 0]}><icosahedronGeometry args={[1, 0]} /><Flat color={SKIN.lit} /></mesh>
        {/* mouth */}
        <mesh position={[0, -0.5 - (cine ? mouth * 0.05 : 0), 0.84]} scale={[cine ? 1.15 - mouth * 0.15 : 1, 0.25 + mouth * (cine ? 1.9 : 1.3), 1]}><boxGeometry args={[0.3, 0.1, 0.06]} /><meshStandardMaterial color="#2a0c0a" flatShading /></mesh>
        {cine && mouth > 0.35 ? <mesh position={[0, -0.47, 0.875]}><boxGeometry args={[0.24, 0.035, 0.02]} /><meshStandardMaterial color="#f4efe6" /></mesh> : null}
      </group>
    </group>
  );
};

/** Little AI companion robot: boxy head with glowing screen eyes. */
export const Robot: React.FC<Pose & { position?: [number, number, number]; rotY?: number; scale?: number; glow?: number; cine?: boolean; nod?: number; happy?: number }> = ({
  mouth = 0, look = 0, tilt = 0, blink = 0, position = [0, 0, 0], rotY = 0, scale = 1, glow = 1, cine = false, nod = 0, happy = 0,
}) => {
  const lid = Math.max(0.1, 1 - blink) * (1 - 0.45 * happy);
  const EYE = cine ? "#ffffff" : "#fff";
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={scale}>
      <mesh position={[0, -1.35, 0]}><boxGeometry args={[1.5, 1.5, 1]} /><meshStandardMaterial color={cine ? "#aab0c4" : "#d9dde8"} flatShading roughness={cine ? 0.8 : 0.5} /></mesh>
      <mesh position={[0, -1.35, 0.51]}><boxGeometry args={[0.6, 0.6, 0.04]} /><meshStandardMaterial color="#d97757" emissive="#d97757" emissiveIntensity={0.9 * glow} flatShading /></mesh>
      <mesh position={[-1.0, -1.3, 0]} rotation={[0, 0, 0.3]}><boxGeometry args={[0.3, 1.2, 0.3]} /><meshStandardMaterial color="#c4c9d8" flatShading /></mesh>
      <mesh position={[1.0, -1.3, 0]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.3, 1.2, 0.3]} /><meshStandardMaterial color="#c4c9d8" flatShading /></mesh>
      {cine ? <>
        <mesh position={[0, -0.72, 0]}><cylinderGeometry args={[0.22, 0.3, 0.3, 8]} /><meshStandardMaterial color="#8d93a8" flatShading /></mesh>
        <mesh position={[0, -0.98, 0.3]}><boxGeometry args={[1.52, 0.16, 0.5]} /><meshStandardMaterial color="#d97757" flatShading roughness={0.6} /></mesh>
        <mesh position={[0.42, -1.25, 0.52]} rotation={[0, 0, -0.12]}><boxGeometry args={[0.2, 0.5, 0.05]} /><meshStandardMaterial color="#c9623f" flatShading roughness={0.6} /></mesh>
      </> : null}
      <group rotation={[nod, look, tilt]}>
        <mesh><boxGeometry args={[1.9, 1.5, 1.4]} /><meshStandardMaterial color={cine ? "#b9bfd2" : "#e3e6ef"} flatShading roughness={cine ? 0.8 : 0.5} /></mesh>
        {cine ? <mesh position={[0, 0.02, 0.9]}><planeGeometry args={[2.6, 2.0]} /><meshBasicMaterial color="#9cc4ff" transparent opacity={0.05 * glow} depthWrite={false} /></mesh> : null}
        <mesh position={[0, 0.02, 0.71]}><boxGeometry args={[1.6, 1.15, 0.05]} />{cine ? <meshBasicMaterial color="#0b0e1a" /> : <meshStandardMaterial color="#10131f" flatShading roughness={0.2} />}</mesh>
        {[-0.38, 0.38].map((x) => (
          <mesh key={x} position={[x, 0.18, 0.75]} scale={[1, lid, 1]}><boxGeometry args={[0.3, 0.38, 0.04]} />{cine ? <meshBasicMaterial color={EYE} toneMapped={false} /> : <meshStandardMaterial color="#fff" emissive="#cfe3ff" emissiveIntensity={1.6 * glow} />}</mesh>
        ))}
        <mesh position={[0, -0.3, 0.75]} scale={[1 + 0.5 * happy, 0.4 + mouth * 2.2, 1]}><boxGeometry args={[0.34, 0.1, 0.04]} />{cine ? <meshBasicMaterial color={EYE} toneMapped={false} /> : <meshStandardMaterial color="#fff" emissive="#cfe3ff" emissiveIntensity={1.4 * glow} />}</mesh>
        <mesh position={[0.55, 0.95, 0]}><cylinderGeometry args={[0.03, 0.03, 0.55, 5]} /><meshStandardMaterial color="#9aa0b3" /></mesh>
        <mesh position={[0.55, 1.28, 0]}><sphereGeometry args={[0.1, 6, 5]} /><meshStandardMaterial color="#ffd98a" emissive="#ffc24a" emissiveIntensity={2 * glow} /></mesh>
        <mesh position={[-1.05, 0, 0]}><boxGeometry args={[0.22, 0.6, 0.6]} /><meshStandardMaterial color="#b9bfd0" flatShading /></mesh>
        <mesh position={[1.05, 0, 0]}><boxGeometry args={[0.22, 0.6, 0.6]} /><meshStandardMaterial color="#b9bfd0" flatShading /></mesh>
      </group>
    </group>
  );
};
