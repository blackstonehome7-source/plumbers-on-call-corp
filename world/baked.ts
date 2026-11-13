import { BufferGeometry, Group, Material, Mesh, MeshStandardMaterial, Object3D, Scene } from "three";

/**
 * Baked geometry.
 *
 * Each scene is first built in code (instant, and the fallback). Its static
 * parts are also exported once, taken through Blender (scripts/bake-world.py:
 * bevelled edges, ambient-occlusion baked into vertex colours, meshes merged,
 * Draco-compressed) and saved under /public/world/baked. At runtime the baked
 * file replaces the code-built static meshes; anything that moves stays live.
 *
 * A mesh takes part when it is frozen (matrixAutoUpdate === false) and its
 * material has a name. Unnamed materials (the logo, the floor, lamps, glass)
 * are left alone.
 */
const isBakeable = (o: unknown): o is Mesh<BufferGeometry, Material> => {
  const m = o as Mesh<BufferGeometry, Material>;
  return Boolean(m.isMesh) && m.matrixAutoUpdate === false && !Array.isArray(m.material) && m.material.name !== "";
};

export function bakeableMeshes(group: Group): Mesh<BufferGeometry, Material>[] {
  const out: Mesh<BufferGeometry, Material>[] = [];
  group.traverse((o) => {
    if (isBakeable(o)) out.push(o);
  });
  return out;
}

/** Swap a scene's code-built static meshes for the baked file, if it exists. */
export async function applyBaked(group: Group, url: string): Promise<boolean> {
  const sources = bakeableMeshes(group);
  if (sources.length === 0) return false;
  const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
    import("three/addons/loaders/GLTFLoader.js"),
    import("three/addons/loaders/DRACOLoader.js"),
  ]);
  const draco = new DRACOLoader().setDecoderPath("/draco/");
  const loader = new GLTFLoader().setDRACOLoader(draco);
  let gltf;
  try {
    gltf = await loader.loadAsync(url);
  } catch {
    return false; // not baked yet: keep the code-built meshes
  } finally {
    draco.dispose();
  }

  // The baked meshes reuse the live materials (by name), with vertex colours switched on.
  const byName = new Map<string, Material>();
  for (const m of sources) if (!byName.has(m.material.name)) byName.set(m.material.name, m.material);
  const lit = new Map<string, Material>();
  const baked = new Group();
  baked.name = "baked";
  const meshes: Mesh[] = [];
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => {
    if ((o as Mesh).isMesh) meshes.push(o as Mesh);
  });
  for (const mesh of meshes) {
    const name = (mesh.material as Material).name.replace(/\.\d+$/, "");
    const live = byName.get(name);
    if (!live) continue;
    let mat = lit.get(name);
    if (!mat) {
      mat = live.clone();
      // Baked shading darkens matte surfaces; polished metal keeps its full reflections.
      // The logo's slab also stays clean: nothing may shade the face the logo sits on.
      const clean = (live as MeshStandardMaterial).metalness > 0.5 || name === "signSlab";
      mat.vertexColors = !clean && mesh.geometry.hasAttribute("color");
      if (clean) mesh.geometry.deleteAttribute("color");
      lit.set(name, mat);
    }
    mesh.geometry.applyMatrix4(mesh.matrixWorld);
    const out = new Mesh(mesh.geometry, mat);
    out.matrixAutoUpdate = false;
    baked.add(out);
  }
  if (baked.children.length === 0) return false;
  for (const m of sources) m.visible = false;
  group.add(baked);
  return true;
}

/** Development only: the static part of a scene as a .glb, ready for Blender. */
export async function exportBakeable(group: Group): Promise<Blob> {
  const { GLTFExporter } = await import("three/addons/exporters/GLTFExporter.js");
  group.updateMatrixWorld(true);
  const scene = new Scene();
  const mats = new Map<string, MeshStandardMaterial>();
  // Fixture markers: Blender puts a properly modelled fixture at each one.
  group.traverse((o) => {
    if (o.name.startsWith("fixture:")) {
      const marker = new Object3D();
      marker.name = o.name;
      o.matrixWorld.decompose(marker.position, marker.quaternion, marker.scale);
      scene.add(marker);
    }
  });
  for (const src of bakeableMeshes(group)) {
    if (src.userData.fixture) continue; // stand-in: the bake supplies the real model
    const geo = src.geometry.clone();
    geo.applyMatrix4(src.matrixWorld);
    if (src.matrixWorld.determinant() < 0 && geo.index) {
      // Mirrored mesh: restore outward-facing triangles.
      const idx = geo.index.array;
      for (let i = 0; i < idx.length; i += 3) {
        const t = idx[i];
        idx[i] = idx[i + 2];
        idx[i + 2] = t;
      }
      geo.computeVertexNormals();
    }
    const name = src.material.name;
    let mat = mats.get(name);
    if (!mat) {
      mat = new MeshStandardMaterial({ name });
      mats.set(name, mat);
    }
    scene.add(new Mesh(geo, mat));
  }
  const buffer = (await new GLTFExporter().parseAsync(scene, { binary: true })) as ArrayBuffer;
  return new Blob([buffer], { type: "model/gltf-binary" });
}
