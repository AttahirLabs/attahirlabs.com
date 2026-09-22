import * as THREE from './vendor/three.module.min.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { createRooms } from './rooms.js?v=20260922h';

export function createCommerceWorld(host) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  const scene = new THREE.Scene();
  let environment, pmrem, env, observer, disposed = false;
  function dispose(){
    if(disposed)return;disposed=true;
    observer?.disconnect();
    const geometries=new Set(),mats=new Set(),textures=new Set();
    scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>{mats.add(m);if(m.map)textures.add(m.map);});});
    geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
    env?.dispose();environment?.dispose();pmrem?.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
  }
  try {
  renderer.setClearColor(0xf7f8f4, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 681 ? 1.75 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .84;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, .1, 80);
  // A slightly elevated diorama view reveals the full floor plan of each shop.
  camera.position.set(8.5, 12, 13);
  camera.lookAt(0, 1.15, 0);
  environment = new RoomEnvironment();
  pmrem = new THREE.PMREMGenerator(renderer);
  env = pmrem.fromScene(environment, .045);
  scene.environment = env.texture;
  scene.environmentIntensity=.72;
  environment.dispose();environment=null;
  pmrem.dispose();pmrem=null;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa6c9c3, 1.05));
  const key = new THREE.DirectionalLight(0xfff8eb, 2.25);
  key.position.set(-4, 10, 9); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {left:-8,right:8,top:10,bottom:-9,near:.5,far:35});
  key.shadow.bias = -.0005; key.shadow.normalBias = .025;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc4eef1, .95);rim.position.set(7,4,-6);scene.add(rim);
  const materials = {
    glass: new THREE.MeshPhysicalMaterial({color:0xc7f0ee,metalness:0,roughness:.12,transmission:0,thickness:.06,ior:1.45,transparent:true,opacity:.10,depthWrite:false,side:THREE.DoubleSide}),
    edge: new THREE.MeshStandardMaterial({color:0x269ca8,roughness:.23,metalness:.3}),
    rim: new THREE.MeshStandardMaterial({color:0xaad8d8,roughness:.2,metalness:.25})
  };
  function block(parent,w,h,d,x,y,z,material) {const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);parent.add(m);return m;}
  const storeStyles = {
    coffee: { wall:0xe7e0d1, trim:0x477366, floor:'#dcc7aa', grout:'#c8ae90', mode:'planks' },
    warehouse: { wall:0xdfe7e5, trim:0x607d80, floor:'#d6dad7', grout:'#b7c4c4', mode:'concrete' },
    boutique: { wall:0xece6dc, trim:0xa87864, floor:'#e9dfd4', grout:'#cfc5b9', mode:'tiles' },
    grocery: { wall:0xe6e8d9, trim:0x67916e, floor:'#e9e8d9', grout:'#cbcdbd', mode:'tiles' },
    florist: { wall:0xe9e5db, trim:0x769273, floor:'#d9c2a9', grout:'#c7a98c', mode:'tiles' },
    homewares: { wall:0xede6dd, trim:0xbe9a8a, floor:'#d6c0a9', grout:'#bea48b', mode:'planks' }
  };
  function floorMaterial(style){
    const canvas=document.createElement('canvas');canvas.width=384;canvas.height=288;
    const ctx=canvas.getContext('2d');ctx.fillStyle=style.floor;ctx.fillRect(0,0,384,288);
    ctx.strokeStyle=style.grout;ctx.lineWidth=2;
    if(style.mode==='planks'){
      for(let y=0;y<=288;y+=36){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(384,y);ctx.stroke();}
      for(let row=0;row<8;row++)for(let x=(row%2)*70;x<384;x+=140){ctx.beginPath();ctx.moveTo(x,row*36);ctx.lineTo(x,(row+1)*36);ctx.stroke();}
    }else if(style.mode==='tiles'){
      for(let x=0;x<=384;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,288);ctx.stroke();}
      for(let y=0;y<=288;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(384,y);ctx.stroke();}
    }else{
      ctx.strokeStyle='#c3cbc8';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(18,255);ctx.lineTo(366,255);ctx.stroke();
      ctx.fillStyle='#d4ad5e';ctx.fillRect(24,249,336,6);
    }
    // Deterministic fine grain avoids the flat, unscaled plastic look.
    let seed=style.wall>>>0;
    for(let i=0;i<650;i++){
      seed=(1664525*seed+1013904223)>>>0;const x=seed%384;
      seed=(1664525*seed+1013904223)>>>0;const y=seed%288;
      ctx.fillStyle=i%3===0?'#ffffff18':'#4539230d';ctx.fillRect(x,y,2,2);
    }
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    return new THREE.MeshStandardMaterial({map:texture,roughness:.91,metalness:0});
  }
  const architecture = new THREE.Group();scene.add(architecture);
  const plinth=block(architecture,6.3,.10,3.3,-.35,-2.4,.1,materials.glass);
  plinth.receiveShadow=true;
  const rooms=createRooms(THREE);
  const pods=rooms.map((room)=>{
    const shell=new THREE.Group();shell.add(room.group);
    const style=storeStyles[room.id];
    const wall=new THREE.MeshStandardMaterial({color:style.wall,roughness:.94});
    const trim=new THREE.MeshStandardMaterial({color:style.trim,roughness:.62,metalness:.07});
    const floor=block(shell,3.85,.12,2.7,0,-.07,0,floorMaterial(style));floor.receiveShadow=true;
    // An open-front cutaway has a full rear wall, side returns, entry threshold,
    // and roof outline. It reads as a whole shop without a pane across the view.
    block(shell,3.82,2.09,.075,0,1.035,-1.34,wall);
    block(shell,.07,2.06,1.72,-1.88,1.03,-.48,wall);
    block(shell,.08,.48,2.56,1.88,.24,0,wall);
    block(shell,1.82,.17,.075,-1.0,.08,1.31,wall);
    block(shell,.8,.17,.075,1.5,.08,1.31,wall);
    block(shell,1.16,.013,.48,.51,.006,1.08,trim);
    // The front and near side stay completely open at eye level.
    block(shell,3.89,.075,.07,0,2.14,-1.33,trim);
    block(shell,3.89,.055,.07,0,-.12,1.34,materials.edge);
    block(shell,3.89,.055,.07,0,-.12,-1.34,materials.rim);
    // Rear-wall lighting and trim supply detail at miniature scale.
    const lightMaterial=new THREE.MeshStandardMaterial({color:0xffe6bd,emissive:0xffd08a,emissiveIntensity:.8,roughness:.35});
    for(const x of [-1.15,1.15]){
      block(shell,.26,.025,.11,x,1.97,-1.21,lightMaterial);
      block(shell,.035,1.9,.035,x,1.03,-1.285,trim);
    }
    shell.position.x=2.55;
    scene.add(shell);
    return shell;
  });
  // A soft studio contact shadow gives the glass structure a grounded base.
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(25,25),new THREE.ShadowMaterial({opacity:.045}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-2.48;shadow.receiveShadow=true;scene.add(shadow);
  let rendered=false,mobile=innerWidth<681;
  function resize(){
    const {width,height}=host.getBoundingClientRect();
    if(!width||!height)return;
    mobile=innerWidth<681;
    pods.forEach(pod=>{pod.position.x=mobile?1.3:2.55;});
    const viewHeight=mobile?8.8:10.2;
    camera.left=-viewHeight*width/height/2;camera.right=-camera.left;
    camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
    if(rendered)renderer.render(scene,camera);
  }
  host.append(renderer.domElement);
  observer=new ResizeObserver(resize);observer.observe(host);resize();
  function render(t,timeline){
    pods.forEach((pod,i)=>{
      const offset=timeline.offset(i);
      pod.position.y=-.2-offset*(mobile?2.75:3.45);
      pod.visible=offset>-1.65&&offset<1.6;
      if(pod.visible) rooms[i].update(t);
    });
    renderer.render(scene,camera);rendered=true;
  }
  return {render,resize,dispose,canvas:renderer.domElement};
  } catch(error) {dispose();throw error;}
}
