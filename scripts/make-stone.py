"""Generate the bathroom floor's stone as a texture.

    blender -b -P scripts/make-stone.py -- <output dir>

Writes stone-color.png (sRGB): a honed warm-grey limestone, clouded softly, with a
few pale veins and darker seams. It is quiet on purpose. The bathroom is lit by
its lamps and its window, and the stone only has to feel like stone up close.
Make it seamless with `node scripts/tile-marble.mjs <dir> stone-color`.
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
mat = bpy.data.materials.new("stone")
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


def clouds(scale, seed, lo, hi, detail=10):
    n = node("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = detail
    n.inputs["Roughness"].default_value = 0.6
    links.new(warped(1.3, 0.3, seed), n.inputs["Vector"])
    return ramp(n.outputs["Fac"], [(lo, 0.0), (hi, 1.0)])


def mix(fac, a, b):
    n = node("ShaderNodeMixRGB")
    for socket, v in (("Fac", fac), ("Color1", a), ("Color2", b)):
        if isinstance(v, tuple):
            n.inputs[socket].default_value = (*v, 1)
        elif isinstance(v, (int, float)):
            n.inputs[socket].default_value = v
        else:
            links.new(v, n.inputs[socket])
    return n.outputs[0]


# Ground: two warm greys, clouded at two sizes, with a fine grain over them.
ground = mix(clouds(1.6, 2.0, 0.3, 0.75), (0.066, 0.056, 0.047), (0.15, 0.131, 0.112))
ground = mix(math("MULTIPLY", clouds(7.0, 8.0, 0.35, 0.8), 0.35), ground, (0.2, 0.178, 0.154))
ground = mix(math("MULTIPLY", clouds(60.0, 4.0, 0.3, 0.7, detail=3), 0.1), ground, (0.03, 0.026, 0.022))

# Veins gather in a few drifts and leave most of the slab calm.
drift = clouds(1.1, 6.3, 0.5, 0.72)
pale = math("MULTIPLY", veins(1.7, 0.01, 0.9, 1.1, 1.0), math("ADD", math("MULTIPLY", drift, 0.75), 0.07, clamp=True))
hair = math("MULTIPLY", veins(5.2, 0.005, 2.2, 0.7, 5.0), math("MULTIPLY", drift, 0.4))
light = math("MAXIMUM", pale, hair, clamp=True)
color = mix(math("MULTIPLY", light, 0.6), ground, (0.5, 0.45, 0.39))
seam = math("MULTIPLY", veins(1.2, 0.007, 0.7, 1.3, 9.0), clouds(1.4, 12.0, 0.45, 0.7))
color = mix(math("MULTIPLY", seam, 0.5), color, (0.028, 0.023, 0.019))

emit = node("ShaderNodeEmission")
output = node("ShaderNodeOutputMaterial")
links.new(emit.outputs[0], output.inputs["Surface"])
links.new(color, emit.inputs["Color"])
target = node("ShaderNodeTexImage")
nodes.active = target

bpy.ops.object.select_all(action="DESELECT")
plane.select_set(True)
bpy.context.view_layer.objects.active = plane

image = bpy.data.images.new("stone-color", SIZE, SIZE)
image.colorspace_settings.name = "sRGB"
target.image = image
bpy.ops.object.bake(type="EMIT")
image.filepath_raw = f"{out_dir}/stone-color.png"
image.file_format = "PNG"
image.save()
print("wrote", image.filepath_raw)
