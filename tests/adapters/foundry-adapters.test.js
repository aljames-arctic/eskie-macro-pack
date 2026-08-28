import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeFoundryAdapter, BaseFoundryAdapter, FoundryCurrentAdapter, USER_PERMISSION_TIERS } from '../../src/adapters/foundry/index.js';

test('initializeFoundryAdapter returns BaseFoundryAdapter on v12/v13 baseline and FoundryCurrentAdapter on v14+', () => {
    // V12 baseline
    game.release = { generation: 12 };
    game.version = '12.331';
    const v12 = initializeFoundryAdapter();
    assert.ok(v12 instanceof BaseFoundryAdapter);
    assert.equal(v12.generation, 12);

    // V13 baseline
    game.release = { generation: 13 };
    game.version = '13.300';
    const v13 = initializeFoundryAdapter();
    assert.ok(v13 instanceof BaseFoundryAdapter);
    assert.equal(v13.generation, 13);

    // V14 modern
    game.release = { generation: 14 };
    game.version = '14.000';
    const v14 = initializeFoundryAdapter();
    assert.ok(v14 instanceof FoundryCurrentAdapter);
    assert.ok(v14 instanceof BaseFoundryAdapter);
    assert.equal(v14.generation, 14);
});

test('BaseFoundryAdapter and FoundryCurrentAdapter constructor getters contract', () => {
    const v12 = new BaseFoundryAdapter();
    assert.equal(v12.ContextMenu, globalThis.ContextMenu);
    assert.equal(v12.KeyboardManager, globalThis.KeyboardManager);
    assert.equal(v12.Token, globalThis.Token);
    assert.equal(v12.Tile, globalThis.Tile);
    assert.equal(v12.FilePicker, globalThis.FilePicker);
    assert.equal(v12.TextEditor, globalThis.TextEditor);

    const v14 = new FoundryCurrentAdapter();
    assert.equal(v14.ContextMenu, globalThis.foundry.applications.ux.ContextMenu);
    assert.equal(v14.KeyboardManager, globalThis.foundry.helpers.interaction.KeyboardManager);
    assert.equal(v14.Token, globalThis.foundry.canvas.placeables.Token);
    assert.equal(v14.Tile, globalThis.foundry.canvas.placeables.Tile);
    assert.equal(v14.FilePicker, globalThis.foundry.applications.apps.FilePicker.implementation);
    assert.equal(v14.TextEditor, globalThis.foundry.applications.ux.TextEditor.implementation);
});

test('Tile offset calculations: V12/V13 top-left origin math vs V14+ centered origin math', () => {
    const mockToken = {
        x: 500,
        y: 600,
        center: { x: 550, y: 650 },
        document: {
            documentName: 'Token',
            width: 1,
            height: 1,
            texture: { scaleX: 1.2, scaleY: 1.2 }
        }
    };

    canvas.grid.size = 100;

    // V12/V13 BaseFoundryAdapter
    const v12 = new BaseFoundryAdapter();
    const v12Reveal = v12.getRevealOffset(mockToken, 1);
    // x = 500 - (100 * 1 * (1.2 - 1) / 2) = 500 - 10 = 490
    // y = 600 - (100 * 1 * (1.2 - 1) / 2) = 600 - 10 = 590
    assert.deepEqual(v12Reveal, { x: 490, y: 590 });
    assert.deepEqual(v12.getShapeOffset(mockToken), { x: 500, y: 600 });
    assert.deepEqual(v12.getTileOffset(mockToken, 'reveal', 1), { x: 490, y: 590 });
    assert.deepEqual(v12.getTileOffset(mockToken, 'shape'), { x: 500, y: 600 });
    assert.throws(() => v12.getTileOffset(mockToken, 'unknown'), /Invalid offset type/);

    // V14+ FoundryCurrentAdapter
    const v14 = new FoundryCurrentAdapter();
    assert.deepEqual(v14.getRevealOffset(mockToken, 1), { x: 550, y: 650 });
    assert.deepEqual(v14.getShapeOffset(mockToken), { x: 550, y: 650 });
    assert.deepEqual(v14.getTileOffset(mockToken, 'reveal', 1), { x: 550, y: 650 });
    assert.deepEqual(v14.getTileOffset(mockToken, 'shape'), { x: 550, y: 650 });
});

test('Template position extraction: V12/V13 MeasuredTemplate vs V14+ Region shapes', () => {
    // V12 MeasuredTemplate
    const v12 = new BaseFoundryAdapter();
    const mockTemplate = {
        x: 1000,
        y: 2000,
        distance: 30,
        width: 10,
        ray: { B: { x: 1030, y: 2000 } }
    };
    canvas.grid.size = 100;
    canvas.grid.distance = 5;

    const v12Pos = v12.getTemplatePosition(mockTemplate);
    assert.equal(v12Pos.length, 3);
    assert.deepEqual(v12Pos[0], { x: 1000, y: 2000 }); // primary
    assert.deepEqual(v12Pos[1], { x: 1030, y: 2000 }); // secondary

    // V14 Region
    const v14 = new FoundryCurrentAdapter();
    const mockRegion = {
        documentName: 'Region',
        shapes: [
            {
                x: 800,
                y: 900,
                center: { x: 850, y: 950 },
                radius: 400,
                rotation: 0
            }
        ]
    };
    const v14Pos = v14.getTemplatePosition(mockRegion);
    assert.equal(v14Pos.length, 3);
    assert.deepEqual(v14Pos[0], { x: 800, y: 900 }); // primary
    assert.deepEqual(v14Pos[1], { x: 1200, y: 900 }); // secondary (x + radius)
    assert.deepEqual(v14Pos[2], { x: 850, y: 950 }); // center
});

test('Permission tiers and ownership evaluation on BaseFoundryAdapter', () => {
    const adapter = new BaseFoundryAdapter();

    const gmUser = { id: 'gm1', isGM: true, role: 4, active: true };
    const trustedUser = { id: 't1', isGM: false, isTrusted: true, role: 2, active: true };
    const playerUser = { id: 'p1', isGM: false, isTrusted: false, role: 1, active: true };

    assert.equal(adapter.getUserPermissionTier(gmUser), USER_PERMISSION_TIERS.GM);
    assert.equal(adapter.getUserPermissionTier(trustedUser), USER_PERMISSION_TIERS.TRUSTED);
    assert.equal(adapter.getUserPermissionTier(playerUser), USER_PERMISSION_TIERS.PLAYER);

    const mockActor = {
        ownership: {
            p1: 3,
            t1: 1,
            default: 0
        },
        getUserLevel: (u) => u.id === 'p1' ? 3 : 1
    };

    const mockToken = {
        actor: mockActor,
        document: { id: 'tok1', actor: mockActor }
    };

    assert.equal(adapter.isUserDocumentOwner(gmUser, mockActor, mockToken.document), true);
    assert.equal(adapter.isUserDocumentOwner(playerUser, mockActor, mockToken.document), true);
    assert.equal(adapter.isUserDocumentOwner(trustedUser, mockActor, mockToken.document), false);

    game.users = [gmUser, playerUser];
    assert.equal(adapter.isUserInCharge(mockToken, playerUser), true);
    assert.equal(adapter.isUserInCharge(mockToken, gmUser), false); // player owns it and is active
});
