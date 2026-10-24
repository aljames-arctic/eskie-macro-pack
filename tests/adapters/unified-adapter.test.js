import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { adapter, Adapter } from '../../src/adapters/index.js';
import { FoundryV14Adapter } from '../../src/adapters/foundry/foundry-v14-adapter.js';
import { Dnd5eSystemAdapter } from '../../src/adapters/system/dnd5e-system-adapter.js';

test('Unified Adapter init initializes Foundry, System, and Module layers', async () => {
    game.release = { generation: 14 };
    game.version = '14.000';
    game.system = { id: 'dnd5e', title: 'D&D 5e' };
    game.modules = new Map([
        ['midi-qol', { id: 'midi-qol', active: true }]
    ]);

    const testAdapter = new Adapter();
    await testAdapter.init();

    assert.ok(testAdapter.foundry instanceof FoundryV14Adapter);
    assert.equal(testAdapter.foundry.generation, 14);
    assert.ok(testAdapter.system instanceof Dnd5eSystemAdapter);
    assert.equal(testAdapter.system.isSupported, true);
    assert.equal(testAdapter.modules.size, 1);
});

test('Unified Adapter delegates methods seamlessly to active layers', async () => {
    game.release = { generation: 14 };
    game.system = { id: 'dnd5e', title: 'D&D 5e' };
    await adapter.init();

    // Foundry delegates
    const mockToken = { center: { x: 300, y: 400 }, document: { documentName: 'Token', width: 1, height: 1, texture: { scaleX: 1 } } };
    assert.deepEqual(adapter.getTileOffset(mockToken, 'reveal'), { x: 300, y: 400 });
    assert.deepEqual(adapter.getShapeOffset(mockToken), { x: 300, y: 400 });

    // System delegates
    const saveMsg = {
        id: 'msg-save',
        flags: {
            dnd5e: {
                roll: {
                    type: 'save',
                    ability: 'wis'
                }
            }
        }
    };
    assert.equal(adapter.qualifyMessage(saveMsg), 'saving throw');
    const rolls = adapter.extractRolls(saveMsg);
    assert.equal(rolls.length, 1);
    assert.equal(adapter.normalizeAbility(rolls[0].rawAbility), 'wisdom');
    assert.equal(adapter.getCreatureType({ system: { details: { type: { value: 'Dragon' } } } }), 'dragon');
});

test('setupModule attaches public api.util delegates to game.modules.get("eskie-macros").api', async () => {
    const { setupModule } = await import('../../src/module.js');
    const mockModule = { id: 'eskie-macros', api: {} };
    game.modules.set('eskie-macros', mockModule);

    setupModule();

    assert.ok(mockModule.api.util, 'api.util must be exposed');
    assert.equal(typeof mockModule.api.util.closest, 'function', 'api.util.closest must be a function');
    assert.ok(mockModule.api.util.tokens, 'api.util.tokens must be exposed');
    assert.equal(typeof mockModule.api.util.tokens.getDistance, 'function');
    assert.equal(typeof mockModule.api.util.tokens.getNearestSquareCenter, 'function');
    assert.equal(typeof mockModule.api.util.tokens.isAdjacent, 'function');

    const t1 = { x: 0, y: 0, w: 100, h: 100, center: { x: 50, y: 50 }, document: { elevation: 0 } };
    const t2 = { x: 100, y: 0, w: 100, h: 100, center: { x: 150, y: 50 }, document: { elevation: 0 } };
    canvas.grid.size = 100;
    canvas.scene.grid.distance = 5;

    assert.equal(mockModule.api.util.tokens.isAdjacent(t1, t2), true);
    assert.equal(mockModule.api.util.tokens.getDistance(t1, t2), 5);
});

