"""Install and enable the Blender MCP addon, then save preferences."""
from pathlib import Path
import bpy

ADDON_PATH = Path(__file__).with_name('addon.py').resolve()

print(f'Installing addon from {ADDON_PATH}')
bpy.ops.preferences.addon_install(filepath=str(ADDON_PATH), overwrite=True)

# Single-file addons are registered under their filename stem.
for module_name in ('addon', 'blender_mcp', 'blender-mcp'):
    try:
        bpy.ops.preferences.addon_enable(module=module_name)
        print(f'Enabled module: {module_name}')
        break
    except Exception as exc:
        print(f'Could not enable {module_name}: {exc}')

# Find enabled addon by bl_info name
enabled = []
for mod_name, mod in bpy.context.preferences.addons.items():
    enabled.append(mod_name)
print('Enabled addons sample:', [n for n in enabled if 'mcp' in n.lower() or n == 'addon'][:20])

bpy.ops.wm.save_userpref()
print('Preferences saved.')
