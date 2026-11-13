"""Path-traced stills of the Services building, used as the site's own imagery.

    blender -b -P scripts/render-fixtures.py -- <repo dir> <out dir> [shot ...]

Loads the baked building (public/world/baked/section.glb), gives its materials
real surfaces (brass, ceramic, the site's marble), lights one room at a time
and renders each shot with depth of field. Coordinates below are the site's
(y up); the script converts to Blender's.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :]
repo, out_dir = argv[0], argv[1]
only = set(argv[2:])

FLOOR_H = 3.3
TOP = -8.5


def room(i):
    return TOP - FLOOR_H * (i + 1)


# name, room, look-at (x, height above floor, z), camera (x, height, z), f-stop
SHOTS = [
    ("tub", 0, (2.9, 0.42, -1.6), (4.9, 1.05, 1.6), 2.8),
    ("kitchen", 1, (-2.4, 0.95, -2.7), (-0.4, 1.35, 0.9), 3.2),
    ("commercial", 2, (0.3, 1.15, -3.3), (3.4, 1.5, 0.9), 4.0),
    ("boiler", 3, (-3.7, 1.6, -3.3), (-2.1, 1.75, 0.6), 2.8),
    ("radiators", 3, (2.6, 0.7, -3.3), (0.9, 1.1, 0.4), 2.8),
    ("tank", 4, (-3.1, 1.05, -3.0), (-1.3, 1.4, 0.9), 2.8),
    ("valve", 5, (-1.8, 1.05, 0.4), (-0.5, 1.45, 2.6), 2.2),
    ("meter", 5, (-3.4, 1.0, 0.4), (-2.6, 1.22, 1.9), 2.0),
]


def to_blender(p):
    return Vector((p[0], -p[2], p[1]))


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=os.path.join(repo, "public/world/baked/section.glb"))

# ---- Materials -----------------------------------------------------------
marble = bpy.data.images.load(os.path.join(repo, "public/world/tex/marble-color.webp"))
SURFACES = {
    "brass": dict(color=(0.83, 0.6, 0.28), metallic=1.0, roughness=0.2),
    "brassDark": dict(color=(0.42, 0.3, 0.14), metallic=1.0, roughness=0.32),
    "steel": dict(color=(0.11, 0.11, 0.115), metallic=1.0, roughness=0.26),
    "ivory": dict(color=(0.86, 0.82, 0.74), metallic=0.0, roughness=0.16),
    "slab": dict(color=(0.012, 0.011, 0.01), metallic=0.0, roughness=0.12),
    "matte": dict(color=(0.006, 0.006, 0.006), metallic=0.0, roughness=0.55),
    "red": dict(color=(0.45, 0.03, 0.02), metallic=0.0, roughness=0.35),
    "stone": dict(color=(0.02, 0.02, 0.02), metallic=0.0, roughness=0.18),
}
for mat in bpy.data.materials:
    spec = SURFACES.get(mat.name.split(".")[0])
    if not spec:
        continue
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*spec["color"], 1)
    bsdf.inputs["Metallic"].default_value = spec["metallic"]
    bsdf.inputs["Roughness"].default_value = spec["roughness"]
    nt.links.new(bsdf.outputs[0], out.inputs["Surface"])
    if mat.name.split(".")[0] == "stone":
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = marble
        tex.projection = "BOX"
        coord = nt.nodes.new("ShaderNodeTexCoord")
        scale = nt.nodes.new("ShaderNodeMapping")
        scale.inputs["Scale"].default_value = (0.35, 0.35, 0.35)
        nt.links.new(coord.outputs["Object"], scale.inputs["Vector"])
        nt.links.new(scale.outputs["Vector"], tex.inputs["Vector"])
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])

# The riser itself is not part of the baked building: add it.
bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=40, vertices=24, location=to_blender((0, -20, 0.4)))
riser = bpy.context.active_object
riser.data.materials.append(bpy.data.materials["brass"])
bpy.ops.object.shade_smooth()

# ---- World and render settings ------------------------------------------
world = bpy.data.worlds.new("studio")
world.use_nodes = True
scene.world = world
wn = world.node_tree
env = wn.nodes.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(os.path.join(repo, "public/world/env/studio.hdr"))
bg = wn.nodes["Background"]
bg.inputs["Strength"].default_value = 0.045
wn.links.new(env.outputs["Color"], bg.inputs["Color"])

scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 72
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 6
scene.render.resolution_x = 1600
scene.render.resolution_y = 1000
scene.render.image_settings.file_format = "PNG"
scene.view_settings.view_transform = "Filmic" if "Filmic" in [v.name for v in bpy.types.ColorManagedViewSettings.bl_rna.properties["view_transform"].enum_items] else "AgX"
scene.view_settings.look = "None"

cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 42
cam_data.dof.use_dof = True
cam = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
target = bpy.data.objects.new("target", None)
scene.collection.objects.link(target)
track = cam.constraints.new("TRACK_TO")
track.target = target
track.track_axis = "TRACK_NEGATIVE_Z"
track.up_axis = "UP_Y"
cam_data.dof.focus_object = target


def area(name, power, size, color, spot=None):
    data = bpy.data.lights.new(name, "SPOT" if spot else "AREA")
    data.energy = power
    data.color = color
    if spot:
        data.spot_size = math.radians(spot)
        data.spot_blend = 0.85
        data.shadow_soft_size = size
    else:
        data.size = size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    aim = obj.constraints.new("TRACK_TO")
    aim.target = target
    aim.track_axis = "TRACK_NEGATIVE_Z"
    aim.up_axis = "UP_Y"
    return obj


key = area("key", 2600, 0.35, (1.0, 0.8, 0.58), spot=46)
rim = area("rim", 110, 0.5, (1.0, 0.72, 0.46))
strip_mat = bpy.data.materials.new("lampstrip")
strip_mat.use_nodes = True
em = strip_mat.node_tree.nodes.new("ShaderNodeEmission")
em.inputs["Color"].default_value = (1.0, 0.82, 0.58, 1)
em.inputs["Strength"].default_value = 14
strip_mat.node_tree.links.new(em.outputs[0], strip_mat.node_tree.nodes["Material Output"].inputs["Surface"])
bpy.ops.mesh.primitive_cube_add(size=1)
strip = bpy.context.active_object
strip.scale = (4.0, 0.012, 0.012)
strip.data.materials.append(strip_mat)

for name, index, look, eye, fstop in SHOTS:
    if only and name not in only:
        continue
    y0 = room(index)
    t = (look[0], y0 + look[1], look[2])
    # Stand a little further back than the framing points suggest, for air around the subject.
    e = tuple(t[k] + ((eye[0], y0 + eye[1], eye[2])[k] - t[k]) * 1.25 for k in range(3))
    target.location = to_blender(t)
    cam.location = to_blender(e)
    cam_data.dof.aperture_fstop = fstop
    key.location = to_blender((t[0] + 1.1, y0 + 2.9, t[2] + 2.0))
    rim.location = to_blender((t[0] - 2.4, y0 + 1.4, t[2] + 0.3))
    strip.location = to_blender((t[0], y0 + 3.1, -2.4))
    scene.render.filepath = os.path.join(out_dir, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("rendered", name)
