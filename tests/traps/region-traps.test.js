import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { adapter } from '../../src/adapters/index.js';
import {
    extractTrapTriggerContext,
    executeTrapTrigger,
    setupTrap,
    setupRegionTrap
} from '../../src/animation/traps/trap-manager.js';
import { MODULE_ID } from '../../src/lib/constants.js';

test('extractTrapTriggerContext: normalizes Region and Tile caller contexts', () => {
    // 1. Positional Region args (scene, region, behavior, event)
    const mockScene = { id: 'scene-1', documentName: 'Scene', regions: new Map() };
    const mockRegionDoc = { id: 'reg-1', documentName: 'Region' };
    const mockBehavior = { id: 'beh-1' };
    const mockEvent = { name: 'tokenEnter', data: { token: { id: 'tok-1' } } };

    const ctx1 = extractTrapTriggerContext(mockScene, mockRegionDoc, mockBehavior, mockEvent);
    assert.equal(ctx1.type, 'region');
    assert.equal(ctx1.scene, mockScene);
    assert.equal(ctx1.region, mockRegionDoc);
    assert.equal(ctx1.behavior, mockBehavior);
    assert.equal(ctx1.event, mockEvent);

    // 2. Positional Tile args (tile, token)
    const mockTileDoc = { id: 'tile-1', documentName: 'Tile' };
    const mockTokenDoc = { id: 'tok-1', documentName: 'Token' };

    const ctx2 = extractTrapTriggerContext(mockTileDoc, mockTokenDoc);
    assert.equal(ctx2.type, 'tile');
    assert.equal(ctx2.tile, mockTileDoc);
    assert.equal(ctx2.token, mockTokenDoc);

    // 3. Object context { region, event }
    const ctx3 = extractTrapTriggerContext({ region: mockRegionDoc, event: mockEvent });
    assert.equal(ctx3.type, 'region');
    assert.equal(ctx3.region, mockRegionDoc);
    assert.equal(ctx3.event, mockEvent);

    // 4. Object context { tile, token }
    const ctx4 = extractTrapTriggerContext({ tile: mockTileDoc, token: mockTokenDoc });
    assert.equal(ctx4.type, 'tile');
    assert.equal(ctx4.tile, mockTileDoc);
    assert.equal(ctx4.token, mockTokenDoc);
});

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

    // Case 3: Generation 14 with MATT active -> prompts user
    globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });
    let promptedMode = null;
    adapter.buttonDialog = async (dialogConfig) => {
        if (dialogConfig.title?.includes?.('modeDialogTitle') || dialogConfig.title?.includes?.('Trigger Mechanism')) {
            promptedMode = 'matt';
            return 'matt';
        }
        return 'continue';
    };

    await setupTrap('eskie.traps.spike', {});
    assert.equal(promptedMode, 'matt');
    assert.equal(mattCalled, true, 'Selecting MATT from prompt executes MATT setup');

    // Restore original MATT setup and V12 adapter
    (await import('../../src/animation/utils/matt-tiles.js')).matt.trap.setup = originalMattTrapSetup;
    adapter.foundry = new FoundryV12Adapter(adapter);
    globalThis.game.release = { generation: 12 };
});

test('setupRegionTrap: configures RegionDocument flags and creates executeScript RegionBehavior', async () => {
    globalThis.game.user = { isGM: true };
    globalThis.game.release = { generation: 14 };
    const { FoundryV12Adapter } = await import('../../src/adapters/foundry/foundry-v12-adapter.js');
    const { FoundryV14Adapter } = await import('../../src/adapters/foundry/foundry-v14-adapter.js');
    adapter.foundry = new FoundryV14Adapter(adapter);

    const updatedFlags = [];
    let createdBehaviorData = null;

    const triggerRegionDoc = {
        id: 'region-trig-10',
        documentName: 'Region',
        behaviors: [],
        update: async (data) => {
            updatedFlags.push(data);
            return triggerRegionDoc;
        },
        createEmbeddedDocuments: async (type, [data]) => {
            createdBehaviorData = data;
            return [{ id: 'beh-10', ...data }];
        }
    };

    const visualTileDoc = {
        id: 'tile-visual-10',
        documentName: 'Tile',
        update: async () => visualTileDoc
    };

    globalThis.canvas.regions = {
        controlled: [{ document: triggerRegionDoc, id: 'region-trig-10' }]
    };
    globalThis.canvas.tiles = {
        controlled: [],
        get: (id) => (id === 'tile-visual-10' ? { document: visualTileDoc, id } : null)
    };

    let step = 0;
    adapter.buttonDialog = async () => {
        step++;
        if (step === 2) {
            // Select visual tile in step 2
            globalThis.canvas.tiles.controlled = [{ document: visualTileDoc, id: 'tile-visual-10' }];
        }
        return 'continue';
    };

    const setupResult = await setupRegionTrap('eskie.traps.spike', { tileCount: 2 });
    assert.equal(setupResult.triggerRegions.length, 1);
    assert.equal(setupResult.originElements.length, 1);

    // Verify Region update flags
    const regionUpdate = updatedFlags[0];
    assert.equal(regionUpdate[`flags.${MODULE_ID}.trap.isTriggerRegion`], true);
    assert.equal(regionUpdate[`flags.${MODULE_ID}.trap.animation`], 'eskie.traps.spike');
    assert.deepEqual(regionUpdate[`flags.${MODULE_ID}.trap.originIds`], ['tile-visual-10']);
    assert.deepEqual(regionUpdate[`flags.${MODULE_ID}.trap.tileIds`], ['tile-visual-10']);

    // Verify created RegionBehavior payload
    assert.ok(createdBehaviorData);
    assert.equal(createdBehaviorData.type, 'executeScript');
    assert.deepEqual(createdBehaviorData.system.events, ['tokenEnter']);
    assert.ok(createdBehaviorData.system.source.includes('executeTrapTrigger'));

    adapter.foundry = new FoundryV12Adapter(adapter);
    globalThis.game.release = { generation: 12 };
});

test('executeTrapTrigger: triggers playback for Region and linked origin placeables', async () => {
    let trapPlayed = false;
    let passedTile = null;
    let passedTargets = null;

    // Register a mock trap on globalThis.eskie.traps
    globalThis.eskie = {
        traps: {
            mockTrap: {
                play: async (tile, targets) => {
                    trapPlayed = true;
                    passedTile = tile;
                    passedTargets = targets;
                }
            }
        }
    };

    const activatingToken = { id: 'act-tok-1', name: 'Activating Token' };
    const tokenDoc = { id: 'act-tok-1', object: activatingToken };

    const targetPlaceable = {
        id: 'tile-anim-1',
        documentName: 'Tile',
        document: { id: 'tile-anim-1' }
    };

    const mockRegionDoc = {
        id: 'region-trig-99',
        documentName: 'Region',
        getFlag: (_mod, key) => {
            if (key === 'trap.animation') return 'eskie.traps.mockTrap';
            if (key === 'trap.originIds') return ['tile-anim-1'];
            if (key === 'trap.config') return {};
            return null;
        }
    };

    globalThis.canvas.tiles = {
        get: (id) => (id === 'tile-anim-1' ? targetPlaceable : null)
    };
    globalThis.canvas.regions = {
        get: (id) => (id === 'region-trig-99' ? { document: mockRegionDoc, id } : null)
    };

    const mockEvent = {
        data: {
            token: tokenDoc
        }
    };

    await executeTrapTrigger(mockRegionDoc, null, mockEvent);

    assert.equal(trapPlayed, true, 'Trap animation play() must be called');
    assert.equal(passedTile, targetPlaceable, 'Target placeable should be passed to play()');
    assert.deepEqual(passedTargets, [activatingToken], 'Activating token should be passed as targets');

    delete globalThis.eskie;
});

test('setupRegionTrap: enforces tile requirement when requiresTile is true', async () => {
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

    const result = await setupRegionTrap('eskie.traps.floodingRoom', { tileCount: 2, requiresTile: true });
    assert.equal(warned, true, 'Must warn user when required tile is missing');
    assert.equal(result, undefined, 'Must abort setup when required tile is missing');

    adapter.foundry = new FoundryV12Adapter(adapter);
    globalThis.game.release = { generation: 12 };
});

test('setupRegionTrap: tileCount === 1 bypasses step 2 and uses trigger region as origin', async () => {
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

    const result = await setupRegionTrap('eskie.traps.electricDoor', { tileCount: 1 });
    assert.equal(dialogCount, 1, 'Only Step 1 prompt should be shown for tileCount === 1');
    assert.equal(result.triggerRegions.length, 1);
    assert.equal(result.originElements.length, 1);
    assert.equal(result.originElements[0].id, 'region-door-1');

    adapter.foundry = new FoundryV12Adapter(adapter);
    globalThis.game.release = { generation: 12 };
});

