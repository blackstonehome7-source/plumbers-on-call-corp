import {
  Color,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MirroredRepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";

/**
 * The whole world is built from a handful of shared materials: honed dark
 * stone, polished floor, warm ivory, brushed brass, glass and one red accent.
 * Sharing them keeps the look coherent and the shader count low.
 */
export function createMaterials(marbleColor: Texture, marbleOrm: Texture) {
  // Black marble with gold veining, generated in Blender (scripts/make-marble.py).
  // The second map carries roughness (G) and metalness (B): the veins are real metal.
  marbleColor.colorSpace = SRGBColorSpace;
  for (const t of [marbleColor, marbleOrm]) {
    t.wrapS = t.wrapT = MirroredRepeatWrapping;
    t.repeat.set(3.2, 2.8);
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
  // Named materials can be matched to Blender-baked geometry (see ./baked.ts).
  // Lamps and glass stay unnamed: they are animated or transparent and never baked.
  for (const key of ["stone", "slab", "matte", "ivory", "brass", "brassDark", "steel", "red"] as const) mats[key].name = key;
  return mats;
}

export type Materials = ReturnType<typeof createMaterials>;
