import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { adapter } from '../../src/adapters/index.js';
import {
    setupTrap
} from '../../src/animation/traps/trap-manager.js';
import { MODULE_ID } from '../../src/lib/constants.js';
import { log } from '../../src/lib/logger.js';

test('setupTrap: routes dynamically based on generation and MATT availability', async () => {
    globalThis.game.user = { isGM: true, id: 'gm-user-1' };

    // Case 1: Generation 12 -> routes to MATT
    globalThis.game.release = { generation: 12 };
    globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });

    let mattCalled = false;
    const originalMattTrapSetup = (await import('../../src/animation/utils/matt-tiles.js')).matt.trap.setup;
    (await import('../../src/animation/utils/matt-tiles.js')).matt.trap.setup = async () => {
        mattCalled = true;
        return { mode: 'matt' };
    };

    const resV12 = await setupTrap('eskie.traps.spike', {});
    assert.equal(mattCalled, true, 'On V12, setupTrap must route to MATT');
    assert.equal(resV12.mode, 'matt');

    // Case 2: Generation 14 without MATT -> defaults to Region setup
    mattCalled = false;
    globalThis.game.release = { generation: 14 };
    const { FoundryV12Adapter } = await import('../../src/adapters/foundry/foundry-v12-adapter.js');
    const { FoundryV14Adapter } = await import('../../src/adapters/foundry/foundry-v14-adapter.js');
    adapter.foundry = new FoundryV14Adapter(adapter);
    globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: false });

    const triggerRegionDoc = {
        id: 'reg-trig-1',
        documentName: 'Region',
        update: async (data) => data,
        createEmbeddedDocuments: async (type, data) => [{ id: 'b-1', ...data[0] }]
    };
    globalThis.canvas.regions = {
        controlled: [{ document: triggerRegionDoc, id: 'reg-trig-1' }]
    };

    adapter.buttonDialog = async () => 'continue';

    const resV14NoMatt = await setupTrap('eskie.traps.spike', { tileCount: 2 });
    assert.equal(mattCalled, false, 'On V14 without MATT, must not call MATT setup');
    assert.ok(resV14NoMatt?.triggerRegions, 'Must return Region setup result');

    // Case 3: Generation 14 with MATT active -> directly runs Region setup without prompting for mode
    globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });
    let promptedDialog = null;
    adapter.buttonDialog = async (dialogConfig) => {
        promptedDialog = dialogConfig.title;
        return 'continue';
    };

    const resV14WithMatt = await setupTrap('eskie.traps.spike', { tileCount: 2 });
    assert.equal(mattCalled, false, 'On V14 with controlled regions, runs Region setup directly without mode prompt');
    assert.ok(resV14WithMatt?.triggerRegions);
    assert.ok(
        !promptedDialog?.includes?.('modeDialogTitle') && !promptedDialog?.includes?.('Trigger Mechanism'),
        'Must not show mode selection popup on V14 even when MATT is active'
    );

    // Case 4: Generation 14 with MATT active when Tile is selected as trigger -> routes to MATT setup
    globalThis.canvas.regions.controlled = [];
    globalThis.canvas.tiles = { controlled: [{ document: { id: 'trig-tile-1' }, id: 'trig-tile-1' }] };
    mattCalled = false;

    await setupTrap('eskie.traps.spike', { tileCount: 2 });
    assert.equal(mattCalled, true, 'On V14 with controlled tile as trigger and MATT active, delegates to MATT setup');

    // Restore original MATT setup and V12 adapter
    (await import('../../src/animation/utils/matt-tiles.js')).matt.trap.setup = originalMattTrapSetup;
    adapter.foundry = new FoundryV12Adapter(adapter);
    globalThis.game.release = { generation: 12 };
});

test('setupTrap: configures RegionDocument flags and creates executeScript RegionBehavior in region mode', async () => {
    globalThis.game.user = { isGM: true };
    globalThis.game.release = { generation: 14 };
    const { FoundryV12Adapter } = await import('../../src/adapters/foundry/foundry-v12-adapter.js');
    const { FoundryV14Adapter } = await import('../../src/adapters/foundry/foundry-v14-adapter.js');
    adapter.foundry = new FoundryV14Adapter(adapter);

    let createdBehaviorData = null;
    const triggerRegionDoc = {
        id: 'region-trig-1',
        documentName: 'Region',
        behaviors: [],
        flags: {},
        update: async () => triggerRegionDoc,
        createEmbeddedDocuments: async (type, [data]) => {
            createdBehaviorData = data;
            return [{ id: 'beh-1', ...data }];
        }
    };

    const visualTileDoc = {
        id: 'tile-visual-10',
        documentName: 'Tile',
        update: async () => visualTileDoc
    };

    globalThis.canvas.regions = {
        controlled: [{ document: triggerRegionDoc, id: 'region-trig-1' }]
    };
    globalThis.canvas.tiles = {
        controlled: [],
        get: (id) => (id === 'tile-visual-10' ? { document: visualTileDoc, id } : null)
    };

    // Simulate multi-step dialog selection: Step 1 trigger region, Step 2 visual tile
    let step = 0;
    adapter.buttonDialog = async () => {
        step++;
        if (step === 2) {
            // Select visual tile in step 2
            globalThis.canvas.tiles.controlled = [{ document: visualTileDoc, id: 'tile-visual-10' }];
        }
        return 'continue';
    };

    const setupResult = await setupTrap('eskie.traps.spike', { mode: 'region', tileCount: 2 });
    assert.equal(setupResult.triggerRegions.length, 1);
    assert.equal(setupResult.originElements.length, 1);

    // Verify created RegionBehavior payload
    assert.ok(createdBehaviorData);
    assert.equal(createdBehaviorData.type, 'executeScript');
    assert.deepEqual(createdBehaviorData.system.events, ['tokenEnter']);
    assert.ok(createdBehaviorData.system.source.includes(`const adapter = game.modules.get('${MODULE_ID}').api.adapter;`));
    assert.ok(createdBehaviorData.system.source.includes('eskie.traps.spike.play(placeable, targets,'));
    assert.ok(createdBehaviorData.system.source.includes('await Promise.all(animPromises);'));

    // Execute the transparent script to verify direct invocation of eskie.traps.spike.play
    let spikePlayed = false;
    let passedTile = null;
    let passedTargets = null;
    globalThis.eskie = {
        traps: {
            spike: {
                play: async (tile, targets) => {
                    spikePlayed = true;
                    passedTile = tile;
                    passedTargets = targets;
                }
            }
        }
    };

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const scriptFn = new AsyncFunction('event', createdBehaviorData.system.source);
    await scriptFn({
        region: triggerRegionDoc,
        data: { token: { id: 'act-tok-10', object: { id: 'act-tok-10', name: 'Adventurer' } } }
    });

    assert.equal(spikePlayed, true, 'Generated region behavior script must directly invoke eskie.traps.spike.play()');
    assert.equal(passedTile.id, 'tile-visual-10');
    assert.equal(passedTargets.length, 0, 'Activating token only on trigger region must not be targeted');

    // Verify activating token IS targeted when moving into the trap placeable
    spikePlayed = false;
    passedTargets = null;
    await scriptFn({
        region: triggerRegionDoc,
        data: {
            token: { id: 'act-tok-10', object: { id: 'act-tok-10', name: 'Adventurer' } },
            movement: { destination: { x: 0, y: 0 } }
        }
    });
    assert.equal(spikePlayed, true);
    assert.equal(passedTargets.length, 1);
    assert.equal(passedTargets[0].id, 'act-tok-10', 'Activating token moving into trap tile must be targeted');

    // Verify activating token IS targeted when trigger region IS the trap region
    spikePlayed = false;
    passedTargets = null;
    await scriptFn({
        region: { id: 'tile-visual-10' },
        data: { token: { id: 'act-tok-10', object: { id: 'act-tok-10', name: 'Adventurer' } } }
    });
    assert.equal(spikePlayed, true);
    assert.equal(passedTargets.length, 1);
    assert.equal(passedTargets[0].id, 'act-tok-10', 'Activating token entering trap region must be targeted');

    // Verify early abort when event.data.token is missing
    spikePlayed = false;
    await scriptFn({ region: triggerRegionDoc, data: {} });
    assert.equal(spikePlayed, false, 'Must abort early when event.data.token is missing');

    delete globalThis.eskie;

    adapter.foundry = new FoundryV12Adapter(adapter);
    globalThis.game.release = { generation: 12 };
});

test('setupTrap: enforces tile requirement when requiresTile is true in region mode', async () => {
    globalThis.game.user = { isGM: true };
    globalThis.game.release = { generation: 14 };
    const { FoundryV12Adapter } = await import('../../src/adapters/foundry/foundry-v12-adapter.js');
    const { FoundryV14Adapter } = await import('../../src/adapters/foundry/foundry-v14-adapter.js');
    adapter.foundry = new FoundryV14Adapter(adapter);

    let warned = false;
    globalThis.ui.notifications.warn = () => { warned = true; };

    const triggerRegionDoc = {
        id: 'region-trig-rt',
        documentName: 'Region',
        behaviors: [],
        update: async () => triggerRegionDoc,
        createEmbeddedDocuments: async () => []
    };

    globalThis.canvas.regions = {
        controlled: [{ document: triggerRegionDoc, id: 'region-trig-rt' }]
    };
    // No tiles controlled!
    globalThis.canvas.tiles = { controlled: [] };

    adapter.buttonDialog = async () => 'continue';

    const result = await setupTrap('eskie.traps.floodingRoom', { mode: 'region', tileCount: 2, requiresTile: true });
    log._flushQueues();
    assert.equal(warned, true, 'Must warn user when required tile is missing');
    assert.equal(result, undefined, 'Must abort setup when required tile is missing');

    adapter.foundry = new FoundryV12Adapter(adapter);
    globalThis.game.release = { generation: 12 };
});

test('setupTrap: tileCount === 1 bypasses step 2 and uses trigger region as origin in region mode', async () => {
    globalThis.game.user = { isGM: true };
    globalThis.game.release = { generation: 14 };
    const { FoundryV12Adapter } = await import('../../src/adapters/foundry/foundry-v12-adapter.js');
    const { FoundryV14Adapter } = await import('../../src/adapters/foundry/foundry-v14-adapter.js');
    adapter.foundry = new FoundryV14Adapter(adapter);

    const triggerRegionDoc = {
        id: 'region-door-1',
        documentName: 'Region',
        behaviors: [],
        update: async () => triggerRegionDoc,
        createEmbeddedDocuments: async () => []
    };

    globalThis.canvas.regions = {
        controlled: [{ document: triggerRegionDoc, id: 'region-door-1' }]
    };
    globalThis.canvas.tiles = { controlled: [] };

    let dialogCount = 0;
    adapter.buttonDialog = async () => {
        dialogCount++;
        return 'continue';
    };

    const result = await setupTrap('eskie.traps.electricDoor', { mode: 'region', tileCount: 1 });
    assert.equal(dialogCount, 1, 'Only Step 1 prompt should be shown for tileCount === 1');
    assert.equal(result.triggerRegions.length, 1);
    assert.equal(result.originElements.length, 1);
    assert.equal(result.originElements[0].id, 'region-door-1');

    adapter.foundry = new FoundryV12Adapter(adapter);
    globalThis.game.release = { generation: 12 };
});

test('setupTrap: tileCount === 3 embeds targetLocation in generated script in region mode', async () => {
    globalThis.game.user = { isGM: true };
    globalThis.game.release = { generation: 14 };
    const { FoundryV12Adapter } = await import('../../src/adapters/foundry/foundry-v12-adapter.js');
    const { FoundryV14Adapter } = await import('../../src/adapters/foundry/foundry-v14-adapter.js');
    adapter.foundry = new FoundryV14Adapter(adapter);

    let createdBehaviorData = null;
    const triggerRegionDoc = {
        id: 'reg-trig-fire',
        documentName: 'Region',
        behaviors: [],
        update: async () => triggerRegionDoc,
        createEmbeddedDocuments: async (_type, [data]) => {
            createdBehaviorData = data;
            return [{ id: 'beh-fire', ...data }];
        }
    };

    const launcherRegionDoc = {
        id: 'reg-launch-fire',
        documentName: 'Region',
        origin: { x: 100, y: 100 },
        document: { id: 'reg-launch-fire' }
    };

    const targetRegionDoc = {
        id: 'reg-target-fire',
        documentName: 'Region',
        origin: { x: 500, y: 600 },
        document: { id: 'reg-target-fire' }
    };

    globalThis.canvas.regions = {
        controlled: [{ document: triggerRegionDoc, id: 'reg-trig-fire' }],
        get: (id) => {
            if (id === 'reg-launch-fire') return { document: launcherRegionDoc, id };
            if (id === 'reg-target-fire') return { document: targetRegionDoc, id };
            if (id === 'reg-trig-fire') return { document: triggerRegionDoc, id };
            return null;
        }
    };
    globalThis.canvas.tiles = { controlled: [], get: () => null };

    let step = 0;
    adapter.buttonDialog = async () => {
        step++;
        if (step === 2) {
            // Step 2: Select launcher
            globalThis.canvas.regions.controlled = [{ document: launcherRegionDoc, id: 'reg-launch-fire' }];
        } else if (step === 3) {
            // Step 3: Select target
            globalThis.canvas.regions.controlled = [{ document: targetRegionDoc, id: 'reg-target-fire' }];
        }
        return 'continue';
    };

    const result = await setupTrap('eskie.traps.fire', { mode: 'region', tileCount: 3 });
    assert.equal(result.triggerRegions.length, 1);
    assert.equal(result.originElements[0].id, 'reg-launch-fire');
    assert.equal(result.targetElements[0].id, 'reg-target-fire');

    assert.ok(createdBehaviorData);
    assert.ok(createdBehaviorData.system.source.includes("const targetPlaceable = adapter.getPlaceable('reg-target-fire');"));
    assert.ok(createdBehaviorData.system.source.includes('eskie.traps.fire.play(placeable, targets,'));
    assert.ok(createdBehaviorData.system.source.includes('await Promise.all(animPromises);'));

    // Execute generated script to verify targetLocation is passed
    let firePlayed = false;
    let passedConfig = null;
    globalThis.eskie = {
        traps: {
            fire: {
                play: async (_placeable, _targets, config) => {
                    firePlayed = true;
                    passedConfig = config;
                }
            }
        }
    };

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const scriptFn = new AsyncFunction('event', createdBehaviorData.system.source);
    await scriptFn({
        region: triggerRegionDoc,
        data: { token: { id: 'act-tok-fire', object: { id: 'act-tok-fire' } } }
    });

    assert.equal(firePlayed, true);
    assert.deepEqual(passedConfig.targetLocation, { x: 500, y: 600 });

    // Test early abort when targetPlaceable is missing
    firePlayed = false;
    globalThis.canvas.regions.get = (id) => (id === 'reg-launch-fire' ? { document: launcherRegionDoc, id } : null);
    await scriptFn({
        region: triggerRegionDoc,
        data: { token: { id: 'act-tok-fire', object: { id: 'act-tok-fire' } } }
    });
    assert.equal(firePlayed, false, 'Must abort early when targetPlaceable does not exist');

    delete globalThis.eskie;
    adapter.foundry = new FoundryV12Adapter(adapter);
    globalThis.game.release = { generation: 12 };
});

test('setupTrap: multiple trap regions fire simultaneously via Promise.all in region mode', async () => {
    globalThis.game.user = { isGM: true };
    globalThis.game.release = { generation: 14 };
    const { FoundryV12Adapter } = await import('../../src/adapters/foundry/foundry-v12-adapter.js');
    const { FoundryV14Adapter } = await import('../../src/adapters/foundry/foundry-v14-adapter.js');
    adapter.foundry = new FoundryV14Adapter(adapter);

    let createdBehaviorData = null;
    const triggerRegionDoc = {
        id: 'reg-trig-multi',
        documentName: 'Region',
        behaviors: [],
        update: async () => triggerRegionDoc,
        createEmbeddedDocuments: async (_type, [data]) => {
            createdBehaviorData = data;
            return [{ id: 'beh-multi', ...data }];
        }
    };

    const launcher1 = { id: 'reg-launch-1', documentName: 'Region', document: { id: 'reg-launch-1' } };
    const launcher2 = { id: 'reg-launch-2', documentName: 'Region', document: { id: 'reg-launch-2' } };
    const launcher3 = { id: 'reg-launch-3', documentName: 'Region', document: { id: 'reg-launch-3' } };

    globalThis.canvas.regions = {
        controlled: [{ document: triggerRegionDoc, id: 'reg-trig-multi' }],
        get: (id) => {
            if (id === 'reg-launch-1') return { document: launcher1, id };
            if (id === 'reg-launch-2') return { document: launcher2, id };
            if (id === 'reg-launch-3') return { document: launcher3, id };
            if (id === 'reg-trig-multi') return { document: triggerRegionDoc, id };
            return null;
        }
    };
    globalThis.canvas.tiles = { controlled: [], get: () => null };

    let step = 0;
    adapter.buttonDialog = async () => {
        step++;
        if (step === 2) {
            // Select all 3 launcher regions in step 2
            globalThis.canvas.regions.controlled = [
                { document: launcher1, id: 'reg-launch-1' },
                { document: launcher2, id: 'reg-launch-2' },
                { document: launcher3, id: 'reg-launch-3' }
            ];
        }
        return 'continue';
    };

    const result = await setupTrap('eskie.traps.spike', { mode: 'region', tileCount: 2 });
    assert.equal(result.originElements.length, 3);

    assert.ok(createdBehaviorData.system.source.includes('const animPromises = animPlaceables.map('));
    assert.ok(createdBehaviorData.system.source.includes('await Promise.all(animPromises);'));

    // Verify all 3 animations are triggered concurrently
    const activeExecutions = [];
    const executionOrder = [];
    let maxConcurrent = 0;

    globalThis.eskie = {
        traps: {
            spike: {
                play: async (placeable) => {
                    activeExecutions.push(placeable.id);
                    if (activeExecutions.length > maxConcurrent) {
                        maxConcurrent = activeExecutions.length;
                    }
                    // Simulate asynchronous animation sequence runtime
                    await new Promise(resolve => setTimeout(resolve, 10));
                    executionOrder.push(placeable.id);
                    activeExecutions.splice(activeExecutions.indexOf(placeable.id), 1);
                }
            }
        }
    };

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const scriptFn = new AsyncFunction('event', createdBehaviorData.system.source);
    await scriptFn({
        region: triggerRegionDoc,
        data: { token: { id: 'act-tok-multi', object: { id: 'act-tok-multi' } } }
    });

    assert.equal(executionOrder.length, 3, 'All 3 trap regions must execute');
    assert.equal(maxConcurrent, 3, 'All 3 trap regions must execute simultaneously (maxConcurrent === 3)');

    delete globalThis.eskie;
    adapter.foundry = new FoundryV12Adapter(adapter);
    globalThis.game.release = { generation: 12 };
});

test('Trap macros accept targetLocation: { x, y } coordinates directly', async () => {
    globalThis.game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true });
    globalThis.game.modules.set('eskie-effects', { id: 'eskie-effects', active: true });
    const origGetEntry = Sequencer.Database.getEntry;
    Sequencer.Database.getEntry = (path) => ({ file: path });
    const origEntryExists = Sequencer.Database.entryExists;
    Sequencer.Database.entryExists = () => true;

    try {
        const { bullRushStatue } = await import('../../src/animation/traps/bull-rush-statue.js');
        const { projectile } = await import('../../src/animation/traps/projectile.js');
        const { fire } = await import('../../src/animation/traps/fire.js');
        const { rollingBoulder } = await import('../../src/animation/traps/rolling-boulder.js');
        const { fallingSky } = await import('../../src/animation/traps/falling-sky.js');

        assert.equal(bullRushStatue.default_config.targetLocation, null, 'bullRushStatue must have targetLocation in default_config');
        assert.equal(projectile.default_config.targetLocation, null, 'projectile must have targetLocation in default_config');
        assert.equal(fire.default_config.targetLocation, null, 'fire must have targetLocation in default_config');
        assert.equal(rollingBoulder.default_config.targetLocation, null, 'rollingBoulder must have targetLocation in default_config');
        assert.equal(fallingSky.default_config.targetLocation, undefined, 'fallingSky must not have targetLocation in default_config');

        assert.equal(bullRushStatue.default_config.targetTile, undefined, 'bullRushStatue must not have targetTile in default_config');
        assert.equal(projectile.default_config.targetTile, undefined, 'projectile must not have targetTile in default_config');
        assert.equal(fire.default_config.targetTile, undefined, 'fire must not have targetTile in default_config');
        assert.equal(rollingBoulder.default_config.targetTile, undefined, 'rollingBoulder must not have targetTile in default_config');
        assert.equal(fallingSky.default_config.targetTile, undefined, 'fallingSky must not have targetTile in default_config');

        const mockOriginTile = {
            id: 'tile-origin-1',
            documentName: 'Tile',
            document: { x: 100, y: 100, width: 1, height: 1, texture: { src: 'tile.png' } },
            center: { x: 150, y: 150 }
        };

        const targetLocation = { x: 800, y: 900 };

        const seqBullRush = await bullRushStatue.create(mockOriginTile, [], { targetLocation, textureSrc: 'statue.png' });
        assert.ok(seqBullRush, 'bullRushStatue should create Sequence when given targetLocation');

        const seqProjectile = await projectile.create(mockOriginTile, [], { targetLocation });
        assert.ok(seqProjectile, 'projectile should create Sequence when given targetLocation');

        const seqFire = await fire.create(mockOriginTile, [], { targetLocation });
        assert.ok(seqFire, 'fire should create Sequence when given targetLocation');

        const seqBoulder = await rollingBoulder.create(mockOriginTile, [], { targetLocation });
        assert.ok(seqBoulder, 'rollingBoulder should create Sequence when given targetLocation');

        const seqFallingSky = await fallingSky.create(mockOriginTile, []);
        assert.ok(seqFallingSky, 'fallingSky should create Sequence without requiring targetLocation');
    } finally {
        Sequencer.Database.getEntry = origGetEntry;
        Sequencer.Database.entryExists = origEntryExists;
        globalThis.game.modules.delete('jb2a_patreon');
        globalThis.game.modules.delete('eskie-effects');
    }
});

test('Fire trap resolves distinct center coordinates for 3-region setups and guards against zero-distance stretch', async () => {
    globalThis.game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true });
    globalThis.game.modules.set('eskie-effects', { id: 'eskie-effects', active: true });
    const origGetEntry = Sequencer.Database.getEntry;
    Sequencer.Database.getEntry = (path) => ({ file: path });
    const origEntryExists = Sequencer.Database.entryExists;
    Sequencer.Database.entryExists = () => true;

    try {
        const { fire } = await import('../../src/animation/traps/fire.js');
        const { projectile } = await import('../../src/animation/traps/projectile.js');

        // Three distinct regions on canvas (Trigger, Origin/Nozzle, Target)
        const originRegion = {
            id: 'region-origin-nozzle',
            documentName: 'Region',
            x: 0,
            y: 0,
            center: { x: 300, y: 400 },
            bounds: { x: 250, y: 350, width: 100, height: 100 },
            document: { id: 'region-origin-nozzle', documentName: 'Region' }
        };

        const targetRegion = {
            id: 'region-target-landing',
            documentName: 'Region',
            x: 0,
            y: 0,
            center: { x: 900, y: 400 },
            bounds: { x: 850, y: 350, width: 100, height: 100 },
            document: { id: 'region-target-landing', documentName: 'Region' }
        };

        const { adapter } = await import('../../src/adapters/index.js');

        const originLoc = adapter.getTargetLocation(originRegion);
        const targetLoc = adapter.getTargetLocation(targetRegion);

        assert.deepEqual(originLoc, { x: 300, y: 400 }, 'Origin region location must resolve its center coordinates');
        assert.deepEqual(targetLoc, { x: 900, y: 400 }, 'Target region location must resolve its center coordinates');
        assert.notDeepEqual(originLoc, targetLoc, 'Origin and target locations must be distinct coordinates');

        // Valid execution: positive distance between origin and target
        const seqValid = await fire.create(originRegion, [], { targetLocation: targetLoc });
        assert.ok(seqValid, 'Fire trap should successfully create animation sequence with distinct region locations');

        // Identical coordinates guard: distance < 1 fails loudly
        await assert.rejects(
            async () => await fire.create(originRegion, [], { targetLocation: { x: 300, y: 400 } }),
            /target location is identical to origin location/,
            'Fire trap should fail loudly when target location equals origin location'
        );

        await assert.rejects(
            async () => await projectile.create(originRegion, [], { targetLocation: { x: 300, y: 400 } }),
            /target location is identical to origin location/,
            'Projectile trap should fail loudly when target location equals origin location'
        );
    } finally {
        Sequencer.Database.getEntry = origGetEntry;
        Sequencer.Database.entryExists = origEntryExists;
        globalThis.game.modules.delete('jb2a_patreon');
        globalThis.game.modules.delete('eskie-effects');
    }
});

test('setupTrap: appends new executeScript RegionBehavior without overwriting existing behaviors in region mode', async () => {
    globalThis.game.user = { isGM: true };
    globalThis.game.release = { generation: 14 };
    const { FoundryV14Adapter } = await import('../../src/adapters/foundry/foundry-v14-adapter.js');
    adapter.foundry = new FoundryV14Adapter(adapter);

    const existingBehavior = {
        id: 'beh-existing-1',
        name: 'Existing Custom Trap (eskie-macro-pack)',
        type: 'executeScript',
        system: { events: ['tokenEnter'], source: '// existing code' },
        getFlag: (mod, key) => (mod === MODULE_ID && key === 'trap.isTrapBehavior' ? true : null),
        update: async () => {
            throw new Error('Should not update/overwrite existing behavior');
        }
    };

    const createdBehaviors = [];
    const triggerRegionDoc = {
        id: 'region-multi-beh',
        documentName: 'Region',
        behaviors: [existingBehavior],
        flags: {},
        update: async () => triggerRegionDoc,
        createEmbeddedDocuments: async (type, [data]) => {
            const beh = { id: `beh-new-${createdBehaviors.length + 1}`, ...data };
            createdBehaviors.push(beh);
            return [beh];
        }
    };

    const visualTileDoc = {
        id: 'tile-vis-2',
        documentName: 'Tile',
        update: async () => visualTileDoc
    };

    globalThis.canvas.regions = {
        controlled: [{ document: triggerRegionDoc, id: 'region-multi-beh' }]
    };
    globalThis.canvas.tiles = {
        controlled: [],
        get: (id) => (id === 'tile-vis-2' ? { document: visualTileDoc, id } : null)
    };

    let step = 0;
    adapter.buttonDialog = async () => {
        step++;
        if (step === 2) {
            globalThis.canvas.tiles.controlled = [{ document: visualTileDoc, id: 'tile-vis-2' }];
        }
        return 'continue';
    };
    let updatedData = null;
    triggerRegionDoc.update = async (data) => {
        updatedData = data;
        return triggerRegionDoc;
    };

    const setupResult = await setupTrap('eskie.traps.fire', { mode: 'region', tileCount: 2 });
    assert.ok(setupResult);

    assert.equal(createdBehaviors.length, 1, 'A new RegionBehavior must be created/appended');
    assert.equal(createdBehaviors[0].type, 'executeScript');
    assert.equal(createdBehaviors[0].name, `Fire Trap (${MODULE_ID})`);
    assert.ok(createdBehaviors[0].system.source.includes('eskie.traps.fire.play(placeable, targets,'));
    assert.ok(createdBehaviors[0].system.source.includes('await Promise.all(animPromises);'));
    assert.equal(updatedData, null, 'No region document flags should be updated');
});

test('setupTrap: targets only tokens currently or moving into trap placeables, ignoring tokens only on trigger regions in region mode', async () => {
    globalThis.game.user = { isGM: true };
    globalThis.game.release = { generation: 14 };
    const { FoundryV14Adapter } = await import('../../src/adapters/foundry/foundry-v14-adapter.js');
    adapter.foundry = new FoundryV14Adapter(adapter);

    let createdBehaviorData = null;
    const triggerRegionDoc = {
        id: 'reg-trig-plate',
        documentName: 'Region',
        behaviors: [],
        update: async () => triggerRegionDoc,
        createEmbeddedDocuments: async (_type, [data]) => {
            createdBehaviorData = data;
            return [{ id: 'beh-plate', ...data }];
        }
    };

    const spikeTrapTile = {
        id: 'tile-spike-trap',
        documentName: 'Tile',
        x: 500,
        y: 500,
        width: 100,
        height: 100,
        document: { id: 'tile-spike-trap', x: 500, y: 500, width: 100, height: 100 }
    };

    globalThis.canvas.regions = {
        controlled: [{ document: triggerRegionDoc, id: 'reg-trig-plate' }]
    };
    globalThis.canvas.tiles = {
        controlled: [],
        get: (id) => (id === 'tile-spike-trap' ? spikeTrapTile : null)
    };

    let step = 0;
    adapter.buttonDialog = async () => {
        step++;
        if (step === 2) {
            globalThis.canvas.tiles.controlled = [{ document: spikeTrapTile.document, id: 'tile-spike-trap' }];
        }
        return 'continue';
    };

    await setupTrap('eskie.traps.spike', { mode: 'region', tileCount: 2 });
    assert.ok(createdBehaviorData);

    let spikePlayed = false;
    let receivedTargets = [];
    globalThis.eskie = {
        traps: {
            spike: {
                play: async (_tile, targets) => {
                    spikePlayed = true;
                    receivedTargets = targets;
                }
            }
        }
    };

    // Token "Alice" activates the pressure plate (at 100, 100, not in spike trap)
    const tokenAlice = {
        id: 'tok-alice',
        x: 100,
        y: 100,
        document: { id: 'tok-alice', x: 100, y: 100 }
    };

    // Token "Bob" is standing on the spike trap (at 500, 500)
    const tokenBob = {
        id: 'tok-bob',
        x: 500,
        y: 500,
        w: 100,
        h: 100,
        document: { id: 'tok-bob', x: 500, y: 500, width: 1, height: 1 }
    };

    globalThis.canvas.tokens = {
        placeables: [tokenAlice, tokenBob],
        get: (id) => (id === 'tok-alice' ? tokenAlice : (id === 'tok-bob' ? tokenBob : null))
    };
    globalThis.canvas.grid = { size: 100 };

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const scriptFn = new AsyncFunction('event', createdBehaviorData.system.source);

    // Alice triggers the pressure plate without moving into the spike trap
    await scriptFn({
        region: triggerRegionDoc,
        data: { token: { id: 'tok-alice', object: tokenAlice } }
    });

    assert.equal(spikePlayed, true);
    assert.equal(receivedTargets.length, 1, 'Only Bob currently in the trap tile should be targeted');
    assert.equal(receivedTargets[0].id, 'tok-bob', 'Bob must be targeted, Alice on trigger region must not bleed');

    // Alice moves directly into the spike trap
    spikePlayed = false;
    receivedTargets = [];
    await scriptFn({
        region: triggerRegionDoc,
        data: {
            token: { id: 'tok-alice', object: tokenAlice },
            movement: { destination: { x: 500, y: 500 } }
        }
    });

    assert.equal(spikePlayed, true);
    assert.equal(receivedTargets.length, 2, 'Both Alice (moving into trap) and Bob (currently in trap) must be targeted');
    assert.ok(receivedTargets.some(t => t.id === 'tok-alice'));
    assert.ok(receivedTargets.some(t => t.id === 'tok-bob'));

    delete globalThis.eskie;
    const { FoundryV12Adapter } = await import('../../src/adapters/foundry/foundry-v12-adapter.js');
    adapter.foundry = new FoundryV12Adapter(adapter);
    globalThis.game.release = { generation: 12 };
});

test('eskie.traps.setup: verifies Foundry version and MATT availability with accurate prompt copy', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const enJson = JSON.parse(fs.readFileSync(path.resolve('lang/en.json'), 'utf-8'));

    const resolveKey = (key) => key.split('.').reduce((acc, part) => acc?.[part], enJson);
    const originalI18n = globalThis.game.i18n;
    const originalError = globalThis.ui.notifications.error;
    const originalWarn = globalThis.ui.notifications.warn;
    const originalButtonDialog = adapter.buttonDialog;
    const originalFoundry = adapter.foundry;
    const originalRelease = globalThis.game.release;

    globalThis.game.i18n = {
        has: (key) => typeof resolveKey(key) === 'string',
        localize: (key) => resolveKey(key) ?? key,
        format: (key, data = {}) => {
            let str = resolveKey(key) ?? key;
            for (const [k, v] of Object.entries(data)) {
                str = str.replace(`{${k}}`, String(v));
            }
            return str;
        }
    };

    try {
        const { traps } = await import('../../src/animation/traps/index.js');
        const { FoundryV12Adapter } = await import('../../src/adapters/foundry/foundry-v12-adapter.js');
        const { FoundryV14Adapter } = await import('../../src/adapters/foundry/foundry-v14-adapter.js');

        globalThis.game.user = { isGM: true, id: 'gm-user-1' };

        // (a1) Below v14 WITHOUT MATT -> errors immediately without opening dialogs
        globalThis.game.release = { generation: 13 };
        adapter.foundry = new FoundryV12Adapter(adapter);
        globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: false });

        const errors = [];
        globalThis.ui.notifications.error = (msg) => errors.push(msg);

        let dialogsOpened = 0;
        adapter.buttonDialog = async () => {
            dialogsOpened++;
            return 'continue';
        };

        const resInteractive = await traps.setup();
        const resDirect = await traps.setup('lightningBolt');
        log._flushQueues();

        assert.equal(resInteractive, undefined);
        assert.equal(resDirect, undefined);
        assert.equal(dialogsOpened, 0, 'Must not open any setup dialogs below v14 when MATT is inactive');
        assert.ok(errors.length >= 1, 'Must emit error notification below v14 when MATT is inactive');
        assert.ok(
            errors.some(m => m.includes("Monk's Active Tile Triggers")),
            `Error message must mention MATT, got: ${JSON.stringify(errors)}`
        );

        // (a2) Below v14 WITH MATT -> only mentions Tiles (never Regions) and prompts 3 tiles for lightningBolt
        globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });
        const tile1 = { id: 't-trig', documentName: 'Tile', getFlag: () => [], update: async () => tile1 };
        const tile2 = { id: 't-orig', documentName: 'Tile', getFlag: () => [], update: async () => tile2 };
        const tile3 = { id: 't-targ', documentName: 'Tile', getFlag: () => [], update: async () => tile3 };
        globalThis.canvas.tiles = {
            controlled: [{ document: tile1, id: 't-trig' }],
            get: (id) => (id === 't-trig' ? { document: tile1, id } : id === 't-orig' ? { document: tile2, id } : id === 't-targ' ? { document: tile3, id } : null)
        };

        const v13Prompts = [];
        adapter.buttonDialog = async (btnData, opts) => {
            v13Prompts.push({ title: btnData.title, content: opts?.content ?? '' });
            if (v13Prompts.length === 1) globalThis.canvas.tiles.controlled = [{ document: tile1, id: 't-trig' }];
            if (v13Prompts.length === 2) globalThis.canvas.tiles.controlled = [{ document: tile2, id: 't-orig' }];
            if (v13Prompts.length === 3) globalThis.canvas.tiles.controlled = [{ document: tile3, id: 't-targ' }];
            return 'continue';
        };

        await traps.setup('lightningBolt');
        assert.equal(v13Prompts.length, 3, 'Below v14 with MATT must prompt for 3 tiles for lightningBolt');
        for (const p of v13Prompts) {
            assert.ok(/tile/i.test(p.title) && /tile/i.test(p.content), `Below v14 prompt must mention tiles: ${JSON.stringify(p)}`);
            assert.ok(!/region/i.test(p.title) && !/region/i.test(p.content), `Below v14 prompt must NOT mention regions: ${JSON.stringify(p)}`);
        }

        // (b1) V14+ WITHOUT MATT -> only mentions Regions (never Tiles) across all 3 steps of lightningBolt
        globalThis.game.release = { generation: 14 };
        adapter.foundry = new FoundryV14Adapter(adapter);
        globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: false });

        const reg1 = { id: 'r-trig', documentName: 'Region', createEmbeddedDocuments: async (_t, [d]) => [d] };
        const reg2 = { id: 'r-orig', documentName: 'Region' };
        const reg3 = { id: 'r-targ', documentName: 'Region' };
        globalThis.canvas.regions = { controlled: [{ document: reg1, id: 'r-trig' }] };
        globalThis.canvas.tiles = { controlled: [], get: () => null };

        const v14NoMattPrompts = [];
        adapter.buttonDialog = async (btnData, opts) => {
            v14NoMattPrompts.push({ title: btnData.title, content: opts?.content ?? '' });
            if (v14NoMattPrompts.length === 1) globalThis.canvas.regions.controlled = [{ document: reg1, id: 'r-trig' }];
            if (v14NoMattPrompts.length === 2) globalThis.canvas.regions.controlled = [{ document: reg2, id: 'r-orig' }];
            if (v14NoMattPrompts.length === 3) globalThis.canvas.regions.controlled = [{ document: reg3, id: 'r-targ' }];
            return 'continue';
        };

        await traps.setup('lightningBolt');
        assert.equal(v14NoMattPrompts.length, 3, 'V14 without MATT must prompt for 3 regions for lightningBolt');
        for (const p of v14NoMattPrompts) {
            assert.ok(/region/i.test(p.title) && /region/i.test(p.content), `V14 without MATT prompt must mention regions: ${JSON.stringify(p)}`);
            assert.ok(!/tile/i.test(p.title) && !/tile/i.test(p.content), `V14 without MATT prompt must NOT mention tiles: ${JSON.stringify(p)}`);
        }

        // Also check built-in 3-step trap (fire) on V14 without MATT -> only mentions Regions
        const fireNoMattPrompts = [];
        globalThis.canvas.regions.controlled = [{ document: reg1, id: 'r-trig' }];
        adapter.buttonDialog = async (btnData, opts) => {
            fireNoMattPrompts.push({ title: btnData.title, content: opts?.content ?? '' });
            if (fireNoMattPrompts.length === 2) globalThis.canvas.regions.controlled = [{ document: reg2, id: 'r-orig' }];
            if (fireNoMattPrompts.length === 3) globalThis.canvas.regions.controlled = [{ document: reg3, id: 'r-targ' }];
            return 'continue';
        };
        await traps.fire.setup();
        assert.equal(fireNoMattPrompts.length, 3);
        for (const p of fireNoMattPrompts) {
            assert.ok(/region/i.test(p.content), `Fire V14 without MATT must mention region: ${JSON.stringify(p)}`);
            assert.ok(!/tile/i.test(p.content), `Fire V14 without MATT must NOT mention tile: ${JSON.stringify(p)}`);
        }

        // (b2) V14+ WITH MATT -> mentions BOTH Regions and Tiles
        globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });
        globalThis.canvas.regions.controlled = [{ document: reg1, id: 'r-trig' }];
        globalThis.canvas.tiles = { controlled: [], get: () => null };

        const v14WithMattPrompts = [];
        adapter.buttonDialog = async (btnData, opts) => {
            v14WithMattPrompts.push({ title: btnData.title, content: opts?.content ?? '' });
            if (v14WithMattPrompts.length === 2) globalThis.canvas.regions.controlled = [{ document: reg2, id: 'r-orig' }];
            if (v14WithMattPrompts.length === 3) globalThis.canvas.regions.controlled = [{ document: reg3, id: 'r-targ' }];
            return 'continue';
        };

        await traps.setup('lightningBolt');
        assert.equal(v14WithMattPrompts.length, 3, 'V14 with MATT must prompt for 3 placeables for lightningBolt');
        for (const p of v14WithMattPrompts) {
            assert.ok(
                /region/i.test(p.content) && /tile/i.test(p.content),
                `V14 with MATT prompt must mention both Regions and Tiles: ${JSON.stringify(p)}`
            );
        }

        // (b3) V14+ WITH MATT when selecting a Tile in Step 1 -> routes to MATT and prompts 3 tiles total without leaking triggerTiles
        const editedMattTiles = new Map();
        const trigTileDoc = { id: 'v14-tile-trig', documentName: 'Tile', getFlag: () => [], update: async (d) => { editedMattTiles.set('v14-tile-trig', d); return trigTileDoc; } };
        const origTileDoc = { id: 'v14-tile-orig', documentName: 'Tile', getFlag: () => [], update: async (d) => { editedMattTiles.set('v14-tile-orig', d); return origTileDoc; } };
        const targTileDoc = { id: 'v14-tile-targ', documentName: 'Tile', getFlag: () => [], update: async (d) => { editedMattTiles.set('v14-tile-targ', d); return targTileDoc; } };

        globalThis.canvas.regions.controlled = [];
        globalThis.canvas.tiles = {
            controlled: [{ document: trigTileDoc, id: 'v14-tile-trig' }],
            get: (id) => (id === 'v14-tile-trig' ? { document: trigTileDoc, id } : id === 'v14-tile-orig' ? { document: origTileDoc, id } : id === 'v14-tile-targ' ? { document: targTileDoc, id } : null)
        };

        let tileFlowSteps = 0;
        adapter.buttonDialog = async () => {
            tileFlowSteps++;
            if (tileFlowSteps === 2) globalThis.canvas.tiles.controlled = [{ document: origTileDoc, id: 'v14-tile-orig' }];
            if (tileFlowSteps === 3) globalThis.canvas.tiles.controlled = [{ document: targTileDoc, id: 'v14-tile-targ' }];
            return 'continue';
        };

        const tileSetupRes = await traps.setup('lightningBolt');
        assert.equal(tileFlowSteps, 3, 'Selecting a Tile in V14 Step 1 for lightningBolt must prompt for 3 tiles total (trigger, origin, target)');
        assert.equal(tileSetupRes.triggerTiles[0].id, 'v14-tile-trig');
        assert.equal(tileSetupRes.originTiles[0].id, 'v14-tile-orig');
        assert.equal(tileSetupRes.targetTiles[0].id, 'v14-tile-targ');

        const origCode = editedMattTiles.get('v14-tile-orig')['flags.monks-active-tiles.actions'][0].data.code;
        assert.ok(!origCode.includes('triggerTiles'), 'Forwarded triggerTiles must be stripped from serialized runtime trap config');
        assert.ok(origCode.includes("const targetTile = canvas.tiles.get('v14-tile-targ');"), 'MATT script must target the 3rd destination tile');
    } finally {
        globalThis.game.i18n = originalI18n;
        globalThis.ui.notifications.error = originalError;
        globalThis.ui.notifications.warn = originalWarn;
        adapter.buttonDialog = originalButtonDialog;
        adapter.foundry = originalFoundry;
        globalThis.game.release = originalRelease;
    }
});

