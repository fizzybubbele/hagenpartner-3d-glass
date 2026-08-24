from pathlib import Path
import math
import bpy

ROOT = Path(__file__).resolve().parents[1]
OUT = Path('/tmp/pwfix/blender-bevel-preview.png')

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/medias/3D-Hypercross-rounded-strong.glb'))
mesh = next(o for o in bpy.context.scene.objects if o.type == 'MESH')

mat = bpy.data.materials.new('Preview')
mat.use_nodes = True
bsdf = mat.node_tree.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (0.78, 0.86, 0.92, 1)
bsdf.inputs['Roughness'].default_value = 0.3
if mesh.data.materials:
    mesh.data.materials[0] = mat
else:
    mesh.data.materials.append(mat)

cam_data = bpy.data.cameras.new('Cam')
cam = bpy.data.objects.new('Cam', cam_data)
bpy.context.scene.collection.objects.link(cam)
bpy.context.scene.camera = cam
cam.location = (6.5, -7.5, 5.2)
cam.rotation_euler = (math.radians(58), 0, math.radians(42))

light_data = bpy.data.lights.new('L', 'AREA')
light_data.energy = 500
light_data.size = 5
light = bpy.data.objects.new('L', light_data)
bpy.context.scene.collection.objects.link(light)
light.location = (4, -3, 8)

world = bpy.data.worlds.new('W')
bpy.context.scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (0.12, 0.12, 0.13, 1)

bpy.context.scene.render.engine = 'BLENDER_EEVEE'
bpy.context.scene.render.resolution_x = 900
bpy.context.scene.render.resolution_y = 900
bpy.context.scene.render.filepath = str(OUT)
bpy.ops.render.render(write_still=True)
print('rendered', OUT)
