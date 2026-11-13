import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  SpotLight,
  SRGBColorSpace,
} from "three";
import { FLOOR, LINE, MONO, SIGN, VALVE, WALL } from "../layout";
import type { FrameState, SceneModule, WorldCtx } from "../types";

/* Tunables */
const KEY_INTENSITY = 150; // raking spot on the slab
const KEY_ANGLE = 0.62;
const POINTER_INTENSITY = 3.2; // small light that follows the pointer
const UPPER_INTENSITY = 46; // wash on the wall above (About / quiet pages)
const FILL_INTENSITY = 0.75;
const BEAD_SPEED = 2.4; // units per second down the line

const smooth = (a: number, b: number, v: number) => {
  const t = MathUtils.clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * "The Name" — the shared architecture of the upper world: the stone wall,
 * the polished floor, the brass line, and the official logo on its ivory slab.
 * It also owns the intro lighting (a narrow beam that finds P, o and C).
 */
export function createName(ctx: WorldCtx): SceneModule & {
  /** Seconds into the intro, or null when not playing. */
  setIntro(seconds: number | null): void;
  /** 0..1 global light level used by other scenes during the intro. */
  level(): number;
} {
  const { mats } = ctx;
  const group = new Group();
  const fixed = (m: Object3D) => {
    m.matrixAutoUpdate = false;
    m.updateMatrix();
    return m;
  };

  /* ---- Wall (three pieces, leaving the Contact slot open) ---- */
  const wallH = WALL.top - WALL.bottom;
  const slotL = VALVE.x - VALVE.slotW / 2;
  const slotR = VALVE.x + VALVE.slotW / 2;
  const wallPiece = (x0: number, x1: number, y0: number, y1: number) => {
    const m = new Mesh(new BoxGeometry(x1 - x0, y1 - y0, WALL.depth), mats.stone);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, -WALL.depth / 2);
    group.add(fixed(m));
  };
  wallPiece(WALL.left, slotL, WALL.bottom, WALL.top);
  wallPiece(slotR, WALL.right, WALL.bottom, WALL.top);
  wallPiece(slotL, slotR, FLOOR.y + VALVE.slotH, WALL.top);
  void wallH;

  /* ---- Floor: dark, polished, slightly see-through so mirrored copies read as reflections ---- */
  const floorMat = new MeshStandardMaterial({
    color: 0x0a0a09,
    roughness: 0.34,
    metalness: 0,
    transparent: true,
    opacity: 0.9,
    envMapIntensity: 0.1,
  });
  const floor = new Mesh(new PlaneGeometry(FLOOR.right - FLOOR.left, FLOOR.front - FLOOR.back), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((FLOOR.left + FLOOR.right) / 2, FLOOR.y, (FLOOR.front + FLOOR.back) / 2);
  floor.renderOrder = 2;
  group.add(fixed(floor));

  /* ---- The slab and the logo ---- */
  const slabTex = ctx.texture("/brand/stone-calcite.webp");
  const slabMat = new MeshStandardMaterial({ color: 0xf3eadd, map: slabTex, roughness: 0.52, metalness: 0, envMapIntensity: 0.3 });
  slabMat.name = "signSlab";
  const slabGeo = new BoxGeometry(SIGN.slabW, SIGN.slabH, SIGN.slabD);
  const slab = new Mesh(slabGeo, slabMat);
  slab.position.set(SIGN.x, SIGN.y, SIGN.slabD / 2);
  group.add(fixed(slab));

  // A hairline of brass under the slab: the shadow gap of a mounted stone.
  const shelf = new Mesh(new BoxGeometry(SIGN.slabW, 0.018, SIGN.slabD + 0.03), mats.brass);
  shelf.position.set(SIGN.x, SIGN.y - SIGN.slabH / 2 - 0.009, (SIGN.slabD + 0.03) / 2);
  group.add(fixed(shelf));

  const logoTex = ctx.texture("/brand/logo.webp");
  logoTex.colorSpace = SRGBColorSpace;
  logoTex.anisotropy = 8;
  const logoMat = new MeshStandardMaterial({
    map: logoTex,
    transparent: true,
    roughness: 0.36,
    metalness: 0.12,
    envMapIntensity: 0.5,
    depthWrite: false,
  });
  const logoGeo = new PlaneGeometry(SIGN.width, SIGN.width * SIGN.aspect);
  const logo = new Mesh(logoGeo, logoMat);
  logo.position.set(SIGN.x, SIGN.y, SIGN.slabD + 0.004);
  logo.renderOrder = 1;
  group.add(fixed(logo));

  /* ---- The line ---- */
  const lineLen = LINE.top - LINE.bottom;
  const lineGeo = new CylinderGeometry(LINE.radius, LINE.radius, lineLen, 14, 1, true);
  lineGeo.translate(0, -lineLen / 2, 0); // origin at the top so it can "drop"
  const line = new Mesh(lineGeo, mats.brass);
  line.position.set(LINE.x, LINE.top, LINE.z);
  group.add(line);

  // Collar where the line meets the floor.
  const collar = new Mesh(new CylinderGeometry(0.06, 0.06, 0.05, 18), mats.brass);
  collar.position.set(LINE.x, FLOOR.y + 0.025, LINE.z);
  group.add(fixed(collar));

  // Beads of light travelling down the line: water on its way.
  const beadMat = new MeshBasicMaterial({ color: 0xffe2a8, transparent: true, opacity: 0.9 });
  const beadGeo = new SphereGeometry(0.034, 10, 8);
  const beads = Array.from({ length: ctx.tier === "full" ? 4 : 2 }, (_, i) => {
    const b = new Mesh(beadGeo, beadMat);
    b.position.set(LINE.x, 0, LINE.z);
    b.userData.offset = i * 11;
    group.add(b);
    return b;
  });

  /* ---- Lights ---- */
  const fill = new HemisphereLight(0x4a443c, 0x000000, FILL_INTENSITY);
  group.add(fill);

  const key = new SpotLight(0xffe6c4, KEY_INTENSITY, 26, KEY_ANGLE, 0.85, 2);
  const keyHome = { x: SIGN.x - 3.4, y: SIGN.y + 5.4, z: 6.2 };
  key.position.set(keyHome.x, keyHome.y, keyHome.z);
  key.target.position.set(SIGN.x, SIGN.y - 0.15, 0);
  group.add(key, key.target);

  const pointer = new PointLight(0xffd8a0, POINTER_INTENSITY, 7, 2);
  pointer.position.set(SIGN.x, SIGN.y, 1.7);
  group.add(pointer);

  const upper = new SpotLight(0xffe2bd, UPPER_INTENSITY, 30, 0.7, 1, 2);
  upper.position.set(-1.5, 15.5, 8.5);
  upper.target.position.set(-3.2, 8.6, 0);
  group.add(upper, upper.target);

  /* ---- Intro ---- */
  let introT: number | null = null;
  let lightLevel = 1;
  const letterX = (u: number) => SIGN.x + (u - 0.5) * SIGN.width;
  const letterY = SIGN.y + (0.5 - MONO.v) * SIGN.width * SIGN.aspect + 0.12;
  const stops = [
    { t: 0.25, x: letterX(MONO.p) },
    { t: 0.95, x: letterX(MONO.p) },
    { t: 1.3, x: letterX(MONO.o) },
    { t: 1.6, x: letterX(MONO.o) },
    { t: 1.9, x: letterX(MONO.c) },
    { t: 2.25, x: letterX(MONO.c) },
    { t: 3.3, x: SIGN.x },
  ];

  function applyIntro(t: number) {
    // Beam position: hold on P, glide to o, glide to C, then open onto the whole name.
    let x = stops[0].x;
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (t >= a.t) x = MathUtils.lerp(a.x, b.x, smooth(a.t, b.t, t));
    }
    const open = smooth(2.2, 3.4, t);
    key.target.position.set(x, MathUtils.lerp(letterY, SIGN.y - 0.15, open), 0);
    key.angle = MathUtils.lerp(0.062, KEY_ANGLE, open);
    key.penumbra = MathUtils.lerp(0.55, 0.85, open);
    key.intensity = KEY_INTENSITY * smooth(0.15, 0.7, t) * MathUtils.lerp(1.5, 1, open);
    lightLevel = smooth(2.3, 3.5, t);
    // The line drops into the floor.
    line.scale.y = Math.max(0.0001, smooth(1.0, 2.6, t));
  }

  function setIntro(seconds: number | null) {
    introT = seconds;
    if (seconds === null) {
      key.target.position.set(SIGN.x, SIGN.y - 0.15, 0);
      key.angle = KEY_ANGLE;
      key.penumbra = 0.85;
      key.intensity = KEY_INTENSITY;
      line.scale.y = 1;
      lightLevel = 1;
    } else {
      applyIntro(seconds);
    }
  }

  let px = 0;
  let py = 0;
  function update(frame: FrameState) {
    const { time, dt, presence } = frame;
    // Pointer light glides across the slab; drifts slowly on its own when idle.
    const idleX = Math.sin(time * 0.23) * 0.55;
    const tx = Math.abs(frame.pointerX) + Math.abs(frame.pointerY) > 0.002 ? frame.pointerX : idleX;
    px += (tx - px) * Math.min(1, dt * 3);
    py += (frame.pointerY - py) * Math.min(1, dt * 3);
    pointer.position.set(SIGN.x + px * 3.4, SIGN.y - py * 0.9, 1.5);
    pointer.intensity = POINTER_INTENSITY * lightLevel * presence;

    if (introT === null) key.intensity = KEY_INTENSITY * presence;
    fill.intensity = FILL_INTENSITY * lightLevel;
    upper.intensity = UPPER_INTENSITY * lightLevel;

    const top = 14;
    const span = top - (LINE.bottom + 2);
    for (const b of beads) {
      const y = top - ((time * BEAD_SPEED + b.userData.offset) % span);
      b.position.y = y;
      b.visible = lightLevel > 0.6 && line.scale.y >= 1;
    }
    beadMat.opacity = 0.85 * lightLevel;
  }

  return { group, update, setIntro, level: () => lightLevel };
}
