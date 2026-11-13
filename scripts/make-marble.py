"""Generate the site's black-and-gold marble as textures.

    blender -b -P scripts/make-marble.py -- <output dir>

Writes marble-color.png (sRGB) and marble-orm.png (G = roughness, B = metalness,
the layout three.js expects). The stone is procedural: near-black ground with
soft charcoal clouding and clustered gold veins that read as metal.
"""
import sys

import bpy

out_dir = sys.argv[sys.argv.index("--") + 1]
SIZE = 2048

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 8
scene.render.bake.margin = 0

bpy.ops.mesh.primitive_plane_add(size=2)
plane = bpy.context.active_object
mat = bpy.data.materials.new("marble")
mat.use_nodes = True
plane.data.materials.append(mat)
nt = mat.node_tree
nodes, links = nt.nodes, nt.links
nodes.clear()


def node(kind, **props):
    n = nodes.new(kind)
    for key, value in props.items():
        setattr(n, key, value)
    return n


def math(op, a, b=None, clamp=False):
    n = node("ShaderNodeMath", operation=op, use_clamp=clamp)
    for i, v in enumerate((a, b)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            n.inputs[i].default_value = v
        else:
            links.new(v, n.inputs[i])
    return n.outputs[0]


def ramp(value, stops):
    n = node("ShaderNodeValToRGB")
    cr = n.color_ramp
    while len(cr.elements) < len(stops):
        cr.elements.new(0.5)
    for el, (pos, grey) in zip(cr.elements, stops):
        el.position = pos
        el.color = (grey, grey, grey, 1)
    links.new(value, n.inputs[0])
    return n.outputs[0]


coord = node("ShaderNodeTexCoord").outputs["UV"]


def warped(scale, amount, seed):
    """UVs pushed around by noise, so veins wander instead of running straight."""
    n = node("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = 6
    offset = node("ShaderNodeVectorMath", operation="ADD")
    offset.inputs[1].default_value = (seed, seed * 0.37, 0)
    links.new(coord, offset.inputs[0])
    links.new(offset.outputs[0], n.inputs["Vector"])
    centred = node("ShaderNodeVectorMath", operation="SUBTRACT")
    links.new(n.outputs["Color"], centred.inputs[0])
    centred.inputs[1].default_value = (0.5, 0.5, 0.5)
    scaled = node("ShaderNodeVectorMath", operation="SCALE")
    links.new(centred.outputs[0], scaled.inputs[0])
    scaled.inputs["Scale"].default_value = amount
    out = node("ShaderNodeVectorMath", operation="ADD")
    links.new(coord, out.inputs[0])
    links.new(scaled.outputs[0], out.inputs[1])
    return out.outputs[0]


def veins(scale, width, warp_scale, warp_amount, seed):
    v = node("ShaderNodeTexVoronoi", feature="DISTANCE_TO_EDGE")
    v.inputs["Scale"].default_value = scale
    links.new(warped(warp_scale, warp_amount, seed), v.inputs["Vector"])
    return ramp(v.outputs["Distance"], [(0.0, 1.0), (width, 0.0)])


def clouds(scale, seed, lo, hi):
    n = node("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = 10
    n.inputs["Roughness"].default_value = 0.62
    links.new(warped(1.3, 0.25, seed), n.inputs["Vector"])
    return ramp(n.outputs["Fac"], [(lo, 0.0), (hi, 1.0)])


# Veins gather in drifts rather than covering the slab evenly.
drift = clouds(1.5, 3.1, 0.46, 0.68)
main = math("MULTIPLY", veins(2.4, 0.012, 1.1, 0.9, 1.0), math("ADD", drift, 0.12, clamp=True))
fine = math("MULTIPLY", veins(6.5, 0.006, 2.0, 0.6, 7.0), math("MULTIPLY", drift, 0.55))
hair = math("MULTIPLY", veins(13.0, 0.004, 3.0, 0.4, 11.0), math("MULTIPLY", drift, 0.3))
mask = math("MAXIMUM", math("MAXIMUM", main, fine), hair, clamp=True)

ground = node("ShaderNodeMixRGB")
ground.inputs["Color1"].default_value = (0.004, 0.004, 0.0045, 1)
ground.inputs["Color2"].default_value = (0.028, 0.026, 0.024, 1)
links.new(clouds(3.2, 5.5, 0.35, 0.8), ground.inputs["Fac"])

gold = node("ShaderNodeMixRGB")
gold.inputs["Color1"].default_value = (0.72, 0.46, 0.17, 1)
gold.inputs["Color2"].default_value = (0.9, 0.78, 0.56, 1)
links.new(clouds(9.0, 2.2, 0.3, 0.75), gold.inputs["Fac"])

color = node("ShaderNodeMixRGB")
links.new(mask, color.inputs["Fac"])
links.new(ground.outputs[0], color.inputs["Color1"])
links.new(gold.outputs[0], color.inputs["Color2"])

roughness = math("ADD", 0.16, math("MULTIPLY", clouds(5.0, 9.0, 0.3, 0.8), 0.14))
orm = node("ShaderNodeCombineColor")
orm.inputs[0].default_value = 1.0
links.new(roughness, orm.inputs[1])
links.new(math("MULTIPLY", mask, 0.92), orm.inputs[2])

emit = node("ShaderNodeEmission")
output = node("ShaderNodeOutputMaterial")
links.new(emit.outputs[0], output.inputs["Surface"])
target = node("ShaderNodeTexImage")
nodes.active = target

bpy.ops.object.select_all(action="DESELECT")
plane.select_set(True)
bpy.context.view_layer.objects.active = plane

for name, source, space in (("marble-color", color.outputs[0], "sRGB"), ("marble-orm", orm.outputs[0], "Non-Color")):
    image = bpy.data.images.new(name, SIZE, SIZE)
    image.colorspace_settings.name = space
    target.image = image
    for link in list(emit.inputs["Color"].links):
        links.remove(link)
    links.new(source, emit.inputs["Color"])
    bpy.ops.object.bake(type="EMIT")
    image.filepath_raw = f"{out_dir}/{name}.png"
    image.file_format = "PNG"
    image.save()
    print("wrote", image.filepath_raw)
