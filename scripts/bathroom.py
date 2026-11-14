"""The bathroom floor of the Services building: model it, light it, bake the light.

    blender -b -P scripts/bathroom.py -- <out dir> [preview|bake] [draft|final]

The room is authored here, in the site's own coordinates (x right, y up from the
floor slab, z toward the viewer), and lit with Cycles the way the real room would
be: a cove over the wet wall, a halo behind the mirror, three downlights and the
evening behind a sheer curtain. `bake` writes everything the site needs:

    bathroom.glb        geometry, one mesh per material, UVs = lightmap UVs
    light-a.png/.exr    baked light on the room itself (walls, floor, ceiling, joinery)
    light-b.png/.exr    baked light on the loose objects (tub, basin, towels, bottles)
    env.hdr             the room as a small panorama, for reflections in metal and glaze
    mirror.png          what the mirror shows from the visitor's standpoint
    preview.png         a Cycles frame from the site's camera, to compare against

`preview` renders only preview.png. scripts/bathroom-pack.mjs turns the PNGs into
the WebP files under public/world/baked.

Lightmaps are stored as sRGB-encoded (value / LIGHT_RANGE); world/scenes/bathroom.ts
multiplies them back.
"""
import math
import os
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fixtures  # noqa: E402  (shared modelling helpers and the tub)

argv = sys.argv[sys.argv.index("--") + 1 :]
OUT = argv[0]
MODE = argv[1] if len(argv) > 1 else "preview"
FINAL = len(argv) > 2 and argv[2] == "final"
os.makedirs(OUT, exist_ok=True)

# ── The room (metres; y = 0 is the top of the floor slab) ──────────────────────
Y0 = -11.8  # world height of that slab top: roomBottom(0) in world/layout.ts
FL = 0.02  # finished floor
CL = 2.9  # finished ceiling
CEIL = 3.14  # underside of the slab above
XL, XR = -4.5, 5.05  # lined side walls
WB = -3.3  # lined back wall (the plumbing runs behind it)
ZF = 1.0  # the cut: the open front of the building
ZS = 3.6  # stage wall behind the visitor (light and reflections only, never exported)

GLASS_X = -2.7  # the shower screen
GLASS_Z = -1.1  # its free edge
RAIN = (-3.6, -2.0)  # rain head, x and z
NICHE = (-4.15, -3.25, 1.1, 1.5)  # x0, x1, y0, y1
VANITY = (-0.45, 1.75)  # x0, x1
VANITY_TOP = 0.86
MIRROR = (-0.35, 1.65, 1.24, 2.44)
BLOCK = (1.1, 1.32, -1.82, -0.92)  # x0, x1, z0, z1: the stone block that carries the tub filler
BLOCK_H = 0.66
TUB = (2.25, -1.36)  # centre x, z
TUB_SIZE = (1.72, 0.78, 0.6)
WINDOW = (2.2, 4.6)  # x0, x1 in the back wall, floor to ceiling
REVEAL = 0.16
COVE_X0 = -0.7  # the cove is at full strength from here to the right wall, low to the left
SLOT = 0.16  # the ceiling stops this far short of the back wall

# The visitor's standpoint on the Services page (world/engine.ts keeps the same numbers).
CAM = dict(p=(-0.3, 1.4, 4.0), t=(-0.3, 1.24, WB), fov=44.0, aspect=1.6)

LIGHT_RANGE = 4.0

# ── Blender scene ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
view = bpy.context.view_layer
coll = scene.collection


def S(x, y, z):
    """Site (x, y, z) -> Blender (x, -z, y), lifted to the room's world height."""
    return Vector((x, -z, y + Y0))


def D(x, y, z):
    """A site direction as a Blender direction."""
    return Vector((x, -z, y))


def material(name, color, rough=0.5, metallic=0.0, emission=None, strength=0.0, coat=0.0, transmission=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.06
    if transmission:
        b.inputs["Transmission Weight"].default_value = transmission
    if emission:
        b.inputs["Emission Color"].default_value = (*emission, 1)
        b.inputs["Emission Strength"].default_value = strength
    return m


STONE = (0.19, 0.165, 0.14)
M = {
    "bathStone": material("bathStone", STONE, 0.5),
    "bathFloor": material("bathFloor", STONE, 0.22),
    "bathPlaster": material("bathPlaster", (0.3, 0.27, 0.235), 0.9),
    "bathCeramic": material("bathCeramic", (0.8, 0.76, 0.7), 0.35, coat=1.0),
    "bathLinen": material("bathLinen", (0.62, 0.57, 0.5), 0.95),
    "bathAmber": material("bathAmber", (0.05, 0.028, 0.012), 0.12, coat=1.0),
    "bathMetal": material("bathMetal", (0.58, 0.44, 0.27), 0.32, metallic=1.0),
    "bathDark": material("bathDark", (0.03, 0.028, 0.026), 0.5),
    "bathGlass": material("bathGlass", (1, 1, 1), 0.0, transmission=1.0),
    "bathMirror": material("bathMirror", (0.9, 0.9, 0.9), 0.0, metallic=1.0),
    "bathCurtain": material("bathCurtain", (0.7, 0.66, 0.6), 0.9, emission=(1.0, 0.86, 0.7), strength=1.7),
    "bathGlow": material("bathGlow", (0, 0, 0), 0.5, emission=(1.0, 0.8, 0.55), strength=30.0),
    "stage": material("stage", (0.12, 0.105, 0.09), 0.6),
    "stageGlow": material("stageGlow", (0, 0, 0), 0.5, emission=(1.0, 0.72, 0.45), strength=1.6),
}
# Glass throws no shadow (no caustics to wait for): shadow rays pass straight through.
_nt = M["bathGlass"].node_tree
_nt.nodes["Principled BSDF"].inputs["IOR"].default_value = 1.45
_mix = _nt.nodes.new("ShaderNodeMixShader")
_nt.links.new(_nt.nodes.new("ShaderNodeLightPath").outputs["Is Shadow Ray"], _mix.inputs[0])
_nt.links.new(_nt.nodes["Principled BSDF"].outputs[0], _mix.inputs[1])
_nt.links.new(_nt.nodes.new("ShaderNodeBsdfTransparent").outputs[0], _mix.inputs[2])
_nt.links.new(_mix.outputs[0], _nt.nodes["Material Output"].inputs["Surface"])

A_OBJECTS = []  # the room itself: planar faces, one lightmap island per plane
B_OBJECTS = []  # loose objects: unwrapped automatically
LIVE = []  # exported without a lightmap (metal, glass, mirror, curtain, lamps)
STAGE = []  # never exported


def new_object(name, bm, mat, bucket, smooth=False):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(M[mat])
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    bucket.append(ob)
    return ob


def quads(name, mat, bucket, faces):
    """Loose quads, each given as four site-space corners, wound to face the room."""
    bm = bmesh.new()
    for corners in faces:
        bm.faces.new([bm.verts.new(S(*c)) for c in corners])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(M[mat])
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    bucket.append(ob)
    return ob


def rect_z(z, x0, x1, y0, y1, face=1):
    """A wall in an x/y plane; face = +1 looks toward the viewer (+z), -1 away."""
    c = [(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)]
    return c if face > 0 else c[::-1]


def rect_x(x, z0, z1, y0, y1, face=1):
    """A wall in a z/y plane; face = +1 looks toward +x."""
    c = [(x, y0, z1), (x, y0, z0), (x, y1, z0), (x, y1, z1)]
    return c if face > 0 else c[::-1]


def rect_y(y, x0, x1, z0, z1, face=1):
    """A floor (face = +1, looks up) or a ceiling (face = -1)."""
    c = [(x0, y, z1), (x1, y, z1), (x1, y, z0), (x0, y, z0)]
    return c if face > 0 else c[::-1]


def cells(lo, hi, cuts):
    edges = sorted({lo, hi, *[c for c in cuts if lo < c < hi]})
    return list(zip(edges[:-1], edges[1:]))


def wall_with_holes(z, x0, x1, y0, y1, holes):
    """The back wall as a grid of quads with rectangular openings left out."""
    out = []
    for xa, xb in cells(x0, x1, [h[0] for h in holes] + [h[1] for h in holes]):
        for ya, yb in cells(y0, y1, [h[2] for h in holes] + [h[3] for h in holes]):
            cx, cy = (xa + xb) / 2, (ya + yb) / 2
            if any(h[0] < cx < h[1] and h[2] < cy < h[3] for h in holes):
                continue
            out.append(rect_z(z, xa, xb, ya, yb))
    return out


def box(name, mat, bucket, x0, x1, y0, y1, z0, z1, bevel=0.0, drop=()):
    """A solid box in site space. `drop` removes faces by outward axis, e.g. ("-z", "-y")."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    lo, hi = S(x0, y0, z1), S(x1, y1, z0)  # Blender y runs the other way from site z
    for v in bm.verts:
        v.co = Vector((lo.x if v.co.x < 0 else hi.x, lo.y if v.co.y < 0 else hi.y, lo.z if v.co.z < 0 else hi.z))
    if drop:
        axes = {"+x": (1, 0, 0), "-x": (-1, 0, 0), "+y": (0, 0, 1), "-y": (0, 0, -1), "+z": (0, -1, 0), "-z": (0, 1, 0)}
        bm.normal_update()
        gone = [f for f in bm.faces if any((f.normal - Vector(axes[d])).length < 0.01 for d in drop)]
        bmesh.ops.delete(bm, geom=gone, context="FACES")
    if bevel:
        bmesh.ops.bevel(bm, geom=[e for e in bm.edges if len(e.link_faces) == 2], offset=bevel, segments=2, profile=0.5, affect="EDGES")
    return new_object(name, bm, mat, bucket)


def lathe(name, mat, bucket, profile, x, y, z, steps=40, stretch=1.0):
    """Spin (radius, height) about the vertical; `stretch` widens it along x."""
    bm = fixtures._lathe(profile, steps=steps)
    bmesh.ops.scale(bm, vec=(stretch, 1.0, 1.0), verts=bm.verts)
    bmesh.ops.translate(bm, verts=bm.verts, vec=S(x, y, z))
    return new_object(name, bm, mat, bucket, smooth=True)


def cyl(name, mat, bucket, r, length, x, y, z, axis="y", segments=28):
    """A cylinder centred at a site point, its length along a site axis."""
    bm = fixtures._cyl(r, length, segments, {"x": "X", "y": "Z", "z": "Y"}[axis])
    bmesh.ops.translate(bm, verts=bm.verts, vec=S(x, y, z))
    return new_object(name, bm, mat, bucket, smooth=True)


def tube(name, mat, bucket, points, radius):
    """A round tube through site-space points (a faucet spout)."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = 5
    cu.use_fill_caps = True
    sp = cu.splines.new("NURBS")
    sp.points.add(len(points) - 1)
    for p, c in zip(sp.points, points):
        p.co = (*S(*c), 1)
    sp.use_endpoint_u = True
    sp.order_u = 3
    sp.resolution_u = 10
    tmp = bpy.data.objects.new(name, cu)
    coll.objects.link(tmp)
    view.update()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(tmp, do_unlink=True)
    me.materials.clear()
    me.materials.append(M[mat])
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    bucket.append(ob)
    return ob


# ── The room itself ────────────────────────────────────────────────────────────
wx0, wx1 = WINDOW
nx0, nx1, ny0, ny1 = NICHE
quads("floor", "bathFloor", A_OBJECTS, [rect_y(FL, XL, XR, WB, ZF)])
quads(
    "ceiling",
    "bathPlaster",
    A_OBJECTS,
    [
        rect_y(CL, XL, XR, WB + SLOT, ZF, -1),
        # Inside the slot: its upstand (the lamp sits on it) and its top.
        rect_z(WB + SLOT, XL, XR, CL, CEIL, -1),
        rect_y(CEIL, XL, XR, WB, WB + SLOT, -1),
    ],
)
quads(
    "walls",
    "bathStone",
    A_OBJECTS,
    wall_with_holes(WB, XL, XR, FL, CEIL, [(wx0, wx1, FL - 1, CEIL + 1), (nx0, nx1, ny0, ny1)])
    + [rect_x(XL, WB, ZF, FL, CL, 1), rect_x(XR, WB, ZF, FL, CL, -1)]
    # The niche in the shower wall.
    + [
        rect_z(WB - 0.11, nx0, nx1, ny0, ny1),
        rect_x(nx0, WB - 0.11, WB, ny0, ny1, 1),
        rect_x(nx1, WB - 0.11, WB, ny0, ny1, -1),
        rect_y(ny0, nx0, nx1, WB - 0.11, WB, 1),
        rect_y(ny1, nx0, nx1, WB - 0.11, WB, -1),
    ]
    # The window reveal: jambs and sill. The curtain hangs inside it.
    + [
        rect_x(wx0, WB - REVEAL, WB, FL, CEIL, 1),
        rect_x(wx1, WB - REVEAL, WB, FL, CEIL, -1),
        rect_y(FL, wx0, wx1, WB - REVEAL, WB, 1),
    ],
)
# Floating vanity: one thick stone slab, open to the wall behind it.
box("vanity", "bathStone", A_OBJECTS, VANITY[0], VANITY[1], VANITY_TOP - 0.14, VANITY_TOP, WB, WB + 0.52, bevel=0.004, drop=("-z",))
# The block at the head of the tub: the filler stands on it, its supply inside.
bx0, bx1, bz0, bz1 = BLOCK
box("block", "bathStone", A_OBJECTS, bx0, bx1, FL, BLOCK_H, bz0, bz1, bevel=0.004, drop=("-y",))

# ── Loose objects ──────────────────────────────────────────────────────────────
before = set(scene.objects)
fixtures.tub(tuple(S(TUB[0], FL, TUB[1])), TUB_SIZE)
for ob in set(scene.objects) - before:
    if ob.name.startswith("tub_drain"):
        bpy.data.objects.remove(ob, do_unlink=True)
        continue
    ob.data.materials.clear()
    ob.data.materials.append(M["bathCeramic"])
    for p in ob.data.polygons:
        p.use_smooth = True
    B_OBJECTS.append(ob)

# Vessel basin on the slab.
BASIN_X = 0.65
BASIN_Z = WB + 0.27
basin = [
    (0.0, 0.0), (0.118, 0.0), (0.142, 0.01), (0.166, 0.05), (0.178, 0.105), (0.181, 0.128), (0.176, 0.135),
    (0.168, 0.128), (0.16, 0.095), (0.142, 0.05), (0.11, 0.028), (0.0, 0.024),
]
lathe("basin", "bathCeramic", B_OBJECTS, basin, BASIN_X, VANITY_TOP, BASIN_Z, steps=48, stretch=1.42)


def towel(name, x, y, z, w, d, n, h=0.036):
    for i in range(n):
        inset = 0.004 * i
        bm = fixtures._box(w - inset * 2, d - inset * 2, h, radius=0.012, segments=3)
        bmesh.ops.translate(bm, verts=bm.verts, vec=S(x, y + h * (i + 0.5), z))
        new_object(f"{name}{i}", bm, "bathLinen", B_OBJECTS, smooth=True)


towel("towelBlock", (bx0 + bx1) / 2, BLOCK_H, bz1 - 0.24, 0.19, 0.34, 3)
towel("towelVanity", 1.38, VANITY_TOP, WB + 0.25, 0.3, 0.2, 2)

bottle = [(0.0, 0.0), (0.03, 0.0), (0.033, 0.006), (0.033, 0.1), (0.028, 0.118), (0.013, 0.128), (0.013, 0.142), (0.0, 0.142)]


def bottle_at(name, x, y, z, scale=1.0):
    lathe(name, "bathAmber", B_OBJECTS, [(r * scale, h * scale) for r, h in bottle], x, y, z, steps=24)
    cyl(f"{name}Cap", "bathMetal", LIVE, 0.015 * scale, 0.022 * scale, x, y + 0.153 * scale, z, segments=20)


bottle_at("bottleNicheA", nx0 + 0.2, ny0, WB - 0.055, 1.25)
bottle_at("bottleNicheB", nx0 + 0.33, ny0, WB - 0.05, 1.0)
bottle_at("bottleVanityA", VANITY[0] + 0.2, VANITY_TOP, WB + 0.2, 1.3)
bottle_at("bottleVanityB", VANITY[0] + 0.33, VANITY_TOP, WB + 0.26, 1.05)

# ── Metal: every fitting comes out of a wall, a ceiling or a block. No exposed pipe. ──
rx, rz = RAIN
TRIM_X = GLASS_X - 0.28
box("rainHead", "bathMetal", LIVE, rx - 0.2, rx + 0.2, CL - 0.014, CL, rz - 0.2, rz + 0.2, bevel=0.003)
for i, y in enumerate((1.08, 1.3)):
    cyl(f"showerTrim{i}", "bathMetal", LIVE, 0.046, 0.014, TRIM_X, y, WB + 0.007, "z", 36)
    cyl(f"showerKnob{i}", "bathMetal", LIVE, 0.02, 0.05, TRIM_X, y, WB + 0.036, "z", 24)
    box(f"showerLever{i}", "bathMetal", LIVE, TRIM_X - 0.006, TRIM_X + 0.006, y, y + 0.062, WB + 0.05, WB + 0.062, bevel=0.002)
box("drain", "bathDark", LIVE, rx - 0.5, rx + 0.5, FL, FL + 0.003, WB + 0.09, WB + 0.15)
box("glassShoe", "bathMetal", LIVE, GLASS_X - 0.011, GLASS_X + 0.011, FL, FL + 0.022, WB, GLASS_Z)

# Wall-mounted basin spout and its lever.
SPOUT_Y = VANITY_TOP + 0.27
cyl("basinRose", "bathMetal", LIVE, 0.03, 0.01, BASIN_X, SPOUT_Y, WB + 0.005, "z", 32)
tube("basinSpout", "bathMetal", LIVE, [(BASIN_X, SPOUT_Y, WB), (BASIN_X, SPOUT_Y, WB + 0.12), (BASIN_X, SPOUT_Y, WB + 0.19), (BASIN_X, SPOUT_Y - 0.02, WB + 0.2)], 0.011)
cyl("basinLeverRose", "bathMetal", LIVE, 0.03, 0.01, BASIN_X + 0.2, SPOUT_Y, WB + 0.005, "z", 32)
cyl("basinLeverStem", "bathMetal", LIVE, 0.014, 0.05, BASIN_X + 0.2, SPOUT_Y, WB + 0.03, "z", 20)
box("basinLever", "bathMetal", LIVE, BASIN_X + 0.194, BASIN_X + 0.206, SPOUT_Y, SPOUT_Y + 0.075, WB + 0.046, WB + 0.058, bevel=0.002)

# Tub filler: a low spout on the block, reaching over the rim.
FILLER_X = (bx0 + bx1) / 2
FILLER_Z = TUB[1] - 0.12
tube(
    "tubSpout",
    "bathMetal",
    LIVE,
    [(FILLER_X, BLOCK_H, FILLER_Z), (FILLER_X, BLOCK_H + 0.1, FILLER_Z), (FILLER_X + 0.03, BLOCK_H + 0.15, FILLER_Z), (FILLER_X + 0.2, BLOCK_H + 0.15, FILLER_Z), (FILLER_X + 0.25, BLOCK_H + 0.13, FILLER_Z)],
    0.014,
)
cyl("tubSpoutBase", "bathMetal", LIVE, 0.027, 0.012, FILLER_X, BLOCK_H + 0.006, FILLER_Z, "y", 28)
cyl("tubLeverBase", "bathMetal", LIVE, 0.022, 0.05, FILLER_X, BLOCK_H + 0.025, FILLER_Z + 0.2, "y", 24)
box("tubLever", "bathMetal", LIVE, FILLER_X - 0.006, FILLER_X + 0.07, BLOCK_H + 0.05, BLOCK_H + 0.062, FILLER_Z + 0.194, FILLER_Z + 0.206, bevel=0.002)

# ── Glass, mirror, curtain, lamps ──────────────────────────────────────────────
box("glass", "bathGlass", LIVE, GLASS_X - 0.005, GLASS_X + 0.005, FL + 0.02, 2.3, WB, GLASS_Z)
mx0, mx1, my0, my1 = MIRROR
MIRROR_Z = WB + 0.035
box("mirrorBody", "bathDark", LIVE, mx0, mx1, my0, my1, WB + 0.012, MIRROR_Z - 0.001, drop=("-z", "+z"))
mirror = quads("mirror", "bathMirror", LIVE, [rect_z(MIRROR_Z, mx0, mx1, my0, my1)])
uv = mirror.data.uv_layers.new(name="UVMap")
for loop, co in zip(mirror.data.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]):
    uv.data[loop.index].uv = co

# Sheer curtain: soft folds, a little irregular, the full height of the window.
CURTAIN_Z = WB - 0.075
bm = bmesh.new()
cols, rows = 150, 10
cx0, cx1 = wx0 + 0.015, wx1 - 0.015
grid = []
for j in range(rows + 1):
    row = []
    for i in range(cols + 1):
        u, v = i / cols, j / rows
        x = cx0 + (cx1 - cx0) * u
        fold = math.sin(u * 46.0 + 0.9 * math.sin(u * 7.3)) * 0.026 + math.sin(u * 17.0 + 1.3) * 0.012
        # Folds are tight at the heading and relax toward the hem.
        z = CURTAIN_Z + fold * (0.75 + 0.25 * (1 - v))
        row.append(bm.verts.new(S(x, FL + 0.004 + (CL + 0.1 - FL) * v, z)))
    grid.append(row)
uv_layer = bm.loops.layers.uv.new("UVMap")
for j in range(rows):
    for i in range(cols):
        f = bm.faces.new([grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]])
        for loop, (di, dj) in zip(f.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]):
            loop[uv_layer].uv = ((i + di) / cols, (j + dj) / rows)
curtain = new_object("curtain", bm, "bathCurtain", LIVE, smooth=True)

SPOTS = [(rx, rz + 0.42, 80, 900.0), (BASIN_X, WB + 0.5, 62, 170.0), (TUB[0] + 0.05, TUB[1] + 0.3, 72, 420.0)]
for i, (x, z, _, _) in enumerate(SPOTS):
    cyl(f"downlight{i}", "bathGlow", LIVE, 0.034, 0.004, x, CL - 0.002, z, "y", 24)
    cyl(f"downlightTrim{i}", "bathDark", LIVE, 0.05, 0.003, x, CL - 0.0015, z, "y", 28)

# ── The stage behind the visitor: seen only by the light and by the mirror ─────
quads(
    "stage",
    "stage",
    STAGE,
    [
        rect_y(FL, XL, XR, ZF, ZS, 1),
        rect_y(CL, XL, XR, ZF, ZS, -1),
        rect_x(XL, ZF, ZS, FL, CL, 1),
        rect_x(XR, ZF, ZS, FL, CL, -1),
    ]
    + [rect_z(ZS, a, b, c, d, -1) for a, b, c, d in [(XL, -1.6, FL, CL), (-0.6, XR, FL, CL), (-1.6, -0.6, 2.2, CL)]],
)
# A doorway to a lit passage, so the mirror has somewhere to look.
quads("stageDoor", "stageGlow", STAGE, [rect_z(ZS + 1.4, -3.0, 1.0, FL, CL, -1)])
quads("stagePassage", "stage", STAGE, [rect_y(FL, -1.6, -0.6, ZS, ZS + 1.4, 1), rect_x(-1.6, ZS, ZS + 1.4, FL, CL, 1), rect_x(-0.6, ZS, ZS + 1.4, FL, CL, -1), rect_y(2.2, -1.6, -0.6, ZS, ZS + 1.4, -1)])
STAGE[-1].data.materials[0] = M["stage"]
# Two wall lights on the stage wall, for the mirror to find.
quads("stageLamps", "stageGlow", STAGE, [rect_z(ZS - 0.01, x - 0.03, x + 0.03, 1.0, 2.3, -1) for x in (1.2, 3.4)])


# ── Light ──────────────────────────────────────────────────────────────────────
WARM = (1.0, 0.72, 0.44)  # the lamps: about 2700 K


def aim(ob, direction):
    ob.rotation_euler = D(*direction).to_track_quat("-Z", "Y").to_euler()


def strip(name, x, y, z, length, width, direction, watts, along="x", color=WARM):
    data = bpy.data.lights.new(name, "AREA")
    data.shape = "RECTANGLE"
    data.size = length
    data.size_y = width
    data.energy = watts
    data.color = color
    ob = bpy.data.objects.new(name, data)
    ob.location = S(x, y, z)
    aim(ob, direction)
    if along == "y":  # a vertical strip: turn its long side upright
        ob.rotation_euler.rotate_axis("Z", math.radians(90))
    coll.objects.link(ob)
    return ob


strip("cove", (COVE_X0 + XR) / 2, CL + 0.09, WB + SLOT - 0.03, XR - COVE_X0 - 0.1, 0.03, (0, -0.55, -1), 95.0)
strip("coveLow", (XL + COVE_X0) / 2, CL + 0.09, WB + SLOT - 0.03, COVE_X0 - XL - 0.1, 0.03, (0, -0.55, -1), 16.0)
halo = 9.0
strip("haloTop", (mx0 + mx1) / 2, my1 - 0.03, WB + 0.02, mx1 - mx0 - 0.1, 0.012, (0, 1, 0.25), halo)
strip("haloBottom", (mx0 + mx1) / 2, my0 + 0.03, WB + 0.02, mx1 - mx0 - 0.1, 0.012, (0, -1, 0.25), halo)
strip("haloLeft", mx0 + 0.03, (my0 + my1) / 2, WB + 0.02, my1 - my0 - 0.1, 0.012, (-1, 0, 0.25), halo * 0.7, along="y")
strip("haloRight", mx1 - 0.03, (my0 + my1) / 2, WB + 0.02, my1 - my0 - 0.1, 0.012, (1, 0, 0.25), halo * 0.7, along="y")
strip("underVanity", (VANITY[0] + VANITY[1]) / 2, VANITY_TOP - 0.145, WB + 0.07, VANITY[1] - VANITY[0] - 0.2, 0.02, (0, -1, 0.35), 8.0)
strip("niche", (nx0 + nx1) / 2, ny1 - 0.004, WB - 0.035, nx1 - nx0 - 0.08, 0.02, (0, -1, -0.2), 2.6)

for i, (x, z, angle, watts) in enumerate(SPOTS):
    data = bpy.data.lights.new(f"spot{i}", "SPOT")
    data.energy = watts
    data.color = WARM
    data.spot_size = math.radians(angle)
    data.spot_blend = 0.55
    data.shadow_soft_size = 0.035
    ob = bpy.data.objects.new(f"spot{i}", data)
    ob.location = S(x, CL - 0.02, z)
    aim(ob, (0, -1, 0))
    coll.objects.link(ob)

world = bpy.data.worlds.new("night")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.0
scene.world = world

# ── Cycles ─────────────────────────────────────────────────────────────────────
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
try:
    prefs.compute_device_type = "CUDA"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == "CUDA"
    scene.cycles.device = "GPU"
except Exception as error:  # no GPU: the CPU gives the same picture, slower
    print("GPU unavailable:", error)
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 8
scene.cycles.diffuse_bounces = 5
scene.cycles.caustics_reflective = False
scene.cycles.caustics_refractive = False
scene.cycles.sample_clamp_indirect = 6.0
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "None"


def camera(name, p, t, fov, shift=(0.0, 0.0), clip=0.05):
    data = bpy.data.cameras.new(name)
    data.sensor_fit = "VERTICAL"
    data.lens_unit = "FOV"
    data.angle = math.radians(fov)
    data.shift_x, data.shift_y = shift
    data.clip_start = clip
    data.clip_end = 60
    ob = bpy.data.objects.new(name, data)
    ob.location = S(*p)
    ob.rotation_euler = (S(*t) - S(*p)).to_track_quat("-Z", "Y").to_euler()
    coll.objects.link(ob)
    return ob


def render(path, cam, width, height, samples):
    scene.camera = cam
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.cycles.samples = samples
    scene.render.filepath = path
    scene.render.image_settings.file_format = "PNG"
    bpy.ops.render.render(write_still=True)
    print("rendered", path)


def render_preview():
    # Everything nearer than the cut is clipped away, as on the site.
    cam = camera("visitor", CAM["p"], CAM["t"], CAM["fov"], clip=CAM["p"][2] - ZF)
    scene.view_settings.exposure = 0.0
    render(os.path.join(OUT, "preview.png"), cam, 1440 if FINAL else 1152, 900 if FINAL else 720, 256 if FINAL else 72)


if MODE == "preview":
    render_preview()
    sys.exit(0)


# ── Bake ───────────────────────────────────────────────────────────────────────
def join(objects, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects:
        o.select_set(True)
    view.objects.active = objects[0]
    if len(objects) > 1:
        bpy.ops.object.join()
    ob = view.objects.active
    ob.name = name
    return ob


def planar_uvs(ob):
    """One island per plane: every face is laid flat along its own normal, in metres."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    layer = bm.loops.layers.uv.verify()
    bm.normal_update()
    for f in bm.faces:
        n = f.normal
        ax = max(range(3), key=lambda k: abs(n[k]))
        a, b = [k for k in range(3) if k != ax]
        for loop in f.loops:
            co = loop.vert.co
            loop[layer].uv = (co[a], co[b])
    bm.to_mesh(ob.data)
    bm.free()


def pack(ob, margin):
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    view.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.select_all(action="SELECT")
    bpy.ops.uv.pack_islands(rotate=True, margin=margin)
    bpy.ops.object.mode_set(mode="OBJECT")


def smart_uvs(ob, margin):
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    view.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(72), island_margin=margin, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode="OBJECT")


def bake(ob, name, size, samples):
    image = bpy.data.images.new(name, size, size, alpha=False, float_buffer=True)
    image.colorspace_settings.name = "Non-Color"
    for slot in ob.material_slots:
        nt = slot.material.node_tree
        node = nt.nodes.get("bakeTarget") or nt.nodes.new("ShaderNodeTexImage")
        node.name = "bakeTarget"
        node.image = image
        nt.nodes.active = node
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    view.objects.active = ob
    scene.cycles.samples = samples
    scene.render.bake.margin = 12
    scene.render.bake.margin_type = "EXTEND"
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, use_clear=True)
    px = np.empty(size * size * 4, dtype=np.float32)
    image.pixels.foreach_get(px)
    rgb = px.reshape(size, size, 4)[:, :, :3]
    lit = rgb[rgb.sum(axis=2) > 0]
    print(f"baked {name}: mean {lit.mean():.3f}  p50 {np.percentile(lit, 50):.3f}  p99 {np.percentile(lit, 99):.3f}  max {lit.max():.2f}")
    image.filepath_raw = os.path.join(OUT, f"{name}.exr")
    image.file_format = "OPEN_EXR"
    image.save()
    # 8-bit copy the site loads: sRGB-encoded (value / LIGHT_RANGE), with a breath of dither against banding.
    v = np.clip(rgb / LIGHT_RANGE, 0.0, 1.0)
    enc = np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)
    enc = np.clip(enc + (np.random.default_rng(7).random(enc.shape, dtype=np.float32) - 0.5) / 255.0, 0.0, 1.0)
    out = bpy.data.images.new(f"{name}-8", size, size, alpha=False)
    out.colorspace_settings.name = "Non-Color"
    out.pixels.foreach_set(np.concatenate([enc, np.ones((size, size, 1), dtype=np.float32)], axis=2).astype(np.float32).ravel())
    out.filepath_raw = os.path.join(OUT, f"{name}.png")
    out.file_format = "PNG"
    out.save()


room = join(A_OBJECTS, "bathRoom")
planar_uvs(room)
pack(room, 0.004)
things = join(B_OBJECTS, "bathThings")
smart_uvs(things, 0.02)

bake(room, "light-a", 2048, 640 if FINAL else 96)
bake(things, "light-b", 1024, 640 if FINAL else 96)

# ── Geometry for the site ──────────────────────────────────────────────────────
by_material = {}
for ob in LIVE:
    by_material.setdefault(ob.data.materials[0].name, []).append(ob)
live = [join(objs, name) for name, objs in by_material.items()]
bpy.ops.object.select_all(action="DESELECT")
for ob in [room, things, *live]:
    ob.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, "bathroom.glb"),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_image_format="NONE",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=12,
    export_draco_texcoord_quantization=14,
)
print("exported bathroom.glb")

# ── What the mirror shows ──────────────────────────────────────────────────────
# The visitor's eye mirrored in the glass, looking back into the room through the
# mirror's own outline (wider than the mirror, so the picture can slide as the eye moves).
OVERSCAN = 1.5
cx, cy, cz = CAM["p"]
depth = cz - MIRROR_Z
plate_w = (mx1 - mx0) * OVERSCAN
plate_h = (my1 - my0) * OVERSCAN
eye = (cx, cy, 2 * MIRROR_Z - cz)
mirror_cam = camera("mirrorEye", eye, (cx, cy, MIRROR_Z), 10.0, clip=depth + 0.002)
mirror_cam.data.sensor_fit = "HORIZONTAL"
mirror_cam.data.angle = 2 * math.atan(plate_w / 2 / depth)
mirror_cam.data.shift_x = -((mx0 + mx1) / 2 - cx) / plate_w
mirror_cam.data.shift_y = ((my0 + my1) / 2 - cy) / plate_w
for ob in live:
    if ob.name == "bathMirror":
        ob.hide_render = True
scene.view_settings.exposure = 0.0
render(os.path.join(OUT, "mirror.png"), mirror_cam, 1024, round(1024 * plate_h / plate_w), 256 if FINAL else 64)
for ob in live:
    ob.hide_render = False

# ── The room as a panorama, for reflections ────────────────────────────────────
PANO = (0.2, 1.3, -1.2)
pano = camera("pano", PANO, (PANO[0] + 1, PANO[1], PANO[2]), 90.0)
pano.data.type = "PANO"
pano.data.panorama_type = "EQUIRECTANGULAR"
scene.camera = pano
scene.render.resolution_x, scene.render.resolution_y = 768, 384
scene.cycles.samples = 256 if FINAL else 64
scene.render.image_settings.file_format = "HDR"
scene.render.filepath = os.path.join(OUT, "env.hdr")
bpy.ops.render.render(write_still=True)
print("rendered env.hdr")

# ── Where things are, for the live scene (world/scenes/bathroom.ts) ────────────
import json  # noqa: E402

layout = {
    "y0": Y0, "floor": FL, "ceiling": CL, "back": WB, "left": XL, "right": XR, "front": ZF,
    "lightRange": LIGHT_RANGE,
    "camera": CAM,
    "rain": {"x": rx, "z": rz, "size": 0.4},
    "glass": {"x": GLASS_X, "z": GLASS_Z},
    "basin": {"x": BASIN_X, "z": BASIN_Z, "spoutY": SPOUT_Y - 0.02, "spoutZ": WB + 0.2, "rimY": VANITY_TOP + 0.03},
    "tub": {"x": TUB[0], "z": TUB[1], "size": TUB_SIZE, "spoutX": FILLER_X + 0.25, "spoutY": BLOCK_H + 0.125, "spoutZ": FILLER_Z},
    "window": {"x0": wx0, "x1": wx1, "z": CURTAIN_Z},
    "mirror": {"x0": mx0, "x1": mx1, "y0": my0, "y1": my1, "z": MIRROR_Z, "overscan": OVERSCAN, "eye": [cx, cy, cz]},
    "pano": list(PANO),
    "spots": [[x, z] for x, z, _, _ in SPOTS],
}
with open(os.path.join(OUT, "layout.json"), "w", encoding="utf-8") as fh:
    json.dump(layout, fh, indent=2)

scene.render.image_settings.file_format = "PNG"
render_preview()
