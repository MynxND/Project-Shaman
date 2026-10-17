"""Run with blender --background --python ... -- STAGE --config PATH.
Independent model, rig, animation, import and rendering checkpoints.
"""
import argparse
import json
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

sys.path.insert(0, str(Path(__file__).parent))
from gait import foot, knee

ROOT = Path(__file__).resolve().parents[2]
p = argparse.ArgumentParser()
p.add_argument('stage', choices=['model', 'rig', 'animate', 'render', 'import', 'fixtures', 'validate'])
p.add_argument('--config', default=str(Path(__file__).with_name('config.json')))
p.add_argument('--input')
args = p.parse_args(sys.argv[sys.argv.index('--')+1:])
c = json.loads(Path(args.config).read_text())
if c['size'] <= 0 or c['pixelScale'] <= 0 or c['size'] % c['pixelScale']:
    raise ValueError('size must be positive and divisible by pixelScale')
if c['frames'] < 2 or c['durationMs'] <= 0 or c['orthoScale'] <= 0:
    raise ValueError('Invalid timeline or framing')
out = ROOT / c['output']
out.mkdir(parents=True, exist_ok=True)
names = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']


def save(name):
    bpy.ops.wm.save_as_mainfile(filepath=str(out/name))


def load(name):
    bpy.ops.wm.open_mainfile(filepath=str(out/name))


def model():
    if c.get('modelBuilder') == 'santet':
        from santet_model import build
        build(c, out)
        save('model.blend')
        return
    bpy.ops.wm.read_factory_settings(use_empty=True)
    colors = {'skin': (0.66, .38, .23, 1), 'cream': (.8, .69, .46, 1),
              'red': (.43, .07, .04, 1), 'moss': (.17, .25, .1, 1),
              'hair': (.76, .74, .67, 1), 'dark': (.07, .045, .035, 1), 'gold': (.55, .3, .07, 1)}
    mats = {}
    for name, color in colors.items():
        m = bpy.data.materials.new(name)
        m.diffuse_color = color
        m.use_nodes = True
        shader = m.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value = color
        shader.inputs['Roughness'].default_value = 1
        mats[name] = m

    def part(name, loc, scale, color, bone, sphere=False):
        if sphere:
            bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, location=loc)
        else:
            bpy.ops.mesh.primitive_cube_add(size=2, location=loc)
        obj = bpy.context.object
        obj.name = name
        obj.scale = scale
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        obj.data.materials.append(mats[color])
        obj['sprite_bone'] = bone
        return obj

    part('tunic', (0, 0, 1.25), (.33, .21, .4), 'cream', 'torso')
    part('sash', (0, -.005, 1.05), (.35, .225, .07), 'red', 'torso')
    part('apron', (0, -.225, .89), (.18, .025, .22), 'moss', 'torso')
    part('amulet', (0, -.245, 1.06), (.075, .025, .075), 'gold', 'torso', True)
    part('mantle', (0, .015, 1.58), (.42, .245, .12), 'gold', 'torso')
    part('head', (0, -.015, 1.96), (.39, .3, .39), 'skin', 'head', True)
    part('hair', (0, .025, 2.15), (.41, .32, .27), 'hair', 'head', True)
    for x in [-.16, .16]:
        part('eye', (x, -.295, 1.97), (.04, .025, .065), 'dark', 'head')
    for i in range(5):
        tuft = part('fringe', ((i-2)*.13, -.27, 2.16), (.085, .07, .16), 'hair', 'head')
        tuft.rotation_euler[1] = (i-2)*.16
    for side, x in [('L', .21), ('R', -.21)]:
        part('thigh.'+side, (x, 0, .74), (.125, .14, .22), 'dark', 'thigh.'+side)
        part('shin.'+side, (x, 0, .31), (.105, .105, .21), 'skin', 'shin.'+side)
        part('sandal.'+side, (x, -.07, .075), (.14, .22, .075), 'gold', 'foot.'+side)
        part('sleeve.'+side, (x*2.1, 0, 1.26), (.12, .14, .25), 'cream', 'arm.'+side)
        part('hand.'+side, (x*2.1, -.01, .97), (.12, .12, .12), 'skin', 'arm.'+side, True)
    save('model.blend')


def rig():
    load('model.blend')
    data = bpy.data.armatures.new('shaman-skeleton')
    arm = bpy.data.objects.new('ShamanRig', data)
    bpy.context.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    def bone(name, head, tail, parent='root'):
        b = data.edit_bones.new(name)
        b.head, b.tail = head, tail
        if parent:
            b.parent = data.edit_bones[parent]
    bone('root', (0,0,0), (0,0,.3), None)
    bone('torso', (0,0,.96), (0,0,1.65))
    bone('head', (0,0,1.65), (0,0,2.35), 'torso')
    for side,x in [('L',.21),('R',-.21)]:
        bone('thigh.'+side, (x,0,.96), (x,-.08,.52))
        bone('shin.'+side, (x,-.08,.52), (x,0,.08), 'thigh.'+side)
        bone('foot.'+side, (x,0,.08), (x,-.25,.08), 'shin.'+side)
        bone('arm.'+side, (x*2.1,0,1.51), (x*2.1,0,.95), 'torso')
    bpy.ops.object.mode_set(mode='OBJECT')
    for obj in list(bpy.context.scene.objects):
        if obj.type != 'MESH':
            continue
        group = obj.vertex_groups.new(name=obj['sprite_bone'])
        group.add(list(range(len(obj.data.vertices))), 1.0, 'REPLACE')
        mod = obj.modifiers.new('Skeleton deformation', 'ARMATURE')
        mod.object = arm
        obj.parent = arm
    save('rig.blend')


def import_model():
    if not args.input:
        raise ValueError('--input rigged GLB/FBX required')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    source = Path(args.input).resolve()
    if source.suffix.lower() == '.glb':
        bpy.ops.import_scene.gltf(filepath=str(source))
    elif source.suffix.lower() == '.fbx':
        bpy.ops.import_scene.fbx(filepath=str(source))
    else:
        raise ValueError('Expected .glb or .fbx')
    arms = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
    if len(arms) != 1:
        raise ValueError('Exactly one armature required; no automatic rigging')
    if not any(o.type == 'MESH' and any(m.type == 'ARMATURE' and m.object == arms[0] for m in o.modifiers) for o in bpy.context.scene.objects):
        raise ValueError('Model has no armature-skinned mesh')
    report = {'source': str(source), 'bones': [b.name for b in arms[0].data.bones],
              'actions': [a.name for a in bpy.data.actions], 'requiresManualNormalization': True}
    (out/'import-report.json').write_text(json.dumps(report, indent=2))
    save('rig.blend')


def animate():
    load('rig.blend')
    arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
    if c.get('sourceAction'):
        action = bpy.data.actions.get(c['sourceAction'])
        if action is None:
            raise ValueError('sourceAction not found')
        arm.animation_data_create()
        arm.animation_data.action = action
        save('animation.blend')
        return
    if c['action'] != 'walk':
        raise ValueError('Only walk is authored; use sourceAction for idle/run/attack/skill')
    mapping = c['boneMap']
    for actual in mapping.values():
        if actual not in arm.pose.bones:
            raise ValueError('Missing mapped bone '+actual)
    # Authored walk adapter requires this normalized Z-up, -Y-forward rest rig.
    # Other imported skeleton proportions/orientations need manual retargeting.
    arm.animation_data_clear()
    arm.animation_data_create()
    arm.animation_data.action = bpy.data.actions.new('walk')
    scene = bpy.context.scene
    scene.render.fps = c['frames']
    scene.frame_start, scene.frame_end = 1, c['frames']
    telemetry = []
    def place(name, start, end):
        pb = arm.pose.bones[mapping[name]]
        rotation = (Vector(end)-Vector(start)).to_track_quat('Y','Z').to_matrix().to_4x4()
        rotation.translation = Vector(start)
        pb.matrix = rotation
        bpy.context.view_layer.update()
    for i in range(c['frames']+1):
        scene.frame_set(i+1)
        phase = i/c['frames']
        sample = {'frame':i, 'phase':phase, 'feet':{}}
        for side,x,offset in [('L',.21,0), ('R',-.21,.5)]:
            y,z,stance = foot(phase+offset, c['stride'], c['footLift'])
            hip, ankle = Vector((x,0,.96)), Vector((x,y,.08+z))
            joint = knee(hip, ankle, .45)
            place('thigh.'+side, hip, joint)
            place('shin.'+side, joint, ankle)
            place('foot.'+side, ankle, ankle+Vector((0,-.25,0)))
            shoulder = Vector((x*2.1,0,1.51))
            amplitude = .025 if c.get('heldArm') == side else .13
            hand = shoulder+Vector((0,-amplitude*math.sin(2*math.pi*(phase+offset)), -.56))
            place('arm.'+side, shoulder, hand)
            actual = arm.matrix_world @ arm.pose.bones[mapping['foot.'+side]].head
            sample['feet'][side] = {'target':list(ankle), 'actual':list(actual), 'stance':stance}
        for pb in arm.pose.bones:
            pb.rotation_mode = 'QUATERNION'
            pb.keyframe_insert('location', frame=i+1)
            pb.keyframe_insert('rotation_quaternion', frame=i+1)
            pb.keyframe_insert('scale', frame=i+1)
        telemetry.append(sample)
    (out/'gait.json').write_text(json.dumps(telemetry, indent=2))
    scene.frame_set(1)
    save('animation.blend')


def render():
    load('animation.blend')
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = c.get('samples', 8)
    scene.cycles.use_denoising = False
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = 4
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.resolution_x = scene.render.resolution_y = c['size']//c['pixelScale']
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = 'Standard'
    scene.world = bpy.data.worlds.new('studio-world')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.45,.45,.45,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .7
    # Remove imported cameras/lights so the fixed setup alone controls framing.
    for obj in list(scene.objects):
        if obj.type in ['CAMERA','LIGHT']:
            bpy.data.objects.remove(obj, do_unlink=True)
    bpy.ops.object.camera_add()
    cam = bpy.context.object
    cam.data.type, cam.data.ortho_scale = 'ORTHO', c['orthoScale']
    scene.camera = cam
    bpy.ops.object.light_add(type='AREA', location=(-3,-4,6))
    light = bpy.context.object
    light.data.energy, light.data.shape, light.data.size = 400, 'DISK', 4
    light.rotation_euler = (Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
    target = Vector(c['cameraTarget'])
    elevation = math.radians(c['cameraElevation'])
    records = []
    # Orbit only between directional batches; camera is fixed for every clip.
    for d,name in enumerate(names):
        az = math.radians(d*45)
        cam.location = target+Vector((math.sin(az)*6*math.cos(elevation), -math.cos(az)*6*math.cos(elevation), 6*math.sin(elevation)))
        cam.rotation_euler = (target-cam.location).to_track_quat('-Z','Y').to_euler()
        bpy.context.view_layer.update()
        ground = world_to_camera_view(scene, cam, Vector((0,0,0)))
        anchor = [round(ground.x*c['size']), round((1-ground.y)*c['size'])]
        for i in range(c['frames']):
            scene.frame_set(c.get('startFrame',1)+i*c.get('frameStep',1))
            path = out/'render'/name/f'{i:02}.png'
            path.parent.mkdir(parents=True, exist_ok=True)
            scene.render.filepath = str(path)
            bpy.ops.render.render(write_still=True)
            records.append({'direction':name, 'angle':d*45, 'index':i, 'groundAnchor':anchor,
                            'path':path.relative_to(out).as_posix(), 'durationMs':c['durationMs']/c['frames']})
    (out/'render.json').write_text(json.dumps(records, indent=2))
    save('render.blend')


def fixtures():
    load('rig.blend')
    bpy.ops.export_scene.gltf(filepath=str(out/'placeholder.glb'), export_format='GLB', export_animations=False)
    bpy.ops.export_scene.fbx(filepath=str(out/'placeholder.fbx'), bake_anim=False, add_leaf_bones=False)


def validate():
    # Reopen the saved animation and evaluate keyframes, rather than trusting
    # the intended IK targets alone. Check actual skinned sandal vertices too.
    load('animation.blend')
    arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
    telemetry = json.loads((out/'gait.json').read_text())
    max_error, max_floor_error = 0.0, 0.0
    samples = []
    for sample in telemetry:
        bpy.context.scene.frame_set(sample['frame']+1)
        deps = bpy.context.evaluated_depsgraph_get()
        record = {}
        for side in ['L', 'R']:
            pos = arm.matrix_world @ arm.pose.bones[c['boneMap']['foot.'+side]].head
            max_error = max(max_error, (pos-Vector(sample['feet'][side]['target'])).length)
            sandal = bpy.data.objects.get('sandal.'+side)
            if sandal:
                evaluated = sandal.evaluated_get(deps)
                lowest = min((evaluated.matrix_world @ v.co).z for v in evaluated.data.vertices)
                expected = sample['feet'][side]['target'][2]-.08
                max_floor_error = max(max_floor_error, abs(lowest-expected))
            record[side] = list(pos)
        samples.append(record)
    if max_error > 1e-5 or max_floor_error > 1e-5:
        raise ValueError(f'Saved animation/contact failed: {max_error}, {max_floor_error}')
    report = {'savedAnimationPassed': True, 'maxBoneTargetError': max_error,
              'maxSkinnedSoleGroundError': max_floor_error, 'samples': samples}
    (out/'saved-animation-qa.json').write_text(json.dumps(report, indent=2))
    print(json.dumps({k:v for k,v in report.items() if k != 'samples'}))

globals()[args.stage if args.stage != 'import' else 'import_model']()
