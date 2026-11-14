import {
  Color,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";

/**
 * The whole world is built from a handful of shared materials: honed dark
 * stone, polished floor, warm ivory, brushed brass, glass and one red accent.
 * Sharing them keeps the look coherent and the shader count low.
 */
/** One tile of the marble spans this many metres, on every wall of every page. */
const MARBLE_TILE = 7.418;
/** Keeps the veining where it has always been behind the logo on the Home wall. */
const MARBLE_OFFSET = [0.9612, 0.2157] as const;

/**
 * Map a material's textures by world position instead of each mesh's own UVs
 * (DESIGN.md: one marble, one scale). Faces are projected along their dominant
 * axis, which is exact for the flat walls, fins and floors the world is made of.
 * The texture tiles seamlessly (scripts/tile-marble.mjs): no mirror axis, no join.
 */
function mapInWorldSpace(material: MeshStandardMaterial): void {
  const scale = (1 / MARBLE_TILE).toFixed(5);
  const offset = `vec2(${MARBLE_OFFSET[0].toFixed(4)}, ${MARBLE_OFFSET[1].toFixed(4)})`;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `#include <project_vertex>
      vec3 marblePos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      vec3 marbleAxis = abs(normalize(mat3(modelMatrix) * objectNormal));
      vec2 marbleUv = marbleAxis.z >= marbleAxis.x && marbleAxis.z >= marbleAxis.y
        ? marblePos.xy
        : (marbleAxis.x >= marbleAxis.y ? marblePos.zy : marblePos.xz);
      marbleUv = marbleUv * ${scale} + ${offset};
      vMapUv = marbleUv;
      vRoughnessMapUv = marbleUv;
      vMetalnessMapUv = marbleUv;`,
    );
  };
  material.customProgramCacheKey = () => "marble-world";
}

export function createMaterials(marbleColor: Texture, marbleOrm: Texture) {
  // Black marble with gold veining, generated in Blender (scripts/make-marble.py)
  // and made seamless by scripts/tile-marble.mjs.
  // The second map carries roughness (G) and metalness (B): the veins are real metal.
  marbleColor.colorSpace = SRGBColorSpace;
  for (const t of [marbleColor, marbleOrm]) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.anisotropy = 8;
  }

  const mats = {
    /** Polished black marble with gold veins (walls, fins, partitions). */
    stone: new MeshStandardMaterial({
      color: 0xffffff,
      map: marbleColor,
      roughnessMap: marbleOrm,
      metalnessMap: marbleOrm,
      roughness: 1,
      metalness: 1,
      envMapIntensity: 0.55,
    }),
    /**
     * The same marble, honed instead of polished: floor plates, ceilings and thin
     * fins. Seen at grazing angles, a polished face mirrors the studio lights as
     * a white bar; a honed one keeps the veining and stays dark.
     */
    stoneHoned: new MeshStandardMaterial({
      color: 0xffffff,
      map: marbleColor,
      roughnessMap: marbleOrm,
      metalnessMap: marbleOrm,
      roughness: 2.6,
      metalness: 1,
      envMapIntensity: 0.04,
    }),
    /** Plain dark slab (floor plates, structure). */
    slab: new MeshStandardMaterial({ color: 0x1c1b1a, roughness: 0.78, metalness: 0, envMapIntensity: 0.3 }),
    /** Near-black matte (back walls, voids). */
    matte: new MeshStandardMaterial({ color: 0x0e0e0d, roughness: 0.95, metalness: 0, envMapIntensity: 0.1 }),
    /** Warm ivory stone/ceramic (fixtures, light surfaces). */
    ivory: new MeshStandardMaterial({ color: 0xe6ddcd, roughness: 0.55, metalness: 0, envMapIntensity: 0.45 }),
    /** Brushed brass: the line, pipes, fittings. */
    brass: new MeshStandardMaterial({ color: 0xcaa566, roughness: 0.3, metalness: 1, envMapIntensity: 1.1 }),
    /** Aged brass for secondary pipework. */
    brassDark: new MeshStandardMaterial({ color: 0x8c6c38, roughness: 0.45, metalness: 1, envMapIntensity: 0.9 }),
    /** Dark steel (equipment casings, tanks). */
    steel: new MeshStandardMaterial({ color: 0x3a3936, roughness: 0.42, metalness: 0.85, envMapIntensity: 0.8 }),
    /** Thin glass panels. */
    glass: new MeshStandardMaterial({
      color: 0xbfd0d0,
      roughness: 0.08,
      metalness: 0,
      transparent: true,
      opacity: 0.14,
      envMapIntensity: 1.2,
      depthWrite: false,
    }),
    /** Self-lit warm lamp strip. Multiply `color` to dim. */
    lamp: new MeshBasicMaterial({ color: new Color(0xffd9a3) }),
    /** The single accent: a shut-off handle. */
    red: new MeshStandardMaterial({ color: 0xa2281c, roughness: 0.5, metalness: 0.1, envMapIntensity: 0.4 }),
  };
  mapInWorldSpace(mats.stone);
  mapInWorldSpace(mats.stoneHoned);
  // Named materials can be matched to Blender-baked geometry (see ./baked.ts).
  // Lamps and glass stay unnamed: they are animated or transparent and never baked.
  for (const key of ["stone", "stoneHoned", "slab", "matte", "ivory", "brass", "brassDark", "steel", "red"] as const) mats[key].name = key;
  return mats;
}

export type Materials = ReturnType<typeof createMaterials>;
