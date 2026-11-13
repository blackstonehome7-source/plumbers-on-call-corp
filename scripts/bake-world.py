"""Bake a scene's static geometry for the website's 3D world.

    blender -b -P scripts/bake-world.py -- <in.glb> <out.glb> [preview.png cx cy cz tx ty tz]

Input: a .glb exported from the running site in development with
`await __world.exportBakeable()` (see world/baked.ts).

What it does, per material:
  1. joins every mesh that shares a material (one draw call each on the site),
  2. welds and bevels hard edges so they catch light instead of aliasing,
  3. subdivides long edges so there are vertices to hold shading,
  4. bakes ambient occlusion (soft contact shadows) into vertex colours,
  5. exports a Draco-compressed .glb that keeps the material names.

The site matches materials by name and multiplies the baked colours in.
Preview arguments use the site's coordinates (y up); the script converts.
"""
import math
import sys

import bmesh
import bpy
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1 :]
src, dst = argv[0], argv[1]
preview = argv[2:] if len(argv) >= 9 else None

BEVEL = 0.012  # metres
BEVEL_ANGLE = math.radians(40)
MAX_EDGE = 0.46  # subdivide edges longer than this
AO_DISTANCE = 1.4
AO_SAMPLES = 192
AO_FLOOR = 0.34  # darkest value a fully occluded vertex may reach
AO_GAMMA = 1.25

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src, merge_vertices=True)
scene = bpy.context.scene
view = bpy.context.view_layer

# ---- 1. Join by material -------------------------------------------------
groups = {}
for obj in [o for o in scene.objects if o.type == "MESH"]:
    key = obj.data.materials[0].name.split(".")[0] if obj.data.materials else "none"
    groups.setdefault(key, []).append(obj)

joined = []
for key, objs in groups.items():
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    view.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    obj = view.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.name = key
    obj.data.materials[0].name = key
    joined.append(obj)

# Remove the now-empty parents the importer created.
for o in [o for o in scene.objects if o.type != "MESH"]:
    bpy.data.objects.remove(o, do_unlink=True)

# ---- 2 + 3. Weld, bevel, subdivide ----------------------------------------
for obj in joined:
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bm.edges.ensure_lookup_table()
    hard = [
        e
        for e in bm.edges
        if len(e.link_faces) == 2 and e.calc_face_angle(0.0) > BEVEL_ANGLE and e.calc_length() > BEVEL * 2.5
    ]
    if hard:
        bmesh.ops.bevel(
            bm,
            geom=hard,
            offset=BEVEL,
            offset_type="OFFSET",
            segments=2,
            profile=0.5,
            affect="EDGES",
            clamp_overlap=True,
        )
    for _ in range(8):
        long_edges = [e for e in bm.edges if e.calc_length() > MAX_EDGE]
        if not long_edges:
            break
        bmesh.ops.subdivide_edges(bm, edges=long_edges, cuts=1, use_grid_fill=True)
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    me.set_sharp_from_angle(angle=math.radians(34))
    me.update()

# ---- 4. Ambient occlusion into vertex colours ------------------------------
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = AO_SAMPLES
world = bpy.data.worlds.new("bake")
scene.world = world
world.light_settings.distance = AO_DISTANCE

for obj in joined:
    me = obj.data
    attr = me.color_attributes.new(name="Col", type="FLOAT_COLOR", domain="POINT")
    me.color_attributes.active_color = attr
    me.color_attributes.render_color_index = me.color_attributes.find("Col")
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    view.objects.active = obj
    bpy.ops.object.bake(type="AO", target="VERTEX_COLORS")

    data = np.empty(len(attr.data) * 4, dtype=np.float32)
    attr.data.foreach_get("color", data)
    data = data.reshape(-1, 4)
    ao = np.clip(data[:, 0], 0.0, 1.0) ** AO_GAMMA
    shade = AO_FLOOR + (1.0 - AO_FLOOR) * ao
    data[:, 0] = data[:, 1] = data[:, 2] = shade
    data[:, 3] = 1.0
    attr.data.foreach_set("color", data.ravel())
    me.update()
    print(f"baked {obj.name}: {len(me.vertices)} verts, AO min {shade.min():.2f} mean {shade.mean():.2f}")

# ---- Optional preview (vertex colours only) -------------------------------
if preview:
    path = preview[0]
    cx, cy, cz, tx, ty, tz = (float(v) for v in preview[1:7])
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens_unit = "FOV"
    cam_data.sensor_fit = "VERTICAL"
    cam_data.angle = math.radians(32)
    cam = bpy.data.objects.new("cam", cam_data)
    scene.collection.objects.link(cam)
    # Site (x, y, z) -> Blender (x, -z, y)
    cam.location = (cx, -cz, cy)
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    target.location = (tx, -tz, ty)
    track = cam.constraints.new("TRACK_TO")
    track.target = target
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"
    scene.camera = cam
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "FLAT"
    scene.display.shading.color_type = "VERTEX"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 800
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True)
    bpy.data.objects.remove(target, do_unlink=True)

# ---- 5. Export ------------------------------------------------------------
bpy.ops.object.select_all(action="DESELECT")
for obj in joined:
    obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=dst,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_vertex_color="ACTIVE",
    export_all_vertex_colors=False,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=12,
    export_draco_texcoord_quantization=12,
    export_draco_color_quantization=8,
)
print("exported", dst)
