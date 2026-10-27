/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistance,
  calculateEntityThreat,
  calculateSanityEffects,
  updateSanity,
  updateStamina,
  updateEntityAI,
  addToInventory,
  removeFromInventory,
  trySolvePuzzle,
  canEscape,
  getSurfaceAtPosition,
  MAX_INVENTORY_SLOTS,
  InventoryItem,
  PuzzleObstacle,
  Clue,
} from './rules.ts';

test('calculateDistance computes 3D euclidean distance correctly', () => {
  const p1 = { x: 0, y: 0, z: 0 };
  const p2 = { x: 3, y: 0, z: 4 };
  assert.equal(calculateDistance(p1, p2), 5);
});

test('calculateEntityThreat scales with proximity, flashlight, and locker hiding', () => {
  // Far away: 0 threat
  const farThreat = calculateEntityThreat(40, false, false, false);
  assert.equal(farThreat, 0);

  // Close (5m) exposed: high threat
  const closeExposed = calculateEntityThreat(5, false, false, false);
  assert.ok(closeExposed > 0.6, 'Threat should be high at 5m exposed');

  // Flashlight on amplifies threat sensing
  const closeFlashlight = calculateEntityThreat(5, true, false, false);
  assert.ok(closeFlashlight > closeExposed, 'Flashlight on should amplify threat');

  // Hiding in locker heavily suppresses threat
  const hidingThreat = calculateEntityThreat(5, false, true, false);
  assert.ok(hidingThreat < 0.2, 'Locker hiding should suppress threat to low value');
});

test('calculateSanityEffects produces tremors and control lag at low sanity', () => {
  // High sanity: full responsiveness
  const highSanityEffects = calculateSanityEffects(90);
  assert.equal(highSanityEffects.controlLagFactor, 1.0);
  assert.equal(highSanityEffects.tremorIntensity, 0);

  // Low sanity: sluggish control response and high tremors
  const lowSanityEffects = calculateSanityEffects(20);
  assert.ok(lowSanityEffects.controlLagFactor < 0.6, 'Control response should become sluggish');
  assert.ok(lowSanityEffects.tremorIntensity > 0.5, 'Tremors should intensify at low sanity');
  assert.ok(lowSanityEffects.visualDistortion > 0.5, 'Visual distortions should be high');
});

test('updateSanity drains rapidly under high threat and recovers in locker', () => {
  // High threat drains sanity
  const drained = updateSanity(80, 0.9, true, false, 1.0);
  assert.ok(drained < 70, 'Sanity should drain under high threat');

  // Safe in locker recovers sanity
  const recovered = updateSanity(50, 0.0, false, true, 1.0);
  assert.ok(recovered > 50, 'Safe hiding should recover composure');
});

test('stamina decreases during sprint and regenerates when walking', () => {
  const sprinting = updateStamina(100, true, 1.0);
  assert.ok(sprinting.stamina < 100);
  assert.equal(sprinting.canSprint, true);

  const walking = updateStamina(20, false, 1.0);
  assert.ok(walking.stamina > 20);
});

test('inventory enforces maximum capacity limit of 6 items', () => {
  let inv: InventoryItem[] = [];

  for (let i = 0; i < MAX_INVENTORY_SLOTS; i++) {
    const item: InventoryItem = {
      id: `item-${i}`,
      name: `Item ${i}`,
      type: 'tool',
      description: 'test',
      useText: 'test',
      icon: 'key',
    };
    const res = addToInventory(inv, item);
    assert.equal(res.success, true);
    inv = res.updatedInventory;
  }

  assert.equal(inv.length, MAX_INVENTORY_SLOTS);

  // Trying to add a 7th item should fail cleanly
  const extraItem: InventoryItem = {
    id: 'item-extra',
    name: 'Overflow Item',
    type: 'tool',
    description: 'test',
    useText: 'test',
    icon: 'key',
  };
  const overflowRes = addToInventory(inv, extraItem);
  assert.equal(overflowRes.success, false);
  assert.equal(overflowRes.updatedInventory.length, MAX_INVENTORY_SLOTS);

  // Removing an item frees up space
  const reducedInv = removeFromInventory(inv, 'item-0');
  assert.equal(reducedInv.length, MAX_INVENTORY_SLOTS - 1);
});

test('trySolvePuzzle checks item requirements and handles consumption', () => {
  const puzzle: PuzzleObstacle = {
    id: 'fusebox-sci',
    name: 'Science Wing Breaker Box',
    requiredItemId: 'fuse-bio',
    requiredItemName: 'Industrial Breaker Fuse',
    position: { x: 8, y: 1.0, z: -4 },
    solved: false,
    inspectMessage: 'Blown fuse slot.',
    solveMessage: 'Breaker powers on.',
  };

  // Wrong item fails
  const wrongItem: InventoryItem = {
    id: 'wrong-key',
    name: 'Wrong Key',
    type: 'key',
    description: 'test',
    useText: 'test',
    icon: 'key',
  };
  const wrongRes = trySolvePuzzle(puzzle, wrongItem);
  assert.equal(wrongRes.solved, false);

  // Correct component solves and marks for consumption
  const correctItem: InventoryItem = {
    id: 'fuse-bio',
    name: 'Industrial Breaker Fuse',
    type: 'component',
    description: 'A fuse.',
    useText: 'Install in panel',
    icon: 'zap',
  };
  const solveRes = trySolvePuzzle(puzzle, correctItem);
  assert.equal(solveRes.solved, true);
  assert.equal(solveRes.consumeItem, true);
});

test('canEscape requires all 5 clues to be discovered', () => {
  const clues: Clue[] = [
    { id: '1', title: 'A', location: 'X', date: '', excerpt: '', lore: '', position: { x: 0, y: 0, z: 0 }, discovered: true },
    { id: '2', title: 'B', location: 'X', date: '', excerpt: '', lore: '', position: { x: 0, y: 0, z: 0 }, discovered: true },
    { id: '3', title: 'C', location: 'X', date: '', excerpt: '', lore: '', position: { x: 0, y: 0, z: 0 }, discovered: false },
  ];

  assert.equal(canEscape(clues), false);

  clues[2].discovered = true;
  assert.equal(canEscape(clues), true);
});

test('getSurfaceAtPosition correctly identifies wood, metal, and linoleum surfaces', () => {
  // Hallway center is dusty linoleum
  assert.equal(getSurfaceAtPosition({ x: 0, y: 1.6, z: 10 }), 'linoleum');
  assert.equal(getSurfaceAtPosition({ x: 0, y: 1.6, z: 0 }), 'linoleum');

  // Classroom 104 (Literature) is wooden floorboards
  assert.equal(getSurfaceAtPosition({ x: -10, y: 1.6, z: -8 }), 'wood');

  // Library Archives is wooden parquet
  assert.equal(getSurfaceAtPosition({ x: -12, y: 1.6, z: 12 }), 'wood');

  // Principal's Office is wooden floor
  assert.equal(getSurfaceAtPosition({ x: 0, y: 1.6, z: -25 }), 'wood');

  // Science Wing / Bio Lab is metallic lab floor
  assert.equal(getSurfaceAtPosition({ x: 12, y: 1.6, z: -8 }), 'metal');

  // Main South Exit threshold is heavy metal gate plate
  assert.equal(getSurfaceAtPosition({ x: 0, y: 1.6, z: 22 }), 'metal');

  // Next to lockers along corridor wall is metal floorplate
  assert.equal(getSurfaceAtPosition({ x: 3.8, y: 1.6, z: -4 }), 'metal');
});

