import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  SpotLight,
} from "three";
import { FLOOR, LINE, PLATES } from "../layout";
import type { FrameState, SceneModule, WorldCtx } from "../types";

/**
 * The Plates (Our Work). Photographs mounted as lit plates on free-standing
 * stone fins, in a row on the polished floor to the right of the wall. A
 * brass rail along the floor links them back to the main line.
 */

// ── Lights ──────────────────────────────────────────────────────────────
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
/** Alternating vertical offset of the plates (even up, odd down). */
const STAGGER = 0.18;
/** Photograph brightness in focus, and the fraction of it left on the neighbours. */
const PHOTO_FULL = 0.92;
const PHOTO_DIM = 0.45;
/** Lamp strip level on plates out of focus (1 = full). */
const LAMP_DIM = 0.15;
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
const HAIRLINE_HEIGHT = 0.012;
const HAIRLINE_DROP = 0.18;
const LAMP_WIDTH = PLATES.w * 0.42;
const LAMP_HEIGHT = 0.022;
const LAMP_DEPTH = 0.03;
const LAMP_RISE = 0.21;

// ── Floor rail ──────────────────────────────────────────────────────────
const RAIL_RADIUS = 0.022;
const RAIL_Y = FLOOR.y + 0.18;
const RAIL_Z = 0.5;
const RAIL_OVERRUN = 2;
const TEE_RADIUS = 0.04;
const ELBOW_RADIUS = 0.03;

/** Vertical centre of plate `i`. */
export const plateY = (i: number) => PLATES.y + (i % 2 === 0 ? STAGGER : -STAGGER);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function fix<T extends Mesh>(mesh: T): T {
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  return mesh;
}

/**
 * A fin-sized box whose UVs keep the stone at one scale on every face and are
 * shifted per fin, so the veining neither stretches on the edges nor repeats
 * from fin to fin.
 */
function finGeometry(w: number, h: number, d: number, index: number): BoxGeometry {
  const geo = new BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    // Box faces come four vertices at a time: +x, -x, +y, -y, +z, -z.
    const face = Math.floor(i / 4);
    const su = face < 2 ? d / w : 1;
    const sv = face === 2 || face === 3 ? d / h : 1;
    uv.setXY(i, uv.getX(i) * su + index * 0.37, uv.getY(i) * sv + index * 0.23);
  }
  return geo;
}

interface Plate {
  photo: Mesh;
  photoMat: MeshBasicMaterial;
  lampMat: MeshBasicMaterial;
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
  const plateAspect = PLATES.w / PLATES.h;

  const photoGeo = new PlaneGeometry(PLATES.w, PLATES.h);
  const matGeo = new BoxGeometry(PLATES.w + MAT_MARGIN * 2, PLATES.h + MAT_MARGIN * 2, MAT_DEPTH);
  const hairlineGeo = new BoxGeometry(PLATES.w, HAIRLINE_HEIGHT, PHOTO_GAP);
  const lampGeo = new BoxGeometry(LAMP_WIDTH, LAMP_HEIGHT, LAMP_DEPTH);
  const lampBase = mats.lamp.color.clone();
  const lampColor = new Color();

  const plates: Plate[] = images.map((image, i) => {
    const x = PLATES.x0 + PLATES.gap * i;
    const y = plateY(i);
    const top = y + PLATES.h / 2;
    const bottom = y - PLATES.h / 2;

    // Fin: from the floor to a little above the plate, its face just behind the photograph.
    const finH = top + FIN_RISE - FLOOR.y;
    const fin = new Mesh(finGeometry(PLATES.w + FIN_MARGIN, finH, FIN_DEPTH, i), mats.stoneHoned);
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
    photo.position.set(x, y, PLATES.z);
    // The mat rides with the photograph when it lifts and turns.
    const mat = new Mesh(matGeo, mats.ivory);
    mat.position.z = -MAT_DEPTH / 2 - 0.003;
    photo.add(mat);

    const hairline = new Mesh(hairlineGeo, mats.brass);
    hairline.position.set(x, bottom - HAIRLINE_DROP - HAIRLINE_HEIGHT / 2, finFaceZ + PHOTO_GAP / 2);

    const lampMat = mats.lamp.clone();
    lampMat.color.copy(lampBase).multiplyScalar(LAMP_DIM);
    const lamp = new Mesh(lampGeo, lampMat);
    lamp.position.set(x, top + LAMP_RISE, finFaceZ + LAMP_DEPTH / 2);

    group.add(fix(fin), fix(photo), fix(hairline), fix(lamp));
    return { photo, photoMat, lampMat, weight: 0 };
  });

  // ── Floor rail: tee on the main line, a short jog forward, then along the gallery ──
  const railSegments = tier === "full" ? 16 : 10;
  const unitRod = new CylinderGeometry(1, 1, 1, railSegments);
  const unitBall = new SphereGeometry(1, railSegments, 10);
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
