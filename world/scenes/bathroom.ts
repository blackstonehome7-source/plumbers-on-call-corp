import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  ShaderMaterial,
  Vector4,
  type Material,
  type Texture,
} from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import type { FrameState, WorldCtx } from "../types";
import L from "./bathroom.layout.json";

/**
 * The bathroom: the top floor of the Services building, and the first floor a
 * visitor enters.
 *
 * The room is modelled and lit in Blender (scripts/bathroom.py). Its light is
 * real: a cove, a halo behind the mirror, three downlights and an evening
 * window, path-traced once and stored in two lightmaps. Here the same geometry
 * carries that light at no cost per frame, so the camera can move through the
 * room, and only what depends on the eye or on time is computed live: the
 * reflection in the floor, the mirror, the glaze and the metal, the rain, the
 * steam and the curtain.
 */

/* ── Tunables ────────────────────────────────────────────────────────────── */

/** Overall strength of the baked light (1 = exactly what Blender rendered). */
const LIGHT_GAIN = 1.25;
/** How much a zone's lamps rise when it is chosen, and how far the rest settle. */
const ZONE_LIFT = 0.5;
const ZONE_REST = 0.24;
/** Seconds for a zone to come up or settle. */
const ZONE_TIME = 0.55;
/** One tile of the stone texture covers this many metres. */
const STONE_TILE = 3.4;
/** Joints between the wall slabs (world x). They follow the architecture, not a grid. */
const WALL_JOINTS = [-3.6, L.glass.x, -0.7, 0.65, 2.0];
const FLOOR_SLAB = 1.2;
/** Mirror-polish of the floor: 0 = honed, 1 = a true mirror at grazing angles. */
const FLOOR_REFLECT = 0.85;

const RAIN_COUNT = { full: 320, lite: 140 } as const;
const RAIN_FALL = 0.62; // seconds from the head to the floor
const RAIN_COLOR = new Color(1.0, 0.9, 0.76);
const STEAM_COLOR = new Color(1.0, 0.88, 0.74);
const CURTAIN_COLOR = new Color(1.0, 0.9, 0.77);
const LAMP_COLOR = new Color(1.0, 0.8, 0.56);

/** The four things a visitor can pick on this floor. */
export const BATH_ZONES = ["rough-in", "shower", "vanity", "tub"] as const;

const Y0 = L.y0;
const glsl = (n: number) => n.toFixed(4);

/* ── Shared shader pieces ────────────────────────────────────────────────── */

const NOISE = /* glsl */ `
  float bHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float bNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(bHash(i), bHash(i + vec2(1.0, 0.0)), f.x), mix(bHash(i + vec2(0.0, 1.0)), bHash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float bFbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * bNoise(p); p = p * 2.03 + 17.7; a *= 0.5; }
    return v;
  }
`;

/**
 * Which lamps a point of the room belongs to. A chosen zone rises and the others
 * settle, the way a lighting scene changes in a real room. uBath = shower, vanity,
 * tub, and the level of the whole room.
 */
const ZONES = /* glsl */ `
  uniform vec4 uBath;
  varying vec3 vBathPos;
  varying vec3 vBathNrm;
  float bathGain(vec3 p) {
    float front = smoothstep(${glsl(L.back + 0.6)}, ${glsl(L.back + 1.3)}, p.z);
    float shower = 1.0 - smoothstep(${glsl(L.glass.x - 0.2)}, ${glsl(L.glass.x + 0.9)}, p.x);
    float vanity = smoothstep(-1.3, -0.5, p.x) * (1.0 - smoothstep(1.8, 2.4, p.x)) * (1.0 - front);
    float tub = smoothstep(0.6, 1.3, p.x) * max(front, smoothstep(1.9, 2.4, p.x));
    float chosen = clamp(shower * uBath.x + vanity * uBath.y + tub * uBath.z, 0.0, 1.0);
    float any = max(uBath.x, max(uBath.y, uBath.z));
    return uBath.w * (1.0 + ${glsl(ZONE_LIFT)} * chosen - ${glsl(ZONE_REST)} * any * (1.0 - chosen));
  }
`;

const VARYINGS_VERTEX = /* glsl */ `#include <project_vertex>
  vBathPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
  vBathNrm = normalize(mat3(modelMatrix) * objectNormal);`;

/** The stone, laid slab by slab: every slab takes its own piece of the texture and a hairline joint. */
const STONE_MAP = /* glsl */ `
  {
    vec3 bn = abs(vBathNrm);
    vec2 sp;
    float id;
    float joint = 1.0e3;
    if (bn.y > 0.6) {
      sp = vBathPos.xz;
      vec2 cell = sp / ${glsl(FLOOR_SLAB)} + vec2(0.5, 0.3);
      id = dot(floor(cell), vec2(1.0, 57.0));
      vec2 f = abs(fract(cell) - 0.5);
      joint = (0.5 - max(f.x, f.y)) * ${glsl(FLOOR_SLAB)};
      if (abs(vBathPos.y - ${glsl(Y0 + L.floor)}) > 0.01) { joint = 1.0e3; id = 91.0; }
    } else if (bn.z >= bn.x) {
      sp = vBathPos.xy;
      id = 0.0;
      ${WALL_JOINTS.map((j) => `id += step(${glsl(j)}, sp.x); joint = min(joint, abs(sp.x - ${glsl(j)}));`).join("\n      ")}
      if (abs(vBathPos.z - ${glsl(L.back)}) > 0.01) { joint = 1.0e3; id += 23.0; }
    } else {
      sp = vBathPos.zy;
      float cell = sp.x / 1.5;
      id = floor(cell) + 40.0 + step(0.0, vBathNrm.x) * 9.0;
      joint = (0.5 - abs(fract(cell) - 0.5)) * 1.5;
      if (abs(abs(vBathPos.x - ${glsl((L.left + L.right) / 2)}) - ${glsl((L.right - L.left) / 2)}) > 0.01) joint = 1.0e3;
    }
    vec2 uv = sp / ${glsl(STONE_TILE)} + vec2(bHash(vec2(id, 3.0)), bHash(vec2(7.0, id))) * 5.0;
    diffuseColor *= texture2D(map, uv);
    // A 2 mm joint is thinner than a pixel from across the room: draw it one pixel wide and proportionally faint.
    float px = max(fwidth(joint), 1.0e-4);
    bathJoint = 1.0 - (1.0 - smoothstep(0.0, px * 1.2, joint - 0.0012)) * clamp(0.0035 / px, 0.0, 0.7);
    diffuseColor.rgb *= bathJoint;
  }
`;

type Lit = { stone?: boolean; reflect?: { texture: Texture; matrix: Matrix4; strength: { value: number } } };

/**
 * A material that carries the baked light. `stone` lays the slabs; `reflect`
 * adds the floor's planar reflection.
 */
function lit(material: MeshStandardMaterial, uBath: { value: Vector4 }, opts: Lit = {}): MeshStandardMaterial {
  const { stone, reflect } = opts;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBath = uBath;
    if (reflect) {
      shader.uniforms.tReflect = { value: reflect.texture };
      shader.uniforms.uReflectMatrix = { value: reflect.matrix };
      shader.uniforms.uReflect = reflect.strength;
    }
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vBathPos;\nvarying vec3 vBathNrm;${reflect ? "\nuniform mat4 uReflectMatrix;\nvarying vec4 vReflect;" : ""}`)
      .replace("#include <project_vertex>", VARYINGS_VERTEX + (reflect ? "\nvReflect = uReflectMatrix * vec4(vBathPos, 1.0);" : ""));
    let frag = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${NOISE}\n${ZONES}\nfloat bathJoint = 1.0;${reflect ? "\nuniform sampler2D tReflect;\nuniform float uReflect;\nvarying vec4 vReflect;" : ""}`)
      .replace("#include <lights_fragment_maps>", "#include <lights_fragment_maps>\nirradiance *= bathGain(vBathPos);");
    if (stone) frag = frag.replace("#include <map_fragment>", STONE_MAP);
    if (reflect) {
      // The room reflected in the polished floor: a few taps soften it the way a honed
      // finish would, the stone's own figure breaks it up, and it strengthens toward
      // grazing angles (Fresnel), which is what makes a floor read as polished.
      frag = frag.replace(
        "#include <opaque_fragment>",
        /* glsl */ `
        {
          vec2 ruv = vReflect.xy / vReflect.w;
          float soft = 0.0035 + 0.006 * (1.0 - diffuseColor.g * 4.0);
          vec3 mirrored = texture2D(tReflect, ruv).rgb * 0.28;
          mirrored += texture2D(tReflect, ruv + vec2(soft, 0.0)).rgb * 0.18;
          mirrored += texture2D(tReflect, ruv - vec2(soft, 0.0)).rgb * 0.18;
          mirrored += texture2D(tReflect, ruv + vec2(0.0, soft * 1.8)).rgb * 0.18;
          mirrored += texture2D(tReflect, ruv - vec2(0.0, soft * 1.8)).rgb * 0.18;
          float facing = clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0);
          float fresnel = 0.045 + 0.955 * pow(1.0 - facing, 5.0);
          outgoingLight += mirrored * fresnel * uReflect * bathJoint * (0.75 + 2.0 * diffuseColor.g);
        }
        #include <opaque_fragment>`,
      );
    }
    shader.fragmentShader = frag;
  };
  material.customProgramCacheKey = () => `bath-${stone ? "s" : "p"}${reflect ? "r" : ""}`;
  return material;
}

/* ── Live elements ───────────────────────────────────────────────────────── */

/** Rain from the ceiling head: fine streaks that catch the downlight. */
function createRain(count: number) {
  const base = new Float32Array(count * 4 * 2);
  const seed = new Float32Array(count * 4 * 2);
  const corner = new Float32Array(count * 4 * 2);
  const index: number[] = [];
  // A plain repeatable sequence: the pattern is the same on every visit.
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < count; i++) {
    const x = L.rain.x + (rnd() - 0.5) * (L.rain.size - 0.04);
    const z = L.rain.z + (rnd() - 0.5) * (L.rain.size - 0.04);
    const phase = rnd();
    const speed = 0.85 + rnd() * 0.3;
    for (let c = 0; c < 4; c++) {
      const k = (i * 4 + c) * 2;
      base[k] = x;
      base[k + 1] = z;
      seed[k] = phase;
      seed[k + 1] = speed;
      corner[k] = c % 2 === 0 ? -1 : 1;
      corner[k + 1] = c < 2 ? 0 : 1;
    }
    index.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3);
  }
  const geo = new BufferGeometry();
  // three culls by the position attribute's bounds: give it the true volume of the rain.
  const position = new Float32Array(count * 4 * 3);
  for (let i = 0; i < count * 4; i++) {
    position[i * 3] = base[i * 2];
    position[i * 3 + 1] = Y0 + (corner[i * 2 + 1] ? L.ceiling : L.floor);
    position[i * 3 + 2] = base[i * 2 + 1];
  }
  geo.setAttribute("position", new BufferAttribute(position, 3));
  geo.setAttribute("aBase", new BufferAttribute(base, 2));
  geo.setAttribute("aSeed", new BufferAttribute(seed, 2));
  geo.setAttribute("aCorner", new BufferAttribute(corner, 2));
  geo.setIndex(index);
  const material = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLevel: { value: 0 }, uViewH: { value: 900 }, uColor: { value: RAIN_COLOR } },
    vertexShader: /* glsl */ `
      attribute vec2 aBase; attribute vec2 aSeed; attribute vec2 aCorner;
      uniform float uTime; uniform float uViewH;
      varying vec2 vCorner; varying float vFall; varying float vThin;
      void main() {
        float t = fract(uTime * aSeed.y / ${glsl(RAIN_FALL)} + aSeed.x);
        float top = ${glsl(Y0 + L.ceiling - 0.02)};
        float drop = ${glsl(L.ceiling - L.floor - 0.02)};
        // Drops leave the head slowly and gather speed.
        float y = top - drop * (0.3 * t + 0.7 * t * t);
        float len = 0.07 + 0.3 * t;
        vec4 mv = modelViewMatrix * vec4(aBase.x, min(top, y + aCorner.y * len), aBase.y, 1.0);
        // Never thinner than a pixel and a bit: a streak that drops below it shimmers.
        float px = -mv.z * 2.0 / (projectionMatrix[1][1] * uViewH);
        float w = max(0.0022, px * 0.75);
        vThin = 0.0022 / w;
        mv.x += aCorner.x * w;
        vCorner = aCorner; vFall = t;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uLevel;
      varying vec2 vCorner; varying float vFall; varying float vThin;
      void main() {
        float across = 1.0 - abs(vCorner.x);
        float along = smoothstep(0.0, 0.25, vCorner.y) * (1.0 - vCorner.y * 0.55);
        // Brightest under the lamp, dimmer near the floor.
        float lamp = mix(1.0, 0.45, vFall);
        float a = across * along * lamp * vThin * uLevel;
        gl_FragColor = vec4(uColor * a * 1.5, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const mesh = new Mesh(geo, material);
  mesh.renderOrder = 4;
  return { mesh, material };
}

/** Steam, and the haze where the water lands: lit vapour drifting on a plane. */
function createVapour(kind: "steam" | "splash") {
  return new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLevel: { value: 0 }, uColor: { value: STEAM_COLOR }, uSeed: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uLevel; uniform float uSeed; uniform vec3 uColor; varying vec2 vUv;
      ${NOISE}
      void main() {
        ${
          kind === "steam"
            ? `float n = bFbm(vec2(vUv.x * 2.1 + uSeed + sin(uTime * 0.11 + uSeed) * 0.2, vUv.y * 2.4 - uTime * 0.085));
               float edge = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x) * smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.45, vUv.y);
               float a = smoothstep(0.36, 0.82, n) * edge * 0.2;`
            : `vec2 c = vUv - 0.5;
               float r = length(c) * 2.0;
               float n = bFbm(c * 9.0 + vec2(uTime * 0.9, -uTime * 0.7));
               float a = smoothstep(1.0, 0.15, r) * (0.35 + 0.65 * n) * 0.3;`
        }
        gl_FragColor = vec4(uColor * a * uLevel, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
  });
}

/** The sheer curtain: evening behind linen, the window's frame as a shadow in it, a slow breath of air. */
function createCurtainMaterial() {
  return new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLevel: { value: 1 }, uColor: { value: CURTAIN_COLOR } },
    vertexShader: /* glsl */ `
      uniform float uTime; varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        // The hem moves, the heading does not.
        float loose = pow(1.0 - uv.y, 1.6);
        p.z += (sin(uTime * 0.55 + position.x * 2.6) * 0.018 + sin(uTime * 0.31 + position.x * 5.9 + 1.7) * 0.008) * loose;
        p.x += sin(uTime * 0.4 + position.x * 1.9) * 0.01 * loose;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uLevel; uniform vec3 uColor; varying vec2 vUv;
      ${NOISE}
      void main() {
        float u = vUv.x, v = vUv.y;
        // The folds the mesh was modelled with (scripts/bathroom.py): cloth seen edge-on is denser and darker.
        float slope = cos(u * 46.0 + 0.9 * sin(u * 7.3)) * (46.0 + 6.57 * cos(u * 7.3)) * 0.026 + cos(u * 17.0 + 1.3) * 0.204;
        float cloth = mix(1.0, 0.56, clamp(abs(slope) / 1.5, 0.0, 1.0)) + 0.05 * slope;
        // The frame of the window behind it, soft through the linen.
        float bars = min(smoothstep(0.004, 0.024, abs(u - 0.333)), smoothstep(0.004, 0.024, abs(u - 0.667)));
        bars = min(bars, smoothstep(0.003, 0.014, abs(v - 0.76)));
        // Dusk: brighter toward the sky, darker toward the ground; leaves move a little outside.
        float sky = mix(0.42, 1.0, smoothstep(0.02, 0.62, v)) * mix(1.0, 0.72, smoothstep(0.86, 1.0, v));
        float leaves = 0.86 + 0.2 * bFbm(vec2(u * 3.2 + sin(uTime * 0.23) * 0.06, v * 2.4 + uTime * 0.012));
        vec3 c = uColor * cloth * mix(0.6, 1.0, bars) * sky * leaves * uLevel;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * The mirror shows a picture Blender rendered from the visitor's reflected eye.
 * As the eye moves the picture slides behind the glass like a real reflection
 * would, taking everything in it to be about `DEPTH` metres beyond the mirror.
 */
function createMirrorMaterial(plate: Texture, uBath: { value: Vector4 }) {
  const m = L.mirror;
  const DEPTH = 6.0;
  return new ShaderMaterial({
    uniforms: { tPlate: { value: plate }, uBath },
    vertexShader: "varying vec3 vWorld; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
    fragmentShader: /* glsl */ `
      uniform sampler2D tPlate; uniform vec4 uBath; varying vec3 vWorld;
      void main() {
        vec2 eye = cameraPosition.xy - vec2(${glsl(m.eye[0])}, ${glsl(Y0 + m.eye[1])});
        float d = max(0.5, cameraPosition.z - ${glsl(m.z)});
        vec2 at = vWorld.xy - eye * (${glsl(DEPTH)} / (d + ${glsl(DEPTH)}));
        vec2 uv = (at - vec2(${glsl((m.x0 + m.x1) / 2)}, ${glsl(Y0 + (m.y0 + m.y1) / 2)})) / vec2(${glsl((m.x1 - m.x0) * m.overscan)}, ${glsl((m.y1 - m.y0) * m.overscan)}) + 0.5;
        uv.x = 1.0 - uv.x;
        vec3 c = texture2D(tPlate, clamp(uv, 0.002, 0.998)).rgb;
        gl_FragColor = vec4(c * (0.3 + 0.7 * uBath.w), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/* ── Scene ───────────────────────────────────────────────────────────────── */

export type Bathroom = {
  group: Group;
  /** `level`: how lit the room is (1 = the visitor is on this floor). */
  update(frame: FrameState, level: number): void;
  /** Choose what the room shows: an index into BATH_ZONES, or -1 for the room at rest. */
  setZone(zone: number): void;
  /** The floor's true reflection is rendered only while the visitor is on this floor. */
  setReflection(on: boolean): void;
};

export function createBathroom(ctx: WorldCtx): Bathroom {
  const group = new Group();
  group.name = "bathroom";
  const full = ctx.tier === "full";
  const uBath = { value: new Vector4(0, 0, 0, 0.2) };
  const intensity = Math.PI * L.lightRange * LIGHT_GAIN;

  const lightmap = (url: string) => {
    const t = ctx.texture(url);
    t.flipY = false; // glTF texture coordinates
    return t;
  };
  const lightA = lightmap("/world/baked/bathroom-light-a.webp");
  const lightB = lightmap("/world/baked/bathroom-light-b.webp");
  const stoneMap = ctx.texture("/world/tex/stone-color.webp");
  stoneMap.wrapS = stoneMap.wrapT = RepeatWrapping;
  stoneMap.anisotropy = 8;

  /* The floor's reflection: a Reflector does the mirrored render; it draws nothing
     itself, and the floor's own material reads what it rendered. */
  let reflector: Reflector | null = null;
  const reflectStrength = { value: 0 };
  const reflectMatrix = new Matrix4();
  if (full) {
    reflector = new Reflector(new PlaneGeometry(L.right - L.left, L.front - L.back), { textureWidth: 1024, textureHeight: 640, clipBias: 0.002 });
    reflector.rotation.x = -Math.PI / 2;
    reflector.position.set((L.left + L.right) / 2, Y0 + L.floor, (L.front + L.back) / 2);
    reflector.renderOrder = -5; // before the floor, so the floor reads this frame's reflection
    const quiet = reflector.material as ShaderMaterial;
    quiet.colorWrite = false;
    quiet.depthWrite = false;
    reflector.visible = false;
    group.add(reflector);
  }

  const std = (color: number, roughness: number, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness });
  const withLight = (m: MeshStandardMaterial, map: Texture) => {
    m.lightMap = map;
    m.lightMapIntensity = intensity;
    return m;
  };
  const stone = lit(withLight(std(0xffffff, 0.56), lightA), uBath, { stone: true });
  stone.map = stoneMap;
  const floor = lit(withLight(std(0xffffff, 0.3), lightA), uBath, {
    stone: true,
    reflect: reflector ? { texture: reflector.getRenderTarget().texture, matrix: reflectMatrix, strength: reflectStrength } : undefined,
  });
  floor.map = stoneMap;
  const metal = std(0x9a7c52, 0.3, 1);
  const glass = new MeshStandardMaterial({ color: 0xcfd6d2, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.1, depthWrite: false });
  const lamp = new MeshBasicMaterial({ color: LAMP_COLOR.clone() });
  const curtain = createCurtainMaterial();
  const mirror = createMirrorMaterial(ctx.texture("/world/baked/bathroom-mirror.webp"), uBath);
  const materials: Record<string, Material> = {
    bathStone: stone,
    bathFloor: floor,
    bathPlaster: lit(withLight(std(0x9a9186, 1), lightA), uBath),
    bathCeramic: lit(withLight(std(0xe8e0d2, 0.26), lightB), uBath),
    bathLinen: lit(withLight(std(0xcdc2b0, 1), lightB), uBath),
    bathAmber: lit(withLight(std(0x21140b, 0.14), lightB), uBath),
    bathMetal: metal,
    bathDark: std(0x0c0b0a, 0.5),
    bathGlass: glass,
    bathGlow: lamp,
    bathCurtain: curtain,
    bathMirror: mirror,
  };

  // The room's own panorama gives the glaze, the metal and the glass something true to reflect.
  const reflective: [MeshStandardMaterial, number][] = [
    [stone, 0.16],
    [floor, full ? 0.1 : 0.55],
    [materials.bathCeramic as MeshStandardMaterial, 0.5],
    [materials.bathAmber as MeshStandardMaterial, 0.9],
    [metal, 1.5],
    [glass, 1.3],
    [materials.bathDark as MeshStandardMaterial, 0.4],
  ];
  // Until it arrives they reflect nothing rather than the studio the rest of the world uses.
  for (const [m] of reflective) m.envMapIntensity = 0;
  ctx.environment("/world/baked/bathroom-env.hdr", (env) => {
    for (const [m, k] of reflective) {
      m.envMap = env;
      m.envMapIntensity = k;
      m.needsUpdate = true;
    }
  });

  void (async () => {
    const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
      import("three/addons/loaders/GLTFLoader.js"),
      import("three/addons/loaders/DRACOLoader.js"),
    ]);
    const draco = new DRACOLoader().setDecoderPath("/draco/");
    try {
      const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync("/world/baked/bathroom.glb");
      gltf.scene.updateMatrixWorld(true);
      const meshes: Mesh[] = [];
      gltf.scene.traverse((o) => {
        if ((o as Mesh).isMesh) meshes.push(o as Mesh);
      });
      for (const src of meshes) {
        const name = (src.material as Material).name.replace(/\.\d+$/, "");
        const material = materials[name];
        if (!material) continue;
        src.geometry.applyMatrix4(src.matrixWorld);
        const mesh = new Mesh(src.geometry, material);
        mesh.matrixAutoUpdate = false;
        if (material === glass) mesh.renderOrder = 3;
        group.add(mesh);
      }
    } catch {
      // Not baked: the floor stays an empty stone room.
    } finally {
      draco.dispose();
    }
  })();

  /* Water and air. */
  const rain = createRain(RAIN_COUNT[ctx.tier]);
  group.add(rain.mesh);
  const vapours: ShaderMaterial[] = [];
  const steamAt = (z: number, w: number, seed: number) => {
    const m = createVapour("steam");
    m.uniforms.uSeed.value = seed;
    const h = L.ceiling - L.floor;
    const mesh = new Mesh(new PlaneGeometry(w, h), m);
    mesh.position.set(L.rain.x, Y0 + L.floor + h / 2, z);
    mesh.renderOrder = 5;
    group.add(mesh);
    vapours.push(m);
  };
  steamAt(L.rain.z - 0.35, 1.9, 0);
  if (full) steamAt(L.rain.z + 0.5, 1.7, 3.7);
  const splash = createVapour("splash");
  const splashMesh = new Mesh(new PlaneGeometry(1.3, 1.3), splash);
  splashMesh.rotation.x = -Math.PI / 2;
  splashMesh.position.set(L.rain.x, Y0 + L.floor + 0.012, L.rain.z);
  splashMesh.renderOrder = 4;
  group.add(splashMesh);
  vapours.push(splash);

  /* State. */
  const zone = new Vector4(0, 0, 0, 0); // shower, vanity, tub, rough-in: where each is heading
  const shown = new Vector4(0, 0, 0, 0);
  let wantReflection = false;

  return {
    group,
    setZone(z) {
      zone.set(z === 1 ? 1 : 0, z === 2 ? 1 : 0, z === 3 ? 1 : 0, z === 0 ? 1 : 0);
    },
    setReflection(on) {
      wantReflection = on;
    },
    update(frame, level) {
      const k = 1 - Math.exp(-frame.dt / ZONE_TIME);
      shown.lerp(zone, k);
      uBath.value.set(shown.x, shown.y, shown.z, level);

      // The shower runs while the visitor is on the floor, and harder when it is chosen.
      const water = level * level * (0.7 + 0.5 * shown.x);
      rain.material.uniforms.uTime.value = frame.time;
      rain.material.uniforms.uLevel.value = water;
      rain.material.uniforms.uViewH.value = window.innerHeight;
      rain.mesh.visible = water > 0.01;
      for (const v of vapours) {
        v.uniforms.uTime.value = frame.time;
        v.uniforms.uLevel.value = water;
      }
      curtain.uniforms.uTime.value = frame.time;
      curtain.uniforms.uLevel.value = 0.45 + 0.55 * level;
      lamp.color.copy(LAMP_COLOR).multiplyScalar(0.5 + 2.2 * level);

      if (reflector) {
        const on = wantReflection && level > 0.3;
        reflector.visible = on;
        const goal = on ? FLOOR_REFLECT : 0;
        reflectStrength.value += (goal - reflectStrength.value) * k;
        if (on) {
          // Reflector's matrix expects its own local coordinates; the floor is in world space.
          const u = (reflector.material as ShaderMaterial).uniforms.textureMatrix.value as Matrix4;
          reflectMatrix.copy(reflector.matrixWorld).invert().premultiply(u);
        }
      }
    },
  };
}
