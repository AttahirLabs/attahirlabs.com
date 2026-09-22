const assert = require('node:assert/strict');

(async () => {
  const THREE = await import('../assets/commerce/vendor/three.module.min.js');
  const {createRooms} = await import('../assets/commerce/rooms.js');
  const rooms = createRooms(THREE);

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
  console.log('Commerce interactions: café and florist handoffs follow visitor arrival, move continuously, and depart with the visitor.');
})().catch(error => { console.error(error); process.exitCode = 1; });
