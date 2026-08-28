import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { template } from '../../src/lib/templates.js';
import { tokens } from '../../src/lib/tokens.js';
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

test('tokens.owners and tokens.getDistance function contracts', () => {
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

    const allOwners = tokens.owners(token);
    assert.equal(allOwners.length, 2); // p1 and GM
    assert.ok(allOwners.includes(p1));
    assert.ok(allOwners.includes(gm));

    const pcOnly = tokens.owners(token, { applyGM: false });
    assert.equal(pcOnly.length, 1);
    assert.equal(pcOnly[0], p1);

    // Distance calculation
    canvas.grid.size = 100;
    canvas.scene.grid.distance = 5;
    const t1 = { center: { x: 0, y: 0 }, document: { elevation: 0 } };
    const t2 = { center: { x: 300, y: 400 }, document: { elevation: 0 } };
    // 300, 400 -> hypot = 500 px. 500 / 100 * 5 = 25 scene units.
    assert.equal(tokens.getDistance(t1, t2), 25);
});
