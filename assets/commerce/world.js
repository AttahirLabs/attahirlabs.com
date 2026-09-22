import * as THREE from './vendor/three.module.min.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { createRooms } from './rooms.js?v=20260922d';

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
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, .1, 80);
  camera.position.set(10, 6.4, 16);
  camera.lookAt(0, 1.2, 0);
  environment = new RoomEnvironment();
  pmrem = new THREE.PMREMGenerator(renderer);
  env = pmrem.fromScene(environment, .045);
  scene.environment = env.texture;
  scene.environmentIntensity=.8;
  environment.dispose();environment=null;
  pmrem.dispose();pmrem=null;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa6c9c3, 1.4));
  const key = new THREE.DirectionalLight(0xfff8eb, 2.8);
  key.position.set(-4, 10, 9); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {left:-8,right:8,top:10,bottom:-9,near:.5,far:35});
  key.shadow.bias = -.0005; key.shadow.normalBias = .025;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc4eef1, 1.3);rim.position.set(7,4,-6);scene.add(rim);
  const materials = {
    glass: new THREE.MeshPhysicalMaterial({color:0xc7f0ee,metalness:0,roughness:.12,transmission:0,thickness:.06,ior:1.45,transparent:true,opacity:.10,depthWrite:false,side:THREE.DoubleSide}),
    floor: new THREE.MeshPhysicalMaterial({color:0xeff4ec,roughness:.3,metalness:.05}),
    edge: new THREE.MeshStandardMaterial({color:0x269ca8,roughness:.23,metalness:.3}),
    rim: new THREE.MeshStandardMaterial({color:0xaad8d8,roughness:.2,metalness:.25})
  };
  function block(parent,w,h,d,x,y,z,material) {const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);parent.add(m);return m;}
  function pane(parent,w,h,x,y,z) {
    const p=block(parent,w,h,.04,x,y,z,materials.glass);
    const outline=new THREE.LineSegments(new THREE.EdgesGeometry(p.geometry),new THREE.LineBasicMaterial({color:0x087f8c,transparent:true,opacity:.8}));p.add(outline);return p;
  }
  const architecture = new THREE.Group();scene.add(architecture);
  const plinth=block(architecture,6.3,.10,3.3,-.35,-2.4,.1,materials.glass);
  plinth.receiveShadow=true;
  const rooms=createRooms(THREE);
  const pods=rooms.map((room)=>{
    const shell=new THREE.Group();shell.add(room.group);
    const floor=block(shell,3.85,.12,2.7,0,-.07,0,materials.floor);floor.receiveShadow=true;
    // Open fronts keep the people and work legible inside each glass enclosure.
    pane(shell,3.85,2.23,0,1.055,-1.36);
    // Open side walls preserve a clear view of staff, aisles and storefront details.
    for(const x of [-1.925,1.925])block(shell,.025,2.25,.025,x,1.07,-1.36,materials.edge);
    for(const y of [-.13,2.18]){
      if(y<0)block(shell,3.9,.035,.035,0,y,1.36,materials.edge);
      block(shell,3.9,.035,.035,0,y,-1.36,materials.rim);
      block(shell,.035,.035,2.7,1.925,y,0,materials.edge);
    }
    shell.position.x=1.5;
    scene.add(shell);
    return shell;
  });
  // A soft studio contact shadow gives the glass structure a grounded base.
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(25,25),new THREE.ShadowMaterial({opacity:.045}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-2.48;shadow.receiveShadow=true;scene.add(shadow);
  let rendered=false;
  function resize(){
    const {width,height}=host.getBoundingClientRect();
    if(!width||!height)return;
    const viewHeight=8.8;
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
      pod.position.y=-offset*2.45-.2;
      pod.visible=offset>-1.65&&offset<1.6;
      if(pod.visible) rooms[i].update(t);
    });
    renderer.render(scene,camera);rendered=true;
  }
  return {render,resize,dispose,canvas:renderer.domElement};
  } catch(error) {dispose();throw error;}
}
