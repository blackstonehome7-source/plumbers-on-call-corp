"""Modelled fixtures for the Services building (used by bake-world.py).

Each builder receives where the site's stand-in sits (Blender axes: x right,
-y toward the viewer, z up) and returns nothing: it links finished objects
into the scene with a material named like the site's materials (ivory, steel,
brass, brassDark, matte, red). The bake then joins, shades and exports them
with everything else.
"""
import math

import bmesh
import bpy
from mathutils import Matrix, Vector


def _mat(name):
    return bpy.data.materials.get(name) or bpy.data.materials.new(name)


def _link(bm, name, mat, loc):
    bmesh.ops.translate(bm, verts=bm.verts, vec=Vector(loc))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(_mat(mat))
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def _lathe(profile, steps=48, axis="Z"):
    """Spin (radius, height) points about Z; axis="X" lays the result along X."""
    bm = bmesh.new()
    verts = [bm.verts.new((r, 0.0, z)) for r, z in profile]
    edges = [bm.edges.new((verts[i], verts[i + 1])) for i in range(len(verts) - 1)]
    bmesh.ops.spin(bm, geom=verts + edges, cent=(0, 0, 0), axis=(0, 0, 1), angle=math.tau, steps=steps)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    if axis == "X":
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, "Y"))
    return bm


def _cyl(radius, length, segments=28, axis="Z"):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segments, radius1=radius, radius2=radius, depth=length)
    if axis == "X":
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, "Y"))
    elif axis == "Y":
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, "X"))
    return bm


def _box(w, d, h, radius=0.0, segments=3):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(w, d, h), verts=bm.verts)
    if radius > 0:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=radius, segments=segments, profile=0.5, affect="EDGES")
    return bm


def _subsurf(ob, levels=1):
    mod = ob.modifiers.new("smooth", "SUBSURF")
    mod.levels = levels
    mod.render_levels = levels
    bpy.context.view_layer.update()
    evaluated = ob.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = bpy.data.meshes.new_from_object(evaluated)
    ob.modifiers.clear()
    ob.data = mesh


def tub(loc, dims):
    """Freestanding oval tub with a rolled rim. `loc` is the centre of its base."""
    w, d, h = dims
    k = (d / 2) / 0.392
    hz = h / 0.598
    profile = [
        (0.0, 0.0), (0.262, 0.0), (0.296, 0.016), (0.322, 0.07), (0.344, 0.2), (0.362, 0.38),
        (0.38, 0.52), (0.392, 0.566), (0.393, 0.586), (0.381, 0.598), (0.364, 0.592),
        (0.354, 0.566), (0.345, 0.44), (0.33, 0.27), (0.298, 0.15), (0.23, 0.1), (0.0, 0.092),
    ]
    bm = _lathe([(r * k, z * hz) for r, z in profile], steps=56)
    bmesh.ops.scale(bm, vec=(w / d, 1.0, 1.0), verts=bm.verts)
    shell = _link(bm, "tub", "ivory", loc)
    _subsurf(shell)
    _link(_cyl(0.034, 0.012), "tub_drain", "brass", (loc[0] + w * 0.18, loc[1], loc[2] + 0.098 * hz))


def wall_unit(loc, dims, stubs, name):
    """Wall-hung boiler or tankless heater: soft-cornered casing, gauge, stubs, flue. `loc` is its centre."""
    w, d, h = dims
    x, y, z = loc
    front = y - d / 2
    _link(_box(w, d, h, min(0.034, d * 0.12)), name, "steel", loc)
    _link(_box(w * 0.86, 0.006, 0.008), f"{name}_seam", "matte", (x, front - 0.002, z + h * 0.02))
    _link(_cyl(0.05, 0.014, 32, "Y"), f"{name}_bezel", "brass", (x - w * 0.2, front - 0.006, z + h * 0.25))
    _link(_cyl(0.041, 0.018, 32, "Y"), f"{name}_dial", "ivory", (x - w * 0.2, front - 0.007, z + h * 0.25))
    for i in range(stubs):
        sx = x + (i - (stubs - 1) / 2) * w * 0.22
        _link(_cyl(0.02, 0.09, 18), f"{name}_stub{i}", "brass", (sx, y, z - h / 2 - 0.045))
        _link(_cyl(0.028, 0.018, 6), f"{name}_nut{i}", "brassDark", (sx, y, z - h / 2 - 0.012))
    _link(_cyl(min(0.07, d * 0.27), 0.1, 28), f"{name}_flue", "matte", (x, y + d * 0.08, z + h / 2 + 0.05))


def tank(loc, dims):
    """Storage water heater: domed shell, base ring, seams, thermostat, drain. `loc` is the centre of its base."""
    w, _, h = dims
    x, y, z = loc
    r = w / 2
    dome = 0.19
    profile = [(0.0, 0.06), (r * 0.9, 0.06), (r, 0.085), (r, h - dome)]
    profile += [(r * math.cos(math.radians(a)), h - dome + dome * math.sin(math.radians(a))) for a in range(9, 91, 9)]
    profile[-1] = (0.0, h)
    _link(_lathe(profile, steps=64), "tank", "steel", loc)
    _link(_cyl(r * 1.04, 0.06, 48), "tank_base", "matte", (x, y, z + 0.03))
    for z0 in (0.44, h - 0.62):
        band = [(r, z0), (r + 0.011, z0 + 0.004), (r + 0.011, z0 + 0.03), (r, z0 + 0.034)]
        _link(_lathe(band, steps=64), "tank_band", "steel", loc)
    _link(_box(0.17, 0.08, 0.24, 0.012), "tank_control", "matte", (x, y - r - 0.03, z + 0.56))
    _link(_cyl(0.036, 0.012, 28, "Y"), "tank_dial", "ivory", (x, y - r - 0.074, z + 0.6))
    _link(_cyl(0.02, 0.1, 18, "Y"), "tank_drain", "brass", (x, y - r - 0.04, z + 0.17))
    _link(_cyl(0.034, 0.02, 6, "Y"), "tank_drain_nut", "brassDark", (x, y - r - 0.012, z + 0.17))
    _link(_cyl(0.024, 0.1, 18), "tank_relief", "brass", (x + 0.14, y, z + h + 0.03))


def valve(loc, _dims):
    """Main shut-off: ball-valve body on the pipe (along X), packing nut, red lever with a grip. `loc` is on the pipe axis."""
    x, y, z = loc
    body = [
        (0.084, -0.2), (0.1, -0.2), (0.1, -0.115), (0.118, -0.092), (0.148, -0.05), (0.158, 0.0),
        (0.148, 0.05), (0.118, 0.092), (0.1, 0.115), (0.1, 0.2), (0.084, 0.2),
    ]
    _link(_lathe(body, steps=40, axis="X"), "valve_body", "brass", loc)
    for sx in (-0.168, 0.168):
        _link(_cyl(0.124, 0.06, 6, "X"), "valve_nut", "brassDark", (x + sx, y, z))
    _link(_cyl(0.05, 0.06, 28), "valve_bonnet", "brass", (x, y, z + 0.175))
    _link(_cyl(0.042, 0.034, 6), "valve_packing", "brassDark", (x, y, z + 0.22))
    _link(_cyl(0.02, 0.09, 18), "valve_stem", "brassDark", (x, y, z + 0.265))
    _link(_box(0.66, 0.054, 0.016, 0.006, 2), "valve_lever", "red", (x + 0.27, y, z + 0.292))
    _link(_box(0.3, 0.07, 0.042, 0.015, 3), "valve_grip", "red", (x + 0.47, y, z + 0.294))
    _link(_cyl(0.03, 0.022, 6), "valve_lever_nut", "brassDark", (x, y, z + 0.312))


def build(kind, loc, dims):
    loc = tuple(loc)
    dims = tuple(dims)
    if kind == "tub":
        tub(loc, dims)
    elif kind == "boiler":
        wall_unit(loc, dims, stubs=4, name="boiler")
    elif kind == "tankless":
        wall_unit(loc, dims, stubs=3, name="tankless")
    elif kind == "tank":
        tank(loc, dims)
    elif kind == "valve":
        valve(loc, dims)
    else:
        print("unknown fixture", kind)
        return False
    print("modelled", kind, "at", [round(v, 2) for v in loc], "size", [round(v, 2) for v in dims])
    return True
