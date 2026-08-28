import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { adapter, Adapter, BaseFoundryAdapter, FoundryCurrentAdapter, Dnd5eSystemAdapter, Pf2eSystemAdapter, GenericSystemAdapter } from '../../src/adapters/index.js';

test('Unified Adapter init initializes Foundry, System, and Module layers', async () => {
    game.release = { generation: 14 };
    game.version = '14.000';
    game.system = { id: 'dnd5e', title: 'D&D 5e' };
    game.modules = new Map([
        ['midi-qol', { id: 'midi-qol', active: true }]
    ]);

    const testAdapter = new Adapter();
    await testAdapter.init();

    assert.ok(testAdapter.foundry instanceof FoundryCurrentAdapter);
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
