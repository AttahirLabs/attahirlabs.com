import { sampleWalk } from './motion.mjs?v=20260922c';
const TAU = Math.PI * 2;

/**
 * Build the six miniature commerce rooms used by the homepage tower.
 * The caller owns the renderer, floor slabs, glass shells, and animation loop.
 *
 * @param {typeof import("three")} THREE
 * @returns {{id: string, group: import("three").Group, update: (tSeconds: number) => void}[]}
 */
export function createRooms(THREE) {
  const geometries = new Map();
  const materials = new Map();

  const C = {
    ivory: 0xf7f8f4,
    cream: 0xeee9dc,
    teal: 0x087f8c,
    tealLight: 0x79c2c3,
    navy: 0x102a36,
    navySoft: 0x274652,
    wood: 0xa56f45,
    woodLight: 0xd2a878,
    brass: 0xb98a4f,
    steel: 0xa9b5b8,
    darkSteel: 0x52646a,
    charcoal: 0x27343a,
    terracotta: 0xb9654a,
    leaf: 0x487a58,
    leafLight: 0x79a86d,
    blush: 0xd99a89,
    mustard: 0xc99a36,
    lavender: 0x8e83a9,
    carton: 0xc7a678,
    pastry: 0xd79b5d,
    skin1: 0xe0b08d,
    skin2: 0xb97855,
    skin3: 0x7f4f3d,
    hair: 0x3b2b27,
    white: 0xffffff,
  };

  function material(color, options = {}) {
    const key = [
      color,
      options.roughness ?? 0.64,
      options.metalness ?? 0.04,
      options.transparent ? 1 : 0,
      options.opacity ?? 1,
      options.emissive ?? 0,
      options.emissiveIntensity ?? 0,
      options.side ?? THREE.FrontSide,
    ].join(":");
    if (!materials.has(key)) {
      materials.set(key, new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.64,
        metalness: options.metalness ?? 0.04,
        transparent: Boolean(options.transparent),
        opacity: options.opacity ?? 1,
        emissive: options.emissive ?? 0x000000,
        emissiveIntensity: options.emissiveIntensity ?? 0,
        side: options.side ?? THREE.FrontSide,
      }));
    }
    return materials.get(key);
  }

  function geometry(key, factory) {
    if (!geometries.has(key)) geometries.set(key, factory());
    return geometries.get(key);
  }

  function boxGeometry(w, h, d) {
    return geometry(`box:${w}:${h}:${d}`, () => new THREE.BoxGeometry(w, h, d));
  }

  function cylinderGeometry(radius, height, segments = 16) {
    return geometry(
      `cylinder:${radius}:${height}:${segments}`,
      () => new THREE.CylinderGeometry(radius, radius, height, segments),
    );
  }

  function taperedGeometry(top, bottom, height, segments = 16) {
    return geometry(
      `tapered:${top}:${bottom}:${height}:${segments}`,
      () => new THREE.CylinderGeometry(top, bottom, height, segments),
    );
  }

  function sphereGeometry(radius, width = 18, height = 12) {
    return geometry(
      `sphere:${radius}:${width}:${height}`,
      () => new THREE.SphereGeometry(radius, width, height),
    );
  }

  function planeGeometry(w, h) {
    return geometry(`plane:${w}:${h}`, () => new THREE.PlaneGeometry(w, h));
  }

  function torusGeometry(radius, tube, radial = 8, tubular = 20) {
    return geometry(
      `torus:${radius}:${tube}:${radial}:${tubular}`,
      () => new THREE.TorusGeometry(radius, tube, radial, tubular),
    );
  }

  function mesh(parent, geo, mat, position, options = {}) {
    const object = new THREE.Mesh(geo, mat);
    object.position.set(position[0], position[1], position[2]);
    if (options.rotation) object.rotation.set(...options.rotation);
    if (options.scale) object.scale.set(...options.scale);
    object.castShadow = options.cast ?? true;
    object.receiveShadow = options.receive ?? false;
    parent.add(object);
    return object;
  }

  function box(parent, size, position, color, options = {}) {
    return mesh(
      parent,
      boxGeometry(size[0], size[1], size[2]),
      options.material ?? material(color, options.materialOptions),
      position,
      options,
    );
  }

  function cylinder(parent, radius, height, position, color, options = {}) {
    return mesh(
      parent,
      cylinderGeometry(radius, height, options.segments ?? 16),
      options.material ?? material(color, options.materialOptions),
      position,
      options,
    );
  }

  function tapered(parent, top, bottom, height, position, color, options = {}) {
    return mesh(
      parent,
      taperedGeometry(top, bottom, height, options.segments ?? 16),
      options.material ?? material(color, options.materialOptions),
      position,
      options,
    );
  }

  function sphere(parent, radius, position, color, options = {}) {
    return mesh(
      parent,
      sphereGeometry(radius, options.widthSegments ?? 18, options.heightSegments ?? 12),
      options.material ?? material(color, options.materialOptions),
      position,
      options,
    );
  }

  function group(parent, name, position = [0, 0, 0]) {
    const result = new THREE.Group();
    result.name = name;
    result.position.set(...position);
    parent.add(result);
    return result;
  }

  function addRearPanels(parent, accent) {
    const panelMat = material(C.ivory, { transparent: true, opacity: 0.84, roughness: 0.8 });
    [-1.12, 0, 1.12].forEach((x, index) => {
      box(parent, [0.95, index === 1 ? 1.15 : 0.92, 0.055], [x, (index === 1 ? 1.15 : 0.92) / 2, -1.13], C.ivory, {
        material: panelMat,
        receive: true,
        cast: false,
      });
      box(parent, [0.78, 0.035, 0.07], [x, index === 1 ? 1.02 : 0.79, -1.095], accent, { cast: false });
    });
    box(parent, [3.35, 0.055, 0.11], [0, 0.035, -1.1], C.woodLight, { receive: true });
  }

  function addRug(parent, size, position, color) {
    const rug = box(parent, [size[0], 0.018, size[1]], [position[0], 0.012, position[1]], color, {
      cast: false,
      receive: true,
      materialOptions: { roughness: 0.96 },
    });
    return rug;
  }

  function addLabel(parent, text, position, size, colors = {}) {
    let signMaterial;
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = 384;
      canvas.height = 128;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = colors.background ?? "#102A36";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = colors.border ?? "#087F8C";
        context.lineWidth = 10;
        context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        context.fillStyle = colors.text ?? "#F7F8F4";
        context.font = "600 44px system-ui, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
        const texture = new THREE.CanvasTexture(canvas);
        if ("colorSpace" in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        signMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
      }
    }
    if (!signMaterial) signMaterial = material(C.navy, { roughness: 0.78, side: THREE.DoubleSide });
    const sign = mesh(parent, planeGeometry(size[0], size[1]), signMaterial, position, {
      cast: false,
      receive: false,
    });
    return sign;
  }

  function addCup(parent, position, color = C.ivory, scale = 1) {
    const cupGroup = group(parent, "cup", position);
    cylinder(cupGroup, 0.045 * scale, 0.075 * scale, [0, 0.038 * scale, 0], color, {
      segments: 14,
    });
    const handle = mesh(
      cupGroup,
      torusGeometry(0.032 * scale, 0.009 * scale, 6, 14),
      material(color),
      [0.045 * scale, 0.044 * scale, 0],
      { rotation: [0, Math.PI / 2, 0], cast: false },
    );
    handle.scale.y = 0.82;
    cylinder(cupGroup, 0.036 * scale, 0.004 * scale, [0, 0.079 * scale, 0], 0x4c2b1c, {
      cast: false,
      segments: 14,
    });
    return cupGroup;
  }

  function addCarton(parent, position, size = [0.25, 0.2, 0.22], color = C.carton) {
    const carton = group(parent, "carton", position);
    box(carton, size, [0, size[1] / 2, 0], color, { receive: true });
    box(carton, [size[0] * 0.78, 0.012, size[2] + 0.006], [0, size[1] + 0.007, 0], C.cream, { cast: false });
    box(carton, [0.012, size[1] * 0.38, size[2] + 0.008], [0, size[1] * 0.56, 0], C.navySoft, { cast: false });
    return carton;
  }

  function addBottle(parent, position, color, scale = 1) {
    const bottle = group(parent, "bottle", position);
    cylinder(bottle, 0.035 * scale, 0.13 * scale, [0, 0.065 * scale, 0], color, { segments: 12 });
    cylinder(bottle, 0.022 * scale, 0.04 * scale, [0, 0.15 * scale, 0], color, { segments: 12 });
    cylinder(bottle, 0.024 * scale, 0.018 * scale, [0, 0.179 * scale, 0], C.brass, { segments: 12 });
    box(bottle, [0.07 * scale, 0.04 * scale, 0.006], [0, 0.075 * scale, 0.035 * scale], C.ivory, { cast: false });
    return bottle;
  }

  function createLimb(parent, name, color, upperLength, lowerLength, radius) {
    const limb = group(parent, name);
    cylinder(limb, radius, upperLength, [0, -upperLength / 2, 0], color, { segments: 10 });
    sphere(limb, radius * 1.05, [0, -upperLength, 0], color, { widthSegments: 12, heightSegments: 8 });
    const joint = group(limb, `${name}-joint`, [0, -upperLength, 0]);
    cylinder(joint, radius * 0.9, lowerLength, [0, -lowerLength / 2, 0], color, { segments: 10 });
    return { pivot: limb, joint };
  }

  function createPerson(parent, options = {}) {
    const person = group(parent, options.name ?? "person", options.position ?? [0, 0, 0]);
    if (options.rotationY) person.rotation.y = options.rotationY;
    person.userData.person = true;
    person.userData.floorRadius = .28;
    person.position.y = .015;
    const skin = options.skin ?? C.skin1;
    const shirt = options.shirt ?? C.teal;
    const trousers = options.trousers ?? C.navy;

    const hips = group(person, "hips", [0, 0.7, 0]);
    sphere(hips, 0.13, [0, 0, 0], trousers, { scale: [1, 0.72, 0.82] });
    tapered(person, 0.18, 0.22, 0.42, [0, 0.98, 0], shirt, { segments: 16 });
    cylinder(person, 0.06, 0.07, [0, 1.23, 0], skin, { segments: 12 });
    sphere(person, 0.14, [0, 1.38, 0], skin, { scale: [0.93, 1.06, 0.92] });
    const hair = sphere(person, 0.143, [0, 1.415, -0.015], options.hair ?? C.hair, {
      scale: [0.96, 0.72, 0.96],
      widthSegments: 16,
      heightSegments: 10,
    });
    hair.rotation.x = -0.08;
    sphere(person, 0.018, [-0.048, 1.395, 0.124], C.charcoal, { cast: false, widthSegments: 8, heightSegments: 6 });
    sphere(person, 0.018, [0.048, 1.395, 0.124], C.charcoal, { cast: false, widthSegments: 8, heightSegments: 6 });

    const leftArm = createLimb(person, "left-arm", skin, 0.24, 0.22, 0.045);
    const rightArm = createLimb(person, "right-arm", skin, 0.24, 0.22, 0.045);
    leftArm.pivot.position.set(-0.205, 1.15, 0);
    rightArm.pivot.position.set(0.205, 1.15, 0);
    sphere(leftArm.pivot, 0.054, [0, 0.01, 0], shirt, { scale: [1, 0.95, 1] });
    sphere(rightArm.pivot, 0.054, [0, 0.01, 0], shirt, { scale: [1, 0.95, 1] });
    sphere(leftArm.joint, 0.052, [0, -0.22, 0], skin, { widthSegments: 10, heightSegments: 8 });
    sphere(rightArm.joint, 0.052, [0, -0.22, 0], skin, { widthSegments: 10, heightSegments: 8 });

    const leftLeg = createLimb(person, "left-leg", trousers, 0.34, 0.33, 0.065);
    const rightLeg = createLimb(person, "right-leg", trousers, 0.34, 0.33, 0.065);
    leftLeg.pivot.position.set(-0.095, 0.7, 0);
    rightLeg.pivot.position.set(0.095, 0.7, 0);
    box(leftLeg.joint, [0.115, 0.06, 0.21], [0, -0.34, 0.055], options.shoes ?? C.charcoal, { receive: true });
    box(rightLeg.joint, [0.115, 0.06, 0.21], [0, -0.34, 0.055], options.shoes ?? C.charcoal, { receive: true });

    const api = {
      group: person,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      setNeutral() {
        leftArm.pivot.rotation.set(0, 0, 0.05);
        rightArm.pivot.rotation.set(0, 0, -0.05);
        leftArm.joint.rotation.set(0, 0, 0);
        rightArm.joint.rotation.set(0, 0, 0);
        leftLeg.pivot.rotation.set(0, 0, 0);
        rightLeg.pivot.rotation.set(0, 0, 0);
        leftLeg.joint.rotation.set(0, 0, 0);
        rightLeg.joint.rotation.set(0, 0, 0);
      },
      setWalk(stride, amount = 1) {
        const swing = stride * 0.42 * amount;
        leftLeg.pivot.rotation.x = swing;
        rightLeg.pivot.rotation.x = -swing;
        leftLeg.joint.rotation.x = Math.max(0, -swing) * 0.55;
        rightLeg.joint.rotation.x = Math.max(0, swing) * 0.55;
        leftArm.pivot.rotation.x = -swing * 0.72;
        rightArm.pivot.rotation.x = swing * 0.72;
        leftArm.joint.rotation.x = -0.12;
        rightArm.joint.rotation.x = -0.12;
      },
      setSeated() {
        person.position.y = -0.25;
        person.userData.seated = true;
        leftLeg.pivot.rotation.x = -1.34;
        rightLeg.pivot.rotation.x = -1.34;
        leftLeg.joint.rotation.x = 1.27;
        rightLeg.joint.rotation.x = 1.27;
        leftArm.pivot.rotation.x = -0.45;
        rightArm.pivot.rotation.x = -0.45;
        leftArm.joint.rotation.x = -0.7;
        rightArm.joint.rotation.x = -0.7;
      },
    };
    api.setNeutral();
    return api;
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function smooth(value) {
    const x = clamp01(value);
    return x * x * (3 - 2 * x);
  }

  function pulse(phase, start, end) {
    if (phase <= start || phase >= end) return 0;
    const local = (phase - start) / (end - start);
    return Math.sin(local * Math.PI) ** 2;
  }

  function duringArrival(motion, start, end) {
    return motion.step === 2 ? pulse(motion.stepProgress, start, end) : 0;
  }

  function duringVisit(motion, start, end) {
    return motion.step === 4 ? pulse(motion.stepProgress, start, end) : 0;
  }

  function transferProgress(motion, start = .3, end = .7) {
    if (motion.step < 4) return 0;
    if (motion.step > 4) return 1;
    return smooth((motion.stepProgress - start) / (end - start));
  }

  function handPosition(person, arm, parent) {
    person.group.updateWorldMatrix(true, true);
    const point = arm.joint.localToWorld(new THREE.Vector3(0, -.22, .03));
    return parent.worldToLocal(point);
  }

  function betweenHands(prop, parent, fromPerson, fromArm, toPerson, toArm, progress) {
    const from = handPosition(fromPerson, fromArm, parent);
    const to = handPosition(toPerson, toArm, parent);
    prop.position.copy(from.lerp(to, progress));
    prop.position.y += Math.sin(progress * Math.PI) * .075;
  }

  function solid(object) { object.userData.solid = true; return object; }

  function walk(person, t, options) {
    const motion = sampleWalk(t, options);
    person.setNeutral();
    person.group.position.x = motion.x;
    person.group.position.z = motion.z;
    person.group.position.y = .015 + (motion.moving ? Math.abs(motion.stride)*.008 : 0);
    person.group.rotation.y = motion.yaw;
    person.setWalk(motion.stride, motion.moving ? 1 : 0);
    return motion;
  }

  function addCafeTable(parent, x, z) {
    solid(cylinder(parent, 0.29, 0.045, [x, 0.58, z], C.woodLight, { segments: 32, receive: true }));
    cylinder(parent, 0.055, 0.54, [x, 0.29, z], C.navySoft, { segments: 12 });
    cylinder(parent, 0.19, 0.035, [x, 0.025, z], C.navy, { segments: 20, receive: true });
  }

  function addChair(parent, x, z, rotationY = 0, color = C.teal) {
    const chair = group(parent, "chair", [x, 0, z]);
    chair.rotation.y = rotationY;
    box(chair, [0.39, 0.07, 0.38], [0, 0.39, 0], color, { receive: true });
    box(chair, [0.39, 0.42, 0.055], [0, 0.59, -0.165], color, { rotation: [-0.1, 0, 0] });
    [-0.15, 0.15].forEach((legX) => {
      [-0.14, 0.14].forEach((legZ) => box(chair, [0.045, 0.38, 0.045], [legX, 0.19, legZ], C.navy, {}));
    });
    return solid(chair);
  }

  function makeCoffeeRoom() {
    const room = new THREE.Group();
    room.name = "coffee-room";
    addRearPanels(room, C.teal);
    addRug(room, [1.46, 0.92], [-0.72, 0.52], 0xdde8e4);
    addLabel(room, "NORTH / COFFEE", [0, 1.79, -1.095], [1.45, 0.3]);

    // Rear service counter and softly rounded display details.
    solid(box(room, [1.65, 0.68, 0.46], [0.83, 0.34, -0.43], C.wood, { receive: true }));
    solid(box(room, [1.75, 0.08, 0.5], [0.83, 0.72, -0.43], C.ivory, { receive: true }));
    box(room, [0.46, 0.18, 0.12], [0.32, 0.85, -0.43], C.navy, {});
    [0, 1, 2].forEach((index) => {
      sphere(room, 0.07, [0.18 + index * 0.14, 0.82, -0.32], [C.pastry, C.cream, C.terracotta][index], {
        scale: [1.25, 0.55, 0.9],
        widthSegments: 14,
        heightSegments: 8,
      });
    });

    const machine = group(room, "espresso-machine", [1.15, 0.78, -0.46]);
    box(machine, [0.64, 0.38, 0.32], [0, 0.19, 0], C.steel, {
      materialOptions: { metalness: 0.62, roughness: 0.3 },
    });
    box(machine, [0.52, 0.19, 0.035], [0, 0.22, 0.178], C.navy, {});
    [ -0.17, 0.17 ].forEach((x) => {
      cylinder(machine, 0.035, 0.16, [x, 0.08, 0.2], C.darkSteel, { segments: 12 });
      cylinder(machine, 0.02, 0.17, [x + 0.055, 0.03, 0.2], C.charcoal, {
        rotation: [0, 0, Math.PI / 2],
        segments: 10,
      });
    });
    [ -0.2, 0, 0.2 ].forEach((x) => sphere(machine, 0.025, [x, 0.28, 0.181], x === 0 ? C.teal : C.ivory, { cast: false }));
    addCup(room, [1.15, 0.76, -0.20], C.ivory, 0.92);
    [0, 1, 2, 3].forEach((index) => addCup(room, [0.45 + index * 0.12, 0.76, -0.55], index % 2 ? C.teal : C.ivory, 0.72));

    addCafeTable(room, -0.79, 0.52);
    addChair(room, -1.35, 0.52, Math.PI / 2, C.teal);
    addChair(room, -0.23, 0.52, -Math.PI / 2, C.mustard);
    addPlant(room, [-1.35, 0, -0.83], .65);

    const seatedA = createPerson(room, {
      name: "patron-lifting-cup",
      position: [-1.35, 0, 0.52],
      rotationY: Math.PI / 2,
      shirt: C.mustard,
      trousers: C.navy,
      skin: C.skin2,
    });
    seatedA.setSeated();
    const heldCup = addCup(seatedA.rightArm.joint, [0, -0.215, 0.015], C.ivory, 0.72);

    const seatedB = createPerson(room, {
      name: "patron-chatting",
      position: [-0.23, 0, 0.52],
      rotationY: -Math.PI / 2,
      shirt: C.lavender,
      trousers: C.navySoft,
      skin: C.skin1,
    });
    seatedB.setSeated();
    seatedB.leftArm.pivot.rotation.z = -0.2;

    const barista = createPerson(room, {
      name: "barista",
      position: [0.68, 0, -1.0],
      shirt: C.teal,
      trousers: C.charcoal,
      skin: C.skin3,
    });
    const apron = box(barista.group, [0.31, 0.43, 0.035], [0, 0.96, 0.135], C.ivory, { cast: false });
    apron.rotation.x = -0.03;

    const pickupCustomer = createPerson(room, {
      name: "pickup-customer",
      position: [1.25, 0, 1.02],
      shirt: C.blush,
      trousers: C.navy,
      skin: C.skin1,
    });
    const servedCup = addCup(room, [0, 0, 0], C.ivory);
    servedCup.name = 'served-cup';
    servedCup.userData.animated = true;
    const steam = [0, 1, 2].map((index) => {
      const ring = mesh(
        room,
        torusGeometry(0.035 + index * 0.007, 0.006, 6, 16),
        material(C.ivory, { transparent: true, opacity: 0.48, roughness: 1 }).clone(),
        [1.15, 0.88 + index * 0.08, -0.20],
        { rotation: [Math.PI / 2, 0, 0], cast: false },
      );
      ring.userData.animated=true;
      return ring;
    });

    function update(t) {
      const pickup = walk(pickupCustomer, t, {start:[1.25,1.02],end:[1.25,.23],endFacing:Math.PI,hold:2.7});
      const reach = duringVisit(pickup, .12, .84);
      const tamp = duringArrival(pickup, .14, .86);
      pickupCustomer.rightArm.pivot.rotation.x -= reach*.78;
      pickupCustomer.rightArm.joint.rotation.x -= reach*.55;
      barista.setNeutral();
      barista.rightArm.pivot.rotation.x = -.65 - reach * .45 - tamp * .2;
      barista.rightArm.pivot.rotation.z = -reach * 0.25;
      barista.rightArm.joint.rotation.x = -0.45 - reach * 0.55;
      barista.leftArm.pivot.rotation.x = -.65 - tamp * .35;
      barista.leftArm.joint.rotation.x = -0.35 - tamp * 0.5;
      const passed = transferProgress(pickup);
      betweenHands(servedCup, room, barista, barista.rightArm, pickupCustomer, pickupCustomer.rightArm, passed);
      // The next drink appears after the previous visitor has left the room.
      const cupFade = pickup.step === 7 ? 1 - smooth(pickup.stepProgress) :
        pickup.step === 0 ? smooth(pickup.stepProgress) : 1;
      servedCup.scale.setScalar(.7 * cupFade);
      room.userData.interaction = {visitorAtCounter:pickup.step === 4, handoff:reach, transfer:passed};

      const sip = pulse((t % 7.4) / 7.4, 0.24, 0.57);
      seatedA.setSeated();
      seatedA.rightArm.pivot.rotation.x = -0.45 - sip * 0.8;
      seatedA.rightArm.pivot.rotation.z = -sip * 0.12;
      seatedA.rightArm.joint.rotation.x = -0.7 - sip * 0.5;
      heldCup.rotation.x = -seatedA.rightArm.pivot.rotation.x - seatedA.rightArm.joint.rotation.x + sip*.14;

      steam.forEach((ring, index) => {
        const phase = (t * 0.18 + index * 0.24) % 1;
        ring.position.y = 0.88 + phase * 0.26;
        ring.position.x = 1.15 + Math.sin((phase + index) * Math.PI) * 0.018;
        ring.scale.setScalar(0.65 + phase * 0.55);
        ring.material.opacity = (1 - phase) * 0.42;
      });
    }

    update(0);
    return { id: "coffee", group: room, update };
  }

  function addWarehouseRack(parent) {
    const rack = group(parent, "stock-rack", [-0.42, 0, -0.88]);
    [-1.1, -0.35, 0.4, 1.1].forEach((x) => box(rack, [0.055, 1.65, 0.42], [x, 0.825, 0], C.darkSteel, {}));
    [0.23, 0.68, 1.13, 1.58].forEach((y) => box(rack, [2.25, 0.055, 0.45], [0, y, 0], C.steel, {
      materialOptions: { metalness: 0.38, roughness: 0.42 },
      receive: true,
    }));
    const colors = [C.carton, C.cream, C.tealLight, C.woodLight];
    [0, 1, 2].forEach((row) => {
      [0, 1, 2, 3, 4].forEach((column) => {
        const width = column % 2 ? 0.29 : 0.34;
        addCarton(rack, [-0.88 + column * 0.44, 0.27 + row * 0.45, 0.02], [width, 0.27, 0.34], colors[(row + column) % colors.length]);
      });
    });
    return solid(rack);
  }

  function makeWarehouseRoom() {
    const room = new THREE.Group();
    room.name = "warehouse-room";
    addRearPanels(room, C.mustard);
    addLabel(room, "FULFILMENT", [0.65, 1.83, -1.095], [1.22, 0.32], { border: "#C99A36" });
    addWarehouseRack(room);

    // Conveyor runs across the open foreground.
    const belt = group(room, "conveyor", [-0.35, 0, 0.62]);
    solid(box(belt, [1.7, 0.12, 0.48], [-.3, 0.48, 0], C.navySoft, { receive: true }));
    [ -1.05, -.7, -.35, 0, .35 ].forEach((x) => {
      cylinder(belt, 0.07, 0.53, [x, 0.55, 0], C.steel, {
        rotation: [Math.PI / 2, 0, 0],
        segments: 14,
        materialOptions: { metalness: 0.45, roughness: 0.4 },
      });
    });
    [ -1.03, .43 ].forEach((x) => {
      [ -0.2, 0.2 ].forEach((z) => box(belt, [0.07, 0.48, 0.07], [x, 0.24, z], C.darkSteel, {}));
    });
    const movingBoxes = [0, 1, 2].map((index) => addCarton(belt, [-1.05 + index * 0.8, 0.62, 0], [0.3, 0.22, 0.3], index === 1 ? C.tealLight : C.carton));

    movingBoxes.forEach(box=>{box.userData.animated=true;});

    // Packing desk and shipping supplies to the right.
    solid(box(room, [0.85, 0.08, 0.64], [1.16, 0.75, -0.1], C.woodLight, { receive: true }));
    [0.88, 1.44].forEach((x) => box(room, [0.07, 0.72, 0.07], [x, 0.36, -0.1], C.navy, {}));
    addCarton(room, [1.15, 0.79, -0.12], [0.34, 0.23, 0.3], C.cream);
    cylinder(room, 0.12, 0.09, [1.43, 0.84, -0.2], C.teal, {
      rotation: [Math.PI / 2, 0, 0],
      segments: 18,
    });
    box(room, [0.32, 0.26, 0.04], [0.9, 1.02, -0.35], C.navy, { rotation: [-0.16, 0, 0] });
    box(room, [0.22, 0.025, 0.16], [0.9, 0.85, -0.25], C.darkSteel, {});

    const picker = createPerson(room, {
      name: "picker",
      position: [-1.45, 0, -0.25],
      shirt: C.mustard,
      trousers: C.navy,
      skin: C.skin2,
    });
    box(picker.group, [0.13, 0.18, 0.035], [0, 1.04, 0.14], C.ivory, { cast: false });
    const pickedCarton = addCarton(picker.rightArm.joint, [0, -0.28, 0.08], [0.19, 0.16, 0.16], C.carton);

    const packer = createPerson(room, {
      name: "packer",
      position: [1.25, 0, 0.61],
      rotationY: Math.PI,
      shirt: C.teal,
      trousers: C.charcoal,
      skin: C.skin3,
    });
    const scanner = box(packer.rightArm.joint, [0.07, 0.13, 0.05], [0, -0.27, 0.04], C.navy, {});

    function update(t) {
      movingBoxes.forEach((carton, index) => {
        const progress = (t * 0.115 + index / movingBoxes.length) % 1;
        carton.position.x = -1.0 + progress * 1.42;
        carton.scale.setScalar(Math.min(1,progress/.08,(1-progress)/.08));
        carton.rotation.y = Math.sin(progress * Math.PI) * 0.03;
      });

      const pick = walk(picker, t, {start:[-1.2,-.22],end:[-.45,-.22],startFacing:0,endFacing:Math.PI,phase:1.1,hold:3});
      pickedCarton.visible = pick.activity < .1;
      picker.rightArm.pivot.rotation.x -= pick.activity*1.05;
      picker.rightArm.joint.rotation.x -= pick.activity*.5;
      picker.leftArm.pivot.rotation.x -= pick.activity*.7;

      // Packing follows the carton on the desk: scan as the picker reaches the
      // rack, then close the box while the picked order moves away.
      const scan = duringVisit(pick, .12, .5);
      const fold = duringVisit(pick, .48, .9);
      packer.setNeutral();
      packer.rightArm.pivot.rotation.x = -0.35 - scan * 0.82;
      packer.rightArm.pivot.rotation.z = -scan * 0.22;
      packer.rightArm.joint.rotation.x = -0.45 - scan * 0.48;
      packer.leftArm.pivot.rotation.x = -0.25 - fold * 0.88;
      packer.leftArm.pivot.rotation.z = fold * 0.22;
      packer.leftArm.joint.rotation.x = -0.4 - fold * 0.5;
      scanner.rotation.z = -scan * 0.22;
    }

    update(0);
    return { id: "warehouse", group: room, update };
  }

  function addGroceryShelf(parent, x, width, labelColor) {
    const shelf = group(parent, "grocery-shelf", [x, 0, -0.87]);
    box(shelf, [width, 1.48, 0.28], [0, 0.74, 0], C.woodLight, { receive: true });
    box(shelf, [width - 0.1, 1.3, 0.04], [0, 0.78, 0.17], C.ivory, { cast: false });
    [0.35, 0.72, 1.09, 1.46].forEach((y) => box(shelf, [width, 0.045, 0.38], [0, y, 0.06], C.navySoft, { receive: true }));
    box(shelf, [width, 0.13, 0.04], [0, 1.55, 0.18], labelColor, {});
    const rows = [0.38, 0.75, 1.12];
    rows.forEach((y, row) => {
      const count = Math.floor(width / 0.18);
      for (let column = 0; column < count; column += 1) {
        const itemX = -width / 2 + 0.11 + column * ((width - 0.22) / Math.max(1, count - 1));
        if ((row + column) % 2 === 0) {
          addBottle(shelf, [itemX, y + 0.025, 0.23], [C.teal, C.terracotta, C.mustard][(row + column) % 3], 0.72);
        } else {
          cylinder(shelf, 0.046, 0.105, [itemX, y + 0.052, 0.23], [C.cream, C.blush, C.tealLight][(row + column) % 3], { segments: 12 });
          cylinder(shelf, 0.05, 0.012, [itemX, y + 0.111, 0.23], C.brass, { segments: 12 });
        }
      }
    });
    return solid(shelf);
  }

  function addProduceTable(parent) {
    const stand = group(parent, "produce-display", [-0.95, 0, 0.52]);
    box(stand, [1.12, 0.18, 0.68], [0, 0.55, 0], C.wood, { receive: true, rotation: [0.08, 0, 0] });
    [ -0.43, 0.43 ].forEach((x) => [ -0.23, 0.23 ].forEach((z) => box(stand, [0.07, 0.52, 0.07], [x, 0.26, z], C.navy, {})));
    const produceColors = [0xd67e3f, 0x82a95b, 0xc9a136, 0x9c4e4e];
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 5; column += 1) {
        sphere(stand, 0.085, [-0.39 + column * 0.195, 0.69 + row * 0.055, -0.16 + row * 0.16], produceColors[(row + column) % produceColors.length], {
          scale: [1, 0.86, 1],
          widthSegments: 12,
          heightSegments: 8,
        });
      }
    }
    return solid(stand);
  }

  function makeGroceryRoom() {
    const room = new THREE.Group();
    room.name = "grocery-wellness-room";
    addRearPanels(room, C.leaf);
    addLabel(room, "PANTRY + WELLNESS", [0, 1.84, -1.095], [1.55, 0.3], { border: "#79A86D" });
    addGroceryShelf(room, -0.86, 1.42, C.leaf);
    addGroceryShelf(room, 0.86, 1.42, C.teal);
    addProduceTable(room);
    addRug(room, [1.1, 0.74], [0.9, 0.66], 0xdfe7d8);

    const assistant = createPerson(room, {
      name: "restocking-assistant",
      position: [0.28, 0, -0.18],
      rotationY: Math.PI,
      shirt: C.leaf,
      trousers: C.navy,
      skin: C.skin3,
    });
    box(assistant.group, [0.22, 0.29, 0.03], [0, 1.01, 0.14], C.ivory, { cast: false });
    const restockBottle = addBottle(assistant.rightArm.joint, [0, -0.27, 0.015], C.terracotta, 0.62);

    const customer = createPerson(room, {
      name: "browsing-customer",
      position: [1.35, 0, 0.8],
      rotationY: Math.PI,
      shirt: C.lavender,
      trousers: C.navySoft,
      skin: C.skin1,
    });
    const basket = group(customer.leftArm.joint, "basket", [0, -0.33, 0.05]);
    box(basket, [0.28, 0.18, 0.2], [0, 0, 0], C.woodLight, { receive: true });
    mesh(basket, torusGeometry(0.14, 0.012, 6, 16), material(C.navy), [0, 0.12, 0], {
      rotation: [Math.PI / 2, 0, 0],
      cast: false,
    });

    function update(t) {
      const browse = walk(customer, t, {start:[1.2,.95],end:[1.2,-.12],endFacing:Math.PI,phase:2,hold:3});
      const lift = duringArrival(browse, .08, .52);
      const place = duringArrival(browse, .48, .94);
      assistant.setNeutral();
      assistant.rightArm.pivot.rotation.x = -0.3 - lift * 1.22;
      assistant.rightArm.pivot.rotation.z = -lift * 0.18;
      assistant.rightArm.joint.rotation.x = -0.28 - place * 0.72;
      assistant.leftArm.pivot.rotation.x = -0.2 - place * 0.72;
      assistant.leftArm.joint.rotation.x = -0.25 - place * 0.4;
      restockBottle.position.y = -0.27 + (lift + place) * 0.03;

      customer.rightArm.pivot.rotation.x -= browse.activity*.85;
      customer.rightArm.joint.rotation.x -= browse.activity*.5;
      customer.leftArm.pivot.rotation.x = -0.42;
      customer.leftArm.pivot.rotation.z = 0.22;
      customer.leftArm.joint.rotation.x = -0.45;
    }

    update(0);
    return { id: "grocery", group: room, update };
  }

  function addPlant(parent, position, scale = 1) {
    const plant = group(parent, "plant", position);
    tapered(plant, 0.16 * scale, 0.22 * scale, 0.28 * scale, [0, 0.14 * scale, 0], C.terracotta, { segments: 18 });
    [
      [-0.11, 0.42, 0, -0.45],
      [0.1, 0.5, 0.01, 0.42],
      [-0.05, 0.61, -0.02, -0.18],
      [0.13, 0.67, 0.02, 0.24],
      [-0.12, 0.73, 0, -0.28],
    ].forEach(([x, y, z, rz], index) => {
      const leaf = sphere(plant, 0.15 * scale, [x * scale, y * scale, z], index % 2 ? C.leafLight : C.leaf, {
        scale: [0.58, 1.3, 0.34],
        widthSegments: 12,
        heightSegments: 8,
      });
      leaf.rotation.z = rz;
    });
    return plant;
  }

  function addLamp(parent, position, color, scale = 1) {
    const lamp = group(parent, "lamp", position);
    cylinder(lamp, 0.045 * scale, 0.72 * scale, [0, 0.36 * scale, 0], C.brass, {
      segments: 12,
      materialOptions: { metalness: 0.55, roughness: 0.32 },
    });
    cylinder(lamp, 0.19 * scale, 0.035 * scale, [0, 0.02 * scale, 0], C.navy, { segments: 20, receive: true });
    tapered(lamp, 0.16 * scale, 0.25 * scale, 0.3 * scale, [0, 0.82 * scale, 0], color, {
      segments: 20,
      materialOptions: { roughness: 0.78 },
    });
    cylinder(lamp, 0.075 * scale, 0.025 * scale, [0, 0.69 * scale, 0], C.white, {
      segments: 16,
      materialOptions: { emissive: 0xffd7a0, emissiveIntensity: 0.45, roughness: 0.4 },
    });
    return lamp;
  }

  function addCeramic(parent, position, color, scale = 1) {
    const ceramic = group(parent, "ceramic", position);
    tapered(ceramic, 0.1 * scale, 0.15 * scale, 0.25 * scale, [0, 0.125 * scale, 0], color, { segments: 20 });
    cylinder(ceramic, 0.07 * scale, 0.06 * scale, [0, 0.27 * scale, 0], color, { segments: 20 });
    return ceramic;
  }

  function makeHomewaresRoom() {
    const room = new THREE.Group();
    room.name = "homewares-room";
    addRearPanels(room, C.blush);
    addLabel(room, "OBJECTS + HOME", [0, 1.73, -1.095], [1.45, 0.32], { border: "#D99A89" });
    addRug(room, [2.0, 1.18], [0.14, 0.25], 0xe5d8cf);

    // Gallery plinths stagger in height instead of forming retail aisles.
    const plinths = [
      { p: [-0.95, 0, -0.5], s: [0.52, 0.58, 0.48], c: C.ivory },
      { p: [-0.32, 0, -0.66], s: [0.42, 0.82, 0.4], c: C.cream },
      { p: [0.3, 0, -0.58], s: [0.48, 0.67, 0.46], c: C.ivory },
    ];
    plinths.forEach(({ p, s, c }, index) => {
      solid(box(room, s, [p[0], s[1] / 2, p[2]], c, { receive: true }));
      addCeramic(room, [p[0], s[1] + 0.015, p[2]], [C.teal, C.terracotta, C.navySoft][index], 0.86 + index * 0.08);
    });
    solid(addLamp(room, [1.40, 0, -.88], C.mustard, 1.1));
    solid(addPlant(room, [-1.5, 0, -.48], .8));

    // Curved-looking lounge vignette made from upholstered volumes.
    const bench = solid(group(room, "display-bench", [-.9, 0, 0.58]));
    box(bench, [1.18, 0.3, 0.48], [0, 0.2, 0], C.teal, { receive: true });
    box(bench, [1.18, 0.44, 0.18], [0, 0.47, -0.17], C.teal, { rotation: [-0.12, 0, 0] });
    cylinder(bench, 0.13, 0.5, [-0.55, 0.42, -0.03], C.teal, { rotation: [Math.PI / 2, 0, 0], segments: 18 });
    cylinder(bench, 0.13, 0.5, [0.55, 0.42, -0.03], C.teal, { rotation: [Math.PI / 2, 0, 0], segments: 18 });
    box(bench, [0.32, 0.24, 0.1], [-0.25, 0.42, 0.19], C.mustard, { rotation: [-0.18, 0.12, 0] });
    box(bench, [0.32, 0.24, 0.1], [0.22, 0.42, 0.19], C.blush, { rotation: [-0.18, -0.12, 0] });

    const smallTable = solid(group(room, "side-table", [.1, 0, .75]));
    cylinder(smallTable, 0.20, 0.045, [0, 0.48, 0], C.woodLight, { segments: 24, receive: true });
    cylinder(smallTable, 0.05, 0.45, [0, 0.245, 0], C.brass, { segments: 12, materialOptions: { metalness: 0.5, roughness: 0.35 } });
    addCeramic(smallTable, [0, 0.51, 0], C.blush, 0.55);

    const consultant = createPerson(room, {
      name: "design-consultant",
      position: [0.13, 0, 0.0],
      rotationY: Math.PI / 2,
      shirt: C.navySoft,
      trousers: C.charcoal,
      skin: C.skin2,
    });
    const swatch = box(consultant.leftArm.joint, [0.17, 0.23, 0.025], [0, -0.29, 0.02], C.mustard, { cast: false });

    const customer = createPerson(room, {
      name: "homewares-customer",
      position: [1.45, 0, 0.9],
      rotationY: Math.PI,
      shirt: C.blush,
      trousers: C.navy,
      skin: C.skin1,
    });

    function update(t) {
      const browse = walk(customer, t, {start:[1.27,.98],end:[.96,.02],endFacing:-Math.PI/2,phase:.8,hold:3});
      const gesture = duringVisit(browse, .12, .5);
      const showSwatch = duringVisit(browse, .48, .88);
      consultant.setNeutral();
      consultant.rightArm.pivot.rotation.x = -0.25 - gesture * 0.78;
      consultant.rightArm.pivot.rotation.z = -gesture * 0.8;
      consultant.rightArm.joint.rotation.x = -0.35 - gesture * 0.42;
      consultant.leftArm.pivot.rotation.x = -0.28 - showSwatch * 0.62;
      consultant.leftArm.pivot.rotation.z = showSwatch * 0.25;
      consultant.leftArm.joint.rotation.x = -0.55;
      swatch.rotation.z = showSwatch * 0.12;

      customer.leftArm.pivot.rotation.x -= browse.activity*.6;
      customer.leftArm.joint.rotation.x -= browse.activity*.45;

    }

    update(0);
    return { id: "homewares", group: room, update };
  }

  function makeBoutiqueRoom() {
    const room = new THREE.Group();
    room.name = 'fashion-boutique';
    addRearPanels(room, C.navy);
    addLabel(room, 'FORM / STUDIO', [0,1.85,-1.095], [1.5,.28]);
    const rack = solid(group(room,'clothing-rail',[-.5,0,-.83]));
    [-1.05,1.05].forEach(x=>cylinder(rack,.025,1.55,[x,.775,0],C.brass));
    cylinder(rack,.025,2.15,[0,1.55,0],C.brass,{rotation:[0,0,Math.PI/2]});
    [-.8,-.4,0,.4,.8].forEach((x,i)=>{
      const garment=group(rack,'garment',[x,0,.05]);
      const color=[C.cream,C.navySoft,C.blush,C.teal,C.ivory][i];
      // Shoulders, sleeves and a flared hem give each hanging piece a clear silhouette.
      box(garment,[.25,.46,.10],[0,1.05,0],color);
      tapered(garment,.14,.19,.26,[0,.72,0],color,{segments:4,rotation:[0,Math.PI/4,0]});
      [-1,1].forEach(side=>box(garment,[.10,.3,.09],[side*.15,1.16,0],color,{rotation:[0,0,side*.28]}));
      mesh(garment,torusGeometry(.04,.009,6,12),material(C.brass),[0,1.5,0],{cast:false});
    });
    box(room,[.75,1.5,.035],[1.23,.85,-1.06],C.steel,{materialOptions:{metalness:.8,roughness:.18}});
    const counter=solid(group(room,'boutique-checkout',[-1.02,0,.76]));
    box(counter,[1.24,.7,.48],[0,.35,0],C.cream,{receive:true});
    box(counter,[1.3,.055,.51],[0,.727,0],C.ivory,{receive:true});
    box(counter,[.23,.16,.025],[-.37,.85,0],C.navy,{rotation:[-.25,0,0]});
    [0,1,2].forEach(i=>box(counter,[.3,.035,.22],[.25,.78+i*.035,.02],[C.teal,C.blush,C.cream][i]));
    const display=solid(group(room,'accessories-table',[.08,0,.55]));
    cylinder(display,.26,.04,[0,.51,0],C.woodLight,{segments:28});
    cylinder(display,.07,.5,[0,.25,0],C.brass);
    box(display,[.19,.18,.1],[0,.63,0],C.blush);
    const stylist=createPerson(room,{name:'stylist-folding',position:[-.24,0,-.18],shirt:C.navySoft,skin:C.skin3});
    const folded=box(stylist.rightArm.joint,[.22,.035,.17],[0,-.22,.03],C.cream);
    const shopper=createPerson(room,{name:'boutique-shopper',position:[1.04,0,1.03],shirt:C.ivory,trousers:C.teal,skin:C.skin2});
    box(shopper.leftArm.joint,[.18,.23,.10],[0,-.33,0],C.woodLight);
    function update(t){
      stylist.setNeutral();
      const browse=walk(shopper,t,{start:[1.04,1.03],end:[.72,-.18],endFacing:-Math.PI/2,phase:1.5,hold:2.8});
      const fold=duringArrival(browse,.1,.9);
      const present=duringVisit(browse,.14,.82);
      stylist.rightArm.pivot.rotation.x=-.8-fold*.25;
      stylist.rightArm.joint.rotation.x=-.35-fold*.2;
      stylist.leftArm.pivot.rotation.x=-.85-fold*.15-present*.35;
      stylist.leftArm.joint.rotation.x=-.35;
      folded.rotation.y=fold*.18+present*.16;
      shopper.rightArm.pivot.rotation.x-=present*.6;
      shopper.rightArm.joint.rotation.x-=present*.4;
    }
    update(0);
    return {id:'boutique',group:room,update};
  }

  function addBouquet(parent,position,color,scale=1){
    const bouquet=group(parent,'bouquet',position);
    bouquet.scale.setScalar(scale);
    [[-.11,.39,.02],[.1,.46,.01],[0,.56,-.02]].forEach(([x,y,z],i)=>{
      cylinder(bouquet,.011,y,[x,y/2,z],C.leaf,{segments:8});
      const leaf=sphere(bouquet,.07,[x+.045,y*.55,z],C.leafLight,{scale:[.45,1,.18],widthSegments:8,heightSegments:6});
      leaf.rotation.z=-.65;
      for(let j=0;j<5;j++){
        const angle=j*TAU/5;
        sphere(bouquet,.055,[x+Math.cos(angle)*.047,y+Math.sin(angle)*.047,z+.018],color,{scale:[1,1,.62],widthSegments:10,heightSegments:8});
      }
      sphere(bouquet,.027,[x,y,z+.055],i===1?C.mustard:C.cream,{widthSegments:10,heightSegments:8});
    });
    return bouquet;
  }

  function makeFloristRoom(){
    const room=new THREE.Group();room.name='florist-studio';
    addRearPanels(room,C.leaf);
    addLabel(room,'STEM / FLORAL STUDIO',[0,1.83,-1.095],[1.85,.28],{border:'#79A86D'});
    [-1.3,-.58,.18].forEach((x,i)=>{
      const stand=solid(group(room,'flower-plinth',[x,0,-.84]));
      const h=[.32,.55,.4][i];
      box(stand,[.52,h,.38],[0,h/2,0],C.cream,{receive:true});
      tapered(stand,.13,.10,.2,[0,h+.1,0],C.ivory,{segments:18});
      addBouquet(stand,[0,h+.16,0],[C.blush,C.terracotta,C.mustard][i],1.12);
    });
    solid(addPlant(room,[1.38,0,-.87],1.05));
    const bench=solid(group(room,'florist-workbench',[-.53,0,.64]));
    box(bench,[1.42,.065,.51],[0,.72,0],C.woodLight,{receive:true});
    [-.58,.58].forEach(x=>[-.18,.18].forEach(z=>box(bench,[.055,.69,.055],[x,.345,z],C.navy)));
    box(bench,[.38,.009,.3],[.35,.761,0],C.cream,{rotation:[0,.15,0]});
    addBouquet(bench,[-.46,.76,-.02],C.blush,.6);
    cylinder(bench,.055,.07,[.02,.79,0],C.teal,{segments:14});
    const florist=createPerson(room,{name:'florist-wrapping',position:[-.2,0,.04],shirt:C.leaf,trousers:C.navySoft,skin:C.skin2});
    box(florist.group,[.31,.42,.03],[0,.96,.15],C.cream);
    const bouquet=addBouquet(room,[0,0,0],C.blush);
    bouquet.name='handoff-bouquet';
    bouquet.userData.animated=true;
    const customer=createPerson(room,{name:'flower-customer',position:[1.13,0,1.02],shirt:C.blush,skin:C.skin1});
    function update(t){
      const pickup=walk(customer,t,{start:[1.13,1.02],end:[.68,.15],endFacing:-Math.PI/2,phase:.6,hold:3});
      const wrapping=duringArrival(pickup,.12,.9);
      const handoff=duringVisit(pickup,.12,.86);
      florist.setNeutral();
      florist.leftArm.pivot.rotation.x=-.9-wrapping*.18;
      florist.leftArm.joint.rotation.x=-.5;
      florist.rightArm.pivot.rotation.x=-.78-wrapping*.3-handoff*.22;
      florist.rightArm.pivot.rotation.z=-handoff*.48;
      florist.rightArm.joint.rotation.x=-.35-wrapping*.2-handoff*.25;
      customer.rightArm.pivot.rotation.x-=handoff*.65;
      customer.rightArm.joint.rotation.x-=handoff*.45;
      const passed=transferProgress(pickup);
      betweenHands(bouquet,room,florist,florist.rightArm,customer,customer.rightArm,passed);
      bouquet.rotation.z=wrapping*.15;
      const bouquetFade=pickup.step===7?1-smooth(pickup.stepProgress):pickup.step===0?smooth(pickup.stepProgress):1;
      bouquet.scale.setScalar(.55*bouquetFade);
      room.userData.interaction={visitorAtCounter:pickup.step===4,handoff,transfer:passed};
    }
    update(0);return {id:'florist',group:room,update};
  }

  function prepareRoom(room){
    room.group.updateMatrixWorld(true);
    // Collider footprints are derived from the actual furniture geometry before batching.
    const obstacles=[];
    room.group.traverse(object=>{
      if(!object.userData.solid)return;
      const b=new THREE.Box3().setFromObject(object);
      obstacles.push({name:object.name||'furniture',minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z});
    });
    room.group.userData.obstacles=obstacles;
    const batches=new Map();
    room.group.traverse(object=>{
      if(!object.isMesh||object.material.transparent||object.material.map)return;
      for(let parent=object;parent&&parent!==room.group;parent=parent.parent){
        if(parent.userData.person||parent.userData.animated)return;
      }
      const key=`${object.geometry.uuid}:${object.material.uuid}:${object.castShadow}:${object.receiveShadow}`;
      if(!batches.has(key))batches.set(key,[]);
      batches.get(key).push(object);
    });
    for(const objects of batches.values()){
      if(objects.length<3)continue;
      const first=objects[0],batch=new THREE.InstancedMesh(first.geometry,first.material,objects.length);
      batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;
      objects.forEach((object,i)=>{batch.setMatrixAt(i,object.matrixWorld);object.removeFromParent();});
      batch.instanceMatrix.needsUpdate=true;room.group.add(batch);
    }
    return room;
  }

  return [makeCoffeeRoom(),makeWarehouseRoom(),makeBoutiqueRoom(),makeGroceryRoom(),makeFloristRoom(),makeHomewaresRoom()].map(prepareRoom);
}
