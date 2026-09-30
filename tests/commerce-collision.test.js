const assert=require('node:assert/strict');
(async()=>{
 const THREE=await import('../assets/commerce/vendor/three.module.min.js');
 const {createRooms}=await import('../assets/commerce/rooms.js');
 const {sampleWalk}=await import('../assets/commerce/motion.mjs');
 const rooms=createRooms(THREE);
 assert.deepEqual(rooms.map(r=>r.id),['coffee','warehouse','boutique','grocery','florist','homewares']);
 let checks=0;
 for(const room of rooms){
  const people=[];room.group.traverse(o=>{if(o.userData.person)people.push(o);});
  assert.ok(people.length>=8&&people.length<=10,`${room.id} contains 8–10 people`);
  const walkingNames={coffee:'arrival-guest',warehouse:'dispatch-worker',boutique:'window-shopper',grocery:'aisle-shopper',florist:'flower-arrival',homewares:'entrance-visitor'};
  const walker=people.find(o=>o.name===walkingNames[room.id]);
  assert.ok(walker,`${room.id} has an ambient walking route`);
  const travel=[];
  assert.ok(room.group.userData.obstacles.length>0);
  for(let frame=0;frame<1800;frame++){
   room.update(frame/30);
   const walkerPosition=walker.getWorldPosition(new THREE.Vector3());
   travel.push([walkerPosition.x,walkerPosition.z]);
   for(const person of people){
    const position=person.getWorldPosition(new THREE.Vector3());
    const {x,z}=position,r=person.userData.floorRadius*person.getWorldScale(new THREE.Vector3()).x/person.scale.x;
    assert.ok(Number.isFinite(x+z+person.rotation.y));
    if(person.userData.seated)continue;
    assert.ok(Math.abs(x)+r<1.91 && Math.abs(z)+r<1.36,`${room.id}/${person.name} stays on its floor`);
    for(const box of room.group.userData.obstacles){
     const dx=x-Math.max(box.minX,Math.min(x,box.maxX)),dz=z-Math.max(box.minZ,Math.min(z,box.maxZ));
     assert.ok(Math.hypot(dx,dz)>=r-.005,`${room.id}/${person.name} intersects ${box.name} at ${(frame/30).toFixed(2)}s: clearance ${Math.hypot(dx,dz).toFixed(3)}`);
     checks++;
    }
   }
   for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){
    const a=people[i].getWorldPosition(new THREE.Vector3()),b=people[j].getWorldPosition(new THREE.Vector3());
    const radius=o=>o.userData.floorRadius*o.getWorldScale(new THREE.Vector3()).x/o.scale.x;
    const clearance=radius(people[i])+radius(people[j])-.01;
    assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>clearance,`${room.id}: people intersect`);
   }
  }
  assert.ok(Math.hypot(Math.max(...travel.map(p=>p[0]))-Math.min(...travel.map(p=>p[0])),Math.max(...travel.map(p=>p[1]))-Math.min(...travel.map(p=>p[1])))>.15,`${room.id} walker actually traverses the store`);
 }
 const options={start:[1.2,1],end:[1.2,-.15],endFacing:-Math.PI/2};
 let previous=sampleWalk(0,options);
 for(let i=1;i<=24000;i++){
  const sample=sampleWalk(i/1000,options);
  assert.ok(Math.hypot(sample.x-previous.x,sample.z-previous.z)<.002,'walk position is continuous');
  const angle=Math.atan2(Math.sin(sample.yaw-previous.yaw),Math.cos(sample.yaw-previous.yaw));
  assert.ok(Math.abs(angle)<.012,'turns are continuous, including loop boundaries');
  assert.ok(Number.isFinite(sample.headLead) && Math.abs(sample.headLead)<=.52,'head anticipation stays bounded');
  assert.ok(Math.abs(sample.headLead-previous.headLead)<.012,'head anticipation is continuous');
  previous=sample;
 }
 console.log(`Commerce geometry: ${checks} furniture-clearance checks across six animated rooms; people separation, floor bounds and smooth route continuity passed.`);
})().catch(e=>{console.error(e);process.exitCode=1});
