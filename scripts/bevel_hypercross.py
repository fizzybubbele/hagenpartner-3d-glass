"""
Subtle chamfer on Hypercross hard edges. Fat Loop/Bevel widths melt the
arm junctions on this boolean-style topology — keep it light and faceted.
"""
from pathlib import Path
import math
import bpy

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'public' / 'medias' / '3D-Hypercross.glb'
OUT_LIGHT = ROOT / 'public' / 'medias' / '3D-Hypercross-rounded.glb'
OUT_STRONG = ROOT / 'public' / 'medias' / '3D-Hypercross-rounded-strong.glb'


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def apply_bevel(obj, width: float, segments: int):
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    if obj.data.has_custom_normals:
        bpy.ops.mesh.customdata_custom_splitnormals_clear()

    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=1e-4)
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')

    before = len(obj.data.vertices)
    mod = obj.modifiers.new(name='Bevel', type='BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    mod.angle_limit = math.radians(40)
    mod.affect = 'EDGES'
    mod.profile = 0.5
    mod.miter_outer = 'MITER_SHARP'
    mod.loop_slide = True
    mod.use_clamp_overlap = True
    mod.harden_normals = False
    mod.vmesh_method = 'CUTOFF'
    bpy.ops.object.modifier_apply(modifier=mod.name)

    # Keep it CAD-like: mostly flat faces, only the tiny chamfer bands soft.
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.faces_shade_flat()
    bpy.ops.object.mode_set(mode='OBJECT')
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(20))
    except Exception:
        pass

    after = len(obj.data.vertices)
    dims = tuple(obj.dimensions)
    print(f'width={width} segs={segments}: {before}→{after} verts dims={dims}')
    if after <= before:
        raise RuntimeError('Bevel did nothing')
    if max(dims) > 6.5:
        raise RuntimeError(f'Dims exploded: {dims}')


def bake(width, out_path, segments):
    reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(SRC))
    for obj in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
        apply_bevel(obj, width, segments)
    bpy.ops.export_scene.gltf(
        filepath=str(out_path),
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_normals=True,
    )
    print('Wrote', out_path, out_path.stat().st_size)


if __name__ == '__main__':
    bake(0.06, OUT_LIGHT, 2)
    bake(0.11, OUT_STRONG, 3)
    print('Done.')
