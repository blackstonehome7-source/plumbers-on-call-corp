import {
  BoxGeometry,
  type BufferGeometry,
  Color,
  CylinderGeometry,
  Group,
  AdditiveBlending,
  type Material,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  SpotLight,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { FLOOR, LINE, PLATES } from "../layout";
import type { FrameState, SceneModule, WorldCtx } from "../types";
import { createWashTexture } from "../wash";

/**
 * The Plates (Our Work). Photographs hung as gallery pieces on free-standing
 * stone fins, in a row on the polished floor to the right of the wall: an
 * ivory stone mat, a brass picture light above and a blank brass plaque
 * below. A brass rail along the floor links them back to the main line.
 */

// ── Lights ──────────────────────────────────────────────────────────────
/** Glow under each picture light (additive, like the strip washes on Home). */
const GLOW_COLOR = 0xffb877;
const GLOW_FULL = 0.5;
const GLOW_HEIGHT = 3.4;
const GLOW_RISE = 0.3;
const WASH_COLOR = 0xffdcb0;
const WASH_INTENSITY = 80;
const WASH_ANGLE = 0.5;
const WASH_PENUMBRA = 0.9;
const WASH_DISTANCE = 14;
/** Spot position relative to the focused plate (x) and the world (y, z): above and in front. */
const WASH_OFFSET_X = 0.6;
const WASH_Y = PLATES.y + 3.6;
const WASH_Z = PLATES.z + 3.2;
/** The spot aims below the plate centre so the pool reaches the floor in front of the fin. */
const WASH_AIM_Y = PLATES.y - 0.6;

const DEPTH_COLOR = 0xffd2a0;
const DEPTH_INTENSITY = 10;
const DEPTH_DISTANCE = 12;
/** Relative to the last plate: far right, a little above, in front. */
const DEPTH_OFFSET = { x: 3.5, y: 1.5, z: 2.5 };

// ── Plates ──────────────────────────────────────────────────────────────
/**
 * Every plate hangs on one line, this far below PLATES.y. The whole piece
 * (picture light above, plaque below) has to sit between the site header and
 * the floor in the desktop framing, which leaves no room for a stagger.
 */
const HANG_DROP = 0.15;
const HANG_Y = PLATES.y - HANG_DROP;
/** Photograph brightness in focus, and the fraction of it left on the neighbours. */
const PHOTO_FULL = 0.92;
const PHOTO_DIM = 0.45;
/** Gap between the fin face and a resting photograph. */
const PHOTO_GAP = 0.02;
/**
 * How far the focused photograph floats off its fin. It needs
 * (w/2)·TURN_Y + (h/2)·TURN_X ≈ 0.13 of clearance to turn without cutting into the stone.
 */
const PHOTO_LIFT = 0.14;
/** Largest turn toward the pointer, in radians per unit of pointer travel. */
const TURN_Y = 0.06;
const TURN_X = 0.03;
/** Smoothing rates in 1/s: focus glide and pointer follow. */
const FOCUS_RATE = 5;
const POINTER_RATE = 5;

// ── Fins and fittings ───────────────────────────────────────────────────
const FIN_DEPTH = 0.22;
const FIN_MARGIN = 0.7;
const FIN_RISE = 0.9;
/** Ivory stone mat around each photograph: the logo's stone, as a frame. */
const MAT_MARGIN = 0.13;
const MAT_DEPTH = 0.016;
/** The gallery's back wall, behind the fins. */
const BACK_HEIGHT = 9;
const BACK_SETBACK = 0.5;
const BACK_OVERRUN = 7;

// ── Picture light and plaque ────────────────────────────────────────────
/** The bar: a slim brass tube across the top of the plate. */
const BAR_WIDTH = PLATES.w * 0.56;
const BAR_RADIUS = 0.03;
/** Bar axis above the mat's top edge. */
const BAR_RISE = 0.26;
/** Bar axis proud of the fin face: out of reach of a lifted, turned photograph (PHOTO_LIFT plus its clearance). */
const BAR_REACH = 0.32;
/** The arm's wall mount: a small plate on the fin just above the mat. `rise` is its centre above the mat. */
const MOUNT = { w: 0.2, h: 0.09, d: 0.022, rise: 0.085 } as const;
const ARM_RADIUS = 0.012;
const ARM_SEGMENTS = 8;
/** The glowing strip under the bar. It hangs below the tube so it shows from the front. */
const LAMP_WIDTH = BAR_WIDTH - 0.16;
const LAMP_HEIGHT = 0.022;
const LAMP_DEPTH = 0.03;
/** How far the strip sits up into the tube, so no gap shows where box meets cylinder. */
const LAMP_TUCK = 0.008;
/** Gold, and held under 1 so the strip glows without clipping to white. */
const LAMP_COLOR = 0xffc47a;
const LAMP_FULL = 0.95;
/** Strip level on plates out of focus, as a fraction of LAMP_FULL. */
const LAMP_DIM = 0.15;
/** Blank brass plaque centred under the mat (`drop` below it), on a darker backing that shows as a rim. */
const PLAQUE = { w: 0.46, h: 0.13, d: 0.014, drop: 0.14 } as const;
const PLAQUE_RIM = 0.02;

// ── Floor rail ──────────────────────────────────────────────────────────
const RAIL_RADIUS = 0.022;
const RAIL_Y = FLOOR.y + 0.18;
const RAIL_Z = 0.5;
const RAIL_OVERRUN = 2;
const TEE_RADIUS = 0.04;
const ELBOW_RADIUS = 0.03;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function fix<T extends Mesh>(mesh: T): T {
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  return mesh;
}

/**
 * One static mesh for every copy of a fitting, so each brass tone costs a
 * single draw call however many plates hang on the wall.
 */
function fittings(parts: BufferGeometry[], material: Material): Mesh {
  const mesh = new Mesh(mergeGeometries(parts), material);
  for (const part of parts) part.dispose();
  return fix(mesh);
}

interface Plate {
  photo: Mesh;
  photoMat: MeshBasicMaterial;
  lampMat: MeshBasicMaterial;
  /** The glow the picture light throws down the stone around the plate. */
  glowMat: MeshBasicMaterial;
  /** Focus weight applied last frame (0 = resting on the fin). */
  weight: number;
}

export function createPlates(
  ctx: WorldCtx,
  images: { src: string; aspect: number }[],
): SceneModule & { setActive(f: number): void } {
  const { mats, tier } = ctx;
  const group = new Group();
  group.name = "plates";

  const count = images.length;
  const lastX = PLATES.x0 + PLATES.gap * Math.max(0, count - 1);
  const finFaceZ = PLATES.z - PHOTO_GAP;
  const glowTex = createWashTexture();
  const glowGeo = new PlaneGeometry(PLATES.w + FIN_MARGIN, GLOW_HEIGHT);
  const plateAspect = PLATES.w / PLATES.h;
  const roundSegments = tier === "full" ? 16 : 10;

  // Every plate hangs at the same height, so each part is one shared geometry.
  const top = HANG_Y + PLATES.h / 2;
  const matTop = top + MAT_MARGIN;
  const matBottom = HANG_Y - PLATES.h / 2 - MAT_MARGIN;
  const barY = matTop + BAR_RISE;
  const barZ = finFaceZ + BAR_REACH;
  const mountY = matTop + MOUNT.rise;
  const plaqueY = matBottom - PLAQUE.drop - PLAQUE.h / 2;

  // Fin: from the floor to a little above the plate, its face just behind the photograph.
  // The stone is mapped in world space (materials.ts), so one box serves every fin.
  const finH = top + FIN_RISE - FLOOR.y;
  const finGeo = new BoxGeometry(PLATES.w + FIN_MARGIN, finH, FIN_DEPTH);
  const photoGeo = new PlaneGeometry(PLATES.w, PLATES.h);
  const matGeo = new BoxGeometry(PLATES.w + MAT_MARGIN * 2, PLATES.h + MAT_MARGIN * 2, MAT_DEPTH);
  const lampGeo = new BoxGeometry(LAMP_WIDTH, LAMP_HEIGHT, LAMP_DEPTH);
  const lampBase = new Color(LAMP_COLOR).multiplyScalar(LAMP_FULL);
  const lampColor = new Color();

  // Picture light and plaque, modelled once around x = 0 and copied to each plate below.
  const barGeo = new CylinderGeometry(BAR_RADIUS, BAR_RADIUS, BAR_WIDTH, roundSegments)
    .rotateZ(Math.PI / 2) // cylinder axis y → x
    .translate(0, barY, barZ);
  // The arm climbs from the mount on the fin, forward and up, to the back of the bar.
  const armRise = barY - mountY;
  const armRun = BAR_REACH - MOUNT.d;
  const armGeo = new CylinderGeometry(ARM_RADIUS, ARM_RADIUS, Math.hypot(armRise, armRun), ARM_SEGMENTS)
    .rotateX(Math.atan2(armRun, armRise)) // cylinder axis y → along the arm
    .translate(0, (mountY + barY) / 2, finFaceZ + MOUNT.d + armRun / 2);
  const mountGeo = new BoxGeometry(MOUNT.w, MOUNT.h, MOUNT.d).translate(0, mountY, finFaceZ + MOUNT.d / 2);
  // The plaque stays blank: no lettering is ever modelled on the world's objects.
  const plaqueGeo = new BoxGeometry(PLAQUE.w, PLAQUE.h, PLAQUE.d).translate(0, plaqueY, finFaceZ + PLAQUE.d / 2);
  const plaqueBackGeo = new BoxGeometry(PLAQUE.w + PLAQUE_RIM * 2, PLAQUE.h + PLAQUE_RIM * 2, PLAQUE.d / 2).translate(
    0,
    plaqueY,
    finFaceZ + PLAQUE.d / 4,
  );
  const fittingTemplates = [barGeo, armGeo, mountGeo, plaqueGeo, plaqueBackGeo];
  const brassParts: BufferGeometry[] = [];
  const brassDarkParts: BufferGeometry[] = [];

  const plates: Plate[] = images.map((image, i) => {
    const x = PLATES.x0 + PLATES.gap * i;

    const fin = new Mesh(finGeo, mats.stoneHoned);
    fin.position.set(x, FLOOR.y + finH / 2, finFaceZ - FIN_DEPTH / 2);

    // Photograph: cover-fit by cropping the texture, never by stretching it.
    const map = ctx.texture(image.src);
    if (image.aspect > plateAspect) {
      map.repeat.set(plateAspect / image.aspect, 1);
    } else {
      map.repeat.set(1, image.aspect / plateAspect);
    }
    map.offset.set((1 - map.repeat.x) / 2, (1 - map.repeat.y) / 2);
    const photoMat = new MeshBasicMaterial({ map, toneMapped: true });
    photoMat.color.setScalar(PHOTO_FULL * PHOTO_DIM);
    const photo = new Mesh(photoGeo, photoMat);
    photo.position.set(x, HANG_Y, PLATES.z);
    // The mat rides with the photograph when it lifts and turns.
    const mat = new Mesh(matGeo, mats.ivory);
    mat.position.z = -MAT_DEPTH / 2 - 0.003;
    photo.add(mat);

    // The strip is the one fitting that changes (it dims out of focus), so it keeps its own mesh.
    const lampMat = mats.lamp.clone();
    lampMat.color.copy(lampBase).multiplyScalar(LAMP_DIM);
    const lamp = new Mesh(lampGeo, lampMat);
    lamp.position.set(x, barY - BAR_RADIUS - LAMP_HEIGHT / 2 + LAMP_TUCK, barZ);

    brassParts.push(barGeo.clone().translate(x, 0, 0), plaqueGeo.clone().translate(x, 0, 0));
    brassDarkParts.push(
      armGeo.clone().translate(x, 0, 0),
      mountGeo.clone().translate(x, 0, 0),
      plaqueBackGeo.clone().translate(x, 0, 0),
    );

    group.add(fix(fin), fix(photo), fix(lamp));
    // The picture light's glow on the fin: a halo of lit stone around the mat.
    const glowMat = new MeshBasicMaterial({
      map: glowTex,
      color: GLOW_COLOR,
      transparent: true,
      opacity: GLOW_FULL * LAMP_DIM,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const glow = new Mesh(glowGeo, glowMat);
    glow.position.set(x, top + GLOW_RISE - GLOW_HEIGHT / 2, finFaceZ + 0.0008);
    glow.renderOrder = 1;
    group.add(fix(glow));

    return { photo, photoMat, lampMat, glowMat, weight: 0 };
  });

  if (count > 0) group.add(fittings(brassParts, mats.brass), fittings(brassDarkParts, mats.brassDark));
  for (const template of fittingTemplates) template.dispose();

  // ── Floor rail: tee on the main line, a short jog forward, then along the gallery ──
  const unitRod = new CylinderGeometry(1, 1, 1, roundSegments);
  const unitBall = new SphereGeometry(1, roundSegments, 10);
  const ball = (radius: number, z: number) => {
    const m = new Mesh(unitBall, mats.brass);
    m.scale.setScalar(radius);
    m.position.set(LINE.x, RAIL_Y, z);
    return fix(m);
  };

  const railLength = lastX + RAIL_OVERRUN - LINE.x;
  const rail = new Mesh(unitRod, mats.brass);
  rail.scale.set(RAIL_RADIUS, railLength, RAIL_RADIUS);
  rail.rotation.z = Math.PI / 2; // cylinder axis y → x
  rail.position.set(LINE.x + railLength / 2, RAIL_Y, RAIL_Z);

  const jogLength = RAIL_Z - LINE.z;
  const jog = new Mesh(unitRod, mats.brass);
  jog.scale.set(RAIL_RADIUS, jogLength, RAIL_RADIUS);
  jog.rotation.x = Math.PI / 2; // cylinder axis y → z
  jog.position.set(LINE.x, RAIL_Y, LINE.z + jogLength / 2);

  group.add(fix(rail), fix(jog), ball(TEE_RADIUS, LINE.z), ball(ELBOW_RADIUS, RAIL_Z));

  // The polished marble wall the fins stand against: lit stone behind every plate.
  const backLen = lastX - PLATES.x0 + BACK_OVERRUN * 2;
  const back = new Mesh(new BoxGeometry(backLen, BACK_HEIGHT, 0.3), mats.stone);
  back.position.set((PLATES.x0 + lastX) / 2, FLOOR.y + BACK_HEIGHT / 2, finFaceZ - FIN_DEPTH - BACK_SETBACK - 0.15);
  group.add(fix(back));

  // ── Lights ──
  const wash = new SpotLight(WASH_COLOR, 0, WASH_DISTANCE, WASH_ANGLE, WASH_PENUMBRA, 2);
  wash.position.set(PLATES.x0 + WASH_OFFSET_X, WASH_Y, WASH_Z);
  wash.target.position.set(PLATES.x0, WASH_AIM_Y, PLATES.z);
  const depth = new PointLight(DEPTH_COLOR, 0, DEPTH_DISTANCE, 2);
  depth.position.set(lastX + DEPTH_OFFSET.x, PLATES.y + DEPTH_OFFSET.y, PLATES.z + DEPTH_OFFSET.z);
  group.add(wash, wash.target, depth);

  // ── State ──
  let target = 0;
  let focus = 0;
  let turnX = 0;
  let turnY = 0;

  function update(frame: FrameState) {
    focus += (target - focus) * (1 - Math.exp(-frame.dt * FOCUS_RATE));
    const follow = 1 - Math.exp(-frame.dt * POINTER_RATE);
    turnY += (frame.pointerX * TURN_Y - turnY) * follow;
    turnX += (-frame.pointerY * TURN_X - turnX) * follow;

    for (let i = 0; i < plates.length; i++) {
      const plate = plates[i];
      const t = clamp01(1 - Math.abs(i - focus));
      const weight = t * t * (3 - 2 * t);

      plate.photoMat.color.setScalar(PHOTO_FULL * (PHOTO_DIM + (1 - PHOTO_DIM) * weight));
      plate.lampMat.color.copy(lampColor.copy(lampBase).multiplyScalar(LAMP_DIM + (1 - LAMP_DIM) * weight));
      plate.glowMat.opacity = GLOW_FULL * (LAMP_DIM + (1 - LAMP_DIM) * weight);

      // Only the plate in (or leaving) focus moves: it floats off the fin and turns toward the pointer.
      if (weight > 0 || plate.weight > 0) {
        plate.photo.rotation.set(turnX * weight, turnY * weight, 0);
        plate.photo.position.z = PLATES.z + PHOTO_LIFT * weight;
        plate.photo.updateMatrix();
      }
      plate.weight = weight;
    }

    const focusX = PLATES.x0 + PLATES.gap * focus;
    wash.position.x = focusX + WASH_OFFSET_X;
    wash.target.position.x = focusX;
    wash.intensity = WASH_INTENSITY * frame.presence;
    depth.intensity = DEPTH_INTENSITY * frame.presence;
  }

  function setActive(f: number) {
    target = Math.min(Math.max(0, count - 1), Math.max(0, f));
  }

  return { group, update, setActive };
}
