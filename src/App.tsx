/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Clue,
  Locker,
  WorldItem,
  PuzzleObstacle,
  InventoryItem,
  RunStats,
  Position3D,
  EntityState,
  INITIAL_CLUES,
  INITIAL_LOCKERS,
  INITIAL_WORLD_ITEMS,
  INITIAL_PUZZLES,
  calculateDistance,
  calculateEntityThreat,
  calculateSanityEffects,
  updateSanity,
  updateStamina,
  updateEntityAI,
  addToInventory,
  removeFromInventory,
  trySolvePuzzle,
  checkWorldItemProximity,
  checkPuzzleProximity,
  checkClueProximity,
  checkLockerProximity,
  canEscape,
  isAtMainExit,
  getSurfaceAtPosition,
  MAX_INVENTORY_SLOTS,
} from './game/rules.ts';
import { buildSchoolLevel, SchoolEnvironment } from './game/proceduralSchool.ts';
import { horrorAudio } from './audio/horrorAudio.ts';
import { HorrorHUD } from './components/HorrorHUD.tsx';
import { TitleScreen } from './components/TitleScreen.tsx';
import { JournalModal } from './components/JournalModal.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { VictoryModal } from './components/VictoryModal.tsx';
import { PauseModal } from './components/PauseModal.tsx';

type GameScreen = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  // High-level game screen
  const [screen, setScreen] = useState<GameScreen>('title');
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [activeJournalClue, setActiveJournalClue] = useState<Clue | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // HUD visible states (throttled/discrete for performance)
  const [hudState, setHudState] = useState({
    locationName: 'Main Corridor - North Hall',
    cluesDiscovered: 0,
    totalClues: INITIAL_CLUES.length,
    sanity: 100,
    stamina: 100,
    flashlightBattery: 100,
    isFlashlightOn: true,
    threatLevel: 0,
    isHiding: false,
    interactionPrompt: null as string | null,
    statusNotification: null as string | null,
    inventory: [] as InventoryItem[],
    selectedItemIndex: 0,
  });

  const [endStats, setEndStats] = useState<RunStats>({
    cluesFound: 0,
    totalClues: INITIAL_CLUES.length,
    timeSurvived: 0,
    sanityRemaining: 100,
    nearMisses: 0,
  });

  // Mutable Game Simulation State (decoupled from React re-renders)
  const simRef = useRef({
    screen: 'title' as GameScreen,
    playerPos: { x: 0, y: 1.6, z: 18 } as Position3D,
    playerVel: { x: 0, z: 0 },
    playerYaw: 0, // Facing North down the long corridor
    playerPitch: 0,
    sanity: 100,
    stamina: 100,
    flashlightBattery: 100,
    isFlashlightOn: true,
    isHiding: false,
    isSprinting: false,
    currentLockerId: null as string | null,
    threatLevel: 0,
    nearMisses: 0,
    startTime: 0,
    elapsedTime: 0,
    clues: JSON.parse(JSON.stringify(INITIAL_CLUES)) as Clue[],
    lockers: JSON.parse(JSON.stringify(INITIAL_LOCKERS)) as Locker[],
    worldItems: JSON.parse(JSON.stringify(INITIAL_WORLD_ITEMS)) as WorldItem[],
    puzzles: JSON.parse(JSON.stringify(INITIAL_PUZZLES)) as PuzzleObstacle[],
    inventory: [] as InventoryItem[],
    selectedItemIndex: 0,
    entityPos: { x: 0, y: 1.2, z: -20 } as Position3D,
    entityState: 'PATROLLING' as EntityState,
    entityWaypointIdx: 0,
    activePrompt: null as string | null,
    toastMsg: null as string | null,
    toastTimeout: 0,
    pointerLocked: false,
    isMouseDown: false,
    lastMouseX: 0,
    lastMouseY: 0,
    keys: new Set<string>(),
  });

  // Reference to 3D environment meshes
  const envRef = useRef<SchoolEnvironment | null>(null);

  // Sync document.body.dataset.state
  const syncBodyState = useCallback((state: GameScreen) => {
    document.body.dataset.state = state;
  }, []);

  const showNotification = useCallback((msg: string) => {
    const sim = simRef.current;
    sim.toastMsg = msg;
    setHudState((prev) => ({ ...prev, statusNotification: msg }));
    if (sim.toastTimeout) window.clearTimeout(sim.toastTimeout);
    sim.toastTimeout = window.setTimeout(() => {
      sim.toastMsg = null;
      setHudState((prev) => ({ ...prev, statusNotification: null }));
    }, 3500);
  }, []);

  // START / RESTART GAME
  const handleStartGame = useCallback(() => {
    horrorAudio.init();
    horrorAudio.resume();

    const sim = simRef.current;
    sim.screen = 'playing';
    sim.playerPos = { x: 0, y: 1.6, z: 18 };
    sim.playerVel = { x: 0, z: 0 };
    sim.playerYaw = 0;
    sim.playerPitch = 0;
    sim.sanity = 100;
    sim.stamina = 100;
    sim.flashlightBattery = 100;
    sim.isFlashlightOn = true;
    sim.isHiding = false;
    sim.isSprinting = false;
    sim.currentLockerId = null;
    sim.threatLevel = 0;
    sim.nearMisses = 0;
    sim.startTime = Date.now();
    sim.elapsedTime = 0;
    sim.clues = JSON.parse(JSON.stringify(INITIAL_CLUES));
    sim.lockers = JSON.parse(JSON.stringify(INITIAL_LOCKERS));
    sim.worldItems = JSON.parse(JSON.stringify(INITIAL_WORLD_ITEMS));
    sim.puzzles = JSON.parse(JSON.stringify(INITIAL_PUZZLES));
    sim.inventory = [];
    sim.selectedItemIndex = 0;
    sim.entityPos = { x: 0, y: 1.2, z: -20 };
    sim.entityState = 'PATROLLING' as EntityState;
    sim.entityWaypointIdx = 0;
    sim.keys.clear();

    // Reset 3D object visibilities
    if (envRef.current) {
      envRef.current.clueMeshes.forEach((mesh) => {
        mesh.visible = true;
      });
      envRef.current.worldItemMeshes.forEach((mesh) => {
        mesh.visible = true;
      });
      if (envRef.current.door104Mesh) envRef.current.door104Mesh.visible = true;
      if (envRef.current.barricadeMesh) envRef.current.barricadeMesh.visible = true;
    }

    setScreen('playing');
    syncBodyState('playing');
    setHudState({
      locationName: 'Main Foyer & Corridor',
      cluesDiscovered: 0,
      totalClues: INITIAL_CLUES.length,
      sanity: 100,
      stamina: 100,
      flashlightBattery: 100,
      isFlashlightOn: true,
      threatLevel: 0,
      isHiding: false,
      interactionPrompt: null,
      statusNotification: 'Explore the school. Collect the 5 investigative seals to unbar the exit.',
      inventory: [],
      selectedItemIndex: 0,
    });
  }, [syncBodyState]);

  // TOGGLE FLASHLIGHT
  const handleToggleFlashlight = useCallback(() => {
    const sim = simRef.current;
    if (sim.isHiding) return;
    sim.isFlashlightOn = !sim.isFlashlightOn;
    horrorAudio.playFlashlightClick(sim.isFlashlightOn);
    setHudState((prev) => ({ ...prev, isFlashlightOn: sim.isFlashlightOn }));
  }, []);

  // TOGGLE MUTE
  const handleToggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    horrorAudio.setMuted(next);
  }, [isMuted]);

  // USE ACTIVE ITEM
  const handleUseActiveItem = useCallback(() => {
    const sim = simRef.current;
    const item = sim.inventory[sim.selectedItemIndex];
    if (!item) return;

    // Check if consumable
    if (item.type === 'consumable') {
      if (item.id === 'sedative-bottle') {
        sim.sanity = Math.min(100, sim.sanity + 40);
        showNotification('Consumed Valerian Tincture: Sanity restored (+40%) and tremors calmed.');
        horrorAudio.playClueFound();
        sim.inventory = removeFromInventory(sim.inventory, item.id);
        setHudState((prev) => ({ ...prev, sanity: sim.sanity, inventory: sim.inventory }));
        return;
      }
      if (item.id === 'battery-pack') {
        sim.flashlightBattery = 100;
        showNotification('Inserted fresh D-Cell battery: Flashlight fully recharged (+100%).');
        horrorAudio.playFlashlightClick(true);
        sim.inventory = removeFromInventory(sim.inventory, item.id);
        setHudState((prev) => ({ ...prev, flashlightBattery: 100, inventory: sim.inventory }));
        return;
      }
    }

    // Check if near a puzzle obstacle that needs this item
    const puzzle = checkPuzzleProximity(sim.playerPos, sim.puzzles);
    if (puzzle) {
      const res = trySolvePuzzle(puzzle, item);
      if (res.solved) {
        puzzle.solved = true;
        showNotification(res.message);
        horrorAudio.playPuzzleSolved();

        // Update environment meshes
        if (puzzle.id === 'door-room-104' && envRef.current?.door104Mesh) {
          envRef.current.door104Mesh.visible = false;
        } else if (puzzle.id === 'barricade-library' && envRef.current?.barricadeMesh) {
          envRef.current.barricadeMesh.visible = false;
        }

        if (res.consumeItem) {
          sim.inventory = removeFromInventory(sim.inventory, item.id);
        }
        setHudState((prev) => ({ ...prev, inventory: sim.inventory }));
      } else {
        showNotification(res.message);
      }
    } else {
      showNotification(`${item.name} is ready. Use it near a matching locked door or puzzle.`);
    }
  }, [showNotification]);

  // CONTEXTUAL INTERACTION (Triggered by [E] or Click)
  const handleInteract = useCallback(() => {
    const sim = simRef.current;
    if (sim.screen !== 'playing') return;

    // 1. Locker hide/unhide
    if (sim.isHiding) {
      // Exit locker
      sim.isHiding = false;
      const locker = sim.lockers.find((l) => l.id === sim.currentLockerId);
      if (locker) locker.occupied = false;
      sim.currentLockerId = null;
      horrorAudio.playLockerSound(false);
      showNotification('Exited locker.');
      setHudState((prev) => ({ ...prev, isHiding: false }));
      return;
    }

    const nearbyLocker = checkLockerProximity(sim.playerPos, sim.lockers);
    if (nearbyLocker) {
      sim.isHiding = true;
      sim.currentLockerId = nearbyLocker.id;
      nearbyLocker.occupied = true;
      horrorAudio.playLockerSound(true);
      showNotification('Concealed inside locker. The unseen entity cannot sense your presence.');
      setHudState((prev) => ({ ...prev, isHiding: true }));
      return;
    }

    // 2. Clue Discovery
    const nearbyClue = checkClueProximity(sim.playerPos, sim.clues);
    if (nearbyClue) {
      nearbyClue.discovered = true;
      horrorAudio.playClueFound();
      // Hide 3D mesh
      const mesh = envRef.current?.clueMeshes.get(nearbyClue.id);
      if (mesh) mesh.visible = false;

      const discoveredCount = sim.clues.filter((c) => c.discovered).length;
      showNotification(`Discovered: ${nearbyClue.title} (${discoveredCount}/${sim.clues.length})`);
      setActiveJournalClue(nearbyClue);
      setIsJournalOpen(true);
      setHudState((prev) => ({ ...prev, cluesDiscovered: discoveredCount }));
      return;
    }

    // 3. World Item Pickup
    const nearbyItem = checkWorldItemProximity(sim.playerPos, sim.worldItems);
    if (nearbyItem) {
      const addRes = addToInventory(sim.inventory, nearbyItem.item, MAX_INVENTORY_SLOTS);
      if (addRes.success) {
        nearbyItem.collected = true;
        sim.inventory = addRes.updatedInventory;
        horrorAudio.playClueFound();
        const mesh = envRef.current?.worldItemMeshes.get(nearbyItem.id);
        if (mesh) mesh.visible = false;
        showNotification(addRes.message);
        setHudState((prev) => ({ ...prev, inventory: sim.inventory }));
      } else {
        showNotification(addRes.message);
      }
      return;
    }

    // 4. Environmental Puzzle Check
    const nearbyPuzzle = checkPuzzleProximity(sim.playerPos, sim.puzzles);
    if (nearbyPuzzle) {
      const activeItem = sim.inventory[sim.selectedItemIndex] || null;
      const res = trySolvePuzzle(nearbyPuzzle, activeItem);
      if (res.solved) {
        nearbyPuzzle.solved = true;
        showNotification(res.message);
        horrorAudio.playPuzzleSolved();
        if (nearbyPuzzle.id === 'door-room-104' && envRef.current?.door104Mesh) {
          envRef.current.door104Mesh.visible = false;
        } else if (nearbyPuzzle.id === 'barricade-library' && envRef.current?.barricadeMesh) {
          envRef.current.barricadeMesh.visible = false;
        }
        if (res.consumeItem && activeItem) {
          sim.inventory = removeFromInventory(sim.inventory, activeItem.id);
        }
        setHudState((prev) => ({ ...prev, inventory: sim.inventory }));
      } else {
        showNotification(res.message);
      }
      return;
    }

    // 5. Main Exit Check
    if (isAtMainExit(sim.playerPos)) {
      if (canEscape(sim.clues)) {
        // VICTORY!
        horrorAudio.playVictoryFanfare();
        sim.screen = 'victory';
        setEndStats({
          cluesFound: sim.clues.filter((c) => c.discovered).length,
          totalClues: sim.clues.length,
          timeSurvived: sim.elapsedTime,
          sanityRemaining: sim.sanity,
          nearMisses: sim.nearMisses,
        });
        setScreen('victory');
        syncBodyState('gameover');
      } else {
        const found = sim.clues.filter((c) => c.discovered).length;
        showNotification(`The heavy iron chains are bound by dark seals. Find all 5 clues to unlock the exit (${found}/5 found).`);
      }
    }
  }, [showNotification, syncBodyState]);

  // INITIALIZE THREE.JS WEBGL RENDERER & SCENE
  useEffect(() => {
    if (!mountRef.current) return;

    // Detect software WebGL as per Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040507);
    scene.fog = new THREE.FogExp2(0x040507, 0.055);

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 18);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.appendChild(renderer.domElement);

    // Studio Environment map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Ambient low fill light
    const hemiLight = new THREE.HemisphereLight(0x1a233a, 0x07090e, 0.4);
    scene.add(hemiLight);

    // Player Flashlight (SpotLight mounted to camera)
    const flashlight = new THREE.SpotLight(0xfff3d6, 3.8, 22, Math.PI / 7, 0.45, 1.2);
    flashlight.position.set(0, 0, 0);
    flashlight.castShadow = !isSoftwareGl;
    flashlight.shadow.bias = -0.0005;
    flashlight.shadow.mapSize.width = 512;
    flashlight.shadow.mapSize.height = 512;
    flashlight.target.position.set(0, 0, -5);
    camera.add(flashlight);
    camera.add(flashlight.target);
    scene.add(camera);

    // Build the school level geometry
    const env = buildSchoolLevel(
      scene,
      simRef.current.clues,
      simRef.current.lockers,
      simRef.current.worldItems,
      simRef.current.puzzles
    );
    envRef.current = env;

    // Check autostart query parameter (?autostart=1)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1') {
      handleStartGame();
    } else {
      syncBodyState('title');
    }

    // Window Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Mouse / Touch Look Handlers
    const canvas = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      simRef.current.isMouseDown = true;
      simRef.current.lastMouseX = e.clientX;
      simRef.current.lastMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      const sim = simRef.current;
      if (sim.screen !== 'playing' || sim.isHiding) return;

      if (sim.pointerLocked || sim.isMouseDown) {
        const dx = sim.pointerLocked ? e.movementX : e.clientX - sim.lastMouseX;
        const dy = sim.pointerLocked ? e.movementY : e.clientY - sim.lastMouseY;
        sim.lastMouseX = e.clientX;
        sim.lastMouseY = e.clientY;

        // Sanity responsiveness impact: controls become sluggish / resistant at low sanity!
        const sanityEffects = calculateSanityEffects(sim.sanity);
        const sensitivity = 0.0022 * sanityEffects.controlLagFactor;

        sim.playerYaw -= dx * sensitivity;
        sim.playerPitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, sim.playerPitch - dy * sensitivity));
      }
    };

    const onMouseUp = () => {
      simRef.current.isMouseDown = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        simRef.current.lastMouseX = e.touches[0].clientX;
        simRef.current.lastMouseY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const sim = simRef.current;
      if (sim.screen !== 'playing' || sim.isHiding || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - sim.lastMouseX;
      const dy = e.touches[0].clientY - sim.lastMouseY;
      sim.lastMouseX = e.touches[0].clientX;
      sim.lastMouseY = e.touches[0].clientY;

      const sanityEffects = calculateSanityEffects(sim.sanity);
      const sensitivity = 0.003 * sanityEffects.controlLagFactor;

      sim.playerYaw -= dx * sensitivity;
      sim.playerPitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, sim.playerPitch - dy * sensitivity));
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });

    // Keyboard Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      const sim = simRef.current;
      sim.keys.add(e.code);
      if (e.key) sim.keys.add(e.key.toLowerCase());

      if (sim.screen === 'playing') {
        const k = e.key ? e.key.toLowerCase() : '';
        if (e.code === 'KeyF' || k === 'f') {
          handleToggleFlashlight();
        } else if (e.code === 'KeyE' || k === 'e') {
          handleInteract();
        } else if (e.code === 'Tab' || e.code === 'KeyJ' || k === 'j') {
          e.preventDefault();
          setIsJournalOpen((prev) => !prev);
        } else if (e.code === 'Escape' || e.code === 'KeyP' || k === 'p') {
          setScreen('paused');
          syncBodyState('paused');
        } else if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', '1', '2', '3', '4', '5', '6'].includes(e.code) || ['1', '2', '3', '4', '5', '6'].includes(k)) {
          const num = parseInt(k || e.code.replace('Digit', ''));
          if (!isNaN(num) && num >= 1 && num <= 6) {
            sim.selectedItemIndex = num - 1;
            setHudState((prev) => ({ ...prev, selectedItemIndex: num - 1 }));
          }
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      simRef.current.keys.delete(e.code);
      if (e.key) simRef.current.keys.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Continuous Simulation & Render Loop
    let lastTime = performance.now();
    let frameId = 0;
    let hudThrottleTime = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const clock = new THREE.Clock();

    const tick = () => {
      const now = performance.now();
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05); // Clamped dt prevents wall tunneling
      const sim = simRef.current;

      if (sim.screen === 'playing') {
        sim.elapsedTime += dt;

        // 1. Player Controls & Movement Physics
        if (!sim.isHiding) {
          const isSprintHeld = sim.keys.has('ShiftLeft') || sim.keys.has('ShiftRight');
          const { stamina, canSprint } = updateStamina(sim.stamina, isSprintHeld, dt);
          sim.stamina = stamina;
          sim.isSprinting = isSprintHeld && canSprint;

          const sanityEffects = calculateSanityEffects(sim.sanity);
          const baseSpeed = sim.isSprinting ? 5.2 : 2.8;
          // Sluggish control lag when sanity is low
          const speed = baseSpeed * sanityEffects.controlLagFactor;

          let moveForward = 0;
          let moveRight = 0;
          if (sim.keys.has('KeyW') || sim.keys.has('ArrowUp') || sim.keys.has('w')) moveForward += 1;
          if (sim.keys.has('KeyS') || sim.keys.has('ArrowDown') || sim.keys.has('s')) moveForward -= 1;
          if (sim.keys.has('KeyD') || sim.keys.has('ArrowRight') || sim.keys.has('d')) moveRight += 1;
          if (sim.keys.has('KeyA') || sim.keys.has('ArrowLeft') || sim.keys.has('a')) moveRight -= 1;

          const isMoving = moveForward !== 0 || moveRight !== 0;

          if (isMoving) {
            const forwardX = -Math.sin(sim.playerYaw);
            const forwardZ = -Math.cos(sim.playerYaw);
            const rightX = Math.cos(sim.playerYaw);
            const rightZ = -Math.sin(sim.playerYaw);

            // Normalize vector if diagonal
            let moveLen = Math.sqrt(moveForward * moveForward + moveRight * moveRight) || 1;
            const normFwd = moveForward / moveLen;
            const normRt = moveRight / moveLen;

            const targetVx = (forwardX * normFwd + rightX * normRt) * speed;
            const targetVz = (forwardZ * normFwd + rightZ * normRt) * speed;

            // Dampening movement
            sim.playerVel.x = THREE.MathUtils.damp(sim.playerVel.x, targetVx, 12, dt);
            sim.playerVel.z = THREE.MathUtils.damp(sim.playerVel.z, targetVz, 12, dt);
          } else {
            sim.playerVel.x = THREE.MathUtils.damp(sim.playerVel.x, 0, 14, dt);
            sim.playerVel.z = THREE.MathUtils.damp(sim.playerVel.z, 0, 14, dt);
          }

          // Collision Resolution with environment walls and locked doors
          const nextX = sim.playerPos.x + sim.playerVel.x * dt;
          const nextZ = sim.playerPos.z + sim.playerVel.z * dt;

          const checkCollision = (cx: number, cz: number) => {
            if (!env) return false;
            for (const box of env.collisionBoxes) {
              if (cx >= box.minX && cx <= box.maxX && cz >= box.minZ && cz <= box.maxZ) {
                return true;
              }
            }
            // Check Room 104 locked door
            const puzzle104 = sim.puzzles.find((p) => p.id === 'door-room-104');
            if (puzzle104 && !puzzle104.solved) {
              if (cx >= -4.6 && cx <= -3.4 && cz >= -9.2 && cz <= -6.8) return true;
            }
            // Check Library barricade
            const puzzleLib = sim.puzzles.find((p) => p.id === 'barricade-library');
            if (puzzleLib && !puzzleLib.solved) {
              if (cx >= -4.6 && cx <= -3.4 && cz >= 6.8 && cz <= 9.2) return true;
            }
            return false;
          };

          if (!checkCollision(nextX, sim.playerPos.z)) {
            sim.playerPos.x = nextX;
          }
          if (!checkCollision(sim.playerPos.x, nextZ)) {
            sim.playerPos.z = nextZ;
          }

          // Camera Position & Hand Tremors (intensify with fear)
          const tremor = sanityEffects.tremorIntensity * 0.04;
          const tremorX = (Math.random() - 0.5) * tremor;
          const tremorY = (Math.random() - 0.5) * tremor;

          camera.position.set(sim.playerPos.x + tremorX, sim.playerPos.y + tremorY, sim.playerPos.z);
          camera.rotation.set(0, 0, 0);
          camera.rotation.y = sim.playerYaw;
          camera.rotation.x = sim.playerPitch;

          // Flashlight battery & flicker
          if (sim.isFlashlightOn) {
            sim.flashlightBattery = Math.max(0, sim.flashlightBattery - 0.45 * dt);
            if (sim.flashlightBattery <= 0) {
              sim.isFlashlightOn = false;
            }
          }

          flashlight.visible = sim.isFlashlightOn;
          if (sim.isFlashlightOn) {
            // Flashlight flickers violently when entity threat is high!
            if (sim.threatLevel > 0.35 && Math.random() < sim.threatLevel * 0.4) {
              flashlight.intensity = 0.4 + Math.random() * 1.5;
            } else {
              flashlight.intensity = 3.6;
            }
          }
        } else {
          // Inside locker: camera fixed facing locker door
          const locker = sim.lockers.find((l) => l.id === sim.currentLockerId);
          if (locker) {
            camera.position.set(locker.position.x, 1.4, locker.position.z);
            camera.rotation.set(0, locker.facing, 0);
          }
          flashlight.visible = false;
        }

        // 2. Unseen Entity AI & Threat Math
        const aiResult = updateEntityAI(
          sim.entityPos,
          sim.playerPos,
          sim.entityState,
          sim.isHiding,
          sim.isFlashlightOn,
          sim.isSprinting,
          dt,
          undefined,
          sim.entityWaypointIdx
        );

        sim.entityPos = aiResult.nextPos;
        sim.entityState = aiResult.nextState;
        sim.entityWaypointIdx = aiResult.nextWaypointIndex;

        if (aiResult.nearMiss) {
          sim.nearMisses += 1;
        }

        // Threat level (EMF radiation & dread)
        const distToEntity = calculateDistance(sim.playerPos, sim.entityPos);
        sim.threatLevel = calculateEntityThreat(
          distToEntity,
          sim.isFlashlightOn,
          sim.isHiding,
          sim.isSprinting
        );

        // Sanity update (drains when near entity or in pure dark, recovers in locker or safe light)
        sim.sanity = updateSanity(
          sim.sanity,
          sim.threatLevel,
          sim.isFlashlightOn,
          sim.isHiding,
          dt
        );

        // Game Over Catch check
        if (aiResult.isCaught) {
          horrorAudio.playJumpscareSting();
          sim.screen = 'gameover';
          setEndStats({
            cluesFound: sim.clues.filter((c) => c.discovered).length,
            totalClues: sim.clues.length,
            timeSurvived: sim.elapsedTime,
            sanityRemaining: sim.sanity,
            nearMisses: sim.nearMisses,
            causeOfDeath: 'The Unseen Entity materialized from the dark and dragged you into the abyss.',
          });
          setScreen('gameover');
          syncBodyState('gameover');
        }

        // 3. Audio Engine Update
        const isPlayerMoving = !sim.isHiding && (sim.playerVel.x !== 0 || sim.playerVel.z !== 0);
        const surface = getSurfaceAtPosition(sim.playerPos);
        horrorAudio.update(sim.threatLevel, sim.sanity, isPlayerMoving, sim.isSprinting, dt, surface);

        // 4. Update 3D Entity Mesh & Fluorescent Lights
        if (env) {
          env.entityGroup.position.set(sim.entityPos.x, sim.entityPos.y, sim.entityPos.z);
          // Flickering corridor fluorescent lights as entity sweeps past
          env.hallwayLights.forEach((light) => {
            const d = calculateDistance(light.position, sim.entityPos);
            if (d < 10) {
              light.intensity = Math.max(0, 0.8 - (10 - d) * 0.08 + (Math.random() - 0.5) * 0.4);
            } else {
              light.intensity = 0.75 + Math.sin(now * 0.003 + light.position.z) * 0.08;
            }
          });

          // Rotate clue beacons
          env.clueMeshes.forEach((mesh) => {
            const disc = mesh.getObjectByName('beaconDisc');
            if (disc) disc.rotation.z += 0.02;
          });
          // Rotate world item markers
          env.worldItemMeshes.forEach((mesh) => {
            const ring = mesh.getObjectByName('itemRing');
            if (ring) ring.rotation.z += 0.03;
          });
        }

        // 5. Contextual Interaction Prompt Check
        let promptText: string | null = null;
        if (sim.isHiding) {
          promptText = 'Exit Locker';
        } else {
          const clue = checkClueProximity(sim.playerPos, sim.clues);
          const worldItem = checkWorldItemProximity(sim.playerPos, sim.worldItems);
          const locker = checkLockerProximity(sim.playerPos, sim.lockers);
          const puzzle = checkPuzzleProximity(sim.playerPos, sim.puzzles);

          if (clue) {
            promptText = `Examine ${clue.title}`;
          } else if (worldItem) {
            promptText = `Pick up ${worldItem.item.name}`;
          } else if (locker) {
            promptText = 'Hide inside Locker';
          } else if (puzzle) {
            const activeItem = sim.inventory[sim.selectedItemIndex];
            if (activeItem && activeItem.id === puzzle.requiredItemId) {
              promptText = `Use ${activeItem.name} on ${puzzle.name}`;
            } else {
              promptText = `Inspect ${puzzle.name}`;
            }
          } else if (isAtMainExit(sim.playerPos)) {
            promptText = canEscape(sim.clues) ? 'Unlock Saint Jude’s Exit Gates' : 'Main Exit (Chained with 5 Seals)';
          }
        }
        sim.activePrompt = promptText;

        // 6. Throttle React HUD state updates to ~10Hz
        if (now - hudThrottleTime > 100) {
          hudThrottleTime = now;
          // Determine Location name
          let loc = 'Main Corridor - Center';
          if (sim.playerPos.z < -18) loc = "Principal's Inner Office";
          else if (sim.playerPos.x < -6 && sim.playerPos.z < 0) loc = 'Classroom 104 - Literature';
          else if (sim.playerPos.x > 6 && sim.playerPos.z < 0) loc = 'Science Wing - Bio Lab';
          else if (sim.playerPos.x < -6 && sim.playerPos.z > 0) loc = 'East Wing - Library Archives';
          else if (sim.playerPos.x > 6 && sim.playerPos.z > 0) loc = 'Infirmary - Treatment Ward';
          else if (sim.playerPos.z > 16) loc = 'Main Foyer & Exit Gates';

          setHudState((prev) => ({
            ...prev,
            locationName: loc,
            sanity: sim.sanity,
            stamina: sim.stamina,
            flashlightBattery: sim.flashlightBattery,
            isFlashlightOn: sim.isFlashlightOn,
            threatLevel: sim.threatLevel,
            isHiding: sim.isHiding,
            interactionPrompt: sim.activePrompt,
            inventory: sim.inventory,
            selectedItemIndex: sim.selectedItemIndex,
          }));
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [handleStartGame, handleInteract, handleToggleFlashlight, syncBodyState]);

  const sanityEffects = calculateSanityEffects(hudState.sanity);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-slate-100 select-none">
      {/* 3D WebGL Canvas Viewport Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Title Screen Overlay */}
      {screen === 'title' && <TitleScreen onStartGame={handleStartGame} />}

      {/* Active In-Game HUD */}
      {screen === 'playing' && (
        <HorrorHUD
          locationName={hudState.locationName}
          cluesDiscovered={hudState.cluesDiscovered}
          totalClues={hudState.totalClues}
          sanity={hudState.sanity}
          stamina={hudState.stamina}
          flashlightBattery={hudState.flashlightBattery}
          isFlashlightOn={hudState.isFlashlightOn}
          threatLevel={hudState.threatLevel}
          isHiding={hudState.isHiding}
          sanityEffects={sanityEffects}
          inventory={hudState.inventory}
          selectedItemIndex={hudState.selectedItemIndex}
          interactionPrompt={hudState.interactionPrompt}
          statusNotification={hudState.statusNotification}
          isMuted={isMuted}
          onToggleFlashlight={handleToggleFlashlight}
          onSelectItem={(idx) => {
            simRef.current.selectedItemIndex = idx;
            setHudState((prev) => ({ ...prev, selectedItemIndex: idx }));
          }}
          onUseActiveItem={handleUseActiveItem}
          onToggleMute={handleToggleMute}
          onOpenJournal={() => setIsJournalOpen(true)}
          onPause={() => {
            simRef.current.screen = 'paused';
            setScreen('paused');
            syncBodyState('paused');
          }}
        />
      )}

      {/* Clue / Investigator's Journal Modal */}
      {isJournalOpen && (
        <JournalModal
          clues={simRef.current.clues}
          activeClue={activeJournalClue}
          onSelectClue={(c) => setActiveJournalClue(c)}
          onClose={() => setIsJournalOpen(false)}
        />
      )}

      {/* Pause Menu Modal */}
      {screen === 'paused' && (
        <PauseModal
          onResume={() => {
            simRef.current.screen = 'playing';
            setScreen('playing');
            syncBodyState('playing');
          }}
          onRestart={handleStartGame}
          onOpenJournal={() => setIsJournalOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over / Consumed Modal */}
      {screen === 'gameover' && (
        <GameOverModal stats={endStats} onRestart={handleStartGame} />
      )}

      {/* Victory / Escaped Modal */}
      {screen === 'victory' && (
        <VictoryModal stats={endStats} onRestart={handleStartGame} />
      )}
    </div>
  );
}
