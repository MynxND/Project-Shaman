"""Original Santet mesh reconstruction from owned sprites.
Actual curved mesh surfaces carry UV-projected source costume/face detail.
No direction-dependent image swaps, sprites/billboards or independent AI poses.
"""
import bpy
import json
import math
from mathutils import Vector


def build(config, out):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    materials = {}
    colors = {'skin':'D49469','skinLight':'ECB184','skinDark':'A25C48',
              'cloth':'302837','clothLight':'453749','gold':'B78A42','goldLight':'E7BE70',
              'red':'9F2025','redLight':'D33C35','hair':'8D849F','hairLight':'C4BDD2',
              'hairDark':'514859','wood':'473026','dark':'241D25','ivory':'DDD0A4'}

    def color(name):
        value=colors[name]
        # Hex reference colors converted from sRGB to scene linear.
        rgb=[int(value[i:i+2],16)/255 for i in (0,2,4)]
        return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb)+(1,)

    def material(name, texture=None):
        key=(name,texture)
        if key in materials:
            return materials[key]
        m=bpy.data.materials.new(name if not texture else 'source-'+texture)
        m.diffuse_color=color(name)
        m.use_nodes=True
        nodes=m.node_tree.nodes
        bsdf=nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value=color(name)
        bsdf.inputs['Roughness'].default_value=.92
        bsdf.inputs['Specular IOR Level'].default_value=.1
        bsdf.inputs['Emission Color'].default_value=color(name)
        bsdf.inputs['Emission Strength'].default_value=.35
        if texture:
            tex=nodes.new('ShaderNodeTexImage')
            tex.image=bpy.data.images.load(str(out/'textures'/texture),check_existing=True)
            tex.image.pack()
            tex.interpolation='Closest'
            tex.extension='EXTEND'
            # Transparent source background must not blacken the actual mesh.
            mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MIX'
            mix.inputs[1].default_value=color(name)
            m.node_tree.links.new(tex.outputs['Alpha'],mix.inputs[0])
            m.node_tree.links.new(tex.outputs['Color'],mix.inputs[2])
            m.node_tree.links.new(mix.outputs[0],bsdf.inputs['Base Color'])
            m.node_tree.links.new(mix.outputs[0],bsdf.inputs['Emission Color'])
            bsdf.inputs['Emission Strength'].default_value=.7
        materials[key]=m
        return m

    def finish(obj,name,mat,bone):
        obj.name=name
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        obj.data.materials.append(mat)
        obj['sprite_bone']=bone
        return obj

    def ellipsoid(name,loc,radii,shade,bone,segments=24):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=12,location=loc)
        obj=bpy.context.object;obj.scale=radii
        finish(obj,name,material(shade),bone)
        for poly in obj.data.polygons:poly.use_smooth=True
        return obj

    def mesh(name,verts,faces,mat,bone):
        data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
        obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
        obj.data.materials.append(mat);obj['sprite_bone']=bone
        return obj

    def cylinder(name,a,b,r,shade,bone,vertices=12):
        a,b=Vector(a),Vector(b);delta=b-a
        bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=delta.length,location=(a+b)/2)
        obj=bpy.context.object;obj.rotation_euler=delta.to_track_quat('Z','Y').to_euler()
        return finish(obj,name,material(shade),bone)

    def line(name,points,width,shade,bone):
        for i in range(len(points)-1):
            cylinder(name,points[i],points[i+1],width,shade,bone,8)

    def project(obj,texture,x0,x1,z0,z1,source_rect,shade='cloth',front=True):
        mat=material(shade,texture)
        obj.data.materials.clear();obj.data.materials.append(mat)
        uv=obj.data.uv_layers.new(name='SourceProjection')
        image=bpy.data.images.get(texture)
        # Image name is usually basename; use actual loaded material image.
        image=next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE')
        sx0,sy0,sx1,sy1=source_rect
        for poly in obj.data.polygons:
            for li in poly.loop_indices:
                v=obj.matrix_world @ obj.data.vertices[obj.data.loops[li].vertex_index].co
                u=(v.x-x0)/(x1-x0)
                if not front:u=1-u
                t=(v.z-z0)/(z1-z0)
                uv.data[li].uv=((sx0+u*(sx1-sx0))/image.size[0],1-(sy1-t*(sy1-sy0))/image.size[1])
        return obj

    def garment(name,rings,bone='torso'):
        # Elliptical volume, divided into front/back material surfaces. Arms/legs
        # remain independent deformable volumes; the robe never becomes a plane.
        n=32;verts=[]
        for z,rx,ry in rings:
            for i in range(n):
                a=2*math.pi*i/n
                verts.append((math.sin(a)*rx,-math.cos(a)*ry,z))
        faces=[]
        for j in range(len(rings)-1):
            for i in range(n):faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
        obj=mesh(name,verts,faces,material('cloth','body-front.png'),bone)
        obj.data.materials.append(material('cloth','body-back.png'))
        uv=obj.data.uv_layers.new(name='CostumeProjection')
        for poly in obj.data.polygons:
            front=sum(obj.data.vertices[vi].co.y for vi in poly.vertices)<0
            poly.material_index=0 if front else 1
            for li in poly.loop_indices:
                v=obj.data.vertices[obj.data.loops[li].vertex_index].co
                x=223+v.x*210*(1 if front else -1)
                y=339-(v.z-.55)/(1.63-.55)*262
                uv.data[li].uv=(x/443,1-y/443)
            poly.use_smooth=True
        return obj

    # Compact adult-chibi proportions measured from the owned body/head study.
    garment('Santet embroidered coat',[(.61,.32,.18),(.82,.34,.2),(1.01,.31,.2),
                                      (1.24,.31,.19),(1.48,.36,.2),(1.6,.29,.16)])
    ellipsoid('neck',(0,0,1.65),(.12,.115,.18),'skin','head')
    # Sculpted jaw/cheek rings, narrower jaw and flattened front for anime face.
    n=32;verts=[]
    for z,rx,depth in [(1.71,.08,.12),(1.75,.2,.2),(1.83,.31,.26),
                       (1.98,.37,.29),(2.12,.35,.27),(2.23,.25,.2)]:
        for i in range(n):
            a=2*math.pi*i/n;verts.append((math.sin(a)*rx,-math.cos(a)*depth,z))
    faces=[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(5) for i in range(n)]
    head=mesh('sculpted face and jaw',verts,faces,material('skin'),'head')
    head.data.materials.append(material('skin','face.png'))
    uv=head.data.uv_layers.new(name='FaceIdentity')
    for poly in head.data.polygons:
        front=sum(head.data.vertices[i].co.y for i in poly.vertices)<-.3
        poly.material_index=1 if front else 0
        poly.use_smooth=True
        for li in poly.loop_indices:
            v=head.data.vertices[head.data.loops[li].vertex_index].co
            uv.data[li].uv=((v.x+.36)/.72,(v.z-1.72)/.46)
    for side,x in [('L',.37),('R',-.37)]:
        ellipsoid('ear.'+side,(x,0,1.98),(.075,.06,.12),'skin','head')
        ellipsoid('inner ear.'+side,(x,-.04,1.98),(.041,.015,.07),'skinDark','head')

    hair=ellipsoid('hair cap',(0,.035,2.19),(.395,.305,.275),'hair','head',32)
    # Sweep locks are individually tapered closed volumes, with source hair
    # UVs on the front and a fixed lavender ramp on sides/rear.
    def lock(name,points,width,depth,shade):
        verts=[];count=8
        for j,pt in enumerate(points):
            radius=1 if j==0 else (.8 if j<len(points)-1 else .025)
            for k in range(count):
                a=2*math.pi*k/count
                verts.append((pt[0]+math.cos(a)*width*radius,pt[1]+math.sin(a)*depth*radius,pt[2]))
        faces=[(j*count+i,j*count+(i+1)%count,(j+1)*count+(i+1)%count,(j+1)*count+i) for j in range(len(points)-1) for i in range(count)]
        faces.extend([tuple(reversed(range(count))),tuple(range((len(points)-1)*count,len(points)*count))])
        return mesh(name,verts,faces,material(shade),'head')
    # Deliberately asymmetric part and lifted, swept clumps from the source.
    for i,(x,z,tipx,tipz) in enumerate([(-.29,2.3,-.38,2.08),(-.2,2.4,-.32,2.08),
       (-.09,2.41,-.21,2.13),(.025,2.43,-.11,2.08),(.13,2.4,.03,2.14),
       (.24,2.35,.2,2.11),(.32,2.29,.37,2.02)]):
        obj=lock('swept fringe',[(x,-.17,z),(x-.035,-.29,z-.11),(tipx,-.31,tipz)],.075,.06,'hairLight' if i in (2,3,4) else 'hair')
        project(obj,'hair.png',-.41,.41,2.04,2.45,(0,0,168,83),'hair')
    for i in range(12):
        a=2*math.pi*i/12
        x,y=math.sin(a)*.32,math.cos(a)*.24+.06
        lock('crown silhouette spike',[(x*.8,y*.8,2.33),(x,y,2.34),(x*1.22,y*1.22,2.24+(i%3)*.035)],.07,.06,'hairLight' if i%3==0 else 'hair')
    for side in (-1,1):
        lock('temple lock',[(side*.33,-.025,2.23),(side*.39,-.055,2.09),(side*.35,-.08,1.98)],.065,.07,'hairDark')

    # Coat split flaps: actual geometry with the original embroidery projected.
    for side in (-1,1):
        x=side*.23
        flap=mesh('gold bordered split skirt',[(x-side*.12,-.22,1.02),(x+side*.11,-.20,1.02),
                    (x+side*.19,-.19,.54),(x-side*.06,-.27,.59)],[(0,1,2,3)],material('cloth'),'torso')
        solid=flap.modifiers.new('Garment thickness','SOLIDIFY');solid.thickness=.022
        project(flap,'body-front.png',-.57,.57,.5,1.65,(108,70,339,359))
        for back in [False,True]:
            if back:
                panel=mesh('rear coat tails',[(x-side*.12,.2,1.0),(x+side*.12,.2,1.0),
                  (x+side*.17,.2,.52),(x-side*.1,.2,.57)],[(0,1,2,3)],material('cloth'),'torso')
                solid=panel.modifiers.new('Garment thickness','SOLIDIFY');solid.thickness=.02
                project(panel,'body-back.png',-.57,.57,.5,1.65,(108,70,339,359),front=False)
    # Red wrapped belt with a gold clasp and braided hanging strips.
    belt=garment('crimson sash',[(.99,.334,.222),(1.07,.337,.223),(1.12,.333,.22)])
    belt.data.materials.clear();belt.data.materials.append(material('red'))
    for poly in belt.data.polygons:poly.material_index=0
    for z in (1.0,1.035,1.072,1.105):
        line('sash wrap',[( -.3,-.15,z),(0,-.227,z+.006),(.3,-.15,z)],.009,'redLight','torso')
    ellipsoid('belt rosette',(0,-.252,1.055),(.073,.037,.066),'gold','torso')
    ellipsoid('rosette ruby',(0,-.282,1.055),(.034,.018,.035),'redLight','torso')
    for x,z in [(-.12,.98),(-.08,.89),(-.15,.76)]:
        cylinder('belt tassel',(x,-.25,1.03),(x-.025,-.265,z),.018,'red','torso')
        ellipsoid('tassel bead',(x,-.27,z+.025),(.023,.023,.025),'gold','torso',12)
    # Necklace follows chest; no loose, independently moving screen overlay.
    necklace=[(-.2,-.2,1.56),(-.14,-.223,1.49),(-.06,-.235,1.44),(.04,-.239,1.43),(.13,-.228,1.49),(.2,-.2,1.56)]
    line('necklace cord',necklace,.011,'dark','torso')
    for i,pt in enumerate(necklace):
        ellipsoid('necklace beads',pt,(.025,.018,.027),'gold' if i%2 else 'red','torso',12)
    ellipsoid('necklace pendant',(0,-.262,1.39),(.037,.02,.05),'goldLight','torso')

    # Ivory effigy, red binding and satchel placed on the reference's belt side.
    ellipsoid('effigy head',(.205,-.26,.96),(.058,.042,.064),'ivory','torso',16)
    cylinder('effigy torso',(.205,-.26,.81),(.205,-.26,.91),.029,'ivory','torso')
    cylinder('effigy arms',(.13,-.265,.88),(.28,-.265,.88),.014,'ivory','torso')
    for dx in (-.025,.025):
        cylinder('effigy leg',(.205+dx,-.27,.74),(.205+dx,-.27,.825),.014,'ivory','torso')
        ellipsoid('effigy eye',(.205+dx,-.305,.97),(.009,.006,.011),'dark','torso',8)
    cylinder('effigy red binding',(.205,-.29,.79),(.205,-.29,.875),.009,'red','torso')

    for side,x in [('L',.21),('R',-.21)]:
        # Ellipsoidal trouser volumes, articulated knees and fitted shin wraps.
        ellipsoid('trousers.'+side,(x,0,.74),(.17,.185,.25),'cloth','thigh.'+side)
        shin=ellipsoid('boot wrap.'+side,(x,0,.32),(.125,.12,.22),'wood','shin.'+side)
        project(shin,'body-front.png',x-.15,x+.15,.1,.55,(121 if side=='R' else 249,326,193 if side=='R' else 320,398),'wood')
        for z in (.19,.27,.35,.43):
            line('cross-laced boot',[(x-.085,-.10,z),(x+.085,-.105,z+.05)],.009,'gold','shin.'+side)
            line('cross-laced boot',[(x+.085,-.10,z),(x-.085,-.105,z+.05)],.009,'gold','shin.'+side)
        # Flat-bottom sole permits actual skinned contact validation.
        bpy.ops.mesh.primitive_cube_add(size=2,location=(x,-.062,.035))
        sole=bpy.context.object;sole.scale=(.135,.20,.035)
        finish(sole,'sandal.'+side,material('dark'),'foot.'+side)
        bevel=sole.modifiers.new('Rounded sole','BEVEL');bevel.width=.035;bevel.segments=3
        ellipsoid('toes.'+side,(x,-.153,.09),(.108,.105,.052),'skin','foot.'+side)
        for dx in (-.065,-.022,.022,.065):
            ellipsoid('toe knuckle',(x+dx,-.23,.092),(.023,.024,.027),'skinLight','foot.'+side,12)
        line('sandal strap',[(x-.115,-.10,.073),(x,-.105,.143),(x+.115,-.10,.073)],.026,'wood','foot.'+side)
        cylinder('ankle strap',(x-.105,.015,.14),(x+.105,.015,.14),.027,'gold','foot.'+side)
        ax=x*2.1
        sleeve=ellipsoid('short sleeve.'+side,(ax,0,1.39),(.14,.16,.19),'cloth','arm.'+side)
        project(sleeve,'body-front.png',ax-.14,ax+.14,1.21,1.58,(117 if side=='R' else 273,101,181 if side=='R' else 332,175))
        ellipsoid('upper arm skin.'+side,(ax,0,1.17),(.106,.112,.13),'skin','arm.'+side)
        bracer=ellipsoid('gold bracer.'+side,(ax,-.012,1.08),(.12,.123,.16),'dark','arm.'+side)
        project(bracer,'body-front.png',ax-.12,ax+.12,.95,1.23,(108 if side=='R' else 281,170,167 if side=='R' else 340,219),'dark')
        for z in (.99,1.07,1.15):
            line('bracer trim',[(ax-.105,-.063,z),(ax,-.14,z+.02),(ax+.105,-.063,z)],.009,'gold','arm.'+side)
        ellipsoid('fist.'+side,(ax,-.025,.935),(.105,.105,.103),'skin','arm.'+side)
        for dx in (-.065,-.025,.025,.065):
            ellipsoid('knuckle',(ax+dx,-.115,.95),(.022,.017,.026),'skinLight','arm.'+side,12)

    # Staff is actual mesh parented/skinned to the held arm. No generated VFX.
    x=-.52;y=-.17
    cylinder('ritual staff',(x,y,.22),(x+.035,y,1.68),.032,'wood','arm.R')
    for z in (.55,.85,1.16,1.47):
        cylinder('staff binding',(x-.045,y,z),(x+.045,y,z+.015),.012,'gold','arm.R')
    ellipsoid('staff skull',(x+.02,y,1.7),(.073,.064,.085),'ivory','arm.R',16)
    for dx in (-.026,.026):
        ellipsoid('staff skull eye',(x+.02+dx,y-.059,1.715),(.017,.009,.022),'dark','arm.R',8)
    line('staff bent tip',[(x+.035,y,1.73),(x+.06,y,1.83),(x+.04,y,1.93)],.018,'wood','arm.R')
    line('red staff tie',[(x+.04,y-.012,1.62),(x-.07,y-.02,1.55),(x-.045,y-.02,1.37)],.014,'red','arm.R')
    line('second red tie',[(x+.04,y-.01,1.62),(x+.09,y-.015,1.5),(x+.07,y-.02,1.4)],.012,'red','arm.R')
    # Everything remains editable; packed image textures travel in the .blend.
    report={'character':'Santet','method':'authored curved mesh + owned UV texture crops',
            'billboards':False,'aiGeneratedWalkingFrames':False,'visualApproved':False,
            'objects':len(bpy.context.scene.objects),
            'vertices':sum(len(o.data.vertices) for o in bpy.context.scene.objects if o.type=='MESH'),
            'limitations':['Hidden anatomy/rear head reconstructed from references, not scanned.',
                           'Small accessories use simplified geometry; garment secondary motion is provisional.']}
    (out/'model-report.json').write_text(json.dumps(report,indent=2))
