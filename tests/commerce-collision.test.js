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
  assert.ok(people.length>=2);
  assert.ok(room.group.userData.obstacles.length>0);
  for(let frame=0;frame<1800;frame++){
   room.update(frame/30);
   for(const person of people){
    const {x,z}=person.position,r=person.userData.floorRadius;
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
    assert.ok(Math.hypot(people[i].position.x-people[j].position.x,people[i].position.z-people[j].position.z)>.50,`${room.id}: people intersect`);
   }
  }
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
