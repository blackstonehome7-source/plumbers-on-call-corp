import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  SplineCurve,
  SpotLight,
  Vector2,
} from "three";
import { PLUMB } from "../layout";
import type { FrameState, SceneModule, WorldCtx } from "../types";

/**
 * The Plumb (About). A brass plumb bob hanging dead still on a hairline cord
 * in front of the stone wall, proving one vertical and one level line
 * engraved behind it. Offsets below are relative to the resting tip of the
 * bob at (PLUMB.x, PLUMB.bobY, PLUMB.z).
 */

// ── Lights ──────────────────────────────────────────────────────────────
const SPOT_COLOR = 0xffd9a8;
const SPOT_INTENSITY = 70;
const SPOT_ANGLE = 0.2;
const SPOT_PENUMBRA = 0.8;
const SPOT_DISTANCE = 14;
/** Above-right and in front; the further forward, the closer its wall pool sits to the bob. */
const SPOT_OFFSET = { x: 1.8, y: 3.0, z: 3.4 };
/** Height above the tip the spot aims at. */
const SPOT_AIM_Y = 0.55;

const RIM_COLOR = 0xffc890;
const RIM_INTENSITY = 2;
const RIM_DISTANCE = 5;
/** Below, slightly left, between the bob and the wall. */
const RIM_OFFSET = { x: -0.45, y: -0.5, z: -0.65 };

// ── Bob and cord ────────────────────────────────────────────────────────
/** Uniform scale of the bob profile (1 → 0.74 tall, max radius 0.11). */
const BOB_SCALE = 1;
/** Height of the cap top above the tip, before BOB_SCALE. */
const CAP_TOP = 0.741;
const CORD_RADIUS = 0.004;
/** Pale ivory at ~55% so the cord reads as a hairline, not a glowing wire. */
const CORD_COLOR = 0x8e897e;

// ── Pendulum ────────────────────────────────────────────────────────────
/** Natural angular frequency in rad/s (period ≈ 3.2 s; an effective g, not the real cord length). */
const OMEGA0 = 1.95;
/** Angular damping in 1/s; the amplitude envelope is exp(-DAMPING·t/2), ~5% left after 9 s. */
const DAMPING = 0.66;
/** Hard limit of either swing angle, in radians. */
const MAX_ANGLE = 0.09;
/** Angular velocity added by nudge(1); the first swing peaks at ≈ 0.4 · NUDGE_GAIN ≈ 0.05 rad. */
const NUDGE_GAIN = 0.125;
/** Angular velocity per unit of pointer travel (a full sweep is 2 units). */
const POINTER_GAIN_X = 0.03;
const POINTER_GAIN_Z = 0.012;
/** Largest pointer step honoured in one frame (guards the jump when the scene wakes up). */
const POINTER_MAX_STEP = 0.25;
const MAX_STEP = 1 / 90;
const REST_EPS = 1e-5;

// ── Wall engraving ──────────────────────────────────────────────────────
const ENGRAVE_COLOR = 0x6f5a36;
const ENGRAVE_Z = 0.01;
const ENGRAVE_DEPTH = 0.004;
const HAIRLINE = 0.006;
/**
 * Sideways shift of the vertical line from PLUMB.x. 0 puts it exactly behind the
 * resting bob in world space; a camera standing off to one side sees the bob
 * displaced against the wall by parallax and may want this nudged to compensate.
 */
const VERTICAL_OFFSET_X = 0;
const VERTICAL_BELOW = 1.2;
const VERTICAL_ABOVE = 5;
const LEVEL_DROP = 0.55;
const LEVEL_LENGTH = 6;
const TICK_SPACING = 1.25;
const TICK_HEIGHT = 0.07;
/** The middle tick doubles as the datum where the two lines cross. */
const DATUM_WIDTH = 0.016;
const DATUM_HEIGHT = 0.12;

/** Brass part of the bob as (radius, height above the tip): body, knurled neck, cap. */
function brassProfile(): Vector2[] {
  const pts: Vector2[] = [
    // Underside lip closing the joint with the steel tip.
    new Vector2(0.018, 0.088),
    new Vector2(0.0295, 0.0845),
  ];
  // The body: a long, slightly convex cone swelling to a round shoulder.
  const body = new SplineCurve([
    new Vector2(0.03, 0.086),
    new Vector2(0.044, 0.15),
    new Vector2(0.064, 0.24),
    new Vector2(0.086, 0.335),
    new Vector2(0.103, 0.415),
    new Vector2(0.11, 0.47),
    new Vector2(0.106, 0.52),
    new Vector2(0.09, 0.56),
    new Vector2(0.064, 0.585),
    new Vector2(0.04, 0.598),
  ]);
  pts.push(...body.getPoints(36));
  // Neck with three thin rings.
  const neckR = 0.032;
  const ringR = 0.041;
  pts.push(new Vector2(neckR, 0.608));
  for (let k = 0; k < 3; k++) {
    const y = 0.618 + k * 0.025;
    pts.push(
      new Vector2(neckR, y),
      new Vector2(ringR, y + 0.003),
      new Vector2(ringR, y + 0.014),
      new Vector2(neckR, y + 0.017),
    );
  }
  // Cap where the cord enters.
  pts.push(
    new Vector2(neckR, 0.696),
    new Vector2(0.047, 0.7),
    new Vector2(0.047, 0.716),
    new Vector2(0.041, 0.728),
    new Vector2(0.016, 0.738),
    new Vector2(0.007, CAP_TOP),
    new Vector2(0, CAP_TOP),
  );
  return pts;
}

/** Steel tip, a faintly ogival point. */
function tipProfile(): Vector2[] {
  return [new Vector2(0, 0), new Vector2(0.008, 0.022), new Vector2(0.0175, 0.052), new Vector2(0.026, 0.086)];
}

export function createPlumb(ctx: WorldCtx): SceneModule & { nudge(impulse: number): void } {
  const { mats, tier } = ctx;
  const group = new Group();
  group.name = "plumb";

  const fix = <T extends Mesh>(mesh: T): T => {
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    return mesh;
  };

  // ── Bob and cord, hanging along -y from the pivot ──
  const radial = tier === "full" ? 48 : 24;
  const length = PLUMB.pivotY - PLUMB.bobY; // pivot → tip

  const pivot = new Group();
  pivot.position.set(PLUMB.x, PLUMB.pivotY, PLUMB.z);
  group.add(pivot);

  const scaled = (pts: Vector2[]) => pts.map((p) => p.multiplyScalar(BOB_SCALE));
  const body = new Mesh(new LatheGeometry(scaled(brassProfile()), radial), mats.brass);
  const tip = new Mesh(new LatheGeometry(scaled(tipProfile()), radial), mats.steel);
  body.position.y = tip.position.y = -length;
  pivot.add(fix(body), fix(tip));

  const cordLength = length - CAP_TOP * BOB_SCALE;
  const cord = new Mesh(
    new CylinderGeometry(CORD_RADIUS, CORD_RADIUS, cordLength, 5, 1, true),
    new MeshBasicMaterial({ color: CORD_COLOR }),
  );
  cord.position.y = -cordLength / 2;
  pivot.add(fix(cord));

  // ── Reference lines engraved on the wall ──
  const engraveMat = new MeshBasicMaterial({ color: ENGRAVE_COLOR });
  const unitBox = new BoxGeometry(1, 1, 1);
  const engrave = (x: number, y: number, w: number, h: number) => {
    const m = new Mesh(unitBox, engraveMat);
    m.position.set(x, y, ENGRAVE_Z);
    m.scale.set(w, h, ENGRAVE_DEPTH);
    group.add(fix(m));
  };
  const levelY = PLUMB.bobY - LEVEL_DROP;
  const verticalX = PLUMB.x + VERTICAL_OFFSET_X;
  engrave(verticalX, PLUMB.bobY + (VERTICAL_ABOVE - VERTICAL_BELOW) / 2, HAIRLINE, VERTICAL_ABOVE + VERTICAL_BELOW);
  engrave(PLUMB.x, levelY, LEVEL_LENGTH, HAIRLINE);
  for (let k = -2; k <= 2; k++) {
    if (k === 0) engrave(verticalX, levelY, DATUM_WIDTH, DATUM_HEIGHT);
    else engrave(PLUMB.x + k * TICK_SPACING, levelY, HAIRLINE, TICK_HEIGHT);
  }

  // ── Lights ──
  const spot = new SpotLight(SPOT_COLOR, 0, SPOT_DISTANCE, SPOT_ANGLE, SPOT_PENUMBRA, 2);
  spot.position.set(PLUMB.x + SPOT_OFFSET.x, PLUMB.bobY + SPOT_OFFSET.y, PLUMB.z + SPOT_OFFSET.z);
  spot.target.position.set(PLUMB.x, PLUMB.bobY + SPOT_AIM_Y, PLUMB.z);
  const rim = new PointLight(RIM_COLOR, 0, RIM_DISTANCE, 2);
  rim.position.set(PLUMB.x + RIM_OFFSET.x, PLUMB.bobY + RIM_OFFSET.y, PLUMB.z + RIM_OFFSET.z);
  group.add(spot, spot.target, rim);

  // ── Pendulum state ──
  // thetaX swings the bob along world x (rotation about z); thetaZ along world z (rotation about x).
  let thetaX = 0;
  let thetaZ = 0;
  let omegaX = 0;
  let omegaZ = 0;
  let lastPX = Number.NaN;
  let lastPY = Number.NaN;

  const k2 = OMEGA0 * OMEGA0;
  const pointerStep = (now: number, last: number) =>
    Number.isNaN(last) ? 0 : Math.min(POINTER_MAX_STEP, Math.max(-POINTER_MAX_STEP, now - last));
  /**
   * Caps a velocity so the swing it carries cannot exceed MAX_ANGLE (small-angle
   * energy bound). Repeated nudges then saturate smoothly instead of hitting the clamp.
   */
  const capped = (omega: number, theta: number) => {
    const limit = OMEGA0 * Math.sqrt(Math.max(0, MAX_ANGLE * MAX_ANGLE - theta * theta));
    return Math.min(limit, Math.max(-limit, omega));
  };

  function update(frame: FrameState) {
    spot.intensity = SPOT_INTENSITY * frame.presence;
    rim.intensity = RIM_INTENSITY * frame.presence;

    // Pointer velocity acts as a gentle torque: right pushes the bob right, up pushes it away.
    omegaX += pointerStep(frame.pointerX, lastPX) * POINTER_GAIN_X;
    omegaZ -= pointerStep(frame.pointerY, lastPY) * POINTER_GAIN_Z;
    lastPX = frame.pointerX;
    lastPY = frame.pointerY;
    omegaX = capped(omegaX, thetaX);
    omegaZ = capped(omegaZ, thetaZ);

    const steps = Math.max(1, Math.ceil(frame.dt / MAX_STEP));
    const h = frame.dt / steps;
    for (let i = 0; i < steps; i++) {
      // Semi-implicit Euler: velocity first, then position with the new velocity.
      omegaX += (-k2 * Math.sin(thetaX) - DAMPING * omegaX) * h;
      omegaZ += (-k2 * Math.sin(thetaZ) - DAMPING * omegaZ) * h;
      thetaX += omegaX * h;
      thetaZ += omegaZ * h;
      if (Math.abs(thetaX) > MAX_ANGLE) {
        thetaX = Math.sign(thetaX) * MAX_ANGLE;
        if (omegaX * thetaX > 0) omegaX = 0;
      }
      if (Math.abs(thetaZ) > MAX_ANGLE) {
        thetaZ = Math.sign(thetaZ) * MAX_ANGLE;
        if (omegaZ * thetaZ > 0) omegaZ = 0;
      }
    }

    // Come to a true rest rather than creeping forever.
    if (Math.abs(thetaX) < REST_EPS && Math.abs(omegaX) < REST_EPS) thetaX = omegaX = 0;
    if (Math.abs(thetaZ) < REST_EPS && Math.abs(omegaZ) < REST_EPS) thetaZ = omegaZ = 0;

    // The bob sits at (0, -length, 0): +rotation.z carries it toward +x, -rotation.x toward +z.
    pivot.rotation.z = thetaX;
    pivot.rotation.x = -thetaZ;
  }

  function nudge(impulse: number) {
    omegaX += impulse * NUDGE_GAIN;
  }

  return { group, update, nudge };
}
