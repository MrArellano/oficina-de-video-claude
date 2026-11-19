import { Composition } from "remotion";
import { MedVideo } from "./MedVideo";
import { VideoProps } from "./types";
import { DialogVideo, DialogProps } from "./DialogVideo";
import { CineVideo } from "./CineVideo";
import { ShowcaseVideo, ShowcaseProps } from "./ShowcaseVideo";
import { AvatarTest, AvatarClose } from "./AvatarTest";
import { VlogVideo, VlogProps } from "./VlogVideo";

const demo: VideoProps = { fps: 30, duration: 3, audio: "", scenes: [], words: [] };

export const Root = () => (
  <>
  <Composition id="DialogVideo" component={DialogVideo as any} width={1080} height={1920} fps={30} durationInFrames={90}
    defaultProps={{ fps: 30, duration: 3, audio: "", lines: [{ who: "yo", text: "demo", start: 0, end: 1, words: [], cam: "two", shotEnd: 3 }], cards: [] } as any}
    calculateMetadata={({ props }) => { const p = props as unknown as DialogProps; return { durationInFrames: Math.max(1, Math.ceil(p.duration * p.fps)), fps: p.fps }; }} />
  <Composition id="CineVideo" component={CineVideo as any} width={1080} height={1920} fps={30} durationInFrames={90}
    defaultProps={{ fps: 30, duration: 3, audio: "", lines: [{ who: "yo", text: "demo", start: 0, end: 1, words: [], cam: "two", shotEnd: 3 }], cards: [] } as any}
    calculateMetadata={({ props }) => { const p = props as unknown as DialogProps; return { durationInFrames: Math.max(1, Math.ceil(p.duration * p.fps)), fps: p.fps }; }} />
  <Composition id="ShowcaseVideo" component={ShowcaseVideo as any} width={1080} height={1920} fps={30} durationInFrames={90}
    defaultProps={{ fps: 30, duration: 3, audio: "", scenes: [] } as any}
    calculateMetadata={({ props }) => { const p = props as unknown as ShowcaseProps; return { durationInFrames: Math.max(1, Math.ceil(p.duration * p.fps)), fps: p.fps }; }} />
  <Composition id="VlogVideo" component={VlogVideo as any} width={1080} height={1920} fps={30} durationInFrames={90}
    defaultProps={{ fps: 30, duration: 3, tomas: [], trans: [], subs: [], titulos: [], emojis: [], sfx: [] } as any}
    calculateMetadata={({ props }) => { const p = props as unknown as VlogProps; return { durationInFrames: Math.max(1, Math.ceil(p.duration * p.fps)), fps: p.fps }; }} />
  <Composition id="AvatarClose" component={AvatarClose} width={1080} height={1920} fps={30} durationInFrames={30} />
  <Composition id="AvatarTest" component={AvatarTest} width={1080} height={1920} fps={30} durationInFrames={30} />
  <Composition
    id="MedVideo"
    component={MedVideo as any}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={90}
    defaultProps={demo as any}
    calculateMetadata={({ props }) => {
      const p = props as unknown as VideoProps;
      return { durationInFrames: Math.max(1, Math.ceil(p.duration * p.fps)), fps: p.fps };
    }}
  />
  </>
);
