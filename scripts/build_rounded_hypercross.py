"""
Build a clean Hypercross from an extruded 2D plus, then bevel.
This avoids the broken 3-way junctions of beveling the original boolean GLB.
"""
from pathlib import Path
import bmesh
import bpy
import math
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT_SHARP = ROOT / 'public' / 'medias' / '3D-Hypercross-procedural-sharp.glb'
OUT_LIGHT = ROOT / 'public' / 'medias' / '3D-Hypercross-rounded.glb'
OUT_STRONG = ROOT / 'public' / 'medias' / '3D-Hypercross-rounded-strong.glb'
PREVIEW = Path('/tmp/pwfix/blender-bevel-preview.png')

# Match original Hypercross proportions (~5 unit bounding cube after scale).
ARM = 2.5          # half-length of each arm from center
THICK = 0.85       # arm half-width
DEPTH = 2.5        # half-depth (Z)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_plus_solid():
    """Create a manifold plus/cross mesh by extruding a 2D plus polygon."""
    # Outer outline of a plus in XY (clockwise), then extrude ±DEPTH in Z via solidify-like bmesh.
    # Plus silhouette points (outer boundary), starting top-left of upper arm:
    hw, hh, arm = THICK, THICK, ARM
    # 12-point plus outline
    pts_2d = [
        (-hw, arm), (hw, arm), (hw, hw), (arm, hw), (arm, -hw), (hw, -hw),
        (hw, -arm), (-hw, -arm), (-hw, -hw), (-arm, -hw), (-arm, hw), (-hw, hw),
    ]

    mesh = bpy.data.meshes.new('Hypercross')
    obj = bpy.data.objects.new('Hypercross', mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    bm = bmesh.new()
    verts_bot = [bm.verts.new((x, y, -DEPTH)) for x, y in pts_2d]
    verts_top = [bm.verts.new((x, y, DEPTH)) for x, y in pts_2d]
    bm.verts.ensure_lookup_table()

    # Top + bottom faces
    bm.faces.new(verts_top)
    bm.faces.new(list(reversed(verts_bot)))

    # Side faces
    n = len(pts_2d)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((verts_bot[i], verts_bot[j], verts_top[j], verts_top[i]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    return obj


def bevel(obj, width, segments):
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    mod = obj.modifiers.new(name='Bevel', type='BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    mod.angle_limit = math.radians(30)
    mod.affect = 'EDGES'
    mod.profile = 0.7
    mod.miter_outer = 'MITER_ARC'
    mod.loop_slide = True
    mod.use_clamp_overlap = True
    mod.harden_normals = False
    mod.vmesh_method = 'CUTOFF'
    bpy.ops.object.modifier_apply(modifier=mod.name)

    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.mesh.faces_shade_smooth()
    bpy.ops.object.mode_set(mode='OBJECT')
    # Auto-smooth keeps big faces flat while fillet bands stay soft.
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(30))
    except Exception:
        pass

    print(f'bevel w={width}: verts={len(obj.data.vertices)} dims={tuple(obj.dimensions)}')


def export(obj, path: Path):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_normals=True,
    )
    print('Wrote', path, path.stat().st_size)


def render_preview(obj, path: Path):
    mat = bpy.data.materials.new('Preview')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (0.78, 0.86, 0.92, 1)
    bsdf.inputs['Roughness'].default_value = 0.28
    obj.data.materials.clear()
    obj.data.materials.append(mat)

    cam_data = bpy.data.cameras.new('Cam')
    cam = bpy.data.objects.new('Cam', cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    cam.location = (7, -8, 5.5)
    cam.rotation_euler = (math.radians(58), 0, math.radians(42))

    light_data = bpy.data.lights.new('L', 'AREA')
    light_data.energy = 600
    light_data.size = 6
    light = bpy.data.objects.new('L', light_data)
    bpy.context.scene.collection.objects.link(light)
    light.location = (4, -3, 9)

    world = bpy.data.worlds.new('W')
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (0.12, 0.12, 0.13, 1)

    bpy.context.scene.render.engine = 'BLENDER_EEVEE'
    bpy.context.scene.render.resolution_x = 900
    bpy.context.scene.render.resolution_y = 900
    bpy.context.scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    print('preview', path)


if __name__ == '__main__':
    # Sharp procedural (for reference / optional swap)
    reset()
    sharp = make_plus_solid()
    export(sharp, OUT_SHARP)

    # Light round
    reset()
    light = make_plus_solid()
    bevel(light, width=0.10, segments=3)
    export(light, OUT_LIGHT)

    # Strong round + preview
    reset()
    strong = make_plus_solid()
    bevel(strong, width=0.16, segments=4)
    export(strong, OUT_STRONG)
    render_preview(strong, PREVIEW)
    print('Done.')
