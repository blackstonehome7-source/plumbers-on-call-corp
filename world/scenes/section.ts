import {
  BoxGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PointLight,
  SphereGeometry,
  SpotLight,
  TubeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
  type Material,
} from "three";
import { LINE, SECTION, roomBottom, roomCenter } from "../layout";
import type { Materials } from "../materials";
import type { FrameState, SceneModule, WorldCtx } from "../types";

/**
 * The Section (Services): a building cut in section like an architect's
 * maquette. Six rooms stacked on the brass line, which is their riser.
 * The riser itself is drawn elsewhere; this module draws the structure,
 * the fixtures and everything that branches from the line.
 *
 * Everything is composed as a front elevation: fixtures are shown in profile
 * (faucet arcs lie in the x/y plane) and branch pipes run plumb and level on
 * the back wall, so the rooms read left to right like a section drawing.
 */

/* ── Tunables (integrator: start here) ───────────────────────────────────── */

const LIGHT_COLOR = 0xffdcae;

/** Warm point light inside the active room. Offset is from (0, roomCenter(f), 0). */
const POINT_INTENSITY = 46;
const POINT_DISTANCE = 9;
const POINT_DECAY = 2;
const POINT_OFFSET = { x: 0, y: 0.9, z: -0.8 } as const;

/** Soft spot from the front-top-right washing the active room. */
const SPOT_INTENSITY = 170;
const SPOT_ANGLE = 0.5;
const SPOT_PENUMBRA = 1;
const SPOT_DISTANCE = 22;
const SPOT_DECAY = 2;
const SPOT_OFFSET = { x: 4.5, y: 3.4, z: 9.5 } as const;
const SPOT_AIM = { x: 0, y: 0, z: -1.2 } as const;

/** Lamp strip brightness of an inactive room (active room = 1). */
const LAMP_DIM = 0.2;
/** Seconds for the focus to glide to a new room (critically damped). */
const FOCUS_SMOOTH_TIME = 0.35;
/** Rate (1/s) of the on/off fade when focus goes to or from "none". */
const FADE_RATE = 5;

/** Flow beads: light travelling inside the active room's branch pipe. */
const BEAD_COLOR = 0xffe6b0;
const BEAD_RADIUS = 0.03;
const BEAD_COUNT = 3;
const FLOW_PERIOD = 2.5; // seconds between restarts
const FLOW_TRAVEL = 0.8; // share of the period spent travelling
const FLOW_GAP = 0.07; // phase gap between consecutive beads

/** Branch pipe radius (the incoming main in the basement is thicker). */
const PIPE_R = 0.035;
const MAIN_R = 0.08;

/* ── Building frame ──────────────────────────────────────────────────────── */

const HALF_W = SECTION.width / 2; // 5.25, outer face of the side walls
const WALL_T = 0.12;
const IN_X = HALF_W - WALL_T; // inner face of the side walls
const FRONT_Z = 1; // open cut face
const BACK_Z = FRONT_Z - SECTION.depth; // outer face of the back wall
const WALL_Z = BACK_Z + WALL_T; // inner face of the back wall
const PIPE_Z = WALL_Z + 0.08; // plane of the pipes that run on the back wall
const CLEAR = SECTION.floorH - SECTION.slab; // clear height of a room
const FOUND_T = 0.18; // extra thickness of the foundation walls
const FOOTING = 0.22;

type P2 = readonly [number, number];
type P3 = readonly [number, number, number];
type Axis = "x" | "y" | "z";

/* ── Build kit: shared geometries and placement helpers ──────────────────── */

interface Kit {
  mats: Materials;
  /** True on the "full" tier: secondary detail is built. */
  detail: boolean;
  sphereGeo: BufferGeometry;
  arcSmall: BufferGeometry;
  arcKitchen: BufferGeometry;
  arcTub: BufferGeometry;
  /** Any geometry, placed with its origin at (x, y, z). */
  mesh(geo: BufferGeometry, mat: Material, x: number, y: number, z: number, sx?: number, sy?: number, sz?: number): Mesh;
  /** Box centred at (x, y, z). */
  box(mat: Material, w: number, h: number, d: number, x: number, y: number, z: number): Mesh;
  /** Cylinder centred at (x, y, z) with its length along `axis`. */
  cyl(mat: Material, r: number, len: number, x: number, y: number, z: number, axis?: Axis): Mesh;
  ball(mat: Material, r: number, x: number, y: number, z: number, squashY?: number): Mesh;
  /** Axis-aligned pipe through `pts`, with elbow spheres at the corners. */
  pipe(mat: Material, r: number, pts: readonly P3[]): void;
  /** Same, for a run that stays in one z plane; points are [x, y]. */
  wallPipe(mat: Material, r: number, z: number, pts: readonly P2[]): void;
  /** Small tee fitting on the riser at height y (detail only). */
  tee(y: number): void;
  /**
   * Marks `parts` as a stand-in for a fixture that Blender models properly
   * (scripts/bake-world.py). `anchor` and `size` tell the bake where the
   * modelled fixture goes; the stand-ins are what shows if the bake is absent.
   */
  fixture(kind: string, anchor: P3, size: P3, parts: Mesh[]): void;
}

/** A faucet in profile: straight stem, half-round top, short drop. Reaches toward +x. */
function arcGeometry(stem: number, reach: number, drop: number, radius: number): BufferGeometry {
  const r = reach / 2;
  const y1 = stem - r;
  const k = Math.SQRT1_2 * r;
  const curve = new CatmullRomCurve3(
    [
      new Vector3(0, 0, 0),
      new Vector3(0, y1 * 0.5, 0),
      new Vector3(0, y1, 0),
      new Vector3(r - k, y1 + k, 0),
      new Vector3(r, stem, 0),
      new Vector3(r + k, y1 + k, 0),
      new Vector3(reach, y1, 0),
      new Vector3(reach, y1 - drop, 0),
    ],
    false,
    "centripetal",
  );
  return new TubeGeometry(curve, 28, radius, 8, false);
}

function createKit(group: Group, ctx: WorldCtx): Kit {
  const detail = ctx.tier === "full";
  const mats = ctx.mats;
  const unitBox = new BoxGeometry(1, 1, 1);
  const unitCyl = new CylinderGeometry(1, 1, 1, 16);
  const unitSphere = new SphereGeometry(1, 16, 12);

  const place = (m: Mesh): Mesh => {
    m.matrixAutoUpdate = false;
    m.updateMatrix();
    group.add(m);
    return m;
  };

  const mesh: Kit["mesh"] = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const m = new Mesh(geo, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    return place(m);
  };

  const box: Kit["box"] = (mat, w, h, d, x, y, z) => mesh(unitBox, mat, x, y, z, w, h, d);

  const cyl: Kit["cyl"] = (mat, r, len, x, y, z, axis = "y") => {
    const m = new Mesh(unitCyl, mat);
    m.position.set(x, y, z);
    m.scale.set(r, len, r);
    if (axis === "x") m.rotation.z = Math.PI / 2;
    else if (axis === "z") m.rotation.x = Math.PI / 2;
    return place(m);
  };

  const ball: Kit["ball"] = (mat, r, x, y, z, squashY = 1) => mesh(unitSphere, mat, x, y, z, r, r * squashY, r);

  const pipe: Kit["pipe"] = (mat, r, pts) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const dz = b[2] - a[2];
      const axis: Axis = Math.abs(dx) > 1e-6 ? "x" : Math.abs(dy) > 1e-6 ? "y" : "z";
      const d = axis === "x" ? dx : axis === "y" ? dy : dz;
      // Without elbow spheres (lite) the segments overlap by one radius so corners stay closed.
      const extA = !detail && i > 0 ? r : 0;
      const extB = !detail && i < pts.length - 2 ? r : 0;
      const shift = (Math.sign(d) * (extB - extA)) / 2;
      cyl(
        mat,
        r,
        Math.abs(d) + extA + extB,
        (a[0] + b[0]) / 2 + (axis === "x" ? shift : 0),
        (a[1] + b[1]) / 2 + (axis === "y" ? shift : 0),
        (a[2] + b[2]) / 2 + (axis === "z" ? shift : 0),
        axis,
      );
      if (detail && i > 0) ball(mat, r * 1.28, a[0], a[1], a[2]);
    }
  };

  const wallPipe: Kit["wallPipe"] = (mat, r, z, pts) =>
    pipe(
      mat,
      r,
      pts.map((p): P3 => [p[0], p[1], z]),
    );

  const tee: Kit["tee"] = (y) => {
    if (detail) cyl(mats.brass, 0.05, 0.15, LINE.x, y, LINE.z);
  };

  return {
    mats,
    detail,
    sphereGeo: unitSphere,
    arcSmall: arcGeometry(0.3, 0.2, 0.04, 0.012),
    arcKitchen: arcGeometry(0.5, 0.26, 0.07, 0.017),
    arcTub: arcGeometry(0.98, 0.36, 0.1, 0.02),
    mesh,
    box,
    cyl,
    ball,
    pipe,
    wallPipe,
    tee,
    fixture(kind, anchor, size, parts) {
      for (const part of parts) part.userData.fixture = kind;
      const marker = new Object3D();
      marker.name = `fixture:${kind}`;
      marker.position.set(anchor[0], anchor[1], anchor[2]);
      marker.scale.set(size[0], size[1], size[2]);
      marker.matrixAutoUpdate = false;
      marker.updateMatrix();
      group.add(marker);
    },
  };
}

/* ── Structure ───────────────────────────────────────────────────────────── */

/** Slabs, walls, foundation and the riser sleeves. */
function buildStructure(k: Kit): void {
  const { mats } = k;
  const bottom = roomBottom(SECTION.count - 1) - SECTION.slab;
  const height = SECTION.top - bottom;
  const midY = bottom + height / 2;
  const midZ = (FRONT_Z + BACK_Z) / 2;

  // Slab i carries room i; slab -1 is the roof. Each front edge gets a hairline of brass.
  for (let i = -1; i < SECTION.count; i++) {
    const top = roomBottom(i);
    k.box(mats.slab, IN_X * 2, SECTION.slab, FRONT_Z - WALL_Z, 0, top - SECTION.slab / 2, (FRONT_Z + WALL_Z) / 2);
    k.box(mats.brassDark, SECTION.width, 0.02, 0.014, 0, top - 0.014, FRONT_Z + 0.003);
    // Sleeve where the riser passes through the slab.
    if (k.detail) k.cyl(mats.brassDark, 0.07, SECTION.slab + 0.08, LINE.x, top - SECTION.slab / 2, LINE.z);
  }

  // Side walls and back wall run the full height in one piece.
  const foundTop = roomBottom(SECTION.count - 2);
  for (const side of [-1, 1]) {
    k.box(mats.slab, WALL_T, height, SECTION.depth, side * (HALF_W - WALL_T / 2), midY, midZ);
    // Foundation: the basement walls are thicker, outward.
    k.box(mats.slab, FOUND_T, foundTop - bottom, SECTION.depth, side * (HALF_W + FOUND_T / 2), (foundTop + bottom) / 2, midZ);
  }
  k.box(mats.matte, IN_X * 2, height, WALL_T, 0, midY, BACK_Z + WALL_T / 2);
  k.box(mats.slab, (HALF_W + FOUND_T) * 2, FOOTING, SECTION.depth, 0, bottom - FOOTING / 2, midZ);
}

/* ── Rooms ───────────────────────────────────────────────────────────────── */
/* Each builder receives the room's floor level y0 and its lamp material, and */
/* returns the flow path: the points the beads travel along the branch.       */

type RoomBuilder = (k: Kit, y0: number, lamp: Material) => P3[];

/** 0. Bathroom: walk-in shower, floating vanity, freestanding tub. */
const buildBathroom: RoomBuilder = (k, y0) => {
  const { mats } = k;
  const BRANCH = 2.55;

  // Shower: tray, glass panel with a brass top rail, rain head on an arm.
  k.box(mats.ivory, 1.36, 0.05, 1.3, -4.4, y0 + 0.025, -2.8);
  k.box(mats.glass, 1.36, 2.1, 0.02, -4.4, y0 + 1.1, -2.16);
  k.box(mats.brassDark, 1.36, 0.02, 0.03, -4.4, y0 + 2.16, -2.16);
  k.cyl(mats.brass, 0.022, 0.63, -4.4, y0 + 2.3, WALL_Z + 0.315, "z");
  k.cyl(mats.brass, 0.15, 0.025, -4.4, y0 + 2.27, -2.85);

  // Vanity: floating slab, vessel basin, faucet arc.
  const vanityTop = y0 + 0.875;
  k.box(mats.ivory, 1.6, 0.09, 0.5, -2, vanityTop - 0.045, WALL_Z + 0.25);
  k.cyl(mats.ivory, 0.2, 0.11, -1.85, vanityTop + 0.055, WALL_Z + 0.25);
  k.mesh(k.arcSmall, mats.brass, -2.15, vanityTop, WALL_Z + 0.25);

  // Freestanding tub (a lathe bowl stretched along x) with a floor-standing filler.
  const tubProfile: P2[] = [
    [0, 0],
    [0.26, 0],
    [0.315, 0.035],
    [0.345, 0.14],
    [0.368, 0.42],
    [0.385, 0.565],
    [0.372, 0.58],
    [0.352, 0.565],
    [0.33, 0.3],
    [0.29, 0.17],
    [0, 0.15],
  ];
  const tubGeo = new LatheGeometry(
    tubProfile.map((p) => new Vector2(p[0], p[1])),
    28,
  );
  const tub = k.mesh(tubGeo, mats.ivory, 2.9, y0, -1.6, 2.25, 1, 1);
  k.fixture("tub", [2.9, y0, -1.6], [1.73, 0.58, 0.77], [tub]);
  k.mesh(k.arcTub, mats.brass, 1.82, y0, -1.6);

  // Branch: back to the wall, along it, with drops to shower, vanity and tub filler.
  k.tee(y0 + BRANCH);
  k.pipe(mats.brass, PIPE_R, [
    [LINE.x, y0 + BRANCH, LINE.z],
    [LINE.x, y0 + BRANCH, PIPE_Z],
  ]);
  k.pipe(mats.brass, PIPE_R, [
    [-4.4, y0 + 2.3, PIPE_Z],
    [-4.4, y0 + BRANCH, PIPE_Z],
    [1.82, y0 + BRANCH, PIPE_Z],
    [1.82, y0 + 0.07, PIPE_Z],
    [1.82, y0 + 0.07, -1.6],
  ]);
  k.wallPipe(mats.brass, PIPE_R, PIPE_Z, [
    [-2.15, y0 + BRANCH],
    [-2.15, vanityTop],
  ]);

  return [
    [LINE.x, y0 + BRANCH, LINE.z],
    [LINE.x, y0 + BRANCH, PIPE_Z],
    [-4.4, y0 + BRANCH, PIPE_Z],
    [-4.4, y0 + 2.3, PIPE_Z],
  ];
};

/** 1. Residential: kitchen run with sink and gooseneck, laundry pair on the right. */
const buildKitchen: RoomBuilder = (k, y0) => {
  const { mats } = k;
  const SUPPLY = 0.34;
  const WASTE = 0.14;
  const counterTop = y0 + 0.92;
  const under = y0 + 0.85; // underside of the counters
  const unitZ = -3.07; // under-counter blocks stand off the wall so pipes pass behind
  const FAUCET_X = -1.86; // right of the sink, so the supply never crosses the waste drop

  // Kitchen run: counter, dishwasher block, end panel, inset sink, gooseneck.
  k.box(mats.ivory, 3.6, 0.07, 0.62, -2.8, counterTop - 0.035, WALL_Z + 0.31);
  k.box(mats.steel, 0.6, 0.85, 0.46, -4.25, y0 + 0.425, unitZ);
  k.box(mats.ivory, 0.06, 0.85, 0.48, -1.03, y0 + 0.425, -3.1);
  k.box(mats.steel, 0.72, 0.2, 0.4, -2.3, under - 0.1, -3.14);
  k.mesh(k.arcKitchen, mats.brass, FAUCET_X, counterTop, -3.14, -1, 1, 1); // mirrored: reaches left over the sink

  // Laundry: washer and dryer under a short counter, beside a partition fin.
  k.box(mats.stone, 0.1, CLEAR, 1.3, 2.4, y0 + CLEAR / 2, WALL_Z + 0.65);
  k.box(mats.ivory, 1.52, 0.07, 0.62, 3.96, counterTop - 0.035, WALL_Z + 0.31);
  k.box(mats.steel, 0.62, 0.85, 0.46, 3.61, y0 + 0.425, unitZ);
  k.box(mats.steel, 0.62, 0.85, 0.46, 4.31, y0 + 0.425, unitZ);

  if (k.detail) {
    k.box(mats.matte, 0.66, 0.008, 0.36, -2.3, counterTop + 0.002, -3.14); // sink cut-out
    for (const x of [-4.25, 3.61, 4.31]) k.box(mats.brassDark, 0.44, 0.016, 0.016, x, y0 + 0.74, unitZ + 0.238);
  }

  // Supply (brass) and waste (aged brass) run low along the wall and back to the riser.
  k.tee(y0 + SUPPLY);
  k.pipe(mats.brass, PIPE_R, [
    [LINE.x, y0 + SUPPLY, LINE.z],
    [LINE.x, y0 + SUPPLY, PIPE_Z],
  ]);
  k.wallPipe(mats.brass, PIPE_R, PIPE_Z, [
    [FAUCET_X, under],
    [FAUCET_X, y0 + SUPPLY],
    [3.6, y0 + SUPPLY],
  ]);
  k.tee(y0 + WASTE);
  k.pipe(mats.brassDark, 0.042, [
    [LINE.x, y0 + WASTE, LINE.z],
    [LINE.x, y0 + WASTE, PIPE_Z],
  ]);
  k.wallPipe(mats.brassDark, 0.042, PIPE_Z, [
    [-2.1, under - 0.1],
    [-2.1, y0 + WASTE],
    [3.6, y0 + WASTE],
  ]);

  return [
    [LINE.x, y0 + SUPPLY, LINE.z],
    [LINE.x, y0 + SUPPLY, PIPE_Z],
    [FAUCET_X, y0 + SUPPLY, PIPE_Z],
    [FAUCET_X, under, PIPE_Z],
  ];
};

/** 2. Commercial: four identical basins under one mirror strip, framed by two panels. */
const buildCommercial: RoomBuilder = (k, y0) => {
  const { mats } = k;
  const BASINS = [-2.25, -0.75, 0.75, 2.25];
  const SUPPLY = 0.45;
  const WASTE = 0.22;
  const SUPPLY_Z = PIPE_Z + 0.1; // supply header runs in front of the waste drops
  const basinTop = y0 + 0.86;
  const basinUnder = y0 + 0.71;

  k.box(mats.steel, 6, 0.7, 0.03, 0, y0 + 1.75, WALL_Z + 0.015); // mirror strip
  for (const side of [-1, 1]) k.box(mats.stone, 0.06, 2.2, 1.5, side * 3.6, y0 + 1.1, WALL_Z + 0.75);
  for (const x of BASINS) {
    k.box(mats.ivory, 0.62, 0.15, 0.44, x, basinTop - 0.075, WALL_Z + 0.22);
    k.mesh(k.arcSmall, mats.brass, x - 0.2, basinTop, -3.3);
  }

  // Supply comb: one header, a drop to every basin.
  const sx = BASINS.map((x) => x - 0.12);
  k.tee(y0 + SUPPLY);
  k.pipe(mats.brass, PIPE_R, [
    [LINE.x, y0 + SUPPLY, LINE.z],
    [LINE.x, y0 + SUPPLY, SUPPLY_Z],
  ]);
  k.wallPipe(mats.brass, PIPE_R, SUPPLY_Z, [
    [sx[0], basinUnder],
    [sx[0], y0 + SUPPLY],
    [sx[3], y0 + SUPPLY],
    [sx[3], basinUnder],
  ]);
  for (const x of [sx[1], sx[2]]) {
    k.wallPipe(mats.brass, PIPE_R, SUPPLY_Z, [
      [x, basinUnder],
      [x, y0 + SUPPLY],
    ]);
  }

  // Waste comb, lower and on the wall plane.
  if (k.detail) {
    const wx = BASINS.map((x) => x + 0.12);
    k.tee(y0 + WASTE);
    k.pipe(mats.brassDark, 0.04, [
      [LINE.x, y0 + WASTE, LINE.z],
      [LINE.x, y0 + WASTE, PIPE_Z],
    ]);
    k.wallPipe(mats.brassDark, 0.04, PIPE_Z, [
      [wx[0], basinUnder],
      [wx[0], y0 + WASTE],
      [wx[3], y0 + WASTE],
      [wx[3], basinUnder],
    ]);
    for (const x of [wx[1], wx[2]]) {
      k.wallPipe(mats.brassDark, 0.04, PIPE_Z, [
        [x, basinUnder],
        [x, y0 + WASTE],
      ]);
    }
  }

  return [
    [LINE.x, y0 + SUPPLY, LINE.z],
    [LINE.x, y0 + SUPPLY, SUPPLY_Z],
    [sx[0], y0 + SUPPLY, SUPPLY_Z],
    [sx[0], basinUnder, SUPPLY_Z],
  ];
};

/** 3. Boilers and heating: boiler, valve manifold, two column radiators in one loop. */
const buildHeating: RoomBuilder = (k, y0, lamp) => {
  const { mats } = k;
  const FEED = 2.7;
  const FLOW = 0.24;
  const RETURN = 0.12;
  const MANIFOLD = 0.95;
  const boilerTop = y0 + 2.3;
  const boilerUnder = y0 + 1.35;
  const radUnder = y0 + 0.38;

  k.box(mats.stone, 0.1, CLEAR, 1.5, -1, y0 + CLEAR / 2, WALL_Z + 0.75); // plant-room partition

  // Wall-hung boiler with a lamp indicator.
  const boiler = k.box(mats.steel, 0.62, 0.95, 0.38, -4.2, y0 + 1.825, WALL_Z + 0.19);
  k.fixture("boiler", [-4.2, y0 + 1.825, WALL_Z + 0.19], [0.62, 0.95, 0.38], [boiler]);
  if (k.detail) k.box(lamp, 0.18, 0.022, 0.01, -4.2, y0 + 1.56, WALL_Z + 0.384);

  // Feed from the riser: high along the wall, down into the boiler.
  const feed: P3[] = [
    [LINE.x, y0 + FEED, LINE.z],
    [LINE.x, y0 + FEED, PIPE_Z],
    [-4.35, y0 + FEED, PIPE_Z],
    [-4.35, boilerTop, PIPE_Z],
  ];
  k.tee(y0 + FEED);
  k.pipe(mats.brass, PIPE_R, feed);

  // Boiler to manifold; four valved branches stand on the manifold.
  k.wallPipe(mats.brass, PIPE_R, PIPE_Z, [
    [-4.05, boilerUnder + 0.05],
    [-4.05, y0 + MANIFOLD],
    [-3.55, y0 + MANIFOLD],
  ]);
  k.cyl(mats.brass, 0.055, 1.5, -2.8, y0 + MANIFOLD, PIPE_Z, "x");
  for (const x of [-3.25, -2.95, -2.65, -2.35]) {
    k.cyl(mats.brass, 0.024, 0.32, x, y0 + MANIFOLD + 0.16, PIPE_Z);
    if (k.detail) k.cyl(mats.brassDark, 0.062, 0.02, x, y0 + MANIFOLD + 0.32, PIPE_Z + 0.03, "z");
  }

  // Column radiators: slim ivory fins, hung on the wall.
  const RAD_W = 1.1;
  const fins = k.detail ? 11 : 5;
  const finW = k.detail ? 0.055 : 0.1;
  const r1 = 1;
  const r2 = 3.2;
  for (const x0 of [r1, r2]) {
    for (let i = 0; i < fins; i++) {
      const x = x0 + 0.05 + (i * (RAD_W - 0.1)) / (fins - 1);
      k.box(mats.ivory, finW, 0.62, 0.14, x, radUnder + 0.31, WALL_Z + 0.13);
    }
    if (k.detail) {
      k.box(mats.ivory, RAD_W, 0.03, 0.1, x0 + RAD_W / 2, radUnder + 0.05, WALL_Z + 0.13);
      k.box(mats.ivory, RAD_W, 0.03, 0.1, x0 + RAD_W / 2, radUnder + 0.57, WALL_Z + 0.13);
    }
  }

  // One loop: manifold -> radiator 1 -> radiator 2 (flow, brass) -> boiler (return, aged brass).
  k.wallPipe(mats.brass, PIPE_R, PIPE_Z, [
    [-2.05, y0 + MANIFOLD],
    [-1.75, y0 + MANIFOLD],
    [-1.75, y0 + FLOW],
    [r1 + 0.05, y0 + FLOW],
    [r1 + 0.05, radUnder + 0.02],
  ]);
  k.wallPipe(mats.brass, PIPE_R, PIPE_Z, [
    [r1 + RAD_W - 0.05, radUnder + 0.02],
    [r1 + RAD_W - 0.05, y0 + FLOW],
    [r2 + 0.05, y0 + FLOW],
    [r2 + 0.05, radUnder + 0.02],
  ]);
  k.wallPipe(mats.brassDark, PIPE_R, PIPE_Z, [
    [r2 + RAD_W - 0.05, radUnder + 0.02],
    [r2 + RAD_W - 0.05, y0 + RETURN],
    [-4.35, y0 + RETURN],
    [-4.35, boilerUnder + 0.05],
  ]);

  return feed;
};

/** 4. Water heaters: storage tank, tankless unit, expansion vessel, nested hot/cold lines. */
const buildWaterHeaters: RoomBuilder = (k, y0, lamp) => {
  const { mats } = k;
  const COLD = 2.55;
  const HOT = 2.8;
  const TANK_X = -3.2;
  const TANK_Z = -3.05;
  const tankTop = y0 + 1.75;
  const unitTop = y0 + 1.95;

  k.box(mats.stone, 0.1, CLEAR, 1.4, 3.7, y0 + CLEAR / 2, WALL_Z + 0.7); // partition fin

  // Storage tank: base ring, shell, domed top.
  k.fixture(
    "tank",
    [TANK_X, y0, TANK_Z],
    [0.8, 1.9, 0.8],
    [
      k.cyl(mats.matte, 0.42, 0.06, TANK_X, y0 + 0.03, TANK_Z),
      k.cyl(mats.steel, 0.4, 1.69, TANK_X, y0 + 0.905, TANK_Z),
      k.ball(mats.steel, 0.4, TANK_X, tankTop, TANK_Z, 0.375),
    ],
  );

  // Tankless unit on the wall.
  const tankless = k.box(mats.steel, 0.56, 0.78, 0.26, 2.2, unitTop - 0.39, WALL_Z + 0.13);
  k.fixture("tankless", [2.2, unitTop - 0.39, WALL_Z + 0.13], [0.56, 0.78, 0.26], [tankless]);
  if (k.detail) k.box(lamp, 0.16, 0.022, 0.01, 2.2, y0 + 1.38, WALL_Z + 0.264);

  // Cold (aged brass) from the riser to both heaters; hot (brass) brackets it one step out.
  const cold: P3[] = [
    [LINE.x, y0 + COLD, LINE.z],
    [LINE.x, y0 + COLD, PIPE_Z],
  ];
  k.tee(y0 + COLD);
  k.pipe(mats.brassDark, PIPE_R, cold);
  k.wallPipe(mats.brassDark, PIPE_R, PIPE_Z, [
    [TANK_X + 0.15, tankTop - 0.05],
    [TANK_X + 0.15, y0 + COLD],
    [2.05, y0 + COLD],
    [2.05, unitTop - 0.05],
  ]);
  k.wallPipe(mats.brass, PIPE_R, PIPE_Z, [
    [TANK_X - 0.15, tankTop - 0.05],
    [TANK_X - 0.15, y0 + HOT],
    [2.35, y0 + HOT],
    [2.35, unitTop - 0.05],
  ]);

  // Expansion vessel hanging from the cold line.
  k.cyl(mats.brassDark, 0.02, 0.17, -1.5, y0 + COLD - 0.085, PIPE_Z);
  k.mesh(new CapsuleGeometry(0.15, 0.22, 6, 16), mats.ivory, -1.5, y0 + 2.14, PIPE_Z + 0.07);

  // Relief pipe: out of the tank's side, down to just above the floor.
  k.pipe(mats.brassDark, 0.022, [
    [TANK_X - 0.35, y0 + 1.5, TANK_Z],
    [TANK_X - 0.65, y0 + 1.5, TANK_Z],
    [TANK_X - 0.65, y0 + 0.12, TANK_Z],
  ]);

  return [...cold, [TANK_X + 0.15, y0 + COLD, PIPE_Z], [TANK_X + 0.15, y0 + 1.95, PIPE_Z]];
};

/** 5. Emergency: the incoming main, the meter and the main shut-off (the only red). */
const buildMain: RoomBuilder = (k, y0) => {
  const { mats } = k;
  const y = y0 + 1; // axis of the main
  const z = LINE.z; // the main runs in the riser's own plane, in front of everything
  const METER_X = -3.6;
  const VALVE_X = -1.7;

  // Foundation piers.
  for (const side of [-1, 1]) k.box(mats.stone, 0.5, CLEAR, 0.5, side * 3, y0 + CLEAR / 2, -2.4);

  // The main: through the left foundation wall, straight to the riser.
  const outside = -(HALF_W + FOUND_T) - 0.37;
  k.cyl(mats.brass, MAIN_R, LINE.x - outside, (LINE.x + outside) / 2, y, z, "x");
  k.cyl(mats.brassDark, 0.13, 0.05, -IN_X + 0.025, y, z, "x"); // wall sleeve
  k.cyl(mats.brass, 0.11, 0.3, LINE.x, y, z); // tee onto the riser
  for (const x of [-4.55, -2.65, -0.75]) {
    k.box(mats.steel, 0.05, 1 - MAIN_R, 0.05, x, y0 + (1 - MAIN_R) / 2, z); // supports
    if (k.detail) k.box(mats.steel, 0.2, 0.02, 0.2, x, y0 + 0.01, z);
  }

  // Water meter: a drum facing the viewer with an ivory dial.
  k.cyl(mats.brassDark, 0.2, 0.22, METER_X, y, z, "z");
  k.cyl(mats.ivory, 0.155, 0.02, METER_X, y, z + 0.12, "z");

  // Main shut-off: ball valve with a red lever, drawn open (lever along the pipe).
  k.fixture(
    "valve",
    [VALVE_X, y, z],
    [1, 1, 1],
    [
      k.ball(mats.brass, 0.15, VALVE_X, y, z),
      k.cyl(mats.brassDark, 0.028, 0.14, VALVE_X, y + 0.2, z),
      k.box(mats.red, 0.68, 0.03, 0.06, VALVE_X + 0.3, y + 0.285, z),
      k.box(mats.red, 0.3, 0.05, 0.075, VALVE_X + 0.49, y + 0.285, z),
    ],
  );

  if (k.detail) {
    k.cyl(mats.brassDark, 0.13, 0.05, -(HALF_W + FOUND_T) - 0.025, y, z, "x"); // outer sleeve
    k.box(mats.matte, 0.012, 0.11, 0.004, METER_X, y + 0.04, z + 0.132); // dial needle
    for (const x of [METER_X, VALVE_X]) {
      k.cyl(mats.brassDark, 0.105, 0.06, x - 0.33, y, z, "x"); // unions
      k.cyl(mats.brassDark, 0.105, 0.06, x + 0.33, y, z, "x");
    }
  }

  // Here the water arrives: the flow runs from the wall to the riser.
  return [
    [-IN_X, y, z],
    [LINE.x, y, z],
  ];
};

/** Builders in SECTION_ROOMS order, top to bottom. */
const ROOM_BUILDERS: readonly RoomBuilder[] = [
  buildBathroom,
  buildKitchen,
  buildCommercial,
  buildHeating,
  buildWaterHeaters,
  buildMain,
];

/* ── Flow paths ──────────────────────────────────────────────────────────── */

interface FlowPath {
  pts: Vector3[];
  /** Distance from the start to each point. */
  cum: number[];
  total: number;
}

function toFlowPath(points: readonly P3[]): FlowPath {
  const pts = points.map((p) => new Vector3(p[0], p[1], p[2]));
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  return { pts, cum, total: cum[cum.length - 1] };
}

function samplePath(path: FlowPath, dist: number, out: Vector3): void {
  let i = 1;
  while (i < path.pts.length - 1 && path.cum[i] < dist) i++;
  const span = path.cum[i] - path.cum[i - 1];
  out.lerpVectors(path.pts[i - 1], path.pts[i], span > 0 ? (dist - path.cum[i - 1]) / span : 0);
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth01 = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

/* ── Scene ───────────────────────────────────────────────────────────────── */

export function createSection(ctx: WorldCtx): SceneModule & { setActive(f: number): void } {
  const group = new Group();
  const kit = createKit(group, ctx);
  const last = SECTION.count - 1;

  buildStructure(kit);

  // Rooms: one lamp strip under each ceiling (own material, dims independently).
  const lampBase = ctx.mats.lamp.color.clone();
  const lamps: MeshBasicMaterial[] = [];
  const paths: FlowPath[] = [];
  ROOM_BUILDERS.forEach((build, i) => {
    const y0 = roomBottom(i);
    const lamp = ctx.mats.lamp.clone();
    lamp.color.copy(lampBase).multiplyScalar(LAMP_DIM);
    lamps.push(lamp);
    kit.box(lamp, 9.4, 0.03, 0.1, 0, y0 + CLEAR - 0.015, -1.2);
    paths.push(toFlowPath(build(kit, y0, lamp)));
  });

  // The only two lights. They glide with the focus and are never added or removed.
  const point = new PointLight(LIGHT_COLOR, 0, POINT_DISTANCE, POINT_DECAY);
  const spot = new SpotLight(LIGHT_COLOR, 0, SPOT_DISTANCE, SPOT_ANGLE, SPOT_PENUMBRA, SPOT_DECAY);
  group.add(point, spot, spot.target);

  // Flow beads: drawn over the pipe (no depth test) so they read as light inside it.
  const beads: Mesh[] = [];
  if (kit.detail) {
    const beadMat = new MeshBasicMaterial({ color: new Color(BEAD_COLOR), depthTest: false });
    for (let i = 0; i < BEAD_COUNT; i++) {
      const bead = new Mesh(kit.sphereGeo, beadMat);
      bead.renderOrder = 10;
      bead.visible = false;
      beads.push(bead);
      group.add(bead);
    }
  }

  // Focus state: `goal` is the requested room, `focus` glides toward it, `on` fades it in and out.
  let goal = 0;
  let focus = 0;
  let velocity = 0;
  let wantOn = 0;
  let on = 0;

  const placeLights = () => {
    const cy = roomCenter(focus);
    point.position.set(POINT_OFFSET.x, cy + POINT_OFFSET.y, POINT_OFFSET.z);
    spot.position.set(SPOT_OFFSET.x, cy + SPOT_OFFSET.y, SPOT_OFFSET.z);
    spot.target.position.set(SPOT_AIM.x, cy + SPOT_AIM.y, SPOT_AIM.z);
  };
  placeLights();

  function setActive(f: number): void {
    if (!(f >= 0)) {
      wantOn = 0;
      return;
    }
    goal = Math.min(last, f);
    // Coming from "none" there is nothing to glide from: start in the room.
    if (on < 0.01) {
      focus = goal;
      velocity = 0;
    }
    wantOn = 1;
  }

  function update(frame: FrameState): void {
    const { dt, time, presence } = frame;

    // Critically damped glide toward the goal room.
    const omega = 2 / FOCUS_SMOOTH_TIME;
    const x = omega * dt;
    const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const delta = focus - goal;
    const temp = (velocity + omega * delta) * dt;
    velocity = (velocity - omega * temp) * decay;
    focus = goal + (delta + temp) * decay;
    on += (wantOn - on) * (1 - Math.exp(-FADE_RATE * dt));

    const level = on * presence;
    placeLights();
    point.intensity = POINT_INTENSITY * level;
    spot.intensity = SPOT_INTENSITY * level;

    // Lamp strips: the room in focus glows, the others rest at LAMP_DIM.
    for (let i = 0; i < lamps.length; i++) {
      const glow = on * smooth01(1 - Math.abs(focus - i));
      lamps[i].color.copy(lampBase).multiplyScalar((LAMP_DIM + (1 - LAMP_DIM) * glow) * presence);
    }

    // Beads travel the branch of the nearest room and fade out at the handover between rooms.
    if (beads.length > 0) {
      const room = Math.min(last, Math.max(0, Math.round(focus)));
      const path = paths[room];
      const strength = level * clamp01(1 - 2 * Math.abs(focus - room));
      const phase = (time / FLOW_PERIOD) % 1;
      for (let i = 0; i < beads.length; i++) {
        const bead = beads[i];
        const u = (phase - i * FLOW_GAP) / FLOW_TRAVEL;
        const size = u > 0 && u < 1 ? strength * smooth01(u / 0.12) * smooth01((1 - u) / 0.15) : 0;
        bead.visible = size > 0.01;
        if (!bead.visible) continue;
        samplePath(path, u * path.total, bead.position);
        bead.scale.setScalar(BEAD_RADIUS * size);
      }
    }
  }

  return { group, update, setActive };
}
