import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  Color,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  SpotLight,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
  type Material,
} from "three";
import { FLOOR, VALVE } from "../layout";
import type { FrameState, SceneModule, WorldCtx } from "../types";

/**
 * The Valve (Contact). Where the line ends: a tall slot of warm light in the
 * stone wall, and a brass branch pipe arriving along the wall at a
 * quarter-turn lever valve. Opening the valve sends light down the pipe and
 * brightens the slot.
 */

// ── Lights ──────────────────────────────────────────────────────────────
const SLOT_LIGHT_COLOR = 0xffc98a;
/** Intensity with the valve fully open; scaled by the slot glow factor below. */
const SLOT_LIGHT_INTENSITY = 44;
const SLOT_LIGHT_DISTANCE = 8;
/** Inside the wall thickness, so it lights the reveals and the floor but not the wall face. */
const SLOT_LIGHT_HEIGHT = 1.4;
const SLOT_LIGHT_Z = -0.3;

const VALVE_SPOT_COLOR = 0xffe2bd;
const VALVE_SPOT_INTENSITY = 120;
const VALVE_SPOT_ANGLE = 0.22;
const VALVE_SPOT_PENUMBRA = 0.8;
const VALVE_SPOT_DISTANCE = 9;
/** Relative to the valve body: above, slightly right, in front. */
const VALVE_SPOT_OFFSET = { x: 0.9, y: 2.4, z: 2.4 };

// ── Slot glow ───────────────────────────────────────────────────────────
const GLOW_COLOR = 0xffd9a3;
const GLOW_CLOSED = 1.5;
const GLOW_OPEN = 2.6;
/** Vertical falloff of the glow: brightest at this fraction of the slot height… */
const GLOW_PEAK = 0.32;
/** …easing down to this fraction of full brightness far above and below. */
const GLOW_FLOOR = 0.62;

// ── Recess behind the slot ──────────────────────────────────────────────
const RECESS_FRONT_Z = -0.6;
const RECESS_BACK_Z = -2.4;
/**
 * The lit back plane is wider and taller than the slot (and the recess floor is
 * lit too) so that, seen off-axis from the camera, the slot shows nothing but light.
 */
const RECESS_WIDTH = 2.6;
const RECESS_RISE = 1.3;
const CHEEK_THICKNESS = 0.05;

// ── Brass frame around the opening ──────────────────────────────────────
const FRAME_BAR = 0.025;
const FRAME_DEPTH = 0.018;
const FRAME_Z = 0.01;
const THRESHOLD_HEIGHT = 0.012;

// ── Branch pipe ─────────────────────────────────────────────────────────
const PIPE_RADIUS = 0.03;
const PIPE_Z = 0.22;
/** Pipe start and valve position, as offsets from the slot centre. */
const PIPE_START_DX = 6.5;
const VALVE_DX = 1.35;
/** Past the valve the pipe runs this far before it has turned into the wall. */
const STUB_LENGTH = 0.35;
const BEND_RADIUS = 0.08;
const BRACKET_DX = [0.75, 2.45, 4.15];

// ── Valve ───────────────────────────────────────────────────────────────
const BODY_RADIUS = 0.062;
const BODY_LENGTH = 0.12;
const COLLAR_RADIUS = 0.055;
const COLLAR_LENGTH = 0.045;
const HANDLE_LENGTH = 0.42;
const HANDLE_WIDTH = 0.036;
const HANDLE_THICKNESS = 0.008;
/** Distance from the stem axis to the short end of the handle. */
const HANDLE_TAIL = 0.035;
const GRIP_LENGTH = 0.19;
/** Handle angle about +z: closed stands up (+y), open lies along the pipe (+x). */
const ANGLE_CLOSED = Math.PI / 2;
const ANGLE_OPEN = 0;
/** Spring driving the handle: natural frequency (rad/s) and damping ratio (<1 = a hint of overshoot). */
const SPRING_OMEGA = 12;
const SPRING_ZETA = 0.82;
const MAX_STEP = 1 / 120;

// ── Light running down the pipe ─────────────────────────────────────────
const BEAD_COUNT = 3;
const BEAD_COLOR = 0xffe0b0;
const BEAD_RADIUS = 0.037;
const BEAD_LENGTH = 0.22;
const BEAD_OPACITY = 0.9;
/** Units per second with the valve fully open. */
const BEAD_SPEED = 1.3;
const BEAD_FADE_IN = 0.5;
const BEAD_FADE_OUT = 0.25;

type Axis = "x" | "y" | "z";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth01 = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

function fix<T extends Mesh>(mesh: T): T {
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  return mesh;
}

/** A static cylinder of the given radius/length along an axis, built from a shared unit geometry. */
function rod(
  geo: BufferGeometry,
  mat: Material,
  radius: number,
  length: number,
  axis: Axis,
  x: number,
  y: number,
  z: number,
): Mesh {
  const m = new Mesh(geo, mat);
  m.scale.set(radius, length, radius);
  if (axis === "x") m.rotation.z = Math.PI / 2;
  else if (axis === "z") m.rotation.x = Math.PI / 2;
  m.position.set(x, y, z);
  return fix(m);
}

function slab(geo: BufferGeometry, mat: Material, w: number, h: number, d: number, x: number, y: number, z: number): Mesh {
  const m = new Mesh(geo, mat);
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  return fix(m);
}

export function createValve(ctx: WorldCtx): SceneModule & { setOpen(v: number): void } {
  const { mats, tier } = ctx;
  const group = new Group();
  group.name = "valve";

  const unitBox = new BoxGeometry(1, 1, 1);
  const unitRod = new CylinderGeometry(1, 1, 1, tier === "full" ? 20 : 12);
  // Faceted hexagon: split the vertices so each flat gets its own normal.
  const unitHex = new CylinderGeometry(1, 1, 1, 6).toNonIndexed();
  unitHex.computeVertexNormals();

  const slotBottom = FLOOR.y;
  const slotTop = FLOOR.y + VALVE.slotH;
  const slotLeft = VALVE.x - VALVE.slotW / 2;
  const slotRight = VALVE.x + VALVE.slotW / 2;

  // ── Recess: lit back plane and floor, two matte cheeks ──
  const recessTop = slotTop + RECESS_RISE;
  const recessH = recessTop - slotBottom;
  const recessMidY = (recessTop + slotBottom) / 2;
  const recessDepth = RECESS_FRONT_Z - RECESS_BACK_Z;
  const recessMidZ = (RECESS_FRONT_Z + RECESS_BACK_Z) / 2;

  /** Glow level at a fraction `t` of the slot height, written into vertex colours. */
  const glowAt = (t: number) => {
    const d = (t - GLOW_PEAK) / 0.55;
    return GLOW_FLOOR + (1 - GLOW_FLOOR) * Math.exp(-d * d);
  };
  const shade = (geo: PlaneGeometry, level: (y: number) => number) => {
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) colors.fill(level(pos.getY(i)), i * 3, i * 3 + 3);
    geo.setAttribute("color", new BufferAttribute(colors, 3));
    return geo;
  };

  const glowBase = new Color(GLOW_COLOR);
  const glowMat = new MeshBasicMaterial({ color: glowBase.clone().multiplyScalar(GLOW_CLOSED), vertexColors: true });

  const back = new Mesh(
    shade(new PlaneGeometry(RECESS_WIDTH, recessH, 1, 12), (y) => glowAt((recessMidY + y - slotBottom) / VALVE.slotH)),
    glowMat,
  );
  back.position.set(VALVE.x, recessMidY, RECESS_BACK_Z);
  group.add(fix(back));

  // The recess floor continues the main floor level and meets the back plane at the same brightness.
  const recessFloor = new Mesh(shade(new PlaneGeometry(RECESS_WIDTH, recessDepth), () => glowAt(0)), glowMat);
  recessFloor.rotation.x = -Math.PI / 2;
  recessFloor.position.set(VALVE.x, slotBottom, recessMidZ);
  group.add(fix(recessFloor));

  for (const side of [-1, 1]) {
    const x = VALVE.x + side * (RECESS_WIDTH / 2 + CHEEK_THICKNESS / 2);
    group.add(slab(unitBox, mats.matte, CHEEK_THICKNESS, recessH, recessDepth, x, recessMidY, recessMidZ));
  }

  // ── Brass frame on the wall face ──
  const frameH = VALVE.slotH + FRAME_BAR;
  const frameMidY = slotBottom + frameH / 2;
  group.add(
    slab(unitBox, mats.brass, FRAME_BAR, frameH, FRAME_DEPTH, slotLeft - FRAME_BAR / 2, frameMidY, FRAME_Z),
    slab(unitBox, mats.brass, FRAME_BAR, frameH, FRAME_DEPTH, slotRight + FRAME_BAR / 2, frameMidY, FRAME_Z),
    slab(unitBox, mats.brass, VALVE.slotW, FRAME_BAR, FRAME_DEPTH, VALVE.x, slotTop + FRAME_BAR / 2, FRAME_Z),
    slab(unitBox, mats.brass, VALVE.slotW, THRESHOLD_HEIGHT, FRAME_DEPTH, VALVE.x, slotBottom + THRESHOLD_HEIGHT / 2, FRAME_Z),
  );

  // ── Branch pipe: straight run → valve → stub → elbow → into the wall ──
  const pipeY = VALVE.y;
  const xStart = VALVE.x + PIPE_START_DX;
  const xValve = VALVE.x + VALVE_DX;
  /** Where the straight run ends and the elbow begins. */
  const xBend = xValve - (STUB_LENGTH - BEND_RADIUS);
  /** Where the pipe enters the wall. */
  const xEntry = xBend - BEND_RADIUS;
  const runLength = xStart - xBend;
  const bendLength = (Math.PI / 2) * BEND_RADIUS;
  const legLength = PIPE_Z - BEND_RADIUS;
  const pathLength = runLength + bendLength + legLength;

  group.add(rod(unitRod, mats.brass, PIPE_RADIUS, runLength, "x", (xStart + xBend) / 2, pipeY, PIPE_Z));
  group.add(rod(unitRod, mats.brass, PIPE_RADIUS, legLength, "z", xEntry, pipeY, legLength / 2));
  group.add(rod(unitRod, mats.brass, PIPE_RADIUS * 2.1, 0.014, "z", xEntry, pipeY, 0.007));

  // The torus arc lies in its local xy plane; map it into the horizontal plane so it
  // runs from the end of the straight run (local +x → world +z of the bend centre)
  // round to the wall leg (local +y → world -x).
  const elbow = new Mesh(new TorusGeometry(BEND_RADIUS, PIPE_RADIUS, 10, 12, Math.PI / 2), mats.brass);
  elbow.matrixAutoUpdate = false;
  elbow.matrix
    .copy(new Matrix4().makeBasis(new Vector3(0, 0, 1), new Vector3(-1, 0, 0), new Vector3(0, -1, 0)))
    .setPosition(xBend, pipeY, PIPE_Z - BEND_RADIUS);
  elbow.matrixWorldNeedsUpdate = true;
  group.add(elbow);

  // Wall brackets: rosette, stand-off and a clamp around the pipe.
  for (const dx of BRACKET_DX) {
    const x = xValve + dx;
    group.add(
      rod(unitRod, mats.brass, 0.034, 0.012, "z", x, pipeY, 0.006),
      rod(unitRod, mats.brass, 0.011, PIPE_Z, "z", x, pipeY, PIPE_Z / 2),
      rod(unitRod, mats.brass, PIPE_RADIUS + 0.01, 0.045, "x", x, pipeY, PIPE_Z),
    );
  }

  // ── Valve body ──
  const collarX = BODY_LENGTH / 2 + COLLAR_LENGTH / 2;
  const bossLength = 0.024;
  const bossZ = PIPE_Z + BODY_RADIUS + bossLength / 2 - 0.004;
  group.add(
    rod(unitRod, mats.brass, BODY_RADIUS, BODY_LENGTH, "x", xValve, pipeY, PIPE_Z),
    rod(unitHex, mats.brass, COLLAR_RADIUS, COLLAR_LENGTH, "x", xValve - collarX, pipeY, PIPE_Z),
    rod(unitHex, mats.brass, COLLAR_RADIUS, COLLAR_LENGTH, "x", xValve + collarX, pipeY, PIPE_Z),
    rod(unitRod, mats.brass, 0.026, bossLength, "z", xValve, pipeY, bossZ),
  );

  // ── Lever handle: turns about the stem axis (+z, toward the viewer) ──
  const handle = new Group();
  handle.position.set(xValve, pipeY, bossZ + bossLength / 2 + HANDLE_THICKNESS / 2);
  handle.rotation.z = ANGLE_CLOSED;
  const gripX = HANDLE_LENGTH - HANDLE_TAIL - 0.01 - GRIP_LENGTH / 2;
  handle.add(
    slab(unitBox, mats.brassDark, HANDLE_LENGTH, HANDLE_WIDTH, HANDLE_THICKNESS, HANDLE_LENGTH / 2 - HANDLE_TAIL, 0, 0),
    slab(unitBox, mats.ivory, GRIP_LENGTH, HANDLE_WIDTH + 0.008, HANDLE_THICKNESS + 0.008, gripX, 0, 0),
    rod(unitHex, mats.brass, 0.02, 0.012, "z", 0, 0, HANDLE_THICKNESS / 2 + 0.006),
  );
  group.add(handle);

  // ── Beads of light travelling down the pipe ──
  const beadGeo = new SphereGeometry(1, 12, 8);
  const beads: { mesh: Mesh; mat: MeshBasicMaterial }[] = [];
  for (let i = 0; i < BEAD_COUNT; i++) {
    const mat = new MeshBasicMaterial({
      color: BEAD_COLOR,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new Mesh(beadGeo, mat);
    mesh.scale.set(BEAD_LENGTH / 2, BEAD_RADIUS, BEAD_RADIUS);
    mesh.visible = false;
    mesh.renderOrder = 3; // after the see-through floor
    group.add(mesh);
    beads.push({ mesh, mat });
  }

  /** Places a bead `d` units along the pipe from its far right end, long axis along the flow. */
  function placeBead(mesh: Mesh, d: number) {
    if (d <= runLength) {
      mesh.position.set(xStart - d, pipeY, PIPE_Z);
      mesh.rotation.y = 0;
    } else if (d <= runLength + bendLength) {
      const a = (d - runLength) / BEND_RADIUS;
      mesh.position.set(xBend - BEND_RADIUS * Math.sin(a), pipeY, PIPE_Z - BEND_RADIUS + BEND_RADIUS * Math.cos(a));
      mesh.rotation.y = -a;
    } else {
      mesh.position.set(xEntry, pipeY, legLength - (d - runLength - bendLength));
      mesh.rotation.y = -Math.PI / 2;
    }
  }

  // ── Lights ──
  const slotLight = new PointLight(SLOT_LIGHT_COLOR, 0, SLOT_LIGHT_DISTANCE, 2);
  slotLight.position.set(VALVE.x, FLOOR.y + SLOT_LIGHT_HEIGHT, SLOT_LIGHT_Z);
  const spot = new SpotLight(VALVE_SPOT_COLOR, 0, VALVE_SPOT_DISTANCE, VALVE_SPOT_ANGLE, VALVE_SPOT_PENUMBRA, 2);
  spot.position.set(xValve + VALVE_SPOT_OFFSET.x, pipeY + VALVE_SPOT_OFFSET.y, PIPE_Z + VALVE_SPOT_OFFSET.z);
  spot.target.position.set(xValve, pipeY, PIPE_Z);
  group.add(slotLight, spot, spot.target);

  // ── State ──
  let target = 0;
  /** Spring position: 0 closed, 1 open; may overshoot slightly. */
  let open = 0;
  let velocity = 0;
  let flow = 0;

  function update(frame: FrameState) {
    const steps = Math.max(1, Math.ceil(frame.dt / MAX_STEP));
    const h = frame.dt / steps;
    for (let i = 0; i < steps; i++) {
      velocity += (SPRING_OMEGA * SPRING_OMEGA * (target - open) - 2 * SPRING_ZETA * SPRING_OMEGA * velocity) * h;
      open += velocity * h;
    }
    if (Math.abs(target - open) < 1e-5 && Math.abs(velocity) < 1e-5) {
      open = target;
      velocity = 0;
    }

    handle.rotation.z = ANGLE_CLOSED + (ANGLE_OPEN - ANGLE_CLOSED) * open;

    const openness = clamp01(open);
    const glow = GLOW_CLOSED + (GLOW_OPEN - GLOW_CLOSED) * openness;
    glowMat.color.copy(glowBase).multiplyScalar(glow);
    slotLight.intensity = SLOT_LIGHT_INTENSITY * glow * frame.presence;
    spot.intensity = VALVE_SPOT_INTENSITY * frame.presence;

    // The light only flows while the valve lets it.
    flow = (flow + BEAD_SPEED * openness * frame.dt) % pathLength;
    const lit = openness > 0.01;
    for (let i = 0; i < beads.length; i++) {
      const { mesh, mat } = beads[i];
      mesh.visible = lit;
      if (!lit) continue;
      const d = (flow + (i * pathLength) / beads.length) % pathLength;
      placeBead(mesh, d);
      mat.opacity = BEAD_OPACITY * openness * smooth01(d / BEAD_FADE_IN) * smooth01((pathLength - d) / BEAD_FADE_OUT);
    }
  }

  function setOpen(v: number) {
    target = clamp01(v);
  }

  return { group, update, setOpen };
}
