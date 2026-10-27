/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export type EntityState = 'PATROLLING' | 'STALKING' | 'HUNTING' | 'DISSIPATING';

export type SurfaceMaterial = 'linoleum' | 'wood' | 'metal';

export type ItemType = 'key' | 'clue_note' | 'tool' | 'consumable' | 'component';

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  useText: string;
  icon: string; // icon identifier
  targetId?: string; // which puzzle obstacle or door it solves
  quantity?: number;
}

export interface WorldItem {
  id: string;
  item: InventoryItem;
  position: Position3D;
  collected: boolean;
}

export interface PuzzleObstacle {
  id: string;
  name: string;
  requiredItemId: string;
  requiredItemName: string;
  position: Position3D;
  solved: boolean;
  inspectMessage: string;
  solveMessage: string;
}

export interface Clue {
  id: string;
  title: string;
  location: string;
  date: string;
  excerpt: string;
  lore: string;
  position: Position3D;
  discovered: boolean;
}

export interface Locker {
  id: string;
  position: Position3D;
  occupied: boolean;
  facing: number; // Y-rotation radians
}

export interface SanityEffects {
  tremorIntensity: number; // 0 to 1
  controlLagFactor: number; // 1.0 (normal) to 0.4 (sluggish lag)
  visualDistortion: number; // 0 to 1 (chromatic aberration, vignette, static)
  auditoryHallucinationRate: number; // 0 to 1
  phantomShadowProbability: number;
}

export interface RunStats {
  cluesFound: number;
  totalClues: number;
  timeSurvived: number; // in seconds
  sanityRemaining: number;
  nearMisses: number;
  causeOfDeath?: string;
}

export const MAX_INVENTORY_SLOTS = 6;

export const INITIAL_CLUES: Clue[] = [
  {
    id: 'clue-1',
    title: "Headmaster's Ledger (Oct 14, 1987)",
    location: 'Classroom 104 - Literature',
    date: 'October 14, 1987',
    excerpt: '“The whispers in the ventilation are not children. The board refuses to evacuate...”',
    lore: 'A water-damaged leather ledger. The writing starts formal and degrades into frantic scratched symbols. The headmaster noted seven students going missing after staying late in the detention hall. He writes of a cold presence that dims the oil lamps and leaves a scent of ozone and copper.',
    position: { x: -14, y: 0.8, z: -8 },
    discovered: false,
  },
  {
    id: 'clue-2',
    title: 'Biology Lab Necropsy Notes',
    location: 'Science Wing - Bio Lab',
    date: 'November 2, 1987',
    excerpt: '“Organic matter dissolves in its path. It leaves no footprints, only cold frost...”',
    lore: 'Pinned to a specimen corkboard beneath shattered glass vials. Dr. Vance documented how iron shavings align toward empty air whenever the entity is within 15 meters. The notes suggest light will agitate its curiosity, while complete stillness inside enclosed spaces masks human warmth.',
    position: { x: 14, y: 0.8, z: -10 },
    discovered: false,
  },
  {
    id: 'clue-3',
    title: 'Torn Occult Codex Page',
    location: 'East Wing - Library Archives',
    date: 'Winter Solstice, 1987',
    excerpt: '“It cannot be gazed upon, for it has shed all physical form. Trust the crackle of static...”',
    lore: 'Found between burned encyclopedia covers. The page details the entity as an ancient presence summoned by unsupervised students playing with automatic writing. The only countermeasure is gathering the five anchor seals to break the school’s perimeter lock.',
    position: { x: -14, y: 0.8, z: 12 },
    discovered: false,
  },
  {
    id: 'clue-4',
    title: "Nurse's Emergency Dispatch",
    location: 'Infirmary - Treatment Ward',
    date: 'December 18, 1987',
    excerpt: '“Pulse rate spikes above 160 bpm when the static starts. If your vision tunnels, hide...”',
    lore: 'A bloody hospital chart. Patients brought in from the west corridor suffered acute hypothermia and cardiac arrest with zero external wounds. The nurse noted that when the entity hunts, lockers and sealed cabinets provide thermal shielding from its psychic gaze.',
    position: { x: 14, y: 0.8, z: 10 },
    discovered: false,
  },
  {
    id: 'clue-5',
    title: 'Engraved Brass Master Key & Sigil',
    location: "Principal's Inner Office",
    date: 'December 24, 1987',
    excerpt: '“The front gates are chained. Only the master key combined with the 4 seals can unseal the exit.”',
    lore: 'A heavy, cold brass key inscribed with Latin verses. Together with the recorded knowledge of the other four clues, this key will break the heavy iron chains barring the front foyer double doors.',
    position: { x: 0, y: 0.8, z: -26 },
    discovered: false,
  },
];

export const INITIAL_WORLD_ITEMS: WorldItem[] = [
  {
    id: 'item-key-104',
    item: {
      id: 'key-104',
      name: 'Classroom 104 Key',
      type: 'key',
      description: 'A rusty iron key tagged "104 - Literature". Opens the locked classroom door.',
      useText: 'Unlock Classroom 104 door',
      icon: 'key',
      targetId: 'door-room-104',
    },
    position: { x: -3.8, y: 0.5, z: -2 },
    collected: false,
  },
  {
    id: 'item-bio-fuse',
    item: {
      id: 'fuse-bio',
      name: 'Industrial Breaker Fuse',
      type: 'component',
      description: 'A heavy cylindrical 30A ceramic fuse. Needed to restore power to the Science Lab magnetic door.',
      useText: 'Install in Main Fuse Panel',
      icon: 'zap',
      targetId: 'fusebox-sci',
    },
    position: { x: 0, y: 0.5, z: 8 },
    collected: false,
  },
  {
    id: 'item-sedative-1',
    item: {
      id: 'sedative-bottle',
      name: 'Valerian Tincture',
      type: 'consumable',
      description: 'An amber medicinal bottle containing calming herbal extracts. Restores +40 sanity and calms tremors.',
      useText: 'Drink to restore Sanity (+40%)',
      icon: 'heart',
      quantity: 1,
    },
    position: { x: 3.8, y: 0.5, z: 2 },
    collected: false,
  },
  {
    id: 'item-crowbar',
    item: {
      id: 'crowbar',
      name: 'Maintenance Crowbar',
      type: 'tool',
      description: 'A sturdy iron wrecking bar. Can pry open wooden barricades blocking the West Archives corridor.',
      useText: 'Pry open barricade',
      icon: 'wrench',
      targetId: 'barricade-library',
    },
    position: { x: -3.8, y: 0.5, z: 16 },
    collected: false,
  },
  {
    id: 'item-battery-pack',
    item: {
      id: 'battery-pack',
      name: 'Heavy-Duty D-Cell Battery',
      type: 'consumable',
      description: 'Fresh industrial batteries. Fully recharges the flashlight and steadies its beam.',
      useText: 'Recharge Flashlight (+100%)',
      icon: 'battery-charging',
      quantity: 1,
    },
    position: { x: 3.8, y: 0.5, z: 14 },
    collected: false,
  },
];

export const INITIAL_PUZZLES: PuzzleObstacle[] = [
  {
    id: 'door-room-104',
    name: 'Classroom 104 Door',
    requiredItemId: 'key-104',
    requiredItemName: 'Classroom 104 Key',
    position: { x: -8, y: 1.0, z: -8 },
    solved: false,
    inspectMessage: 'The wooden door to Classroom 104 is locked tight. The brass keyhole is labeled "104".',
    solveMessage: 'You turn the rusty key. The heavy lock clicks open with a loud metallic snap!',
  },
  {
    id: 'fusebox-sci',
    name: 'Science Wing Breaker Box',
    requiredItemId: 'fuse-bio',
    requiredItemName: 'Industrial Breaker Fuse',
    position: { x: 8, y: 1.0, z: -4 },
    solved: false,
    inspectMessage: 'The breaker box is sparking. The fuse slot for the Science Lab magnetic lock is blown and empty.',
    solveMessage: 'You slot the ceramic fuse into place. The breaker snaps alive and the Science Lab door unlocks!',
  },
  {
    id: 'barricade-library',
    name: 'Library Timber Barricade',
    requiredItemId: 'crowbar',
    requiredItemName: 'Maintenance Crowbar',
    position: { x: -8, y: 1.0, z: 8 },
    solved: false,
    inspectMessage: 'Rotting wooden planks have been nailed shut across the Library entrance.',
    solveMessage: 'You wedge the crowbar into the rotted timber and pry the nails free, clearing the entrance!',
  },
];

export const INITIAL_LOCKERS: Locker[] = [
  { id: 'locker-hall-1', position: { x: -3.8, y: 0, z: -4 }, occupied: false, facing: Math.PI / 2 },
  { id: 'locker-hall-2', position: { x: 3.8, y: 0, z: -4 }, occupied: false, facing: -Math.PI / 2 },
  { id: 'locker-hall-3', position: { x: -3.8, y: 0, z: 6 }, occupied: false, facing: Math.PI / 2 },
  { id: 'locker-hall-4', position: { x: 3.8, y: 0, z: 6 }, occupied: false, facing: -Math.PI / 2 },
  { id: 'locker-class-1', position: { x: -16.5, y: 0, z: -6 }, occupied: false, facing: 0 },
  { id: 'locker-lab-1', position: { x: 16.5, y: 0, z: -8 }, occupied: false, facing: 0 },
  { id: 'locker-lib-1', position: { x: -16.5, y: 0, z: 14 }, occupied: false, facing: 0 },
  { id: 'locker-inf-1', position: { x: 16.5, y: 0, z: 12 }, occupied: false, facing: 0 },
];

/**
 * 2D/3D Euclidean Distance helper
 */
export function calculateDistance(a: Position3D, b: Position3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate the threat level (0.0 to 1.0) based on entity distance and player state.
 */
export function calculateEntityThreat(
  dist: number,
  isFlashlightOn: boolean,
  isHiding: boolean,
  isSprinting: boolean,
  maxSenseRange = 26
): number {
  if (isHiding) {
    if (dist > 4) {
      return Math.max(0, 0.15 * (1 - dist / maxSenseRange));
    }
    return 0.45 * (1 - dist / 4);
  }

  let effectiveDistance = dist;
  if (isFlashlightOn) effectiveDistance *= 0.8;
  if (isSprinting) effectiveDistance *= 0.72;

  if (effectiveDistance >= maxSenseRange) return 0;

  const raw = 1 - effectiveDistance / maxSenseRange;
  return Math.min(1, Math.max(0, Math.pow(raw, 1.4)));
}

/**
 * Calculate derived sanity effects: tremors, control responsiveness lag, auditory/visual distortion.
 */
export function calculateSanityEffects(sanity: number): SanityEffects {
  const loss = Math.max(0, (100 - sanity) / 100);

  // Normal at > 75 sanity
  if (sanity >= 75) {
    return {
      tremorIntensity: 0,
      controlLagFactor: 1.0,
      visualDistortion: 0,
      auditoryHallucinationRate: 0,
      phantomShadowProbability: 0,
    };
  }

  // Moderate decline (45 - 75)
  if (sanity >= 45) {
    const factor = (75 - sanity) / 30;
    return {
      tremorIntensity: factor * 0.35,
      controlLagFactor: 1.0 - factor * 0.25, // Down to 0.75 responsiveness
      visualDistortion: factor * 0.4,
      auditoryHallucinationRate: factor * 0.35,
      phantomShadowProbability: factor * 0.2,
    };
  }

  // Severe panic (< 45)
  const panicFactor = (45 - sanity) / 45;
  return {
    tremorIntensity: 0.35 + panicFactor * 0.65, // Strong tremors
    controlLagFactor: 0.75 - panicFactor * 0.35, // Down to 0.40 (heavy sluggish drag)
    visualDistortion: 0.4 + panicFactor * 0.6,
    auditoryHallucinationRate: 0.35 + panicFactor * 0.65,
    phantomShadowProbability: 0.2 + panicFactor * 0.8,
  };
}

/**
 * Update player's sanity based on current threat, frightening events, flashlight, and hiding state.
 */
export function updateSanity(
  currentSanity: number,
  threatLevel: number,
  isFlashlightOn: boolean,
  isHiding: boolean,
  dt: number,
  scareBurst = 0
): number {
  let change = -scareBurst;

  if (threatLevel > 0.05) {
    change -= threatLevel * 16 * dt;
  } else if (!isFlashlightOn && !isHiding) {
    change -= 1.8 * dt;
  } else if (isHiding && threatLevel < 0.2) {
    change += 4.5 * dt;
  } else if (threatLevel < 0.05 && isFlashlightOn) {
    change += 2.2 * dt;
  }

  return Math.min(100, Math.max(0, currentSanity + change));
}

/**
 * Update player stamina when sprinting or recovering.
 */
export function updateStamina(
  currentStamina: number,
  isSprinting: boolean,
  dt: number
): { stamina: number; canSprint: boolean } {
  let next = currentStamina;
  if (isSprinting) {
    next = Math.max(0, currentStamina - 28 * dt);
  } else {
    next = Math.min(100, currentStamina + 18 * dt);
  }

  return {
    stamina: next,
    canSprint: next > 5,
  };
}

/**
 * Entity AI simulation step.
 */
export function updateEntityAI(
  entityPos: Position3D,
  playerPos: Position3D,
  currentState: EntityState,
  isHiding: boolean,
  isFlashlightOn: boolean,
  isSprinting: boolean,
  dt: number,
  waypoints: Position3D[] = [
    { x: 0, y: 0.8, z: -20 },
    { x: -14, y: 0.8, z: -8 },
    { x: 0, y: 0.8, z: 0 },
    { x: 14, y: 0.8, z: -10 },
    { x: 0, y: 0.8, z: 10 },
    { x: -14, y: 0.8, z: 12 },
    { x: 14, y: 0.8, z: 10 },
  ],
  waypointIndex = 0
): {
  nextPos: Position3D;
  nextState: EntityState;
  nextWaypointIndex: number;
  isCaught: boolean;
  nearMiss: boolean;
} {
  const distToPlayer = calculateDistance(entityPos, playerPos);

  // Catch radius (instant defeat if entity reaches exposed player)
  const isCaught = !isHiding && distToPlayer < 1.7;

  // Near miss detection (within 3.8m while player was safely hiding or in stealth)
  const nearMiss = distToPlayer < 3.8 && isHiding;

  let detectionRadius = 13;
  if (isFlashlightOn) detectionRadius += 7;
  if (isSprinting) detectionRadius += 8;
  if (isHiding) detectionRadius = 1.9;

  let nextState: EntityState = currentState;
  let target: Position3D;
  let moveSpeed = 2.8;
  let nextWaypointIndex = waypointIndex;

  if (isHiding && distToPlayer > 3.0) {
    nextState = 'PATROLLING';
  } else if (distToPlayer <= detectionRadius) {
    if (distToPlayer < 8.5) {
      nextState = 'HUNTING';
      moveSpeed = 4.6;
    } else {
      nextState = 'STALKING';
      moveSpeed = 3.2;
    }
  } else {
    nextState = 'PATROLLING';
    moveSpeed = 2.4;
  }

  if (nextState === 'HUNTING' || nextState === 'STALKING') {
    target = playerPos;
  } else {
    const currentWp = waypoints[waypointIndex % waypoints.length];
    const distToWp = calculateDistance(entityPos, currentWp);
    if (distToWp < 2.0) {
      nextWaypointIndex = (waypointIndex + 1) % waypoints.length;
    }
    target = waypoints[nextWaypointIndex % waypoints.length];
  }

  const dx = target.x - entityPos.x;
  const dz = target.z - entityPos.z;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  const step = Math.min(moveSpeed * dt, len);

  const nextPos: Position3D = {
    x: entityPos.x + (dx / len) * step,
    y: entityPos.y,
    z: entityPos.z + (dz / len) * step,
  };

  return {
    nextPos,
    nextState,
    nextWaypointIndex,
    isCaught,
    nearMiss,
  };
}

/**
 * Add an item to inventory if capacity allows.
 */
export function addToInventory(
  inventory: InventoryItem[],
  item: InventoryItem,
  maxSlots = MAX_INVENTORY_SLOTS
): { success: boolean; updatedInventory: InventoryItem[]; message: string } {
  if (inventory.length >= maxSlots) {
    return {
      success: false,
      updatedInventory: inventory,
      message: `Inventory is full (${maxSlots}/${maxSlots}). Drop or use an item first.`,
    };
  }

  return {
    success: true,
    updatedInventory: [...inventory, item],
    message: `Acquired: ${item.name}`,
  };
}

/**
 * Remove an item from inventory by its id.
 */
export function removeFromInventory(
  inventory: InventoryItem[],
  itemId: string
): InventoryItem[] {
  const index = inventory.findIndex((it) => it.id === itemId);
  if (index === -1) return inventory;
  const copy = [...inventory];
  copy.splice(index, 1);
  return copy;
}

/**
 * Check if player has the specified item in their inventory.
 */
export function hasItem(inventory: InventoryItem[], itemId: string): boolean {
  return inventory.some((it) => it.id === itemId);
}

/**
 * Try to solve an environmental puzzle with an equipped or selected item.
 */
export function trySolvePuzzle(
  puzzle: PuzzleObstacle,
  activeItem: InventoryItem | null
): { solved: boolean; message: string; consumeItem: boolean } {
  if (puzzle.solved) {
    return { solved: true, message: `${puzzle.name} is already opened.`, consumeItem: false };
  }

  if (!activeItem) {
    return { solved: false, message: `${puzzle.inspectMessage} (Requires: ${puzzle.requiredItemName})`, consumeItem: false };
  }

  if (activeItem.id === puzzle.requiredItemId) {
    return {
      solved: true,
      message: puzzle.solveMessage,
      // Keys are kept, fuses or consumables are consumed
      consumeItem: activeItem.type === 'component',
    };
  }

  return {
    solved: false,
    message: `That doesn't work here. ${puzzle.inspectMessage}`,
    consumeItem: false,
  };
}

/**
 * Check if player is close enough to interact with a world item pickup.
 */
export function checkWorldItemProximity(
  playerPos: Position3D,
  worldItems: WorldItem[],
  interactRadius = 2.2
): WorldItem | null {
  for (const wi of worldItems) {
    if (!wi.collected && calculateDistance(playerPos, wi.position) <= interactRadius) {
      return wi;
    }
  }
  return null;
}

/**
 * Check if player is close enough to an environmental puzzle obstacle.
 */
export function checkPuzzleProximity(
  playerPos: Position3D,
  puzzles: PuzzleObstacle[],
  interactRadius = 2.5
): PuzzleObstacle | null {
  for (const p of puzzles) {
    if (!p.solved && calculateDistance(playerPos, p.position) <= interactRadius) {
      return p;
    }
  }
  return null;
}

/**
 * Check if player is close enough to a clue.
 */
export function checkClueProximity(
  playerPos: Position3D,
  clues: Clue[],
  pickupRadius = 2.2
): Clue | null {
  for (const clue of clues) {
    if (!clue.discovered && calculateDistance(playerPos, clue.position) <= pickupRadius) {
      return clue;
    }
  }
  return null;
}

/**
 * Check if player is close enough to hide inside a locker.
 */
export function checkLockerProximity(
  playerPos: Position3D,
  lockers: Locker[],
  interactRadius = 2.0
): Locker | null {
  for (const locker of lockers) {
    if (calculateDistance(playerPos, locker.position) <= interactRadius) {
      return locker;
    }
  }
  return null;
}

/**
 * Escape condition: all 5 clues found + player at the front double doors.
 */
export function canEscape(clues: Clue[]): boolean {
  return clues.length > 0 && clues.every((c) => c.discovered);
}

export function isAtMainExit(
  playerPos: Position3D,
  exitPos = { x: 0, y: 0, z: 22 },
  exitRadius = 3.2
): boolean {
  return calculateDistance(playerPos, exitPos) <= exitRadius;
}

export function getSurfaceAtPosition(pos: Position3D): SurfaceMaterial {
  if (pos.z > 20) return 'metal';
  if (pos.x > 4.5 && pos.z < -2 && pos.z > -16) return 'metal';
  if (Math.abs(pos.x) > 3.2 && Math.abs(pos.x) < 4.5) return 'metal';
  if (pos.x < -4.5 && pos.z < -2 && pos.z > -16) return 'wood';
  if (pos.x < -4.5 && pos.z > 2 && pos.z < 22) return 'wood';
  if (pos.z < -19) return 'wood';
  return 'linoleum';
}
