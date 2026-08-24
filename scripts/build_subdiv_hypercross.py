"""
Round the Hypercross while keeping the original plate-union silhouette.

Uses Blender SDF grid ops so concave (inner) notches get real fillets
without 3-way bevel pinching:

  1) Boolean-union three 5×5×1.2 plates
  2) Mesh → SDF
  3) Morphological closing (outer rounds)
  4) SDF Grid Fillet (inner / concave rounds)
  5) SDF → Mesh, cleanup, normalize to 5-unit frame
"""
from pathlib import Path
import math
import bpy

ROOT = Path(__file__).resolve().parents[1]
OUT_LIGHT = ROOT / 'public' / 'medias' / '3D-Hypercross-rounded.glb'
OUT_STRONG = ROOT / 'public' / 'medias' / '3D-Hypercross-rounded-strong.glb'

ARM = 2.5
THICK = 0.6


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def build_plate_union():
    def plate(name, scale):
        bpy.ops.mesh.primitive_cube_add(size=2)
        obj = bpy.context.active_object
        obj.name = name
        obj.scale = scale
        bpy.ops.object.transform_apply(scale=True)
        return obj

    xy = plate('PlateXY', (ARM, ARM, THICK))
    xz = plate('PlateXZ', (ARM, THICK, ARM))
    yz = plate('PlateYZ', (THICK, ARM, ARM))

    bpy.ops.object.select_all(action='DESELECT')
    xy.select_set(True)
    bpy.context.view_layer.objects.active = xy
    for other, tag in ((xz, 'XZ'), (yz, 'YZ')):
        mod = xy.modifiers.new('B' + tag, 'BOOLEAN')
        mod.operation = 'UNION'
        mod.solver = 'EXACT'
        mod.object = other
        bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(other, do_unlink=True)

    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=1e-4)
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')

    print(
        'plate union',
        'verts', len(xy.data.vertices),
        'dims', tuple(round(v, 4) for v in xy.dimensions),
    )
    return xy


def build_sdf_fillet_group(name, voxel, band, outer_r, fillet_iters, adaptivity):
    # Remove prior group with same name.
    existing = bpy.data.node_groups.get(name)
    if existing:
        bpy.data.node_groups.remove(existing)

    ng = bpy.data.node_groups.new(name, 'GeometryNodeTree')
    nodes, links = ng.nodes, ng.links
    ng.interface.new_socket(name='Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket(name='Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    nin = nodes.new('NodeGroupInput')
    nin.location = (-900, 0)
    nout = nodes.new('NodeGroupOutput')
    nout.location = (700, 0)

    to_sdf = nodes.new('GeometryNodeMeshToSDFGrid')
    to_sdf.location = (-660, 0)
    to_sdf.inputs['Voxel Size'].default_value = voxel
    to_sdf.inputs['Band Width'].default_value = band

    # Outer fillets via morphological closing: dilate then erode.
    dil = nodes.new('GeometryNodeSDFGridOffset')
    dil.location = (-420, 60)
    dil.inputs['Distance'].default_value = outer_r
    ero = nodes.new('GeometryNodeSDFGridOffset')
    ero.location = (-180, 60)
    ero.inputs['Distance'].default_value = -outer_r

    # Inner / concave fillets.
    fil = nodes.new('GeometryNodeSDFGridFillet')
    fil.location = (60, 0)
    fil.inputs['Iterations'].default_value = fillet_iters

    to_mesh = nodes.new('GeometryNodeGridToMesh')
    to_mesh.location = (300, 0)
    to_mesh.inputs['Threshold'].default_value = 0.0
    to_mesh.inputs['Adaptivity'].default_value = adaptivity

    links.new(nin.outputs['Geometry'], to_sdf.inputs['Mesh'])
    links.new(to_sdf.outputs['SDF Grid'], dil.inputs['Grid'])
    links.new(dil.outputs['Grid'], ero.inputs['Grid'])
    links.new(ero.outputs['Grid'], fil.inputs['Grid'])
    links.new(fil.outputs['Grid'], to_mesh.inputs['Grid'])
    links.new(to_mesh.outputs['Mesh'], nout.inputs['Geometry'])
    return ng


def apply_sdf_fillet(obj, ng_name, voxel, band, outer_r, fillet_iters, adaptivity):
    ng = build_sdf_fillet_group(
        ng_name,
        voxel=voxel,
        band=band,
        outer_r=outer_r,
        fillet_iters=fillet_iters,
        adaptivity=adaptivity,
    )
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    mod = obj.modifiers.new('SDFFillet', 'NODES')
    mod.node_group = ng
    bpy.ops.object.modifier_apply(modifier='SDFFillet')

    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=1e-5)
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')

    wn = obj.modifiers.new('WN', 'WEIGHTED_NORMAL')
    wn.keep_sharp = False
    wn.mode = 'FACE_AREA'
    bpy.ops.object.modifier_apply(modifier='WN')

    try:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
    except Exception:
        bpy.ops.object.shade_smooth()

    max_dim = max(obj.dimensions)
    if max_dim > 0 and abs(max_dim - 5.0) > 1e-4:
        s = 5.0 / max_dim
        obj.scale = (s, s, s)
        bpy.ops.object.transform_apply(scale=True)

    dims = tuple(round(v, 4) for v in obj.dimensions)
    print(
        f'SDF outer_r={outer_r} fillet_iters={fillet_iters} voxel={voxel}: '
        f'verts={len(obj.data.vertices)} dims={dims}'
    )
    if abs(max(dims) - 5.0) > 0.05:
        raise RuntimeError(f'Dims drifted from original 5³: {dims}')


def export_glb(obj, path: Path):
    bpy.ops.object.select_all(action='DESELECT')
    obj.name = 'Cube'
    obj.data.name = 'Cube'
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
    print(f'Wrote {path} ({path.stat().st_size} bytes)')


def bake(voxel, band, outer_r, fillet_iters, adaptivity, path, ng_name):
    reset_scene()
    obj = build_plate_union()
    apply_sdf_fillet(
        obj,
        ng_name=ng_name,
        voxel=voxel,
        band=band,
        outer_r=outer_r,
        fillet_iters=fillet_iters,
        adaptivity=adaptivity,
    )
    export_glb(obj, path)


def main():
    # Fillet iterations roughly control inner radius; keep outer_r modest
    # so the plate silhouette stays readable.
    bake(0.04, 14, 0.09, 22, 0.02, OUT_LIGHT, 'HyperSDF_Light')
    bake(0.035, 16, 0.13, 34, 0.015, OUT_STRONG, 'HyperSDF_Strong')
    print('done')


if __name__ == '__main__':
    main()
