import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { summon, tokensOfTheDeparted } from '../../src/animation/summon/index.js';
import { animation } from '../../src/animation/index.js';
import { adapter } from '../../src/adapters/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('summon namespace is exported correctly on animation object', () => {
    assert.ok(animation.summon, 'animation.summon must exist');
    assert.equal(animation.summon, summon);
    assert.ok(animation.summon.tokensOfTheDeparted, 'animation.summon.tokensOfTheDeparted must exist');
});

test('tokensOfTheDeparted has required API methods and valid default_config', () => {
    assert.equal(typeof tokensOfTheDeparted.create, 'function', 'tokensOfTheDeparted.create must be a function');
    assert.equal(typeof tokensOfTheDeparted.play, 'function', 'tokensOfTheDeparted.play must be a function');
    assert.equal(typeof tokensOfTheDeparted.stop, 'function', 'tokensOfTheDeparted.stop must be a function');
    assert.equal(tokensOfTheDeparted.summon, undefined, 'tokensOfTheDeparted.summon must not be exposed');

    const config = tokensOfTheDeparted.default_config;
    assert.ok(config, 'default_config must exist');
    assert.equal(config.id, 'tokensOfTheDeparted');
    assert.equal(config.tint, '#58feb0');
    assert.equal(config.changeLight, true);
    assert.ok(config.light, 'light config must exist');
    assert.equal(config.light.color, '#58feb0');
    assert.ok(config.sound, 'sound config must exist');
    assert.equal(typeof config.sound.enable, 'boolean', 'sound.enable must be boolean');
    assert.ok(config.crosshairParameters, 'crosshairParameters must exist');
    assert.equal(config.crosshairParameters.t, 'circle');
});

test('tokensOfTheDeparted.create with single token adjusts copysprite on that token without summoning', async () => {
    let capturedSpriteRotation = null;
    let attachedObject = null;
    const originalSequence = globalThis.Sequence;

    globalThis.Sequence = class MockSequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'spriteRotation') {
                        return (angle) => {
                            capturedSpriteRotation = angle;
                            return proxy;
                        };
                    }
                    if (prop === 'attachTo') {
                        return (obj) => {
                            attachedObject = obj;
                            return proxy;
                        };
                    }
                    if (prop === 'play') return async () => proxy;
                    if (prop === 'then') return undefined;
                    return (..._args) => proxy;
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    };

    try {
        const mockTargetToken = {
            id: 'target-token-1',
            name: 'Spirit Token',
            document: { rotation: 180, x: 200, y: 200 },
            center: { x: 250, y: 250 }
        };

        const seq = await tokensOfTheDeparted.create(mockTargetToken);
        assert.ok(seq, 'Sequence must be created for single token');
        assert.equal(capturedSpriteRotation, -180, 'spriteRotation must counteract token rotation (-180)');
        assert.equal(attachedObject, mockTargetToken, 'Effects must attach directly to provided token');
    } finally {
        globalThis.Sequence = originalSequence;
    }
});

test('tokensOfTheDeparted.create builds sequence with effects and animations', async () => {
    game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
    game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

    const mockCaster = {
        id: 'caster-1',
        name: 'Rogue',
        document: { rotation: 0, x: 100, y: 100 },
        center: { x: 150, y: 150 }
    };
    const mockSummon = {
        id: 'summon-1',
        name: 'Departed Spirit',
        document: { rotation: 0, x: 300, y: 300 },
        center: { x: 350, y: 350 }
    };

    const seq = await tokensOfTheDeparted.create(mockCaster, mockSummon);
    assert.ok(seq, 'Sequence must be returned');

    const playResult = await tokensOfTheDeparted.play(mockCaster, mockSummon);
    assert.ok(playResult, 'Play must return sequence play result');
});

test('tokensOfTheDeparted.create applies spriteRotation matching counter token rotation', async () => {
    let capturedSpriteRotation = null;
    const originalSequence = globalThis.Sequence;

    globalThis.Sequence = class MockSequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'spriteRotation') {
                        return (angle) => {
                            capturedSpriteRotation = angle;
                            return proxy;
                        };
                    }
                    if (prop === 'play') return async () => proxy;
                    if (prop === 'then') return undefined;
                    return (..._args) => proxy;
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    };

    try {
        const mockCaster = { id: 'c1', name: 'Rogue', document: { rotation: 0 } };
        const mockSummon = { id: 's1', name: 'Spirit', document: { rotation: 90 } };
        await tokensOfTheDeparted.create(mockCaster, mockSummon);
        assert.equal(capturedSpriteRotation, -90, 'spriteRotation must be -90 for a 90 degree rotated summon token');
    } finally {
        globalThis.Sequence = originalSequence;
    }
});


test('tokensOfTheDeparted.stop terminates persistent effects on summoned token', async () => {
    let endedEffectName = null;
    let endedObject = null;

    Sequencer.EffectManager.endEffects = (filter) => {
        endedEffectName = filter.name;
        endedObject = filter.object;
    };

    const mockSummon = {
        id: 'summon-1',
        name: 'Departed Spirit'
    };
    const mockCaster = {
        id: 'caster-1',
        name: 'Rogue'
    };

    await tokensOfTheDeparted.stop(mockCaster, mockSummon);
    assert.equal(endedEffectName, 'Departed Spirit Tokens of the Departed');
    assert.equal(endedObject, mockSummon);
});

test('tokensOfTheDeparted.create delegates to adapter.summons.pick when Actor is provided', async () => {
    let pickOptionsPassed = null;
    const mockToken = {
        id: 'summon-token',
        name: 'Departed Spirit',
        document: { rotation: 0, x: 200, y: 200 },
        center: { x: 250, y: 250 }
    };

    adapter.summons.pick = async (options) => {
        pickOptionsPassed = options;
        return mockToken;
    };

    const mockCaster = { id: 'caster-1', name: 'Rogue', document: { rotation: 0 }, center: { x: 100, y: 100 } };
    const mockActor = { id: 'actor-1', name: 'Spirit', uuid: 'Actor.spirit123', documentName: 'Actor' };
    const seq = await tokensOfTheDeparted.create(mockCaster, mockActor, { summonConfig: { drawPing: true, tint: '#58feb0' } });

    assert.ok(seq, 'Sequence must be returned');
    assert.equal(pickOptionsPassed.uuid, 'Actor.spirit123');
    assert.equal(pickOptionsPassed.drawPing, true);
    assert.ok(pickOptionsPassed.tokenData.light);
});

test('tokensOfTheDeparted.create and play fail cleanly when inputs are missing', async () => {
    assert.equal(await tokensOfTheDeparted.create(undefined), null, 'create must return null when token is undefined');
    assert.equal(await tokensOfTheDeparted.play(undefined, { id: 'tok' }), null, 'play must return null when token is undefined');
    assert.equal(await tokensOfTheDeparted.play({ id: 'tok' }, undefined), null, 'play must return null when summonTarget is undefined');
});

test('tokensOfTheDeparted.play summons a token when Actor is provided and plays animation', async () => {
    let pickOptionsPassed = null;
    const mockSpawnedToken = {
        id: 'spawned-token-1',
        name: 'Ghostly Companion',
        document: { rotation: 0, x: 200, y: 200 },
        center: { x: 250, y: 250 }
    };

    adapter.summons.pick = async (options) => {
        pickOptionsPassed = options;
        return mockSpawnedToken;
    };

    const mockCaster = { id: 'caster-1', name: 'Rogue', document: { rotation: 0 }, center: { x: 100, y: 100 } };
    const mockActor = { id: 'actor-ghost', name: 'Ghostly Companion', uuid: 'Actor.ghost123', documentName: 'Actor' };

    const playResult = await tokensOfTheDeparted.play(mockCaster, mockActor);
    assert.ok(playResult, 'Play must return sequence play result for Actor');
    assert.equal(pickOptionsPassed.uuid, 'Actor.ghost123');
});

test('tokensOfTheDeparted.play summons a token when Actor and config are provided', async () => {
    let pickOptionsPassed = null;
    const mockSpawnedToken = {
        id: 'spawned-token-2',
        name: 'Ghostly Companion 2',
        document: { rotation: 0, x: 200, y: 200 },
        center: { x: 250, y: 250 }
    };

    adapter.summons.pick = async (options) => {
        pickOptionsPassed = options;
        return mockSpawnedToken;
    };

    const mockCaster = { id: 'caster-1', name: 'Rogue', document: { rotation: 0 }, center: { x: 100, y: 100 } };
    const mockActor = { id: 'actor-ghost-2', name: 'Ghost 2', uuid: 'Actor.ghost456', documentName: 'Actor' };

    const playResult = await tokensOfTheDeparted.play(mockCaster, mockActor, {
        summonConfig: { drawPing: true }
    });
    assert.ok(playResult, 'Play must return sequence play result when config is provided');
    assert.equal(pickOptionsPassed.uuid, 'Actor.ghost456');
    assert.equal(pickOptionsPassed.drawPing, true);

    // Also verify play fails cleanly when summonTarget is omitted
    const playResult2 = await tokensOfTheDeparted.play(mockCaster, undefined);
    assert.equal(playResult2, null, 'Play must return null when summonTarget is omitted');
});

test('tokensOfTheDeparted.play uses existing Token directly without invoking summon spawn', async () => {
    let pickCalled = false;
    adapter.summons.pick = async () => {
        pickCalled = true;
        return null;
    };

    const mockCaster = { id: 'caster-1', name: 'Rogue', document: { rotation: 0 }, center: { x: 100, y: 100 } };
    const existingToken = {
        id: 'token-existing',
        name: 'Existing Spirit',
        document: { rotation: 0, x: 300, y: 300 },
        center: { x: 350, y: 350 }
    };

    const playResult = await tokensOfTheDeparted.play(mockCaster, existingToken);
    assert.ok(playResult, 'Play must return sequence play result for existing Token');
    assert.equal(pickCalled, false, 'spawn should not be called when Token is passed directly');
});

test('tokensOfTheDeparted.create places token directly when location is provided in summonConfig', async () => {
    let createdTokenData = null;
    const mockActor = {
        id: 'actor-1',
        name: 'Ghost',
        uuid: 'Actor.ghost1',
        documentName: 'Actor',
        getTokenDocument: async (data) => {
            createdTokenData = data;
            return { id: 'tok-doc-1', ...data, object: { id: 'tok-doc-1', name: 'Ghost', document: data, center: { x: data.x, y: data.y } } };
        }
    };

    game.actors.set('actor-1', mockActor);
    const mockSceneTokens = [];
    canvas.scene = {
        createEmbeddedDocuments: async (_type, docs) => {
            mockSceneTokens.push(...docs);
            return docs;
        }
    };

    const mockCaster = { id: 'caster-1', name: 'Rogue', document: { rotation: 0 }, center: { x: 100, y: 100 } };
    const seq = await tokensOfTheDeparted.create(mockCaster, mockActor, { summonConfig: { location: { x: 500, y: 600 } } });

    assert.ok(seq, 'Sequence must be returned for direct location placement');
    assert.equal(createdTokenData.x, 500);
    assert.equal(createdTokenData.y, 600);
});

test('tokensOfTheDeparted is registered in autorec', () => {
    const aaMenu = adapter.autorec.aa.menu;
    const ontokenEntries = aaMenu.ontoken;
    const entry = ontokenEntries.find(e => e.label === 'Tokens of the Departed');

    assert.ok(entry, 'tokensOfTheDeparted must be registered in AA menu');
    assert.equal(entry.metaData.version, '0.0.4');
    assert.ok(entry.macro.args.includes('eskie.summon.tokensOfTheDeparted'), 'Macro args must contain unquoted eskie.summon.tokensOfTheDeparted');
});

