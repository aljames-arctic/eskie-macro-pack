import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { adapter } from '../../src/adapters/index.js';
import {
    createCasterProxy,
    executeTrapEffect,
    playEffectAsTrap,
    resolveTrapDispatchMode,
    setupTrap
} from '../../src/animation/traps/trap-manager.js';
import { MODULE_ID } from '../../src/lib/constants.js';
import { FoundryV13Adapter } from '../../src/adapters/foundry/foundry-v13-adapter.js';

adapter.foundry = new FoundryV13Adapter(adapter);

test('createCasterProxy: creates Token-compatible proxy for Tile placeable', () => {
    const tile = {
        id: 'tile-origin-1',
        x: 100,
        y: 200,
        w: 100,
        h: 100,
        rotation: 0,
        document: {
            id: 'tile-origin-1',
            uuid: 'Scene.1.Tile.tile-origin-1',
            name: 'Wall Spout',
            x: 100,
            y: 200,
            width: 100,
            height: 100,
            rotation: 0,
            elevation: 0,
            texture: {
                src: 'tiles/spout.png',
                scaleX: 1,
                scaleY: 1
            }
        }
    };

    const targetLoc = { x: 400, y: 600 };
    const proxy = createCasterProxy(tile, targetLoc);

    assert.ok(proxy);
    assert.equal(proxy.id, 'tile-origin-1');
    assert.equal(proxy.name, 'Wall Spout');
    assert.deepEqual(proxy.center, { x: 150, y: 250 });
    assert.equal(proxy.w, 100);
    assert.equal(proxy.h, 100);
    // dx = 400 - 150 = 250, dy = 600 - 250 = 350 -> angle in degrees
    const expectedAngle = Math.atan2(350, 250) * 180 / Math.PI;
    assert.ok(Math.abs(proxy.rotation - expectedAngle) < 0.001);
    assert.equal(proxy.isTrapCasterProxy, true);
    assert.equal(proxy.isRegionOrigin, false);
    assert.ok(proxy.document);
    assert.equal(proxy.document.texture.src, 'tiles/spout.png');
    assert.equal(proxy.document.name, 'Wall Spout');
});

test('createCasterProxy: creates Token-compatible proxy for Region placeable', () => {
    const regionDoc = {
        id: 'region-origin-1',
        name: 'Gargoyle Statue',
        documentName: 'Region',
        shapes: [{ x: 50, y: 50, width: 200, height: 200, center: { x: 150, y: 150 } }],
        elevation: 10,
        texture: { src: 'icons/statue.png', scaleX: 1, scaleY: 1 }
    };

    const targetLoc = { x: 550, y: 150 }; // Straight east: rotation = 0 deg
    const proxy = createCasterProxy(regionDoc, targetLoc);

    assert.ok(proxy);
    assert.equal(proxy.id, 'region-origin-1');
    assert.equal(proxy.name, 'Gargoyle Statue');
    assert.deepEqual(proxy.center, { x: 150, y: 150 });
    assert.equal(proxy.rotation, 0);
    assert.equal(proxy.isTrapCasterProxy, true);
    assert.equal(proxy.isRegionOrigin, true);
    assert.equal(proxy.document.elevation, 10);
    assert.equal(proxy.document.texture.src, 'icons/statue.png');

    // Foundry V14 Region elevation ranges normalize to a finite number
    const rangedRegion = {
        id: 'region-origin-2',
        documentName: 'Region',
        shapes: [{ x: 0, y: 0, width: 100, height: 100 }],
        elevation: { bottom: 20, top: 30 }
    };
    assert.equal(createCasterProxy(rangedRegion).document.elevation, 20);

    const unboundedRegion = {
        id: 'region-origin-3',
        documentName: 'Region',
        shapes: [{ x: 0, y: 0, width: 100, height: 100 }],
        elevation: { bottom: -Infinity, top: Infinity }
    };
    assert.equal(createCasterProxy(unboundedRegion).document.elevation, 0);
});

test('createCasterProxy: passes through Token placeables unchanged and handles null', () => {
    const token = {
        id: 'tok-real-1',
        documentName: 'Token',
        document: { id: 'tok-real-1', name: 'Real Mage' }
    };
    assert.equal(createCasterProxy(token), token);
    assert.equal(createCasterProxy(null), null);
});

test('adapter.getTemplatePosition: cleanly handles Tile as template and sets primary to caster proxy', () => {
    const tile = {
        id: 'tile-target-zone',
        documentName: 'Tile',
        x: 300,
        y: 400,
        document: {
            id: 'tile-target-zone',
            documentName: 'Tile',
            x: 300,
            y: 400,
            width: 200,
            height: 200,
            texture: { src: 'tiles/trapzone.png' }
        }
    };

    const casterProxy = {
        id: 'caster-proxy-1',
        center: { x: 50, y: 50 },
        document: { id: 'caster-proxy-1', rotation: 0 }
    };

    const positions = adapter.getTemplatePosition(tile, { token: casterProxy });
    assert.ok(positions);
    assert.equal(positions.length, 3);
    const [primary, secondary, center] = positions;
    assert.deepEqual(primary, { x: 50, y: 50 }, 'Primary must be casterProxy center');
    assert.deepEqual(secondary, { x: 400, y: 500 }, 'Secondary must be tile center (300+100, 400+100)');
    assert.deepEqual(center, { x: 400, y: 500 }, 'Center must be tile center');
});

test('executeTrapEffect: executes template animation with caster proxy and target placeable', async () => {
    let capturedToken = null;
    let capturedConfig = null;

    const mockFireball = {
        default_config: { id: 'fireball', radius: 20 },
        play: async (token, config) => {
            capturedToken = token;
            capturedConfig = config;
            return { played: true, effect: 'fireball' };
        }
    };

    const originTile = {
        id: 'tile-statue-1',
        documentName: 'Tile',
        x: 0,
        y: 0,
        document: {
            id: 'tile-statue-1',
            documentName: 'Tile',
            name: 'Fire Gargoyle',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            texture: { src: 'gargoyle.png' }
        }
    };

    const targetRegion = {
        id: 'reg-landing-1',
        documentName: 'Region',
        shapes: [{ x: 300, y: 400, width: 200, height: 200, center: { x: 400, y: 500 } }],
        document: {
            id: 'reg-landing-1',
            documentName: 'Region',
            shapes: [{ x: 300, y: 400, width: 200, height: 200, center: { x: 400, y: 500 } }]
        }
    };

    const result = await executeTrapEffect(mockFireball, originTile, targetRegion, [], { damage: '8d6' });

    assert.ok(result);
    assert.equal(result.played, true);
    assert.ok(capturedToken, 'Template effect must receive caster proxy as token');
    assert.equal(capturedToken.name, 'Fire Gargoyle');
    assert.deepEqual(capturedToken.center, { x: 50, y: 50 });
    assert.equal(capturedConfig.template, targetRegion, 'Template effect must receive targetPlaceable as template');
    assert.deepEqual(capturedConfig.targetLocation, { x: 400, y: 500 });
    assert.equal(capturedConfig.damage, '8d6');
});

test('executeTrapEffect: executes targeted animation for multiple tokens in trap zone', async () => {
    const targetedCalls = [];

    const mockDisintegrate = {
        default_config: { id: 'disintegrate' },
        play: async (token, target, config) => {
            targetedCalls.push({ token, target, config });
            return { hit: target.name };
        }
    };

    const originTile = {
        id: 'tile-crystal',
        documentName: 'Tile',
        x: 100,
        y: 100,
        document: { id: 'tile-crystal', documentName: 'Tile', name: 'Focus Crystal', x: 100, y: 100, width: 100, height: 100 }
    };

    const target1 = { id: 'tok-1', name: 'Goblin 1', center: { x: 300, y: 300 }, document: { id: 'tok-1', width: 1, height: 1 } };
    const target2 = { id: 'tok-2', name: 'Goblin 2', center: { x: 350, y: 350 }, document: { id: 'tok-2', width: 1, height: 1 } };

    const results = await executeTrapEffect(mockDisintegrate, originTile, null, [target1, target2], { power: 'max' });

    assert.equal(targetedCalls.length, 2, 'Must invoke targeted effect for each target token');
    assert.equal(targetedCalls[0].token.name, 'Focus Crystal');
    assert.equal(targetedCalls[0].target.id, 'tok-1');
    assert.equal(targetedCalls[1].target.id, 'tok-2');
    assert.equal(results.length, 2);
    assert.equal(results[0].hit, 'Goblin 1');
    assert.equal(results[1].hit, 'Goblin 2');
});

test('executeTrapEffect: targeted animation with 0 tokens fires at landing placeable proxy', async () => {
    let capturedSource = null;
    let capturedTarget = null;

    const mockBeam = {
        default_config: { id: 'beam' },
        play: async (source, target) => {
            capturedSource = source;
            capturedTarget = target;
            return { fired: true };
        }
    };

    const originTile = {
        id: 'tile-turret',
        documentName: 'Tile',
        x: 0,
        y: 0,
        document: { id: 'tile-turret', documentName: 'Tile', name: 'Turret', x: 0, y: 0, width: 100, height: 100 }
    };

    const landingTile = {
        id: 'tile-landing',
        documentName: 'Tile',
        x: 500,
        y: 500,
        document: { id: 'tile-landing', documentName: 'Tile', name: 'Target Pad', x: 500, y: 500, width: 100, height: 100 }
    };

    const result = await playEffectAsTrap(mockBeam, originTile, landingTile, []);

    assert.ok(result);
    assert.equal(result.fired, true);
    assert.ok(capturedSource);
    assert.equal(capturedSource.name, 'Turret');
    assert.ok(capturedTarget, 'Must create target proxy for landing placeable when no tokens are present');
    assert.equal(capturedTarget.name, 'Target Pad');
    assert.deepEqual(capturedTarget.center, { x: 550, y: 550 });
});

test('setupTrap: generates script invoking adapter.executeTrapEffect for spell effects in region mode', async () => {
    globalThis.game.user = { isGM: true };
    globalThis.game.release = { generation: 14 };
    const { FoundryV14Adapter } = await import('../../src/adapters/foundry/foundry-v14-adapter.js');
    adapter.foundry = new FoundryV14Adapter(adapter);

    let createdBehaviorData = null;
    const triggerRegionDoc = {
        id: 'reg-trig-fireball',
        documentName: 'Region',
        behaviors: [],
        update: async () => triggerRegionDoc,
        createEmbeddedDocuments: async (_type, [data]) => {
            createdBehaviorData = data;
            return [{ id: 'beh-fireball', ...data }];
        }
    };

    const originDoc = {
        id: 'reg-origin-spout',
        documentName: 'Region',
        origin: { x: 100, y: 100 },
        document: { id: 'reg-origin-spout' }
    };

    const targetDoc = {
        id: 'reg-target-room',
        documentName: 'Region',
        origin: { x: 500, y: 500 },
        document: { id: 'reg-target-room' }
    };

    globalThis.canvas.regions = {
        controlled: [{ document: triggerRegionDoc, id: 'reg-trig-fireball' }],
        get: (id) => {
            if (id === 'reg-origin-spout') return { document: originDoc, id };
            if (id === 'reg-target-room') return { document: targetDoc, id };
            if (id === 'reg-trig-fireball') return { document: triggerRegionDoc, id };
            return null;
        }
    };
    globalThis.canvas.tiles = { controlled: [], get: () => null };

    let step = 0;
    adapter.buttonDialog = async () => {
        step++;
        if (step === 2) {
            globalThis.canvas.regions.controlled = [{ document: originDoc, id: 'reg-origin-spout' }];
        } else if (step === 3) {
            globalThis.canvas.regions.controlled = [{ document: targetDoc, id: 'reg-target-room' }];
        }
        return 'continue';
    };

    const setupResult = await setupTrap('eskie.effect.fireball', { mode: 'region' });
    assert.ok(setupResult);
    assert.equal(setupResult.triggerRegions.length, 1);
    assert.equal(setupResult.originElements.length, 1);
    assert.equal(setupResult.targetElements.length, 1);

    assert.ok(createdBehaviorData);
    assert.ok(
        createdBehaviorData.system.source.includes("adapter.executeTrapEffect('eskie.effect.fireball', placeable, targetPlaceable, targets,"),
        'Generated script for spell trap must invoke adapter.executeTrapEffect'
    );

    // Execute generated script to verify execution through adapter.executeTrapEffect
    let trapExecuted = false;
    let passedOrigin = null;
    let passedTarget = null;

    globalThis.eskie = {
        effect: {
            fireball: {
                default_config: { id: 'fireball', radius: 20 },
                play: async (token, config) => {
                    trapExecuted = true;
                    passedOrigin = token;
                    passedTarget = config.template;
                    return { ok: true };
                }
            }
        }
    };

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const scriptFn = new AsyncFunction('event', createdBehaviorData.system.source);
    await scriptFn({
        region: triggerRegionDoc,
        data: { token: { id: 'hero-1', object: { id: 'hero-1', name: 'Hero' } } }
    });

    assert.equal(trapExecuted, true, 'Script must trigger execution through executeTrapEffect');
    assert.equal(passedOrigin.id, 'reg-origin-spout');
    assert.equal(passedTarget.id, 'reg-target-room');

    delete globalThis.eskie;
});

test('executeTrapEffect: delegates to trap module when animation is a TrapModule', async () => {
    let capturedTile = null;
    let capturedTargets = null;
    let capturedConfig = null;

    const mockTrap = {
        setup: async () => {},
        play: async (tile, targets, config) => {
            capturedTile = tile;
            capturedTargets = targets;
            capturedConfig = config;
            return { trapFired: true };
        }
    };

    const originTile = { id: 'tile-spike-origin', documentName: 'Tile', x: 0, y: 0 };
    const targets = [{ id: 'victim-1' }];
    const targetLoc = { x: 50, y: 50 };

    const result = await executeTrapEffect(mockTrap, originTile, null, targets, { targetLocation: targetLoc, damage: 10 });

    assert.ok(result.trapFired);
    assert.equal(capturedTile, originTile);
    assert.deepEqual(capturedTargets, targets);
    assert.deepEqual(capturedConfig.targetLocation, targetLoc);
    assert.equal(capturedConfig.damage, 10);
});

test('executeTrapEffect: respects explicit config.type override', async () => {
    let templateCalled = false;
    const mockMulti = {
        play: async (token, config) => {
            templateCalled = true;
            return { token, config };
        }
    };

    const originTile = {
        id: 'tile-multi',
        documentName: 'Tile',
        x: 0,
        y: 0,
        document: { id: 'tile-multi', x: 0, y: 0, width: 100, height: 100 }
    };
    await executeTrapEffect(mockMulti, originTile, null, [], { type: 'template', radius: 15 });
    assert.equal(templateCalled, true, 'Explicit type="template" must dispatch as template effect');
});

test('createCasterProxy: preserves rotation when target location is identical to origin center', () => {
    const tile = {
        id: 'tile-center-test',
        x: 100,
        y: 100,
        w: 100,
        h: 100,
        rotation: 45,
        document: {
            id: 'tile-center-test',
            name: 'Pillar',
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            rotation: 45
        }
    };

    const tileCenter = adapter.getCenter(tile);
    const proxy = createCasterProxy(tile, tileCenter);
    assert.equal(proxy.rotation, 45, 'Must preserve original rotation when distance to target is 0');
});

test('matt.trap.setup: configures adapter.executeTrapEffect for spell effects', async () => {
    globalThis.game.user = { isGM: true, id: 'gm-user-1' };
    globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });

    const editedTiles = [];
    const triggerTile = {
        id: 'matt-trig-spell',
        documentName: 'Tile',
        getFlag: () => [],
        update: async (data) => {
            editedTiles.push({ tileId: 'matt-trig-spell', data });
            return triggerTile;
        }
    };
    const originTile = {
        id: 'matt-origin-spell',
        documentName: 'Tile',
        getFlag: () => [],
        update: async (data) => {
            editedTiles.push({ tileId: 'matt-origin-spell', data });
            return originTile;
        }
    };
    const targetTile = {
        id: 'matt-target-spell',
        documentName: 'Tile',
        getFlag: () => [],
        update: async (data) => {
            editedTiles.push({ tileId: 'matt-target-spell', data });
            return targetTile;
        }
    };

    globalThis.canvas.tiles = {
        controlled: [{ document: triggerTile }],
        get: (id) => {
            if (id === 'matt-trig-spell') return { document: triggerTile, id };
            if (id === 'matt-origin-spell') return { document: originTile, id };
            if (id === 'matt-target-spell') return { document: targetTile, id };
            return null;
        }
    };

    let step = 0;
    adapter.buttonDialog = async () => {
        step++;
        if (step === 2) {
            // Step 2: select origin
            globalThis.canvas.tiles.controlled = [{ document: originTile }];
        } else if (step === 3) {
            // Step 3: select target
            globalThis.canvas.tiles.controlled = [{ document: targetTile }];
        }
        return 'continue';
    };

    const { matt } = await import('../../src/animation/utils/matt-tiles.js');
    await matt.trap.setup('eskie.effect.lightningBolt', { tileCount: 3 });

    assert.equal(editedTiles.length, 2, 'Must configure trigger and origin tiles');
    const originEdit = editedTiles.find(e => e.tileId === 'matt-origin-spell');
    assert.ok(originEdit);
    const actionCode = originEdit.data['flags.monks-active-tiles.actions'][0].data.code;
    assert.ok(
        actionCode.includes("await adapter.executeTrapEffect(animation, tilePlaceable, targetTile, targets,"),
        'MATT action code must call adapter.executeTrapEffect for non-eskie-traps'
    );
});

test('traps.setup: direct string invocation or config.animation routes to setupTrap', async () => {
    const { traps } = await import('../../src/animation/traps/index.js');

    assert.equal(traps.setupTrap, undefined, 'setupTrap should not be exported on public traps namespace');

    // Test direct string animation call
    let calledAnimation = null;
    let calledConfig = null;
    const { matt } = await import('../../src/animation/utils/matt-tiles.js');
    const originalMattSetup = matt.trap.setup;
    matt.trap.setup = async (anim, cfg) => {
        calledAnimation = anim;
        calledConfig = cfg;
        return { success: true };
    };

    globalThis.game.release = { generation: 12 };
    globalThis.game.user = { isGM: true };

    await traps.setup('eskie.effect.fireball', { customOption: true });
    assert.equal(calledAnimation, 'eskie.effect.fireball');
    assert.equal(calledConfig.customOption, true);

    // Test config with animation property
    calledAnimation = null;
    calledConfig = null;
    await traps.setup({ animation: 'eskie.effect.lightningBolt', speed: 500 });
    assert.equal(calledAnimation, 'eskie.effect.lightningBolt');
    assert.equal(calledConfig.speed, 500);

    matt.trap.setup = originalMattSetup;
});

test('traps.setup: interactive dialog includes Spell / Animation Effect option', async () => {
    const { traps } = await import('../../src/animation/traps/index.js');

    let passedButtons = null;
    adapter.buttonDialog = async (data) => {
        passedButtons = data.buttons;
        return 'customEffect';
    };

    const dialogCls = adapter.foundry.DialogV2 ?? globalThis.foundry?.applications?.api?.DialogV2;
    const originalPrompt = dialogCls.prompt;
    let capturedPromptOptions = null;
    dialogCls.prompt = async (options) => {
        capturedPromptOptions = options;
        return 'disintegrate';
    };

    let calledAnimation = null;
    const { matt } = await import('../../src/animation/utils/matt-tiles.js');
    const originalMattSetup = matt.trap.setup;
    matt.trap.setup = async (anim) => {
        calledAnimation = anim;
        return { success: true };
    };

    globalThis.game.release = { generation: 12 };
    globalThis.game.user = { isGM: true };

    await traps.setup();

    assert.ok(passedButtons);
    const customEffectBtn = passedButtons.find(b => b.value === 'customEffect');
    assert.ok(customEffectBtn, 'Must include customEffect option in setup dialog');
    assert.equal(customEffectBtn.label, 'Spell / Animation Effect');
    assert.equal(calledAnimation, 'eskie.effect.disintegrate', 'Must resolve and execute custom effect');
    assert.ok(capturedPromptOptions, 'Must have opened prompt dialog');
    assert.ok(
        capturedPromptOptions.content.includes('Not all effects have been tested as traps') ||
        capturedPromptOptions.content.includes('not all effects have been tested as traps'),
        'Prompt content must include disclaimer that not all effects have been tested as traps'
    );

    dialogCls.prompt = originalPrompt;
    matt.trap.setup = originalMattSetup;
});

test('traps.setup: normalizes shorthand and prefix variations', async () => {
    const { traps } = await import('../../src/animation/traps/index.js');

    let calledAnimation = null;
    const { matt } = await import('../../src/animation/utils/matt-tiles.js');
    const originalMattSetup = matt.trap.setup;
    matt.trap.setup = async (anim) => {
        calledAnimation = anim;
        return { success: true };
    };

    globalThis.game.release = { generation: 12 };
    globalThis.game.user = { isGM: true };

    // Shorthand "fireball" -> "eskie.effect.fireball"
    await traps.setup('fireball');
    assert.equal(calledAnimation, 'eskie.effect.fireball');

    // Prefix "effect.lightningBolt" -> "eskie.effect.lightningBolt"
    await traps.setup('effect.lightningBolt');
    assert.equal(calledAnimation, 'eskie.effect.lightningBolt');

    // Prefix "traps.fire" -> "eskie.traps.fire"
    await traps.setup('traps.fire');
    assert.equal(calledAnimation, 'eskie.traps.fire');

    // Full path "eskie.effect.fireball" -> "eskie.effect.fireball"
    await traps.setup('eskie.effect.fireball');
    assert.equal(calledAnimation, 'eskie.effect.fireball');

    matt.trap.setup = originalMattSetup;
});

test('fireball: passes string bg.src to Sequence.file rather than raw background object', async () => {
    const { fireball } = await import('../../src/animation/effects/template/fireball.js');

    const fileCalls = [];
    const originalSequence = globalThis.Sequence;
    globalThis.Sequence = class MockSequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'play') return async () => proxy;
                    if (prop === 'file') {
                        return (filePath) => {
                            fileCalls.push(filePath);
                            return proxy;
                        };
                    }
                    if (prop === 'then') return undefined;
                    return (..._args) => proxy;
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    };

    const mockToken = {
        name: 'Caster Token',
        document: {
            texture: { src: 'token.png' }
        }
    };

    const mockTemplate = {
        x: 200,
        y: 200,
        document: { x: 200, y: 200 }
    };

    globalThis.game.modules.set('psfx-patreon', { id: 'psfx-patreon', active: true });
    globalThis.game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true });
    globalThis.game.modules.set('eskie-effects', { id: 'eskie-effects', active: true });
    globalThis.game.modules.set('blfx', { id: 'blfx', active: true });

    // Ensure scene background returns object { src: 'background.png', offsetX: 0, offsetY: 0 }
    globalThis.canvas.scene = {
        background: { src: 'background.png', offsetX: 10, offsetY: 20 },
        width: 2000,
        height: 2000
    };

    await fireball.create(mockToken, {
        template: mockTemplate,
        tintMap: true,
        sound: {
            beam: { enable: false },
            cast: { enable: false },
            explosion: { enable: false }
        }
    });

    assert.ok(fileCalls.length > 0, 'Sequence must register effect files');
    for (const f of fileCalls) {
        assert.equal(typeof f, 'string', `Every file argument must be a string, got ${typeof f}: ${JSON.stringify(f)}`);
    }
    assert.ok(fileCalls.includes('background.png'), 'Must include scene background src as a string');

    globalThis.Sequence = originalSequence;
});

test('adapter.createTargetProxy: ensures at minimum the scale of a 1x1 token', async () => {
    const { adapter } = await import('../../src/adapters/index.js');

    // 1. Raw coordinate { x: 500, y: 500 }
    const coordProxy = adapter.createTargetProxy({ x: 500, y: 500 });
    assert.equal(coordProxy.document.width, 1, 'Coordinate target must default to minimum 1 unit width');
    assert.equal(coordProxy.document.height, 1, 'Coordinate target must default to minimum 1 unit height');
    assert.ok(coordProxy.w >= 100, 'Coordinate target pixel width must be at least 1 grid unit');
    assert.equal(coordProxy.center.x, 500);
    assert.equal(coordProxy.center.y, 500);

    // 2. Tiny token (0.5 x 0.5)
    const tinyToken = {
        name: 'Tiny Imp',
        w: 50,
        h: 50,
        center: { x: 200, y: 200 },
        document: {
            width: 0.5,
            height: 0.5,
            texture: { scaleX: 1, scaleY: 1 }
        },
        actor: {}
    };
    const tinyProxy = adapter.createTargetProxy(tinyToken);
    assert.equal(tinyProxy.document.width, 1, 'Tiny token must be clamped to minimum 1 unit width');
    assert.equal(tinyProxy.document.height, 1, 'Tiny token must be clamped to minimum 1 unit height');
    assert.ok(tinyProxy.w >= 100, 'Tiny token pixel width must be at least 1 grid unit');

    // 3. Large token (2 x 2)
    const largeToken = {
        name: 'Large Ogre',
        w: 200,
        h: 200,
        center: { x: 300, y: 300 },
        document: {
            width: 2,
            height: 2,
            texture: { scaleX: 1, scaleY: 1 }
        },
        actor: {}
    };
    const largeProxy = adapter.createTargetProxy(largeToken);
    assert.equal(largeProxy.document.width, 2, 'Large token scale must be preserved');
    assert.equal(largeProxy.document.height, 2, 'Large token scale must be preserved');
    assert.ok(largeProxy.w >= 200, 'Large token pixel width must reflect 2 grid units');

    // 4. Trap Tile (300px x 300px on 100px grid = 3x3)
    const trapTile = {
        w: 300,
        h: 300,
        center: { x: 400, y: 400 },
        document: {
            documentName: 'Tile',
            width: 300,
            height: 300,
        }
    };
    const tileProxy = adapter.createTargetProxy(trapTile);
    assert.equal(tileProxy.document.width, 3, 'Trap tile scale must be computed from tile dimensions');
    assert.ok(tileProxy.w >= 300, 'Trap tile pixel width must match tile dimensions');
});

test('fireball: ensures explosion target has at minimum 1x1 token scale and cleans up screen darkness', async () => {
    const { fireball } = await import('../../src/animation/effects/template/fireball.js');

    const locations = [];
    const durations = [];
    let endedEffects = [];

    const originalEndEffects = globalThis.Sequencer.EffectManager.endEffects;
    globalThis.Sequencer.EffectManager.endEffects = (filter) => {
        endedEffects.push(filter);
    };

    const originalSequence = globalThis.Sequence;
    globalThis.Sequence = class MockSequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'play') return async () => proxy;
                    if (prop === 'atLocation') {
                        return (loc) => {
                            locations.push(loc);
                            return proxy;
                        };
                    }
                    if (prop === 'duration') {
                        return (ms) => {
                            durations.push(ms);
                            return proxy;
                        };
                    }
                    if (prop === 'thenDo') {
                        return (fn) => {
                            fn();
                            return proxy;
                        };
                    }
                    if (prop === 'then') return undefined;
                    return (..._args) => proxy;
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    };

    const mockToken = {
        name: 'Trap Origin',
        document: {
            texture: { src: 'token.png' }
        }
    };

    // Target is a 0.5x0.5 token in the trap
    const mockTinyTarget = {
        name: 'Tiny Rat',
        w: 50,
        h: 50,
        center: { x: 300, y: 300 },
        document: {
            width: 0.5,
            height: 0.5,
            texture: { src: 'rat.png' }
        },
        actor: {}
    };

    const seq = await fireball.create(mockToken, {
        template: mockTinyTarget,
        target: mockTinyTarget,
        tintMap: true,
        sound: {
            beam: { enable: false },
            cast: { enable: false },
            explosion: { enable: false }
        }
    });

    assert.ok(seq, 'Sequence should be created');

    // 1. Target scale check: all target locations with documents must have at least 1 unit width
    const targetLocationsWithDoc = locations.filter(loc => loc?.document?.width !== undefined);
    assert.ok(targetLocationsWithDoc.length > 0, 'Must have target locations with document');
    for (const loc of targetLocationsWithDoc) {
        assert.ok(loc.document.width >= 1, `Target location width must be >= 1, got: ${loc.document.width}`);
        assert.ok(loc.w >= 100, `Target location pixel width must be >= 100, got: ${loc.w}`);
    }

    // 2. Screen darkness check: screen tint effect must specify a finite duration (not infinite persist)
    assert.ok(durations.includes(5000), 'Screen tint must specify a finite duration (e.g. 5000ms)');

    // 3. Screen darkness cleanup in thenDo
    const endedNames = endedEffects.map(e => e.name);
    assert.ok(endedNames.some(n => n.includes('Casting')), 'Must call endEffects on Casting effect names');

    // 4. fireball.stop cleanup check
    endedEffects = [];
    fireball.stop(mockToken);
    assert.ok(endedEffects.some(e => e.name.includes('Casting')), 'stop() must clean up Casting effects');

    globalThis.Sequence = originalSequence;
    globalThis.Sequencer.EffectManager.endEffects = originalEndEffects;
});

test('lightningBolt as V14 Region trap and Tile trap receive identical Sequencer-safe cachedLocation proxies', async () => {
    const { FoundryV14Adapter } = await import('../../src/adapters/foundry/foundry-v14-adapter.js');
    const { lightningBolt } = await import('../../src/animation/effects/template/lightning-bolt.js');

    const originalFoundry = adapter.foundry;
    const originalSequence = globalThis.Sequence;
    const originalRelease = globalThis.game.release;

    adapter.foundry = new FoundryV14Adapter(adapter);
    globalThis.game.release = { generation: 14 };
    globalThis.game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true });
    globalThis.game.modules.set('eskie-effects', { id: 'eskie-effects', active: true });
    globalThis.game.modules.set('psfx-patreon', { id: 'psfx-patreon', active: true });

    const effects = [];
    globalThis.Sequence = class MockSequence {
        constructor() {
            let currentEffect = null;
            const handler = {
                get(_t, prop) {
                    if (prop === 'play') return async () => proxy;
                    if (prop === 'then') return undefined;
                    if (prop === 'effect') {
                        return () => {
                            currentEffect = {
                                files: [],
                                atLocations: [],
                                stretchTos: [],
                                rotateTowards: [],
                                scaleToObjects: [],
                                sizes: [],
                                masks: []
                            };
                            effects.push(currentEffect);
                            return proxy;
                        };
                    }
                    if (prop === 'file') {
                        return (f) => { currentEffect?.files.push(f); return proxy; };
                    }
                    if (prop === 'atLocation') {
                        return (loc) => { currentEffect?.atLocations.push(loc); return proxy; };
                    }
                    if (prop === 'stretchTo') {
                        return (loc, opts) => { currentEffect?.stretchTos.push({ loc, opts }); return proxy; };
                    }
                    if (prop === 'rotateTowards') {
                        return (loc) => { currentEffect?.rotateTowards.push(loc); return proxy; };
                    }
                    if (prop === 'scaleToObject') {
                        return (scale, opts) => { currentEffect?.scaleToObjects.push({ scale, opts }); return proxy; };
                    }
                    if (prop === 'size') {
                        return (val, opts) => { currentEffect?.sizes.push({ val, opts }); return proxy; };
                    }
                    if (prop === 'mask') {
                        return (...args) => { currentEffect?.masks.push(args); return proxy; };
                    }
                    return (..._args) => proxy;
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    };

    try {
        // Non-square Foundry V14 Rectangle Region placeables: PIXI container at (0, 0), shape x/y is top-left corner
        const originRegion = {
            id: 'reg-bolt-origin',
            documentName: 'Region',
            x: 0,
            y: 0,
            bounds: { x: 200, y: 300, width: 300, height: 100 },
            center: { x: 350, y: 350 },
            document: {
                id: 'reg-bolt-origin',
                uuid: 'Scene.scene1.Region.reg-bolt-origin',
                name: 'Lightning Nozzle',
                documentName: 'Region',
                elevation: { bottom: 10, top: 20 },
                shapes: [{ type: 'rectangle', x: 200, y: 300, width: 300, height: 100, rotation: 0 }]
            }
        };

        const targetRegion = {
            id: 'reg-bolt-target',
            documentName: 'Region',
            x: 0,
            y: 0,
            bounds: { x: 800, y: 500, width: 200, height: 200 },
            center: { x: 900, y: 600 },
            document: {
                id: 'reg-bolt-target',
                uuid: 'Scene.scene1.Region.reg-bolt-target',
                name: 'Lightning Target',
                documentName: 'Region',
                shapes: [{ type: 'rectangle', x: 800, y: 500, width: 200, height: 200, rotation: 0 }]
            }
        };

        await executeTrapEffect(lightningBolt, originRegion, targetRegion, [], {
            sound: { primary: { enable: false }, secondary: { enable: false } }
        });

        // 1. Main stretched lightning bolt originates at center of originRegion and stretches to center of targetRegion
        const boltEffect = effects.find(e => e.stretchTos.length > 0);
        assert.ok(boltEffect, 'Must have a stretched lightning bolt beam effect');
        assert.deepEqual(boltEffect.atLocations[0], { x: 350, y: 350 });
        assert.deepEqual(boltEffect.stretchTos[0].loc, { x: 900, y: 600 });

        // 2. Origin effects receive a Sequencer-safe cachedLocation synthetic CasterProxy (no live Region UUID / .object leak, uniform 1x1 dimensions)
        const staticEffect = effects.find(e => e.stretchTos.length === 0 && e.rotateTowards.length === 0);
        assert.ok(staticEffect, 'Must have static electricity buildup effect');
        assert.equal(effects.length, 5, 'lightningBolt must emit all 5 sequence effects');
        const regionProxy = staticEffect.atLocations[0];
        assert.equal(regionProxy.isTrapCasterProxy, true);
        assert.equal(regionProxy.isRegionOrigin, true);
        assert.equal(regionProxy.cachedLocation, true, 'CasterProxy must set cachedLocation: true for Sequencer');
        assert.equal(regionProxy.object, undefined, 'CasterProxy must not expose .object so Sequencer cannot unwrap live Region');
        assert.equal(regionProxy.document.uuid, 'TrapOrigin.reg-bolt-origin', 'CasterProxy must use synthetic non-Foundry UUID so Sequencer skips live Region resolution & polygon masking');
        assert.deepEqual(regionProxy.center, { x: 350, y: 350 });
        assert.equal(regionProxy.x, 350);
        assert.equal(regionProxy.y, 350);
        assert.equal(regionProxy.w, 100, 'Non-square 300x100 Region CasterProxy must normalize to 1x1 uniform pixel width');
        assert.equal(regionProxy.h, 100, 'Non-square 300x100 Region CasterProxy must normalize to 1x1 uniform pixel height');
        assert.equal(regionProxy.document.width, 1);
        assert.equal(regionProxy.document.height, 1);
        assert.equal(regionProxy.elevation, 10);
        assert.equal(regionProxy.document.elevation, 10);

        // 3. Remaining origin discharge effects (02/03/04) share the same centered proxy and rotate towards target center
        const dischargeEffects = effects.filter(e => e.rotateTowards.length > 0);
        assert.equal(dischargeEffects.length, 3);
        for (const de of dischargeEffects) {
            assert.equal(de.atLocations[0], regionProxy);
            assert.deepEqual(de.rotateTowards[0], { x: 900, y: 600 });
        }

        // 4. Polygon -> Rectangle RegionDocuments (without precomputed .center or .bounds)
        effects.length = 0;
        const polyOriginDoc = {
            id: 'reg-poly-origin',
            uuid: 'Scene.scene1.Region.reg-poly-origin',
            documentName: 'Region',
            elevation: { bottom: -Infinity, top: Infinity },
            shapes: [{ type: 'polygon', points: [100, 100, 300, 100, 300, 300, 100, 300] }]
        };
        const rectTargetDoc = {
            id: 'reg-rect-target',
            uuid: 'Scene.scene1.Region.reg-rect-target',
            documentName: 'Region',
            shapes: [{ type: 'rectangle', x: 1000, y: 400, width: 200, height: 100, rotation: 0 }]
        };

        await executeTrapEffect(lightningBolt, polyOriginDoc, rectTargetDoc, [], {
            sound: { primary: { enable: false }, secondary: { enable: false } }
        });

        const polyBoltEffect = effects.find(e => e.stretchTos.length > 0);
        assert.deepEqual(polyBoltEffect.atLocations[0], { x: 200, y: 200 });
        assert.deepEqual(polyBoltEffect.stretchTos[0].loc, { x: 1100, y: 450 });
        const polyStaticEffect = effects.find(e => e.stretchTos.length === 0 && e.rotateTowards.length === 0);
        assert.equal(polyStaticEffect.atLocations[0].cachedLocation, true);
        assert.equal(polyStaticEffect.atLocations[0].document.uuid, 'TrapOrigin.reg-poly-origin');
        assert.equal(polyStaticEffect.atLocations[0].w, 100);
        assert.equal(polyStaticEffect.atLocations[0].h, 100);
        assert.equal(polyStaticEffect.atLocations[0].elevation, 0);

        // 5. Tile trap receives the exact same synthetic cachedLocation contract (identical animation parity with Regions)
        effects.length = 0;
        const originTile = {
            id: 'tile-bolt-origin',
            documentName: 'Tile',
            x: 250,
            y: 350,
            w: 300,
            h: 100,
            document: {
                id: 'tile-bolt-origin',
                uuid: 'Scene.scene1.Tile.tile-bolt-origin',
                name: 'Tile Nozzle',
                documentName: 'Tile',
                x: 250,
                y: 350,
                width: 300,
                height: 100,
                anchor: { x: 0.5, y: 0.5 },
                texture: { src: 'tiles/nozzle.png' }
            }
        };
        const targetTile = {
            id: 'tile-bolt-target',
            documentName: 'Tile',
            x: 850,
            y: 350,
            w: 100,
            h: 100,
            document: {
                id: 'tile-bolt-target',
                uuid: 'Scene.scene1.Tile.tile-bolt-target',
                name: 'Tile Target',
                documentName: 'Tile',
                x: 850,
                y: 350,
                width: 100,
                height: 100,
                anchor: { x: 0.5, y: 0.5 },
                texture: { src: 'tiles/target.png' }
            }
        };

        await executeTrapEffect(lightningBolt, originTile, targetTile, [], {
            sound: { primary: { enable: false }, secondary: { enable: false } }
        });

        const tileStaticEffect = effects.find(e => e.stretchTos.length === 0 && e.rotateTowards.length === 0);
        const tileProxy = tileStaticEffect.atLocations[0];
        assert.equal(tileProxy.isTrapCasterProxy, true);
        assert.equal(tileProxy.isRegionOrigin, false);
        assert.equal(tileProxy.cachedLocation, true);
        assert.equal(tileProxy.object, undefined);
        assert.equal(tileProxy.document.uuid, 'TrapOrigin.tile-bolt-origin');
        assert.equal(tileProxy.w, 100, 'Non-square Tile CasterProxy also normalizes to 1x1 uniform width');
        assert.equal(tileProxy.h, 100);

        // 6. Real Token caster still passes through unchanged with live Token UUID & mesh masking
        effects.length = 0;
        const wizardToken = {
            id: 'tok-wizard',
            name: 'Wizard',
            center: { x: 150, y: 150 },
            document: { id: 'tok-wizard', name: 'Wizard', width: 1, height: 1, elevation: 0 }
        };
        await lightningBolt.create(wizardToken, {
            template: targetTile,
            sound: { primary: { enable: false }, secondary: { enable: false } }
        });

        const tokenStaticEffect = effects.find(e => e.stretchTos.length === 0 && e.rotateTowards.length === 0);
        assert.equal(tokenStaticEffect.atLocations[0], wizardToken);
        assert.equal(tokenStaticEffect.scaleToObjects[0].scale, 1.5);
        assert.equal(tokenStaticEffect.masks.length, 1);
    } finally {
        adapter.foundry = originalFoundry;
        globalThis.Sequence = originalSequence;
        globalThis.game.release = originalRelease;
    }
});

test('Layer 1: CasterProxy and TargetProxy synthetic contracts and adapter geometry helpers', async () => {
    const { FoundryV14Adapter } = await import('../../src/adapters/foundry/foundry-v14-adapter.js');
    const originalFoundry = adapter.foundry;
    adapter.foundry = new FoundryV14Adapter(adapter);

    try {
        let mutated = false;
        const wideRegion = {
            id: 'reg-hallway',
            documentName: 'Region',
            x: 0,
            y: 0,
            bounds: { x: 100, y: 200, width: 400, height: 100 },
            center: { x: 300, y: 250 },
            document: {
                id: 'reg-hallway',
                uuid: 'Scene.s1.Region.reg-hallway',
                name: 'Hallway Trap',
                documentName: 'Region',
                elevation: { bottom: 15, top: 25 },
                shapes: [{ type: 'rectangle', x: 100, y: 200, width: 400, height: 100 }],
                update: async () => { mutated = true; }
            }
        };

        const casterProxy = adapter.createCasterProxy(wideRegion);
        assert.equal(casterProxy.cachedLocation, true);
        assert.equal(casterProxy.object, undefined);
        assert.equal(casterProxy.sourcePlaceable, undefined, 'CasterProxy must not retain circular live placeable references');
        assert.equal(casterProxy.document.uuid, 'TrapOrigin.reg-hallway');
        assert.equal(casterProxy.w, 100);
        assert.equal(casterProxy.h, 100);
        assert.equal(casterProxy.width, 100);
        assert.equal(casterProxy.height, 100);
        assert.equal(casterProxy.elevation, 15);
        assert.equal(casterProxy.document.elevation, 15);

        // Regression test: live PIXI Tile/Region with circular `_events.pointerover.context` must not break JSON.stringify / foundry.utils.duplicate
        const circularTile = {
            id: 'tile-circ',
            documentName: 'Tile',
            x: 200,
            y: 300,
            w: 100,
            h: 100,
            document: { id: 'tile-circ', uuid: 'Scene.s1.Tile.tile-circ', documentName: 'Tile', x: 200, y: 300, width: 100, height: 100 }
        };
        circularTile._events = { pointerover: { context: circularTile } };
        const circularCasterProxy = adapter.createCasterProxy(circularTile);
        assert.doesNotThrow(() => JSON.stringify(circularCasterProxy), 'CasterProxy from circular PIXI Tile must serialize cleanly to JSON');

        const circularActor = { id: 'actor-circ' };
        circularActor.self = circularActor;
        const circularToken = {
            id: 'tok-circ',
            w: 50,
            h: 50,
            center: { x: 125, y: 125 },
            document: { id: 'tok-circ', width: 0.5, height: 0.5 },
            actor: circularActor
        };
        const circularTargetProxy = adapter.createTargetProxy(circularToken);
        assert.doesNotThrow(() => JSON.stringify(circularTargetProxy), 'TargetProxy from Token with circular actor must serialize cleanly to JSON');
        assert.doesNotThrow(() => JSON.stringify(adapter.createTargetProxy(circularTile)), 'TargetProxy from circular PIXI Tile must serialize cleanly to JSON');

        // Safe no-op update must not mutate underlying Region/Tile document
        await casterProxy.document.update({ x: 999, y: 999 });
        assert.equal(mutated, false, 'CasterProxy.document.update must be a safe no-op');

        // TargetProxy uses synthetic UUID, cachedLocation, normalized elevation, and uniform square dimensions for non-square Regions
        const targetProxy = adapter.createTargetProxy(wideRegion);
        assert.equal(targetProxy.cachedLocation, true);
        assert.equal(targetProxy.object, undefined);
        assert.equal(targetProxy.sourcePlaceable, undefined);
        assert.equal(targetProxy.document.uuid, 'TargetProxy.reg-hallway');
        assert.equal(targetProxy.document.width, 1, '400x100 non-square Region TargetProxy must use uniform min span (1x1)');
        assert.equal(targetProxy.document.height, 1);
        assert.equal(targetProxy.w, 100);
        assert.equal(targetProxy.h, 100);
        assert.equal(targetProxy.width, 100);
        assert.equal(targetProxy.height, 100);
        assert.equal(targetProxy.elevation, 15);
        await targetProxy.document.update({ x: 999 });
        assert.equal(mutated, false);

        // adapter.getBounds(proxy) returns exact centered pixel bounds instead of misreading grid units as pixels
        const bounds = adapter.getBounds(casterProxy);
        assert.deepEqual(bounds, {
            minX: 250,
            maxX: 350,
            minY: 200,
            maxY: 300,
            center: { x: 300, y: 250 },
            width: 100,
            height: 100,
            anchor: { x: 0.5, y: 0.5 }
        });

        // adapter.isAdjacent & getNearestSquareCenter derive top-left from center - w/2 for centered proxies
        // Adjacent token sits immediately east of casterProxy [250..350, 200..300] at [350..450, 200..300]
        const eastToken = {
            id: 'tok-east',
            x: 350,
            y: 200,
            w: 100,
            h: 100,
            center: { x: 400, y: 250 },
            document: { id: 'tok-east', x: 350, y: 200, width: 1, height: 1, elevation: 15 }
        };
        assert.equal(adapter.isAdjacent(casterProxy, eastToken), true, 'Adjacent token immediately east of centered CasterProxy must be detected as adjacent');

        const nearestSq = adapter.getNearestSquareCenter(eastToken, targetProxy);
        assert.deepEqual(nearestSq, { x: 300, y: 250 }, 'getNearestSquareCenter on centered TargetProxy must resolve center (300, 250), not shifted (+50, +50)');
    } finally {
        adapter.foundry = originalFoundry;
    }
});

test('Layer 2: registry-driven executeTrapEffect dispatch routes template, victim, origin, position, array, bound this, and namespace guards cleanly', async () => {
    const { silence } = await import('../../src/animation/effects/template/silence.js');
    const { spikeGrowth } = await import('../../src/animation/effects/template/spike-growth.js');
    const { tashasCausticBrew } = await import('../../src/animation/effects/template/tashas-caustic-brew.js');
    const { charmed } = await import('../../src/animation/effects/active-effect/charmed.js');
    const { twilightSanctuary } = await import('../../src/animation/effects/aura/twilight-sanctuary.js');

    // 1. Autorec registry resolves trigger categories for previously misclassified effects
    assert.equal(adapter.autorec.getTrigger('eskie.effect.silence'), 'template');
    assert.equal(adapter.autorec.getTrigger(undefined, silence.default_config), 'template');
    assert.equal(adapter.autorec.getTrigger('eskie.effect.spikeGrowth'), 'template');
    assert.equal(adapter.autorec.getTrigger('eskie.effect.tashasCausticBrew'), 'template');
    assert.equal(adapter.autorec.getTrigger('eskie.effect.charmed'), 'effect');
    assert.equal(adapter.autorec.getTrigger('eskie.effect.twilightSanctuary'), 'aura');

    // 2. resolveTrapDispatchMode classifies all categories accurately
    assert.equal(resolveTrapDispatchMode('eskie.effect.silence', silence), 'template');
    assert.equal(resolveTrapDispatchMode('', spikeGrowth), 'template');
    assert.equal(resolveTrapDispatchMode('eskie.effect.tashasCausticBrew', tashasCausticBrew), 'template');
    assert.equal(resolveTrapDispatchMode('eskie.effect.charmed', charmed), 'victim');
    assert.equal(resolveTrapDispatchMode('eskie.effect.twilightSanctuary', twilightSanctuary), 'origin');
    assert.equal(resolveTrapDispatchMode('eskie.effect.callLightning', { default_config: { radius: 7.5 }, play: () => {} }), 'caster-to-position');
    assert.equal(resolveTrapDispatchMode('eskie.effect.chainLightning', { play: (token, targetTokens) => {} }), 'caster-to-targets');
    assert.equal(resolveTrapDispatchMode('eskie.effect.sleep', { play: (targets) => {} }), 'targets-only');
    assert.equal(resolveTrapDispatchMode('eskie.effect.curseOfTheWerewolf', { play: (target) => {} }), 'victim');
    assert.equal(resolveTrapDispatchMode('eskie.effect.detect.magic', { default_config: { distance: 30 }, play: (token) => {} }), 'origin');

    const originTile = {
        id: 'tile-dispatch-origin',
        documentName: 'Tile',
        x: 100,
        y: 100,
        document: { id: 'tile-dispatch-origin', documentName: 'Tile', x: 100, y: 100, width: 100, height: 100 }
    };
    const landingTile = {
        id: 'tile-dispatch-target',
        documentName: 'Tile',
        x: 500,
        y: 500,
        document: { id: 'tile-dispatch-target', documentName: 'Tile', x: 500, y: 500, width: 100, height: 100 }
    };
    const victim1 = { id: 'tok-v1', name: 'Hero 1', center: { x: 550, y: 550 }, document: { id: 'tok-v1', width: 1, height: 1 } };
    const victim2 = { id: 'tok-v2', name: 'Hero 2', center: { x: 560, y: 560 }, document: { id: 'tok-v2', width: 1, height: 1 } };

    // 3. Bound `this` preservation (fixes tashasCausticBrew calling this.create)
    let boundThisMatched = false;
    const thisBoundEffect = {
        default_config: { id: 'BoundTemplate', template: undefined },
        create(token, cfg) {
            return { ok: true, token, cfg };
        },
        async play(token, cfg) {
            boundThisMatched = this === thisBoundEffect;
            return this.create(token, cfg);
        }
    };
    const boundRes = await executeTrapEffect(thisBoundEffect, originTile, landingTile, [victim1]);
    assert.equal(boundThisMatched, true, 'executeTrapEffect must preserve `this` binding when calling effectObj.play');
    assert.equal(boundRes.ok, true);

    // 4. Victim dispatch passes real victim Token as arg 1 and targetConfig as arg 2 (not casterProxy + victimToken!)
    const victimCalls = [];
    const mockCurse = {
        default_config: charmed.default_config, // registered as 'effect' in autorec
        play: async (target, cfg) => {
            victimCalls.push({ target, cfg });
            return target.id;
        }
    };
    await executeTrapEffect(mockCurse, originTile, landingTile, [victim1, victim2], { duration: 3000 });
    assert.equal(victimCalls.length, 2);
    assert.equal(victimCalls[0].target, victim1, 'Victim effect must receive victim1 Token, not CasterProxy');
    assert.equal(victimCalls[0].cfg.duration, 3000, 'Victim effect must receive config as 2nd arg, not victim Token');
    assert.equal(victimCalls[1].target, victim2);

    // 5. Origin dispatch fires once on CasterProxy even when 0 tokens are present
    const originCalls = [];
    const mockAura = {
        default_config: twilightSanctuary.default_config, // registered as 'aura' in autorec
        play: async (caster, cfg) => {
            originCalls.push({ caster, cfg });
            return 'played';
        }
    };
    await executeTrapEffect(mockAura, originTile, null, [], { radius: 30 });
    assert.equal(originCalls.length, 1);
    assert.equal(originCalls[0].caster.isTrapCasterProxy, true);
    assert.equal(originCalls[0].cfg.radius, 30);

    // 6. Array-accepting caster-to-targets receives [targetProxy] on 0 tokens (no `targets is not iterable` crash)
    let capturedArrayArgs = null;
    const mockChain = {
        play: async (caster, targetTokens, cfg) => {
            capturedArrayArgs = { caster, targetTokens, cfg };
            return 'chained';
        }
    };
    await executeTrapEffect(mockChain, originTile, landingTile, [], { maxJumps: 3 });
    assert.ok(Array.isArray(capturedArrayArgs.targetTokens), 'caster-to-targets must wrap 0-target TargetProxy in an array');
    assert.equal(capturedArrayArgs.targetTokens.length, 1);
    assert.equal(capturedArrayArgs.targetTokens[0].isTrapTargetProxy, true);
    assert.equal(capturedArrayArgs.targetTokens[0].cachedLocation, true);

    // 7. Non-callable container namespace returns null safely instead of throwing TypeError
    const containerNamespace = { cast: { play: async () => {} }, damage: { play: async () => {} } };
    const nsResult = await executeTrapEffect(containerNamespace, originTile, landingTile, [victim1]);
    assert.equal(nsResult, null, 'Non-callable container namespace must return null gracefully');
});

test('Layer 3: getTemplatePosition defaults primary to center on Tiles and V14 Rectangle/Polygon Regions when cfg.token is omitted', async () => {
    const { FoundryV14Adapter } = await import('../../src/adapters/foundry/foundry-v14-adapter.js');
    const v13 = new FoundryV13Adapter(adapter);
    const v14 = new FoundryV14Adapter(adapter);

    // V13 Tile without cfg.token -> primary must be Tile center (300, 400), not top-left (200, 300)
    const tile = {
        id: 'tile-aoe',
        documentName: 'Tile',
        x: 200,
        y: 300,
        document: { id: 'tile-aoe', documentName: 'Tile', x: 200, y: 300, width: 200, height: 200, texture: { src: 'a.png' } }
    };
    const [tilePrimary, , tileCenter] = v13.getTemplatePosition(tile, {});
    assert.deepEqual(tilePrimary, { x: 300, y: 400 }, 'Tile template without cfg.token must center primary');
    assert.deepEqual(tileCenter, { x: 300, y: 400 });

    // V14 Rectangle Region without cfg.token -> primary must be center (500, 400), not top-left (400, 300)
    const rectRegion = {
        id: 'reg-rect-aoe',
        documentName: 'Region',
        x: 0,
        y: 0,
        bounds: { x: 400, y: 300, width: 200, height: 200 },
        center: { x: 500, y: 400 },
        document: {
            id: 'reg-rect-aoe',
            documentName: 'Region',
            shapes: [{ type: 'rectangle', x: 400, y: 300, width: 200, height: 200, rotation: 0 }]
        }
    };
    const [rectPrimary, , rectCenter] = v14.getTemplatePosition(rectRegion, {});
    assert.deepEqual(rectPrimary, { x: 500, y: 400 }, 'V14 Rectangle Region without cfg.token must center primary');
    assert.deepEqual(rectCenter, { x: 500, y: 400 });

    // V14 Polygon Region placeable (container x=0, y=0) without cfg.token -> primary must be bounding center (600, 500), not (0, 0)
    const polyRegion = {
        id: 'reg-poly-aoe',
        documentName: 'Region',
        x: 0,
        y: 0,
        document: {
            id: 'reg-poly-aoe',
            documentName: 'Region',
            shapes: [{ type: 'polygon', points: [500, 400, 700, 400, 700, 600, 500, 600] }]
        }
    };
    const [polyPrimary, , polyCenter] = v14.getTemplatePosition(polyRegion, {});
    assert.deepEqual(polyPrimary, { x: 600, y: 500 }, 'V14 Polygon Region without cfg.token must center primary, never container (0, 0)');
    assert.deepEqual(polyCenter, { x: 600, y: 500 });
});



