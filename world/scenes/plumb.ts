import {
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  Shape,
  SphereGeometry,
  SplineCurve,
  SpotLight,
  Vector2,
  type Material,
} from "three";
import { PLUMB } from "../layout";
import type { FrameState, SceneModule, WorldCtx } from "../types";

/**
 * The Plumb (About). Three instruments on one vertical datum engraved in the
 * stone wall, one per word of the headline and one per scene of the page:
 *
 *   Plumb: a brass bob hanging dead still on a hairline cord;
 *   Level: a turned brass spirit level, its bubble at rest between the marks;
 *   True:  a try square seated in the corner of two brass inlays.
 *
 * The camera drops PLUMB.sceneDrop per scene, so instrument k is centred near
 * sceneY(k). Everything is placed from the resting tip of the bob at
 * (PLUMB.x, PLUMB.bobY, PLUMB.z) and from the datum at x = PLUMB.x.
 *
 * Why the shapes are turned and bevelled: the studio environment is black
 * straight ahead of the wall and bright up-and-behind and to the front-left.
 * A brass face parallel to the wall mirrors the black and reads as a hole, so
 * every brass surface the camera sees is a round or a facet turned toward one
 * of those lights.
 */

// ── Scenes ──────────────────────────────────────────────────────────────
/** Height of the frame's centre above the bob's tip in the first scene: the plumb station's aim in engine.ts. */
const SCENE_AIM_Y = 0.8;

// ── Lights ──────────────────────────────────────────────────────────────
const SPOT_COLOR = 0xffd9a8;
const SPOT_INTENSITY = 42;
const SPOT_ANGLE = 0.24;
const SPOT_PENUMBRA = 0.8;
const SPOT_DISTANCE = 14;
/** Above-right and in front; the further forward, the closer its wall pool sits to the bob. */
const SPOT_OFFSET = { x: 1.8, y: 3.0, z: 3.4 };
/** Height above the tip the spot aims at, before BOB_SCALE. */
const SPOT_AIM_Y = 0.55;

const RIM_COLOR = 0xffc890;
const RIM_INTENSITY = 0.5;
const RIM_DISTANCE = 5;
/** Below, slightly left, between the bob and the wall. */
const RIM_OFFSET = { x: -0.45, y: -0.5, z: -0.65 };

/**
 * One key for the level and the square together. It hangs above the level and
 * aims down at the square: the square takes the centre of the cone from further
 * away, the level takes its soft edge from close by, and the two come out even.
 * From every camera height on the page its mirror image in the polished wall
 * falls outside the cone, so the wall never shows the lamp as a blob.
 */
const LOW_SPOT_INTENSITY = 40;
const LOW_SPOT_ANGLE = 0.5;
const LOW_SPOT_PENUMBRA = 0.7;
const LOW_SPOT_DISTANCE = 14;
/** From the centre of the level; z is measured from the wall. */
const LOW_SPOT_OFFSET = { x: 0.2, y: 2.0, z: 3.4 };
/** Where it aims, from the corner the square sits in. */
const LOW_SPOT_AIM = { x: 0.3, y: 0.7 };

// ── Bob and cord ────────────────────────────────────────────────────────
/** Uniform scale of the bob profile (1 → 0.74 tall, max radius 0.11). At 1.5 it takes about 37% of the frame's height. */
const BOB_SCALE = 1.5;
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
 * Sideways shift of the datum (and of the level and the square that sit on it)
 * from PLUMB.x. 0 puts it exactly behind the resting bob in world space; a camera
 * standing off to one side sees the bob displaced against the wall by parallax
 * and may want this nudged to compensate.
 */
const VERTICAL_OFFSET_X = 0;
const VERTICAL_ABOVE = 5;
/** The level line under the bob, below its tip. */
const DATUM_DROP = 0.55;
/** Length of the short level line engraved at the bob and at the level. It stops short of the words on the left. */
const DATUM_LENGTH = 2.3;
/** The tick where the level line crosses the vertical. */
const DATUM_WIDTH = 0.016;
const DATUM_HEIGHT = 0.12;
/**
 * The vertical breaks this far above and below the level's axis. The tube stands
 * off the wall, so from the side the line would not pass through the middle of
 * the bubble; with the break there is nothing to compare it against.
 */
const DATUM_BREAK = 0.32;

// ── Level ───────────────────────────────────────────────────────────────
/** Tube axis below the centre of scene 2 (the header takes the top of the frame). */
const LEVEL_DROP_Y = 0.1;
const LEVEL_LENGTH = 1.6;
const LEVEL_RADIUS = 0.095;
/** Tube axis to the wall. */
const LEVEL_STANDOFF = 0.16;
/** Glass left open between the two collars. */
const VIAL_LENGTH = 0.36;
const VIAL_RADIUS = 0.058;
const SPIRIT_RADIUS = 0.046;
const BUBBLE_RADIUS = 0.03;
const BUBBLE_LENGTH = 0.11;
/** Bubble centre above and in front of the vial's axis, so its crown breaks the surface of the spirit. */
const BUBBLE_RISE = { y: 0.02, z: 0.016 };
/** The two reference rings, either side of centre: the bubble at rest sits between them with equal gaps. */
const MARK_OFFSET = 0.075;
const MARK_WIDTH = 0.007;
/** Two slim rods bridge the vial above and below, behind its axis so they never cross the bubble. */
const GUARD_RADIUS = 0.008;
const GUARD_OFFSET = { y: 0.077, z: -0.036 };
/** Pipe clips that hold the tube to the wall, either side of centre. */
const CLIP_OFFSET = 0.44;
const CLIP_WIDTH = 0.034;
const CLIP_THICKNESS = 0.012;
const CLIP_STEM = 0.014;

// ── Bubble ──────────────────────────────────────────────────────────────
/** Natural frequency in rad/s and damping ratio: just under critical, so it overshoots once, barely, and stops. */
const BUBBLE_OMEGA = 5.5;
const BUBBLE_ZETA = 0.8;
/** Speed in m/s added by nudge(1). Scrolling pushes the bubble aside; it settles when the scene arrives. */
const BUBBLE_GAIN = 0.3;
/** Furthest the bubble can be pushed off centre. */
const BUBBLE_TRAVEL = 0.05;

// ── Square ──────────────────────────────────────────────────────────────
/** The corner the square proves, below the centre of scene 3. */
const SQUARE_DROP_Y = 0.86;
const STOCK_LENGTH = 0.82;
const STOCK_HEIGHT = 0.18;
const STOCK_DEPTH = 0.085;
/** Brass binding along the top and bottom of the stock; the ivory between them sits back by STOCK_INSET. */
const STOCK_BAND = 0.036;
const STOCK_INSET = 0.006;
/** Height of the chamfer on each binding. */
const BAND_CHAMFER = 0.028;
/** How far the chamfer's face leans back, in radians (52°): the upper one mirrors the light above and behind, a gold line along the stock. */
const BAND_CHAMFER_TILT = 0.91;
/** Blade above the stock. With the stock it stands about 40% of the frame's height. */
const BLADE_LENGTH = 1.3;
const BLADE_WIDTH = 0.16;
/** Thickness of the blade at its two edges, and the flat left along its ridge. */
const BLADE_EDGE = 0.006;
const BLADE_LAND = 0.024;
/** Back of the blade to the wall: it is let into the middle of the stock. */
const BLADE_BACK_Z = 0.03;
/** Slope of the blade's two facets, in radians (30°): the left one mirrors the front-left light, the right one stays dark and gives the blade its edge. */
const BLADE_BEVEL = 0.524;
const RIVET_RADIUS = 0.02;
/** Rivet centres along the stock, from the blade's end. */
const RIVETS = [0.08, 0.41, 0.74];

// ── Brass inlay at the square ───────────────────────────────────────────
/** Round beads let into the stone: a round catches the light where a flat strip would not. */
const INLAY_RADIUS = 0.007;
const INLAY_Z = 0.002;
/** How far the two beads run from the corner. */
const INLAY_REACH = { left: 0.45, right: 1.25, down: 0.4, up: 1.9 };

/** Brass part of the bob as (radius, height above the tip): body, knurled neck, cap. */
function brassProfile(): Vector2[] {
  const pts: Vector2[] = [
    // Underside lip closing the joint with the tip.
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

/** The darker tip, a faintly ogival point. */
function tipProfile(): Vector2[] {
  return [new Vector2(0, 0), new Vector2(0.008, 0.022), new Vector2(0.0175, 0.052), new Vector2(0.026, 0.086)];
}

/**
 * One half of the level's brass body as (radius, distance from its centre):
 * the collar that grips the vial, the barrel, one turned ring, the end cap.
 * The paired points just inside each long run keep its normals square to the axis.
 */
function barrelProfile(): Vector2[] {
  const r = LEVEL_RADIUS;
  const a = VIAL_LENGTH / 2;
  const b = LEVEL_LENGTH / 2;
  const flange = r + 0.016;
  const ring = r + 0.009;
  return [
    // Collar.
    new Vector2(VIAL_RADIUS - 0.006, a),
    new Vector2(flange - 0.004, a),
    new Vector2(flange, a + 0.004),
    new Vector2(flange, a + 0.03),
    new Vector2(r, a + 0.036),
    // Barrel.
    new Vector2(r, a + 0.046),
    new Vector2(r, b - 0.215),
    new Vector2(r, b - 0.205),
    // Ring, echoing the bob's neck.
    new Vector2(ring, b - 0.2),
    new Vector2(ring, b - 0.176),
    new Vector2(r, b - 0.171),
    new Vector2(r, b - 0.146),
    // End cap, domed at its face.
    new Vector2(flange, b - 0.14),
    new Vector2(flange, b - 0.13),
    new Vector2(flange, b - 0.034),
    new Vector2(flange, b - 0.024),
    new Vector2(flange - 0.008, b - 0.008),
    new Vector2(r * 0.5, b),
    new Vector2(0, b),
  ];
}

/**
 * A straight bar: a closed outline swept `length` along `axis`, starting at the
 * origin. Along "x" the outline is (z, y) pairs; along "y" it is (x, z) pairs.
 * ExtrudeGeometry leaves every edge hard, so each bevel is one flat facet with
 * one reflection.
 */
function bar(outline: [number, number][], length: number, axis: "x" | "y"): ExtrudeGeometry {
  const shape = new Shape(outline.map(([u, v]) => new Vector2(u, v)));
  const geo = new ExtrudeGeometry(shape, { depth: length, bevelEnabled: false });
  if (axis === "x") geo.rotateY(-Math.PI / 2).translate(length, 0, 0);
  else geo.rotateX(Math.PI / 2).translate(0, length, 0);
  return geo;
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

  const radial = tier === "full" ? 48 : 24;
  const unitBox = new BoxGeometry(1, 1, 1);
  const unitRod = new CylinderGeometry(1, 1, 1, radial);
  /** The same without ends: a sleeve. */
  const unitTube = new CylinderGeometry(1, 1, 1, radial, 1, true);

  /** A round bar (or, from `unitTube`, a sleeve) along `axis`, centred on (x, y, z). */
  const rod = (
    mat: Material,
    radius: number,
    length: number,
    axis: "x" | "y" | "z",
    x: number,
    y: number,
    z: number,
    geo = unitRod,
  ) => {
    const m = new Mesh(geo, mat);
    m.scale.set(radius, length, radius);
    if (axis === "x") m.rotation.z = Math.PI / 2;
    else if (axis === "z") m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z);
    group.add(fix(m));
  };
  const slab = (mat: Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
    const m = new Mesh(unitBox, mat);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    group.add(fix(m));
  };

  /** World height of the centre of scene k (0 = Plumb, 1 = Level, 2 = True). */
  const sceneY = (k: number) => PLUMB.bobY + SCENE_AIM_Y - PLUMB.sceneDrop * k;
  const verticalX = PLUMB.x + VERTICAL_OFFSET_X;
  const levelY = sceneY(1) - LEVEL_DROP_Y;
  const cornerY = sceneY(2) - SQUARE_DROP_Y;

  // ── Plumb: bob and cord, hanging along -y from the pivot ──
  const length = PLUMB.pivotY - PLUMB.bobY; // pivot → tip

  const pivot = new Group();
  pivot.position.set(PLUMB.x, PLUMB.pivotY, PLUMB.z);
  group.add(pivot);

  const scaled = (pts: Vector2[]) => pts.map((p) => p.multiplyScalar(BOB_SCALE));
  const body = new Mesh(new LatheGeometry(scaled(brassProfile()), radial), mats.brass);
  const tip = new Mesh(new LatheGeometry(scaled(tipProfile()), radial), mats.brassDark);
  body.position.y = tip.position.y = -length;
  pivot.add(fix(body), fix(tip));

  const cordLength = length - CAP_TOP * BOB_SCALE;
  const cord = new Mesh(
    new CylinderGeometry(CORD_RADIUS, CORD_RADIUS, cordLength, 5, 1, true),
    new MeshBasicMaterial({ color: CORD_COLOR }),
  );
  cord.position.y = -cordLength / 2;
  pivot.add(fix(cord));

  // ── The datum engraved on the wall: one vertical, and a short level line where an instrument proves it ──
  const engraveMat = new MeshBasicMaterial({ color: ENGRAVE_COLOR });
  const engrave = (x: number, y: number, w: number, h: number) => slab(engraveMat, w, h, ENGRAVE_DEPTH, x, y, ENGRAVE_Z);
  const vertical = (from: number, to: number) => engrave(verticalX, (from + to) / 2, HAIRLINE, to - from);
  // The vertical hands over to the brass bead where the square's corner begins.
  vertical(levelY + DATUM_BREAK, PLUMB.bobY + VERTICAL_ABOVE);
  vertical(cornerY + INLAY_REACH.up, levelY - DATUM_BREAK);
  for (const y of [PLUMB.bobY - DATUM_DROP, levelY]) {
    engrave(verticalX, y, DATUM_LENGTH, HAIRLINE);
    engrave(verticalX, y, DATUM_WIDTH, DATUM_HEIGHT);
  }

  // ── Level: a turned brass tube, the vial open at its centre, held to the wall in two pipe clips ──
  const levelZ = LEVEL_STANDOFF;
  const barrelGeo = new LatheGeometry(barrelProfile(), radial).rotateZ(-Math.PI / 2);
  for (const turn of [0, Math.PI]) {
    const barrel = new Mesh(barrelGeo, mats.brass);
    barrel.position.set(verticalX, levelY, levelZ);
    barrel.rotation.z = turn;
    group.add(fix(barrel));
  }
  // The spirit is aged brass under the glass: amber, and darker than the barrels either side of it.
  rod(mats.brassDark, SPIRIT_RADIUS, VIAL_LENGTH + 0.01, "x", verticalX, levelY, levelZ);
  rod(mats.glass, VIAL_RADIUS, VIAL_LENGTH, "x", verticalX, levelY, levelZ, unitTube);
  for (const side of [-1, 1]) {
    rod(mats.brass, VIAL_RADIUS + 0.0015, MARK_WIDTH, "x", verticalX + side * MARK_OFFSET, levelY, levelZ, unitTube);
    rod(mats.brass, GUARD_RADIUS, VIAL_LENGTH, "x", verticalX, levelY + side * GUARD_OFFSET.y, levelZ + GUARD_OFFSET.z);
    const clipX = verticalX + side * CLIP_OFFSET;
    rod(mats.brassDark, LEVEL_RADIUS + CLIP_THICKNESS, CLIP_WIDTH, "x", clipX, levelY, levelZ);
    rod(mats.brassDark, CLIP_STEM, LEVEL_STANDOFF, "z", clipX, levelY, LEVEL_STANDOFF / 2);
  }
  const bubble = new Mesh(
    new CapsuleGeometry(BUBBLE_RADIUS, BUBBLE_LENGTH - 2 * BUBBLE_RADIUS, 6, 16).rotateZ(Math.PI / 2),
    mats.ivory,
  );
  bubble.position.set(verticalX, levelY + BUBBLE_RISE.y, levelZ + BUBBLE_RISE.z);
  group.add(bubble);

  // ── True: two brass beads let into the wall, and a try square seated in their corner ──
  rod(
    mats.brass,
    INLAY_RADIUS,
    INLAY_REACH.left + INLAY_REACH.right,
    "x",
    verticalX + (INLAY_REACH.right - INLAY_REACH.left) / 2,
    cornerY,
    INLAY_Z,
  );
  rod(
    mats.brass,
    INLAY_RADIUS,
    INLAY_REACH.down + INLAY_REACH.up,
    "y",
    verticalX,
    cornerY + (INLAY_REACH.up - INLAY_REACH.down) / 2,
    INLAY_Z,
  );

  // The square's outer corner: the stock rests on the level bead, the blade's edge touches the vertical one.
  const squareX = verticalX + INLAY_RADIUS;
  const squareY = cornerY + INLAY_RADIUS;
  const seat = (geo: ExtrudeGeometry, y: number) => {
    const m = new Mesh(geo, mats.brass);
    m.position.set(squareX, y, 0);
    group.add(fix(m));
  };
  // Stock: ivory bound in brass, seen in section as (z, y). Each binding is chamfered toward the viewer.
  const chamferZ = BAND_CHAMFER * Math.tan(BAND_CHAMFER_TILT);
  const sd = STOCK_DEPTH;
  const sh = STOCK_HEIGHT;
  seat(
    bar(
      [
        [0, 0],
        [sd - chamferZ, 0],
        [sd, BAND_CHAMFER],
        [sd, STOCK_BAND],
        [0, STOCK_BAND],
      ],
      STOCK_LENGTH,
      "x",
    ),
    squareY,
  );
  seat(
    bar(
      [
        [0, sh - STOCK_BAND],
        [sd, sh - STOCK_BAND],
        [sd, sh - BAND_CHAMFER],
        [sd - chamferZ, sh],
        [0, sh],
      ],
      STOCK_LENGTH,
      "x",
    ),
    squareY,
  );
  const coreDepth = sd - STOCK_INSET;
  slab(mats.ivory, STOCK_LENGTH, sh - 2 * STOCK_BAND, coreDepth, squareX + STOCK_LENGTH / 2, squareY + sh / 2, coreDepth / 2);
  const dome = new SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2);
  for (const x of RIVETS) {
    const rivet = new Mesh(dome, mats.brass);
    rivet.scale.set(RIVET_RADIUS, RIVET_RADIUS, RIVET_RADIUS * 0.5);
    rivet.position.set(squareX + x, squareY + sh / 2, coreDepth);
    group.add(fix(rivet));
  }
  // Blade: seen from above as (x, z), a flat back and two facets rising to a narrow ridge. It starts inside the stock.
  const edgeZ = BLADE_BACK_Z + BLADE_EDGE;
  const ridgeZ = edgeZ + ((BLADE_WIDTH - BLADE_LAND) / 2) * Math.tan(BLADE_BEVEL);
  seat(
    bar(
      [
        [0, BLADE_BACK_Z],
        [BLADE_WIDTH, BLADE_BACK_Z],
        [BLADE_WIDTH, edgeZ],
        [(BLADE_WIDTH + BLADE_LAND) / 2, ridgeZ],
        [(BLADE_WIDTH - BLADE_LAND) / 2, ridgeZ],
        [0, edgeZ],
      ],
      BLADE_LENGTH + sh / 2,
      "y",
    ),
    squareY + sh / 2,
  );

  // ── Lights ──
  const spot = new SpotLight(SPOT_COLOR, 0, SPOT_DISTANCE, SPOT_ANGLE, SPOT_PENUMBRA, 2);
  spot.position.set(PLUMB.x + SPOT_OFFSET.x, PLUMB.bobY + SPOT_OFFSET.y, PLUMB.z + SPOT_OFFSET.z);
  spot.target.position.set(PLUMB.x, PLUMB.bobY + SPOT_AIM_Y * BOB_SCALE, PLUMB.z);
  const rim = new PointLight(RIM_COLOR, 0, RIM_DISTANCE, 2);
  rim.position.set(PLUMB.x + RIM_OFFSET.x, PLUMB.bobY + RIM_OFFSET.y, PLUMB.z + RIM_OFFSET.z);
  const lowSpot = new SpotLight(SPOT_COLOR, 0, LOW_SPOT_DISTANCE, LOW_SPOT_ANGLE, LOW_SPOT_PENUMBRA, 2);
  lowSpot.position.set(verticalX + LOW_SPOT_OFFSET.x, levelY + LOW_SPOT_OFFSET.y, LOW_SPOT_OFFSET.z);
  lowSpot.target.position.set(verticalX + LOW_SPOT_AIM.x, cornerY + LOW_SPOT_AIM.y, 0);
  group.add(spot, spot.target, rim, lowSpot, lowSpot.target);

  // ── Pendulum state ──
  // thetaX swings the bob along world x (rotation about z); thetaZ along world z (rotation about x).
  let thetaX = 0;
  let thetaZ = 0;
  let omegaX = 0;
  let omegaZ = 0;
  let lastPX = Number.NaN;
  let lastPY = Number.NaN;

  // ── Bubble state: metres off centre along the vial, and its speed ──
  let bubbleX = 0;
  let bubbleV = 0;

  const k2 = OMEGA0 * OMEGA0;
  const bubbleK = BUBBLE_OMEGA * BUBBLE_OMEGA;
  const bubbleC = 2 * BUBBLE_ZETA * BUBBLE_OMEGA;
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
    lowSpot.intensity = LOW_SPOT_INTENSITY * frame.presence;

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
      // The bubble is a damped spring to dead centre, stopped at the ends of its travel.
      bubbleV += (-bubbleK * bubbleX - bubbleC * bubbleV) * h;
      bubbleX += bubbleV * h;
      if (Math.abs(bubbleX) > BUBBLE_TRAVEL) {
        bubbleX = Math.sign(bubbleX) * BUBBLE_TRAVEL;
        if (bubbleV * bubbleX > 0) bubbleV = 0;
      }
    }

    // Come to a true rest rather than creeping forever.
    if (Math.abs(thetaX) < REST_EPS && Math.abs(omegaX) < REST_EPS) thetaX = omegaX = 0;
    if (Math.abs(thetaZ) < REST_EPS && Math.abs(omegaZ) < REST_EPS) thetaZ = omegaZ = 0;
    if (Math.abs(bubbleX) < REST_EPS && Math.abs(bubbleV) < REST_EPS) bubbleX = bubbleV = 0;

    // The bob sits at (0, -length, 0): +rotation.z carries it toward +x, -rotation.x toward +z.
    pivot.rotation.z = thetaX;
    pivot.rotation.x = -thetaZ;
    bubble.position.x = verticalX + bubbleX;
  }

  function nudge(impulse: number) {
    omegaX += impulse * NUDGE_GAIN;
    bubbleV += impulse * BUBBLE_GAIN;
  }

  return { group, update, nudge };
}
