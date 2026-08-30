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

test('template.getPosition calculates secondary farpoint for AA templateData without ray', async () => {
    const { BaseFoundryAdapter } = await import('../../src/adapters/index.js');
    adapter.foundry = new BaseFoundryAdapter();

    canvas.grid.size = 100;
    canvas.grid.distance = 5;

    const aaTemplateData = {
        x: 200,
        y: 300,
        distance: 100,
        direction: 0,
        width: 5,
        t: 'ray'
    };

    const [primary, secondary, center] = await template.getPosition(aaTemplateData);
    assert.deepEqual(primary, { x: 200, y: 300 });
    // 100 ft / 5 ft * 100 px = 2000 px along 0 deg (x-axis)
    assert.deepEqual(secondary, { x: 2200, y: 300 });
    assert.ok(secondary.x > primary.x);
});

test('template.getPosition resolves isSamePoint with token and returns error on unresolvable position', async () => {
    const { BaseFoundryAdapter } = await import('../../src/adapters/index.js');
    adapter.foundry = new BaseFoundryAdapter();

    const token = {
        center: { x: 100, y: 100 },
        document: { rotation: 0 }
    };

    // Case 1: Template placed at target (500, 500) away from token, with no secondary point
    const targetTemplate = { x: 500, y: 500, distance: 0 };
    const [primary, secondary] = await template.getPosition(targetTemplate, { token });
    assert.deepEqual(primary, { x: 100, y: 100 }); // token center
    assert.deepEqual(secondary, { x: 500, y: 500 }); // target location

    // Case 2: Template placed at token with zero distance and rotation, but config defines fallback distance/direction
    const selfTemplate = { x: 100, y: 100, distance: 0 };
    const [p2, s2] = await template.getPosition(selfTemplate, { token, distance: 50, direction: 90 });
    assert.deepEqual(p2, { x: 100, y: 100 });
    assert.ok(s2);
    assert.ok(Math.hypot(s2.x - p2.x, s2.y - p2.y) > 0);

    // Case 3: Completely unresolvable position (distance 0 and secondary forced to same point)
    const collapsedPositions = [{ x: 100, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 100 }];
    const resolved = template.resolveDistinctPositions(collapsedPositions, { distance: 0, max: 0 });
    assert.ok(resolved.error);
    assert.ok(resolved[0].error);
    assert.ok(resolved[0].cancelled);
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

test('entangle template and entangled active effect exports and contracts', async () => {
    const { entangle } = await import('../../src/animation/effects/template/entangle.js');
    const { entangled } = await import('../../src/animation/effects/active-effect/entangled.js');
    const { effect } = await import('../../src/animation/effects/index.js');

    assert.equal(typeof entangle.create, 'function');
    assert.equal(typeof entangle.play, 'function');
    assert.equal(typeof entangle.stop, 'function');
    assert.equal(entangle.entangled, entangled);
    assert.equal(entangle.effect, entangled);
    assert.equal(typeof entangle.template.create, 'function');
    assert.equal(typeof entangle.template.play, 'function');
    assert.equal(typeof entangle.template.stop, 'function');
    assert.equal(effect.entangled, entangled);
    assert.equal(effect.entangle, entangle);

    // Initial cast DEFAULT_CONFIG must not contain target entangle flags
    assert.equal(entangle.default_config.entangle, undefined);
    assert.equal(entangle.default_config.targets, undefined);

    // Entangled active effect contracts
    assert.equal(typeof entangled.create, 'function');
    assert.equal(typeof entangled.play, 'function');
    assert.equal(typeof entangled.stop, 'function');
    assert.equal(entangled.default_config.id, 'entangled');

    const endEffectsCalls = [];
    globalThis.Sequencer.EffectManager.endEffects = (opts) => endEffectsCalls.push(opts);

    const token = { id: 'victim-123' };
    await entangled.stop(token);
    assert.equal(endEffectsCalls.length, 1);
    assert.deepEqual(endEffectsCalls[0], { name: 'entangled - victim-123', object: token });
});

test('twilightSanctuary.stop ends effects by name without restricting to object: token', async () => {
    const { twilightSanctuary } = await import('../../src/animation/effects/aura/twilight-sanctuary.js');
    assert.equal(typeof twilightSanctuary.stop, 'function');

    const endEffectsCalls = [];
    globalThis.Sequencer.EffectManager.endEffects = (opts) => endEffectsCalls.push(opts);

    const token = { id: 'cleric-789' };
    await twilightSanctuary.stop(token);
    assert.equal(endEffectsCalls.length, 1);
    assert.deepEqual(endEffectsCalls[0], { name: 'twilightSanctuary - cleric-789' });
});



