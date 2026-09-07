import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { adapter } from '../../src/adapters/index.js';
import { matt } from '../../src/animation/utils/matt-tiles.js';
import { MODULE_ID } from '../../src/lib/constants.js';

test('matt.trap.setup configures tiles with MATT runcode action using standard foundry.utils.getProperty', async () => {
    const updatedTiles = new Map();
    globalThis.game.user = { isGM: true, id: 'gm-user-1' };
    globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });

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

    const triggerUpdate = updatedTiles.get('tile-trigger-1');
    assert.ok(triggerUpdate, 'Trigger tile should be updated with MATT configuration');
    assert.equal(triggerUpdate['flags.monks-active-tiles.active'], true);
    assert.ok(Array.isArray(triggerUpdate['flags.monks-active-tiles.actions']));

    const runcodeAction = triggerUpdate['flags.monks-active-tiles.actions'][0];
    assert.equal(runcodeAction.action, 'runcode');
    assert.ok(typeof runcodeAction.data.code === 'string');

    // Verify the code string does not reference 'adapter.' and uses 'foundry.utils.getProperty'
    assert.ok(!runcodeAction.data.code.includes('adapter.getProperty'), 'Generated code should not reference module-scoped adapter');
    assert.ok(runcodeAction.data.code.includes('foundry.utils.getProperty'), 'Generated code should reference foundry.utils.getProperty');

    // Verify evaluating the generated code does not throw ReferenceError
    let playCalled = false;
    globalThis.eskie = {
        traps: {
            spike: {
                play: (originTile, tokens) => {
                    playCalled = true;
                    assert.equal(originTile.id, 'tile-trap-1');
                    assert.equal(tokens[0].id, 'tok-1');
                }
            }
        }
    };

    const mockTile = {
        getFlag: (mod, key) => {
            if (mod === MODULE_ID && key === 'trap.animation') return 'eskie.traps.spike';
            if (mod === MODULE_ID && key === 'trap.originIds') return ['tile-trap-1'];
            return null;
        }
    };
    const mockToken = { id: 'tok-1', object: { id: 'tok-1' } };

    // Execute in an isolated function mimicking MATT _executeCode
    const execFn = new Function('token', 'tile', 'canvas', runcodeAction.data.code);
    assert.doesNotThrow(() => {
        execFn(mockToken, mockTile, globalThis.canvas);
    });
    assert.equal(playCalled, true, 'Trap play should be invoked successfully without ReferenceError');
});
