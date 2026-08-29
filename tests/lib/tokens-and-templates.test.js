import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { template } from '../../src/lib/templates.js';
import { adapter, FoundryCurrentAdapter } from '../../src/adapters/index.js';

test('template.getPosition delegates to adapter.getTemplatePosition', async () => {
    adapter.foundry = new FoundryCurrentAdapter();

    const mockRegion = {
        documentName: 'Region',
        shapes: [
            {
                x: 100,
                y: 200,
                center: { x: 150, y: 250 },
                radius: 50,
                rotation: 0
            }
        ]
    };

    const pos = await template.getPosition(mockRegion);
    assert.equal(pos.length, 3);
    assert.deepEqual(pos[0], { x: 100, y: 200 });
    assert.deepEqual(pos[1], { x: 150, y: 200 });
    assert.deepEqual(pos[2], { x: 150, y: 250 });
});

test('adapter.getTokenOwners and adapter.getDistance function contracts', () => {
    const p1 = { id: 'p1', isGM: false, active: true };
    const p2 = { id: 'p2', isGM: false, active: true };
    const gm = { id: 'gm1', isGM: true, role: 4, active: true };

    game.users = [p1, p2, gm];

    const actor = {
        ownership: {
            p1: 3,
            p2: 1,
            default: 0
        },
        getUserLevel: (u) => u.id === 'p1' ? 3 : 1
    };

    const token = {
        actor,
        document: { id: 't1', actor }
    };

    const allOwners = adapter.getTokenOwners(token);
    assert.equal(allOwners.length, 2); // p1 and GM
    assert.ok(allOwners.includes(p1));
    assert.ok(allOwners.includes(gm));

    const pcOnly = adapter.getTokenOwners(token, { applyGM: false });
    assert.equal(pcOnly.length, 1);
    assert.equal(pcOnly[0], p1);

    // Distance calculation
    canvas.grid.size = 100;
    canvas.scene.grid.distance = 5;
    const t1 = { center: { x: 0, y: 0 }, document: { elevation: 0 } };
    const t2 = { center: { x: 300, y: 400 }, document: { elevation: 0 } };
    // 300, 400 -> hypot = 500 px. 500 / 100 * 5 = 25 scene units.
    assert.equal(adapter.getDistance(t1, t2), 25);
});

test('tokensOfTheDeparted exports stop functions on root, harvest, and use sub-objects', async () => {
    const { tokensOfTheDeparted } = await import('../../src/animation/effects/target/tokens-of-the-departed.js');
    assert.equal(typeof tokensOfTheDeparted.stop, 'function');
    assert.equal(typeof tokensOfTheDeparted.harvest.stop, 'function');
    assert.equal(typeof tokensOfTheDeparted.use.stop, 'function');

    const endEffectsCalls = [];
    globalThis.Sequencer.EffectManager.endEffects = (opts) => endEffectsCalls.push(opts);

    const token = { id: 'token-123' };
    const target = { id: 'target-456' };

    // Test tokensOfTheDeparted.use.stop(target)
    endEffectsCalls.length = 0;
    await tokensOfTheDeparted.use.stop(target);
    assert.equal(endEffectsCalls.length, 1);
    assert.deepEqual(endEffectsCalls[0], { name: 'tokensOfTheDepartedUse - target-456', object: target });

    // Test tokensOfTheDeparted.use.stop(token, target)
    endEffectsCalls.length = 0;
    await tokensOfTheDeparted.use.stop(token, target);
    assert.equal(endEffectsCalls.length, 1);
    assert.deepEqual(endEffectsCalls[0], { name: 'tokensOfTheDepartedUse - target-456', object: target });

    // Test tokensOfTheDeparted.stop(target)
    endEffectsCalls.length = 0;
    await tokensOfTheDeparted.stop(target);
    assert.equal(endEffectsCalls.length, 2);
    assert.deepEqual(endEffectsCalls[0], { name: 'tokensOfTheDepartedUse - target-456', object: target });
    assert.deepEqual(endEffectsCalls[1], { name: 'tokensOfTheDeparted - target-456', object: target });
});

