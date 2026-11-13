import {
  ACESFilmicToneMapping,
  EquirectangularReflectionMapping,
  Fog,
  HalfFloatType,
  MathUtils,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { PLATES, PLUMB, SECTION, SECTION_ROOMS, SIGN, VALVE } from "./layout";
import { applyBaked, exportBakeable } from "./baked";
import { createMaterials } from "./materials";
import { createName } from "./scenes/name";
import { createPlates } from "./scenes/plates";
import { createPlumb } from "./scenes/plumb";
import { createSection } from "./scenes/section";
import { createValve } from "./scenes/valve";
import type { FrameState, Tier, WorldCtx } from "./types";

/* Tunables */
const BASE_FOV = 32;
const TALL_FOV = 40;
const ENV_INTENSITY = 0.42;
const EXPOSURE = 1.05;
const BACKGROUND = 0x040404;
const BLOOM = { strength: 0.32, radius: 0.7, threshold: 0.92 };
const GRAIN = 0.035;

/** A whisper of film grain, added after tone mapping so it stays even in shadows and highlights. */
const GrainShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uAmount: { value: GRAIN } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: [
    "uniform sampler2D tDiffuse; uniform float uTime; uniform float uAmount; varying vec2 vUv;",
    "float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime * 43.37) * 43758.5453); }",
    "void main(){ vec4 c = texture2D(tDiffuse, vUv); float n = hash(gl_FragCoord.xy) - 0.5; gl_FragColor = vec4(c.rgb + n * uAmount, c.a); }",
  ].join(" "),
};
const INTRO_SECONDS = 3.6;
const INTRO_REVEAL_AT = 2.5;

/** Where the camera looks in each room on a service page: the fixture, measured from the room's floor. */
const ROOM_FOCUS: ({ x: number; y: number; z: number } | null)[] = [
  { x: 2.9, y: 0.75, z: -1.6 }, // bathroom: the tub
  { x: -2.4, y: 1.0, z: -2.6 }, // home: the kitchen run
  null, // commercial: the whole row
  { x: -3.4, y: 1.55, z: -3.2 }, // heating: boiler and manifold
  { x: -3.0, y: 1.15, z: -3.0 }, // water heaters: the tank
  { x: -1.9, y: 1.05, z: 0.4 }, // emergency: the main shut-off
];

type Station = "home" | "section" | "room" | "plates" | "plumb" | "valve" | "quiet";
type Route = { station: Station; index: number };
type Pose = { p: Vector3; t: Vector3; fov: number };

export type World = {
  /** Move to the place for this pathname. `instant` cuts instead of travelling. */
  setRoute(pathname: string, instant?: boolean): void;
  startIntro(onReveal: () => void, onDone: () => void): void;
  skipIntro(): void;
  /** Page-driven signals: "valve" (0..1 open) and "plumb" (impulse). */
  signal(name: "valve" | "plumb", value: number): void;
  /** Renders one frame and returns it as an image (used to make static stills). */
  capture(type?: string, quality?: number): Promise<Blob | null>;
  dispose(): void;
};

export function routeFor(pathname: string): Route {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return { station: "home", index: 0 };
  if (path === "/services") return { station: "section", index: 0 };
  if (path.startsWith("/services/")) {
    const i = (SECTION_ROOMS as readonly string[]).indexOf(path.slice("/services/".length));
    return i >= 0 ? { station: "room", index: i } : { station: "section", index: 0 };
  }
  if (path === "/work" || path.startsWith("/work/")) return { station: "plates", index: 0 };
  if (path === "/about") return { station: "plumb", index: 0 };
  if (path === "/contact") return { station: "valve", index: 0 };
  return { station: "quiet", index: 0 };
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (a: number, b: number, v: number) => {
  const t = MathUtils.clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function createWorld(
  canvas: HTMLCanvasElement,
  opts: { tier: Tier; plates: { src: string; aspect: number }[]; onFirstFrame?: () => void },
): World {
  const { tier } = opts;
  const renderer = new WebGLRenderer({ canvas, antialias: tier === "full", alpha: false, powerPreference: "high-performance" });
  renderer.setClearColor(BACKGROUND);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = EXPOSURE;
  renderer.outputColorSpace = SRGBColorSpace;
  const maxDpr = tier === "full" ? 1.75 : 1.25;

  const scene = new Scene();
  scene.fog = new Fog(BACKGROUND, 12, 46);
  const pmrem = new PMREMGenerator(renderer);
  const envScene = new RoomEnvironment();
  scene.environment = pmrem.fromScene(envScene, 0.04).texture;
  scene.environmentIntensity = ENV_INTENSITY;
  pmrem.dispose();
  // A photographed studio (Poly Haven, CC0) gives the brass real softbox reflections.
  new RGBELoader().load("/world/env/studio.hdr", (hdr) => {
    hdr.mapping = EquirectangularReflectionMapping;
    const gen = new PMREMGenerator(renderer);
    scene.environment = gen.fromEquirectangular(hdr).texture;
    gen.dispose();
    hdr.dispose();
  });

  const camera = new PerspectiveCamera(BASE_FOV, 1, 0.1, 120);

  const loader = new TextureLoader();
  const texture = (url: string) => {
    const t = loader.load(url);
    t.colorSpace = SRGBColorSpace;
    return t;
  };
  // Data maps (normals, roughness) keep their raw values: no colour-space conversion.
  const dataTexture = (url: string) => loader.load(url);
  const ctx: WorldCtx = {
    tier,
    mats: createMaterials(
      texture("/brand/stone-calcite.webp"),
      dataTexture("/world/tex/wall-normal.webp"),
      dataTexture("/world/tex/wall-rough.webp"),
    ),
    texture,
  };

  // Post-processing on capable devices: bloom on the brightest light, then grain.
  let composer: EffectComposer | null = null;
  let grain: ShaderPass | null = null;
  if (tier === "full") {
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new Vector2(1, 1), BLOOM.strength, BLOOM.radius, BLOOM.threshold));
    composer.addPass(new OutputPass());
    grain = new ShaderPass(GrainShader);
    composer.addPass(grain);
  }

  const name = createName(ctx);
  const section = createSection(ctx);
  const plates = createPlates(ctx, opts.plates);
  const plumb = createPlumb(ctx);
  const valve = createValve(ctx);
  scene.add(name.group, section.group, plates.group, plumb.group, valve.group);
  name.group.name = "name";
  section.group.name = "section";
  plates.group.name = "plates";
  plumb.group.name = "plumb";
  valve.group.name = "valve";
  if (process.env.NODE_ENV !== "production") {
    // Development aid for inspecting the scene from the browser console.
    (window as unknown as { __world?: unknown }).__world = {
      scene,
      camera,
      renderer,
      /** Advance n frames by hand (the loop pauses while the tab is hidden). */
      tick: (n = 1, dt = 1 / 60) => {
        for (let i = 0; i < n; i++) step(dt);
      },
      /** The static part of a scene as a .glb for scripts/bake-world.py. */
      exportBakeable: () => exportBakeable(section.group),
    };
  }

  // Swap in the Blender-baked geometry where it exists (bevels, soft contact shadows).
  if (!/[?&]baked=off(&|$)/.test(location.search)) {
    // Only the building: large flat walls look cleaner built in code than baked.
    void applyBaked(section.group, "/world/baked/section.glb");
  }

  /* ---------- Input ---------- */
  let W = 1;
  let H = 1;
  let rawX = 0;
  let rawY = 0;
  let pointerX = 0;
  let pointerY = 0;
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    rawX = (e.clientX / window.innerWidth) * 2 - 1;
    rawY = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  /* ---------- DOM anchors ---------- */
  let signAnchor: { cx: number; cy: number; w: number } | null = null;
  let steps: { i: number; c: number }[] = [];
  function measure() {
    const y = window.scrollY;
    const el = document.querySelector<HTMLElement>('[data-world-anchor="sign"]');
    if (el) {
      const r = el.getBoundingClientRect();
      signAnchor = r.width > 0 ? { cx: r.left + r.width / 2, cy: r.top + y + r.height / 2, w: r.width } : null;
    } else signAnchor = null;
    steps = Array.from(document.querySelectorAll<HTMLElement>("[data-world-step]"), (s) => {
      const r = s.getBoundingClientRect();
      return { i: Number(s.dataset.worldStep), c: r.top + y + r.height / 2 };
    });
  }
  /** Which step (float) is at the centre of the viewport. */
  function stepFocus(lead: number): number {
    if (steps.length === 0) return 0;
    const c = window.scrollY + H / 2;
    const first = steps[0];
    if (c <= first.c) return first.i - lead * MathUtils.clamp((first.c - c) / H, 0, 1);
    for (let k = 0; k < steps.length - 1; k++) {
      const a = steps[k];
      const b = steps[k + 1];
      if (c <= b.c) return MathUtils.lerp(a.i, b.i, smooth(a.c, b.c, c));
    }
    return steps[steps.length - 1].i;
  }

  /* ---------- Poses ---------- */
  let route: Route = { station: "home", index: 0 };
  const tanHalf = (fov: number) => Math.tan(MathUtils.degToRad(fov / 2));

  function desired(r: Route, out: Pose) {
    const aspect = W / H;
    const tall = aspect < 1;
    const s = window.scrollY;
    out.fov = tall ? TALL_FOV : BASE_FOV;
    switch (r.station) {
      case "home": {
        // Lock the 3D logo to its DOM placeholder so layout drives composition.
        const a = signAnchor ?? { cx: W / 2, cy: H * 0.36, w: Math.min(W * 0.62, 900) };
        let fov = BASE_FOV;
        let d = (SIGN.width * H) / (2 * tanHalf(fov) * a.w);
        if (d > 15) {
          d = 15;
          fov = Math.min(64, MathUtils.radToDeg(2 * Math.atan((SIGN.width * H) / (2 * d * a.w))));
        }
        const ppu = H / (2 * tanHalf(fov) * d);
        // The logo scrolls away with the page; after that the camera keeps sinking down
        // the line, past the building, and drifts toward it, so the world stays in view
        // (softly, behind the content) for the whole length of the page.
        const past = Math.max(0, s - H);
        const follow = Math.min(s, H) + 0.42 * past;
        const tx = SIGN.x - (a.cx - W / 2) / ppu + 3.4 * smooth(0, H * 1.5, past);
        const ty = SIGN.y - (H / 2 - a.cy + follow) / ppu;
        out.fov = fov;
        out.t.set(tx, ty, 0);
        out.p.set(tx, ty, d + SIGN.slabD);
        break;
      }
      case "section": {
        const f = MathUtils.clamp(stepFocus(0.75), -0.8, SECTION.count - 1);
        const cy = SECTION.top - SECTION.floorH * (f + 0.5);
        if (tall) {
          out.t.set(0.2, cy - 0.2, 0);
          out.p.set(1.2, cy + 0.6, 23);
        } else {
          // Far enough back that the whole width of the building fits right of the words.
          const d = MathUtils.clamp(8.2 / (tanHalf(BASE_FOV) * aspect), 12, 24);
          out.t.set(-2.5, cy, 0);
          out.p.set(0.7, cy + 0.85, d);
        }
        break;
      }
      case "room": {
        const cy = SECTION.top - SECTION.floorH * (r.index + 0.5) - s * 0.0012;
        if (tall) {
          out.t.set(0.2, cy - 0.3, 0);
          out.p.set(0.9, cy + 0.3, 13.5);
        } else {
          // A close look at the room's main fixture, set right of the words.
          const focus = ROOM_FOCUS[r.index];
          if (focus) {
            const d = 6.6;
            const half = tanHalf(BASE_FOV) * d * aspect;
            const fy = SECTION.top - SECTION.floorH * (r.index + 1) + focus.y - s * 0.0012;
            out.t.set(focus.x - half * 0.34, fy, focus.z);
            out.p.set(focus.x - half * 0.34 + 1.3, fy + 0.45, focus.z + d);
          } else {
            out.t.set(-0.5, cy, 0);
            out.p.set(1.2, cy + 0.55, 10.6);
          }
        }
        break;
      }
      case "plates": {
        const f = stepFocus(0.5);
        const x = PLATES.x0 + PLATES.gap * f;
        if (tall) {
          out.t.set(x, -0.35, 0);
          out.p.set(x - 0.5, 0.15, 12.5);
        } else {
          out.t.set(x - 1.5, 0.2, 0);
          out.p.set(x - 2.9, 0.7, 8.8);
        }
        break;
      }
      case "plumb": {
        const drift = s * 0.0011;
        if (tall) {
          out.t.set(PLUMB.x, PLUMB.bobY + 1.15 - drift, 0);
          out.p.set(PLUMB.x + 0.35, PLUMB.bobY + 1.3 - drift, 8.2);
        } else {
          // Words on the left, the bob right of centre, the line at the frame's right edge.
          out.t.set(PLUMB.x - 0.95, PLUMB.bobY + 0.8 - drift, 0);
          out.p.set(PLUMB.x - 0.55, PLUMB.bobY + 1.0 - drift, 6.4);
        }
        break;
      }
      case "valve": {
        const drift = s * 0.0009;
        if (tall) {
          out.t.set(VALVE.x + 0.5, 0.5 - drift, 0);
          out.p.set(VALVE.x + 0.9, 0.7 - drift, 12.5);
        } else {
          out.t.set(VALVE.x - 1.7, 0.25 - drift, 0);
          out.p.set(VALVE.x - 0.5, 0.55 - drift, 9.2);
        }
        break;
      }
      default: {
        const drift = s * 0.0009;
        out.t.set(-3.6, 6.4 - drift, 0);
        out.p.set(-3.1, 6.6 - drift, tall ? 14 : 10);
      }
    }
  }

  const mkPose = (): Pose => ({ p: new Vector3(), t: new Vector3(), fov: BASE_FOV });
  const want = mkPose();
  const from = mkPose();
  const now = mkPose(); // pose before pointer parallax
  const shown = mkPose(); // smoothed pose actually applied
  let travel = { active: false, t: 0, dur: 1.6, arc: 0 };
  let snap = true;

  function setRoute(pathname: string, instant = false) {
    const next = routeFor(pathname);
    if (next.station === route.station && next.index === route.index) {
      measure();
      return;
    }
    from.p.copy(now.p);
    from.t.copy(now.t);
    from.fov = now.fov;
    route = next;
    measure();
    if (instant) {
      travel.active = false;
      snap = true;
      return;
    }
    desired(route, want);
    const dist = from.t.distanceTo(want.t);
    travel = { active: true, t: 0, dur: MathUtils.clamp(0.9 + dist * 0.06, 1.1, 2.1), arc: Math.min(4.5, dist * 0.22) };
    if (route.station === "plumb") plumb.nudge(0.9);
  }

  /* ---------- Intro ---------- */
  const intro = { playing: false, t: 0, revealed: false, onReveal: () => {}, onDone: () => {} };
  function finishIntro() {
    if (!intro.playing) return;
    intro.playing = false;
    name.setIntro(null);
    if (!intro.revealed) {
      intro.revealed = true;
      intro.onReveal();
    }
    intro.onDone();
  }

  /* ---------- Scene presence ----------
     How close the camera's subject is to each place (1 = there, 0 = far away).
     Places that are long (the building, the gallery) measure to their nearest point. */
  const probe = new Vector3();
  const near = (x: number, y: number, range: number) => {
    probe.set(x, y, 0);
    return 1 - smooth(range * 0.5, range, shown.t.distanceTo(probe));
  };
  const sectionBottom = SECTION.top - SECTION.floorH * SECTION.count;
  const platesEnd = PLATES.x0 + PLATES.gap * Math.max(0, opts.plates.length - 1);
  const presenceOf = {
    name: () => near(SIGN.x, SIGN.y, 16),
    section: () => near(0, MathUtils.clamp(shown.t.y, sectionBottom, SECTION.top), 13),
    plates: () => near(MathUtils.clamp(shown.t.x, PLATES.x0, platesEnd), 0, 13),
    plumb: () => near(PLUMB.x, PLUMB.bobY, 9),
    valve: () => near(VALVE.x, 0, 11),
  };

  /* ---------- Loop ---------- */
  let raf = 0;
  let last = performance.now();
  let time = 0;
  let frames = 0;
  let lastScroll = window.scrollY;
  let valveTarget = 0;
  const frame: FrameState = { time: 0, dt: 0, pointerX: 0, pointerY: 0, presence: 1 };

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    if (w === W && h === H) return;
    W = w;
    H = h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.setSize(w, h, false);
    composer?.setPixelRatio(renderer.getPixelRatio());
    composer?.setSize(w, h);
    camera.aspect = w / h;
    measure();
  }

  function step(dt: number) {
    time += dt;
    resize();
    if (frames % 40 === 0) measure();

    pointerX += (rawX - pointerX) * Math.min(1, dt * 4);
    pointerY += (rawY - pointerY) * Math.min(1, dt * 4);

    desired(route, want);
    if (travel.active) {
      travel.t = Math.min(1, travel.t + dt / travel.dur);
      const e = ease(travel.t);
      now.p.lerpVectors(from.p, want.p, e);
      now.t.lerpVectors(from.t, want.t, e);
      now.fov = MathUtils.lerp(from.fov, want.fov, e);
      now.p.z += Math.sin(Math.PI * e) * travel.arc; // pull back mid-journey
      if (travel.t >= 1) travel.active = false;
    } else {
      now.p.copy(want.p);
      now.t.copy(want.t);
      now.fov = want.fov;
    }

    if (intro.playing) {
      intro.t += dt;
      name.setIntro(intro.t);
      // Start a little closer and settle back as the name opens up.
      const k = MathUtils.lerp(0.88, 1, smooth(0, INTRO_SECONDS, intro.t));
      now.p.z = now.t.z + (now.p.z - now.t.z) * k;
      if (!intro.revealed && intro.t >= INTRO_REVEAL_AT) {
        intro.revealed = true;
        intro.onReveal();
      }
      if (intro.t >= INTRO_SECONDS) finishIntro();
    }

    const k = snap ? 1 : Math.min(1, dt * 11);
    shown.p.lerp(now.p, k);
    shown.t.lerp(now.t, k);
    shown.fov += (now.fov - shown.fov) * k;
    snap = false;

    const parallax = tier === "full" ? 1 : 0;
    camera.position.set(shown.p.x + pointerX * 0.24 * parallax, shown.p.y - pointerY * 0.12 * parallax, shown.p.z);
    camera.fov = shown.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(shown.t.x + pointerX * 0.05 * parallax, shown.t.y, shown.t.z);

    const dist = shown.p.distanceTo(shown.t);
    const fog = scene.fog as Fog;
    fog.near = dist * 0.7 + 5;
    fog.far = dist + 34;

    const level = name.level();
    scene.environmentIntensity = ENV_INTENSITY * (0.08 + 0.92 * level);

    frame.time = time;
    frame.dt = dt;
    frame.pointerX = pointerX * parallax;
    frame.pointerY = pointerY * parallax;

    frame.presence = presenceOf.name();
    name.update(frame);

    // On Home the camera sinks past the building: light whichever room it is level with.
    const storey = (SECTION.top - shown.t.y) / SECTION.floorH - 0.5;
    const passing = storey > -0.9 ? MathUtils.clamp(storey, 0, SECTION.count - 1) : -1;
    section.setActive(
      route.station === "section" ? stepFocus(0.75) : route.station === "room" ? route.index : route.station === "home" ? passing : -1,
    );
    frame.presence = presenceOf.section() * level;
    section.group.visible = frame.presence > 0.001;
    if (section.group.visible) section.update(frame);

    plates.setActive(route.station === "plates" ? stepFocus(0.5) : 0);
    frame.presence = presenceOf.plates() * level;
    plates.group.visible = frame.presence > 0.001;
    if (plates.group.visible) plates.update(frame);

    const sy = window.scrollY;
    if (route.station === "plumb" && Math.abs(sy - lastScroll) > 0) plumb.nudge(MathUtils.clamp((sy - lastScroll) * 0.0035, -0.25, 0.25));
    lastScroll = sy;
    frame.presence = presenceOf.plumb() * level;
    plumb.update(frame);

    valve.setOpen(route.station === "valve" ? valveTarget : 0);
    frame.presence = presenceOf.valve() * level;
    valve.update(frame);

    if (composer) {
      if (grain) grain.uniforms.uTime.value = time % 10;
      composer.render(dt);
    } else {
      renderer.render(scene, camera);
    }
    if (frames === 1) opts.onFirstFrame?.();
    frames++;
  }

  function loop(t: number) {
    raf = requestAnimationFrame(loop);
    if (document.hidden) {
      last = t;
      return;
    }
    const dt = Math.min(0.05, Math.max(0.001, (t - last) / 1000));
    last = t;
    step(dt);
  }
  resize();
  raf = requestAnimationFrame(loop);

  return {
    setRoute,
    startIntro(onReveal, onDone) {
      intro.playing = true;
      intro.t = 0;
      intro.revealed = false;
      intro.onReveal = onReveal;
      intro.onDone = onDone;
      name.setIntro(0);
      snap = true;
    },
    skipIntro: finishIntro,
    signal(sig, value) {
      if (sig === "valve") valveTarget = value;
      else plumb.nudge(value);
    },
    capture(type = "image/webp", quality = 0.86) {
      step(0.001);
      return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      renderer.dispose();
    },
  };
}
