import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { adapter } from '../../src/adapters/index.js';
import { matt } from '../../src/animation/utils/matt-tiles.js';
import { MODULE_ID } from '../../src/lib/constants.js';

test('matt.trap.setup configures trigger tiles to manually activate trap tiles and trap tiles to target contained tokens', async () => {
    const updatedTiles = new Map();
    globalThis.game.user = { isGM: true, id: 'gm-user-1' };
    globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });

    let trapTileTriggered = false;
    let trapTileTriggerArg = null;

    const triggerTileDoc = {
        id: 'tile-trigger-1',
        flags: {},
        update: async (data) => {
            updatedTiles.set('tile-trigger-1', data);
            return triggerTileDoc;
        }
    };
    const trapTileDoc = {
        id: 'tile-trap-1',
        flags: {},
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        trigger: async (args) => {
            trapTileTriggered = true;
            trapTileTriggerArg = args;
        },
        update: async (data) => {
            updatedTiles.set('tile-trap-1', data);
            return trapTileDoc;
        }
    };

    globalThis.canvas.tiles = {
        controlled: [{ document: triggerTileDoc, id: 'tile-trigger-1' }],
        get: (id) => (id === 'tile-trigger-1' ? { document: triggerTileDoc, id } : id === 'tile-trap-1' ? { document: trapTileDoc, id } : null)
    };

    // Simulate multi-step dialog selection: step 1 trigger tile, step 2 trap animation tile
    let dialogCount = 0;
    adapter.buttonDialog = async () => {
        dialogCount++;
        if (dialogCount === 2) {
            globalThis.canvas.tiles.controlled = [{ document: trapTileDoc, id: 'tile-trap-1' }];
        }
        return 'continue';
    };

    await matt.trap.setup('eskie.traps.spike', { tileCount: 2 });

    // 1. Verify Trigger Tile configuration
    const triggerUpdate = updatedTiles.get('tile-trigger-1');
    assert.ok(triggerUpdate, 'Trigger tile should be updated with MATT configuration');
    assert.equal(triggerUpdate['flags.monks-active-tiles.active'], true);
    assert.deepEqual(triggerUpdate['flags.monks-active-tiles.trigger'], ['enter']);
    assert.deepEqual(triggerUpdate[`flags.${MODULE_ID}.trap.originIds`], ['tile-trap-1']);
    assert.equal(triggerUpdate[`flags.${MODULE_ID}.trap.isTriggerTile`], true);

    const triggerAction = triggerUpdate['flags.monks-active-tiles.actions'][0];
    assert.equal(triggerAction.action, 'runcode');
    assert.ok(typeof triggerAction.data.code === 'string');

    // Test executing trigger action code
    const mockTriggerTile = {
        getFlag: (mod, key) => {
            if (mod === MODULE_ID && key === 'trap.originIds') return ['tile-trap-1'];
            return null;
        }
    };
    const mockActivatingToken = { id: 'tok-activating', document: { id: 'tok-activating' } };
    const triggerExecFn = new Function('token', 'tile', 'canvas', `return (async () => { ${triggerAction.data.code} })();`);
    await triggerExecFn(mockActivatingToken, mockTriggerTile, globalThis.canvas);

    assert.equal(trapTileTriggered, true, 'Trigger tile execution should manually trigger the linked trap tile');
    assert.equal(trapTileTriggerArg.token.id, 'tok-activating', 'Activating token should be passed to trap tile trigger');

    // 2. Verify Trap Tile configuration
    const trapUpdate = updatedTiles.get('tile-trap-1');
    assert.ok(trapUpdate, 'Trap tile should be updated with MATT configuration');
    assert.equal(trapUpdate['flags.monks-active-tiles.active'], true);
    assert.deepEqual(trapUpdate['flags.monks-active-tiles.trigger'], ['manual']);
    assert.equal(trapUpdate[`flags.${MODULE_ID}.trap.isTrapTile`], true);
    assert.equal(trapUpdate[`flags.${MODULE_ID}.trap.animation`], 'eskie.traps.spike');

    const trapAction = trapUpdate['flags.monks-active-tiles.actions'][0];
    assert.equal(trapAction.action, 'runcode');
    assert.ok(typeof trapAction.data.code === 'string');

    // Verify the code string resolves adapter via module API and foundry.utils fallback
    assert.ok(trapAction.data.code.includes(`game.modules.get('${MODULE_ID}')?.api?.adapter ?? foundry.utils`), 'Generated code should resolve adapter from module API with fallback');
    assert.ok(trapAction.data.code.includes('const trap = adapter.getProperty(globalThis, animation);'), 'Generated code should invoke getProperty on resolved adapter');

    // Test executing trap action code
    let playCalled = false;
    let playTargets = [];
    globalThis.eskie = {
        traps: {
            spike: {
                play: (originTile, tokens) => {
                    playCalled = true;
                    playTargets = tokens;
                    assert.equal(originTile.id, 'tile-trap-1');
                }
            }
        }
    };
    globalThis.game.modules.set(MODULE_ID, { id: MODULE_ID, api: { adapter } });

    // Place tokens on canvas: tokenInside is inside the trap tile (100, 100, 100, 100), tokenOutside is outside (300, 300)
    const tokenInside = { id: 'tok-inside', document: { id: 'tok-inside', x: 120, y: 120, width: 1, height: 1 }, x: 120, y: 120, w: 100, h: 100 };
    const tokenOutside = { id: 'tok-outside', document: { id: 'tok-outside', x: 300, y: 300, width: 1, height: 1 }, x: 300, y: 300, w: 100, h: 100 };
    globalThis.canvas.tokens = {
        placeables: [tokenInside, tokenOutside]
    };
    globalThis.canvas.grid = { size: 100 };

    const mockTrapTile = {
        id: 'tile-trap-1',
        document: trapTileDoc,
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        getFlag: (mod, key) => {
            if (mod === MODULE_ID && key === 'trap.animation') return 'eskie.traps.spike';
            return null;
        }
    };

    const trapExecFn = new Function('token', 'tile', 'canvas', `return (async () => { ${trapAction.data.code} })();`);
    await trapExecFn(mockActivatingToken, mockTrapTile, globalThis.canvas);

    assert.equal(playCalled, true, 'Trap play should be invoked successfully');
    assert.equal(playTargets.length, 1, 'Only tokens contained within the trap tile should be targeted');
    assert.equal(playTargets[0].id, 'tok-inside', 'Contained token should be the target');
});

test('matt.trap.setup correctly handles when the trigger tile is the trap tile (single tile)', async () => {
    const updatedTiles = new Map();
    globalThis.game.user = { isGM: true, id: 'gm-user-1' };
    globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });

    const selfTileDoc = {
        id: 'tile-self-1',
        flags: {},
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        update: async (data) => {
            updatedTiles.set('tile-self-1', data);
            return selfTileDoc;
        }
    };

    globalThis.canvas.tiles = {
        controlled: [{ document: selfTileDoc, id: 'tile-self-1' }],
        get: (id) => (id === 'tile-self-1' ? { document: selfTileDoc, id } : null)
    };

    // Simulate selecting the same tile for trigger and trap
    adapter.buttonDialog = async () => 'continue';

    await matt.trap.setup('eskie.traps.spike', { tileCount: 2 });

    const selfUpdate = updatedTiles.get('tile-self-1');
    assert.ok(selfUpdate, 'Single tile should be updated');
    assert.equal(selfUpdate['flags.monks-active-tiles.active'], true);
    assert.deepEqual(selfUpdate['flags.monks-active-tiles.trigger'], ['enter', 'manual'], 'Combined tile should have both enter and manual triggers');
    assert.equal(selfUpdate[`flags.${MODULE_ID}.trap.isTriggerTile`], true);
    assert.equal(selfUpdate[`flags.${MODULE_ID}.trap.isTrapTile`], true);
    assert.equal(selfUpdate[`flags.${MODULE_ID}.trap.animation`], 'eskie.traps.spike');
    assert.deepEqual(selfUpdate[`flags.${MODULE_ID}.trap.originIds`], ['tile-self-1']);

    const action = selfUpdate['flags.monks-active-tiles.actions'][0];
    assert.equal(action.action, 'runcode');

    // Test execution of combined action
    let playCalled = false;
    let playTargets = [];
    globalThis.eskie = {
        traps: {
            spike: {
                play: (tile, tokens) => {
                    playCalled = true;
                    playTargets = tokens;
                    assert.equal(tile.id, 'tile-self-1');
                }
            }
        }
    };
    globalThis.game.modules.set(MODULE_ID, { id: MODULE_ID, api: { adapter } });

    const tokenInside = { id: 'tok-on-tile', document: { id: 'tok-on-tile', x: 220, y: 220, width: 1, height: 1 }, x: 220, y: 220, w: 100, h: 100 };
    globalThis.canvas.tokens = {
        placeables: [tokenInside]
    };
    globalThis.canvas.grid = { size: 100 };

    const mockTile = {
        id: 'tile-self-1',
        document: selfTileDoc,
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        getFlag: (mod, key) => {
            if (mod === MODULE_ID && key === 'trap.animation') return 'eskie.traps.spike';
            if (mod === MODULE_ID && key === 'trap.originIds') return ['tile-self-1'];
            return null;
        }
    };
    const mockToken = { id: 'tok-on-tile', document: { id: 'tok-on-tile' } };

    const execFn = new Function('token', 'tile', 'canvas', `return (async () => { ${action.data.code} })();`);
    await execFn(mockToken, mockTile, globalThis.canvas);

    assert.equal(playCalled, true, 'Trap play should be executed on the tile');
    assert.equal(playTargets.length, 1, 'Token on the tile should be targeted');
    assert.equal(playTargets[0].id, 'tok-on-tile');
});

test('adapter.getTokensInTile returns only overlapping tokens', () => {
    const tile = {
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        document: { x: 100, y: 100, width: 200, height: 200 }
    };

    const token1 = { id: 't1', x: 150, y: 150, w: 100, h: 100, document: { x: 150, y: 150, width: 1, height: 1 } };
    const token2 = { id: 't2', x: 50, y: 50, w: 100, h: 100, document: { x: 50, y: 50, width: 1, height: 1 } }; // Overlaps top-left
    const token3 = { id: 't3', x: 300, y: 300, w: 100, h: 100, document: { x: 300, y: 300, width: 1, height: 1 } }; // Outside
    const token4 = { id: 't4', x: 100, y: 300, w: 100, h: 100, document: { x: 100, y: 300, width: 1, height: 1 } }; // Touching edge (no overlap)

    globalThis.canvas.tokens = {
        placeables: [token1, token2, token3, token4]
    };
    globalThis.canvas.grid = { size: 100 };

    const contained = adapter.getTokensInTile(tile);
    assert.deepEqual(contained.map(t => t.id), ['t1', 't2']);
    assert.deepEqual(adapter.getTokensInTile(null), []);
});
