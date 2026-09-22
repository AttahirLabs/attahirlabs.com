const assert = require('node:assert/strict');

(async () => {
  const THREE = await import('../assets/commerce/vendor/three.module.min.js');
  const {createRooms} = await import('../assets/commerce/rooms.js');
  const rooms = createRooms(THREE);

  const warehouse = rooms.find(room => room.id === 'warehouse');
  const pickedCarton = warehouse.group.getObjectByName('picked-carton');
  assert.ok(pickedCarton);
  warehouse.update(0);
  assert.equal(pickedCarton.scale.x, 0, 'picker approaches the shelf empty handed');
  warehouse.update(4.9);
  assert.ok(pickedCarton.scale.x > .5, 'carton appears during pickup at the shelf');
  warehouse.update(8.2);
  assert.equal(pickedCarton.scale.x, 1, 'picker carries the order back');
  warehouse.update(10.12);
  assert.ok(pickedCarton.scale.x < .1, 'carton is set down before the next pick');

  for (const [roomId, propName] of [['coffee', 'served-cup'], ['florist', 'handoff-bouquet']]) {
    const room = rooms.find(candidate => candidate.id === roomId);
    const prop = room.group.getObjectByName(propName);
    assert.ok(prop, `${roomId} has a visible item to pass`);
    let approached = 0, exchanged = 0, departed = 0, previous;
    for (let frame = 0; frame < 1800; frame++) {
      room.update(frame / 60);
      const interaction = room.group.userData.interaction;
      assert.ok(Number.isFinite(prop.position.x + prop.position.y + prop.position.z));
      assert.ok(interaction.transfer >= 0 && interaction.transfer <= 1);
      if (interaction.handoff > .02) {
        assert.ok(interaction.visitorAtCounter, `${roomId} does not pass an item to empty space`);
        approached++;
      }
      if (interaction.transfer > .05 && interaction.transfer < .95) {
        assert.ok(interaction.visitorAtCounter, `${roomId} transfers only after the visitor arrives`);
        exchanged++;
      }
      if (!interaction.visitorAtCounter && interaction.transfer === 1) departed++;
      if (previous && prop.scale.x > .3 && previous.scale > .3) {
        const movement = prop.position.distanceTo(previous.position);
        assert.ok(movement < .12, `${roomId} item moves smoothly (${movement.toFixed(3)})`);
      }
      previous = {position:prop.position.clone(), scale:prop.scale.x};
    }
    assert.ok(approached > 20 && exchanged > 20 && departed > 20, `${roomId} completes the exchange and departure`);
  }
  console.log('Commerce interactions: café and florist handoffs wait for visitors and move continuously; warehouse pickup follows the reach and return.');
})().catch(error => { console.error(error); process.exitCode = 1; });
