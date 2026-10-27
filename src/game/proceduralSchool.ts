/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Clue, Locker, WorldItem, PuzzleObstacle } from './rules.ts';

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface SchoolEnvironment {
  scene: THREE.Scene;
  collisionBoxes: CollisionBox[];
  lockerMeshes: Map<string, THREE.Group>;
  clueMeshes: Map<string, THREE.Group>;
  worldItemMeshes: Map<string, THREE.Group>;
  puzzleMeshes: Map<string, THREE.Group>;
  entityGroup: THREE.Group;
  entityLight: THREE.PointLight;
  hallwayLights: THREE.PointLight[];
  exitDoorGroup: THREE.Group;
  door104Mesh: THREE.Group | null;
  barricadeMesh: THREE.Group | null;
}

/**
 * Generate procedural floor texture with linoleum tiles and water/grime stains
 */
function createFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Grimy aged base
  ctx.fillStyle = '#22252a';
  ctx.fillRect(0, 0, 512, 512);

  // Checker tiles with distress
  const tileSize = 64;
  for (let x = 0; x < 512; x += tileSize) {
    for (let y = 0; y < 512; y += tileSize) {
      const isAlt = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#2b2f36' : '#1e2126';
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

      // Scuff marks
      if (Math.random() > 0.4) {
        ctx.fillStyle = 'rgba(10, 10, 12, 0.45)';
        ctx.fillRect(x + Math.random() * 40, y + Math.random() * 40, Math.random() * 24, 2);
      }
    }
  }

  // Large grime / water stain splatters
  for (let i = 0; i < 15; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    const rad = 20 + Math.random() * 60;
    const grad = ctx.createRadialGradient(rx, ry, 2, rx, ry, rad);
    grad.addColorStop(0, 'rgba(12, 10, 8, 0.55)');
    grad.addColorStop(1, 'rgba(12, 10, 8, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(rx, ry, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 24);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural wall texture with peeling paint and moisture stains
 */
function createWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Upper plaster (pale sickly beige/green)
  ctx.fillStyle = '#454a44';
  ctx.fillRect(0, 0, 512, 320);

  // Lower dark wainscoting
  ctx.fillStyle = '#1c1f22';
  ctx.fillRect(0, 320, 512, 192);

  // Wooden trim divider
  ctx.fillStyle = '#0f1114';
  ctx.fillRect(0, 316, 512, 8);

  // Peeling plaster cracks
  ctx.strokeStyle = '#2b2e2a';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 25; i++) {
    ctx.beginPath();
    let cx = Math.random() * 512;
    let cy = Math.random() * 300;
    ctx.moveTo(cx, cy);
    for (let j = 0; j < 5; j++) {
      cx += (Math.random() - 0.5) * 30;
      cy += (Math.random() - 0.5) * 30;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Create composite school locker (3-5 part THREE.Group)
 */
function createLockerGroup(): THREE.Group {
  const group = new THREE.Group();

  const cabinetMat = new THREE.MeshStandardMaterial({
    color: 0x2d3748, // Dark institutional olive/slate
    roughness: 0.65,
    metalness: 0.45,
  });

  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.55,
    metalness: 0.5,
  });

  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x8a929e,
    roughness: 0.25,
    metalness: 0.85,
  });

  // 1. Outer cabinet carcass
  const carcassGeo = new THREE.BoxGeometry(0.9, 2.2, 0.8);
  const carcass = new THREE.Mesh(carcassGeo, cabinetMat);
  carcass.position.y = 1.1;
  carcass.castShadow = true;
  group.add(carcass);

  // 2. Door with handle
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.42, 1.1, 0.4);

  const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.1, 0.04), doorMat);
  doorMesh.position.set(0.42, 0, 0);
  doorPivot.add(doorMesh);

  // Handle
  const handleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15), handleMat);
  handleMesh.position.set(0.75, 0, 0.04);
  doorPivot.add(handleMesh);

  // Vent louvers (visual indent)
  const louverMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
  const louver = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.01), louverMat);
  louver.position.set(0.42, 0.7, 0.025);
  doorPivot.add(louver);

  doorPivot.name = 'doorPivot';
  group.add(doorPivot);

  return group;
}

/**
 * Create classroom desk with chair
 */
function createDeskAndChair(): THREE.Group {
  const group = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5a3e28, // Aged stained wood
    roughness: 0.75,
    metalness: 0.05,
  });

  const legMat = new THREE.MeshStandardMaterial({
    color: 0x1e242d, // Dark metal tube
    roughness: 0.4,
    metalness: 0.7,
  });

  // Desktop
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.7), woodMat);
  top.position.y = 0.75;
  top.castShadow = true;
  group.add(top);

  // Desk legs (4 thin cylinders)
  const legPositions = [
    [-0.52, 0.375, -0.28],
    [0.52, 0.375, -0.28],
    [-0.52, 0.375, 0.28],
    [0.52, 0.375, 0.28],
  ];
  legPositions.forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.75), legMat);
    leg.position.set(lx, ly, lz);
    group.add(leg);
  });

  // Chair
  const chairGroup = new THREE.Group();
  chairGroup.position.set(0, 0, 0.65);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.45), woodMat);
  seat.position.y = 0.45;
  chairGroup.add(seat);

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.03), woodMat);
  backrest.position.set(0, 0.72, 0.2);
  chairGroup.add(backrest);

  const chairLegs = [
    [-0.18, 0.22, -0.18],
    [0.18, 0.22, -0.18],
    [-0.18, 0.22, 0.18],
    [0.18, 0.22, 0.18],
  ];
  chairLegs.forEach(([cx, cy, cz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45), legMat);
    leg.position.set(cx, cy, cz);
    chairGroup.add(leg);
  });

  group.add(chairGroup);
  return group;
}

/**
 * Create a chalkboard with eerie scratched message
 */
function createChalkboard(message: string): THREE.Group {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });
  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 512;
  boardCanvas.height = 256;
  const ctx = boardCanvas.getContext('2d')!;

  ctx.fillStyle = '#1b2d24'; // Slate blackboard green
  ctx.fillRect(0, 0, 512, 256);

  // Scratched chalk text
  ctx.font = '28px "Special Elite", monospace';
  ctx.fillStyle = 'rgba(230, 240, 235, 0.75)';
  ctx.textAlign = 'center';
  ctx.fillText(message, 256, 120);
  ctx.font = '16px "Special Elite", monospace';
  ctx.fillStyle = 'rgba(200, 210, 205, 0.45)';
  ctx.fillText('DO NOT TURN OFF THE LIGHT', 256, 170);

  const boardTex = new THREE.CanvasTexture(boardCanvas);
  boardTex.colorSpace = THREE.SRGBColorSpace;
  const boardMat = new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.9 });

  const boardMesh = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.8, 0.05), boardMat);
  boardMesh.position.y = 1.8;
  group.add(boardMesh);

  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.08, 0.08), frameMat);
  frameTop.position.set(0, 2.72, 0);
  group.add(frameTop);

  const frameBottom = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.12, 0.14), frameMat);
  frameBottom.position.set(0, 0.88, 0.03);
  group.add(frameBottom);

  return group;
}

/**
 * Create 3D pickup mesh for a clue
 */
function createClue3D(clue: Clue): THREE.Group {
  const group = new THREE.Group();
  group.position.set(clue.position.x, clue.position.y, clue.position.z);

  // Glowing parchment / folio
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xf1e7cf,
    roughness: 0.85,
    metalness: 0.0,
    emissive: 0x3d3215, // Subtle warm golden glow in dark
    emissiveIntensity: 0.4,
  });

  const page = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.45), paperMat);
  group.add(page);

  // Ethereal subtle float particle disc
  const discGeo = new THREE.RingGeometry(0.2, 0.35, 16);
  const discMat = new THREE.MeshBasicMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = Math.PI / 2;
  disc.position.y = 0.05;
  disc.name = 'beaconDisc';
  group.add(disc);

  return group;
}

/**
 * Create 3D pickup mesh for an inventory world item
 */
function createWorldItem3D(worldItem: WorldItem): THREE.Group {
  const group = new THREE.Group();
  group.position.set(worldItem.position.x, worldItem.position.y, worldItem.position.z);

  let mainMesh: THREE.Mesh;
  if (worldItem.item.type === 'key') {
    // Brass Key
    const keyMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.9,
      emissive: 0x4a3a0e,
      emissiveIntensity: 0.5,
    });
    mainMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3), keyMat);
    mainMesh.rotation.z = Math.PI / 2;
  } else if (worldItem.item.type === 'component') {
    // Ceramic Fuse
    const fuseMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.4,
      metalness: 0.3,
      emissive: 0x330000,
      emissiveIntensity: 0.3,
    });
    mainMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25), fuseMat);
  } else if (worldItem.item.type === 'tool') {
    // Crowbar
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.3,
      metalness: 0.85,
    });
    mainMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6), steelMat);
    mainMesh.rotation.z = Math.PI / 3;
  } else {
    // Medicine Bottle / Battery
    const bottleMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0x064e3b,
      emissiveIntensity: 0.4,
    });
    mainMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22), bottleMat);
  }

  mainMesh.castShadow = true;
  group.add(mainMesh);

  // Pulsing subtle marker ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.25, 16),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.02;
  ring.name = 'itemRing';
  group.add(ring);

  return group;
}

/**
 * Build the entire school level geometry, collision barriers, and interactive objects
 */
export function buildSchoolLevel(
  scene: THREE.Scene,
  clues: Clue[],
  lockers: Locker[],
  worldItems: WorldItem[],
  puzzles: PuzzleObstacle[]
): SchoolEnvironment {
  const collisionBoxes: CollisionBox[] = [];
  const lockerMeshes = new Map<string, THREE.Group>();
  const clueMeshes = new Map<string, THREE.Group>();
  const worldItemMeshes = new Map<string, THREE.Group>();
  const puzzleMeshes = new Map<string, THREE.Group>();
  const hallwayLights: THREE.PointLight[] = [];

  const wallMat = new THREE.MeshStandardMaterial({
    map: createWallTexture(),
    roughness: 0.85,
    metalness: 0.1,
  });

  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0x1b1d20,
    roughness: 0.9,
    metalness: 0.05,
  });

  const floorMat = new THREE.MeshStandardMaterial({
    map: createFloorTexture(),
    roughness: 0.7,
    metalness: 0.2,
  });

  // 1. FLOOR & CEILING
  const floorGeo = new THREE.PlaneGeometry(50, 70);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ceilingGeo = new THREE.PlaneGeometry(50, 70);
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 3.6;
  scene.add(ceiling);

  // Helper to add a wall block + register collision
  const addWall = (
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    customMat?: THREE.Material
  ) => {
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, customMat || wallMat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Register AABB collision box with small margin
    collisionBoxes.push({
      minX: x - width / 2 - 0.4,
      maxX: x + width / 2 + 0.4,
      minZ: z - depth / 2 - 0.4,
      maxZ: z + depth / 2 + 0.4,
    });

    return mesh;
  };

  // OUTER PERIMETER BOUNDARIES
  addWall(0, 1.8, -32, 50, 3.6, 1); // North exterior wall
  addWall(0, 1.8, 25, 50, 3.6, 1);  // South exterior wall
  addWall(-24, 1.8, -4, 1, 3.6, 60); // West exterior wall
  addWall(24, 1.8, -4, 1, 3.6, 60);  // East exterior wall

  // MAIN CORRIDOR WALLS (Hallway width: ~8m, X from -4 to +4)
  // Left hallway wall with doorways
  addWall(-4, 1.8, -20, 0.4, 3.6, 12);
  addWall(-4, 1.8, -4, 0.4, 3.6, 8);
  addWall(-4, 1.8, 16, 0.4, 3.6, 14);

  // Right hallway wall with doorways
  addWall(4, 1.8, -20, 0.4, 3.6, 12);
  addWall(4, 1.8, -4, 0.4, 3.6, 8);
  addWall(4, 1.8, 16, 0.4, 3.6, 14);

  // ROOM DIVIDER WALLS
  // Room 104 (Literature) West Wing (Z: -14 to -2)
  addWall(-14, 1.8, -2, 20, 3.6, 0.4);
  addWall(-14, 1.8, -14, 20, 3.6, 0.4);
  // Add desks in Room 104
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const desk = createDeskAndChair();
      desk.position.set(-11 - c * 2.5, 0, -5 - r * 2.4);
      scene.add(desk);
      collisionBoxes.push({
        minX: desk.position.x - 0.7,
        maxX: desk.position.x + 0.7,
        minZ: desk.position.z - 0.6,
        maxZ: desk.position.z + 0.6,
      });
    }
  }
  const board104 = createChalkboard('THE SHADOW BREATHES IN 104');
  board104.position.set(-14, 0, -13.7);
  scene.add(board104);

  // Room 104 Locked Door Mesh
  const door104Group = new THREE.Group();
  door104Group.position.set(-4, 1.3, -8);
  const door104Panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 2.6, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.6 })
  );
  door104Group.add(door104Panel);
  scene.add(door104Group);

  // Science Wing / Bio Lab East Wing (Z: -16 to -4)
  addWall(14, 1.8, -2, 20, 3.6, 0.4);
  addWall(14, 1.8, -16, 20, 3.6, 0.4);
  // Chemistry lab benches
  for (let i = 0; i < 2; i++) {
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 });
    const bench = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.9, 1.2), benchMat);
    bench.position.set(13, 0.45, -7 - i * 4);
    bench.castShadow = true;
    scene.add(bench);
    collisionBoxes.push({
      minX: 13 - 2.8,
      maxX: 13 + 2.8,
      minZ: bench.position.z - 0.9,
      maxZ: bench.position.z + 0.9,
    });
  }

  // Library & Archives West Wing (Z: 4 to 20)
  addWall(-14, 1.8, 4, 20, 3.6, 0.4);
  addWall(-14, 1.8, 20, 20, 3.6, 0.4);
  // Bookshelves
  for (let b = 0; b < 3; b++) {
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.8 });
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.8, 0.6), shelfMat);
    shelf.position.set(-13, 1.4, 8 + b * 3.5);
    shelf.castShadow = true;
    scene.add(shelf);
    collisionBoxes.push({
      minX: -13 - 2.4,
      maxX: -13 + 2.4,
      minZ: shelf.position.z - 0.5,
      maxZ: shelf.position.z + 0.5,
    });
  }

  // Timber barricade mesh for library
  const barricadeGroup = new THREE.Group();
  barricadeGroup.position.set(-4, 1.2, 8);
  for (let p = 0; p < 4; p++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.3, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 })
    );
    plank.position.set(0, (p - 1.5) * 0.4, 0);
    plank.rotation.x = (p % 2 === 0 ? 1 : -1) * 0.15;
    barricadeGroup.add(plank);
  }
  scene.add(barricadeGroup);

  // Infirmary East Wing (Z: 4 to 20)
  addWall(14, 1.8, 4, 20, 3.6, 0.4);
  addWall(14, 1.8, 20, 20, 3.6, 0.4);
  // Nurse's clinic bed
  const bedMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.7 });
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 2.4), bedMat);
  bed.position.set(14, 0.3, 10);
  scene.add(bed);

  // Principal's Office North End (Z: -20 to -32)
  addWall(-10, 1.8, -20, 12, 3.6, 0.4);
  addWall(10, 1.8, -20, 12, 3.6, 0.4);
  // Large mahogany desk
  const prinDesk = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.8, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x2b1810, roughness: 0.5 })
  );
  prinDesk.position.set(0, 0.4, -26);
  scene.add(prinDesk);
  collisionBoxes.push({
    minX: -1.6,
    maxX: 1.6,
    minZ: -27.2,
    maxZ: -24.8,
  });

  // MAIN SOUTH EXIT GATES (Z: 22 to 24)
  const exitDoorGroup = new THREE.Group();
  exitDoorGroup.position.set(0, 1.6, 22);

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.4,
    metalness: 0.85,
  });
  const chainMat = new THREE.MeshStandardMaterial({
    color: 0x8a929e,
    roughness: 0.3,
    metalness: 0.9,
  });

  const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.0, 0.1), ironMat);
  leftDoor.position.set(-0.85, 0, 0);
  exitDoorGroup.add(leftDoor);

  const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.0, 0.1), ironMat);
  rightDoor.position.set(0.85, 0, 0);
  exitDoorGroup.add(rightDoor);

  // Heavy chains wrapped across handles
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 8, 24), chainMat);
  chain.position.set(0, 0, 0.1);
  chain.name = 'exitChains';
  exitDoorGroup.add(chain);

  scene.add(exitDoorGroup);
  // South exit blocking collision box
  collisionBoxes.push({
    minX: -2.0,
    maxX: 2.0,
    minZ: 21.6,
    maxZ: 22.8,
  });

  // 2. CORRIDOR FLUORESCENT LIGHTS (Flickering, eerie low glow)
  const lightZPositions = [-24, -14, -4, 6, 16];
  lightZPositions.forEach((lz, idx) => {
    // Light fixture model
    const fixture = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.1, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 })
    );
    fixture.position.set(0, 3.5, lz);
    scene.add(fixture);

    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.6),
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        emissive: 0x93c5fd,
        emissiveIntensity: 0.8,
      })
    );
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, 3.42, lz);
    scene.add(tube);

    const pointLight = new THREE.PointLight(0xa5c4e8, 0.8, 12, 1.8);
    pointLight.position.set(0, 3.3, lz);
    pointLight.name = `fluorescent-${idx}`;
    scene.add(pointLight);
    hallwayLights.push(pointLight);
  });

  // 3. LOCKERS
  lockers.forEach((locker) => {
    const lockerMesh = createLockerGroup();
    lockerMesh.position.set(locker.position.x, locker.position.y, locker.position.z);
    lockerMesh.rotation.y = locker.facing;
    scene.add(lockerMesh);
    lockerMeshes.set(locker.id, lockerMesh);

    // Collision around locker carcass
    collisionBoxes.push({
      minX: locker.position.x - 0.6,
      maxX: locker.position.x + 0.6,
      minZ: locker.position.z - 0.6,
      maxZ: locker.position.z + 0.6,
    });
  });

  // 4. CLUES
  clues.forEach((clue) => {
    const clueMesh = createClue3D(clue);
    scene.add(clueMesh);
    clueMeshes.set(clue.id, clueMesh);
  });

  // 5. WORLD ITEMS (Keys, fuses, crowbar, consumables)
  worldItems.forEach((wi) => {
    const wiMesh = createWorldItem3D(wi);
    scene.add(wiMesh);
    worldItemMeshes.set(wi.id, wiMesh);
  });

  // 6. PUZZLE INTERACTABLES (e.g. Science Breaker Box on wall)
  puzzles.forEach((puzzle) => {
    const puzzleGroup = new THREE.Group();
    puzzleGroup.position.set(puzzle.position.x, puzzle.position.y, puzzle.position.z);

    if (puzzle.id === 'fusebox-sci') {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.7, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 })
      );
      puzzleGroup.add(box);

      // Warning lightning bolt decal or light
      const sparkLight = new THREE.PointLight(0xf59e0b, 0.5, 3);
      sparkLight.position.set(0, 0, 0.15);
      puzzleGroup.add(sparkLight);
    }
    scene.add(puzzleGroup);
    puzzleMeshes.set(puzzle.id, puzzleGroup);
  });

  // 7. THE MALEVOLENT UNSEEN ENTITY (refractive disturbance + dark eddy particles + cold eerie light)
  const entityGroup = new THREE.Group();
  entityGroup.position.set(0, 1.2, -20);

  // Ethereal dark particle cloud (the only physical clue of the unseen entity)
  const particleCount = 45;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 1.8;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0x38194a, // Dark shadowy purple / void
    size: 0.12,
    transparent: true,
    opacity: 0.55,
    blending: THREE.NormalBlending,
  });
  const entityParticles = new THREE.Points(particleGeo, particleMat);
  entityParticles.name = 'entityParticles';
  entityGroup.add(entityParticles);

  // Cold violet/blue psychic distortion light
  const entityLight = new THREE.PointLight(0x7c3aed, 0.6, 7, 2.0);
  entityLight.position.set(0, 0.5, 0);
  entityGroup.add(entityLight);

  scene.add(entityGroup);

  return {
    scene,
    collisionBoxes,
    lockerMeshes,
    clueMeshes,
    worldItemMeshes,
    puzzleMeshes,
    entityGroup,
    entityLight,
    hallwayLights,
    exitDoorGroup,
    door104Mesh: door104Group,
    barricadeMesh: barricadeGroup,
  };
}
