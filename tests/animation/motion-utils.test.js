import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    isMotionPlaceable,
    resolveMotionTarget,
    endEffectsAndMotions,
    computeCenterDelta,
    motion
} from '../../src/animation/utils/motion.js';
import { utils } from '../../src/animation/utils/index.js';
import { adapter } from '../../src/adapters/index.js';

test('motion utility is exported via src/animation/utils/index.ts', () => {
    assert.equal(utils.motion, motion);
    assert.equal(typeof motion.isMotionPlaceable, 'function');
    assert.equal(typeof motion.resolveMotionTarget, 'function');
    assert.equal(typeof motion.endEffectsAndMotions, 'function');
    assert.equal(typeof motion.computeCenterDelta, 'function');
});

test('isMotionPlaceable accepts concrete Token, Tile, and Drawing placeables and rejects proxies, Regions, Actors, and points', () => {
    const tokenPlaceable = {
        id: 'tok-1',
        center: { x: 150, y: 150 },
        document: { id: 'tok-1', uuid: 'Scene.s1.Token.tok-1', documentName: 'Token' }
    };
    const tilePlaceable = {
        id: 'tile-1',
        center: { x: 200, y: 200 },
        document: { id: 'tile-1', uuid: 'Scene.s1.Tile.tile-1', documentName: 'Tile' }
    };
    const drawingPlaceable = {
        id: 'draw-1',
        shape: {},
        document: { id: 'draw-1', uuid: 'Scene.s1.Drawing.draw-1', documentName: 'Drawing' }
    };
    const meshOnlyPlaceable = {
        id: 'mesh-1',
        mesh: {},
        document: { id: 'mesh-1', uuid: 'Scene.s1.Token.mesh-1' }
    };

    assert.equal(isMotionPlaceable(tokenPlaceable), true);
    assert.equal(isMotionPlaceable(tilePlaceable), true);
    assert.equal(isMotionPlaceable(drawingPlaceable), true);
    assert.equal(isMotionPlaceable(meshOnlyPlaceable), true);

    // Reject synthetic trap proxies (CasterProxy / TargetProxy)
    const casterProxy = adapter.createCasterProxy(tilePlaceable, { x: 500, y: 500 });
    const targetProxy = adapter.createTargetProxy(tilePlaceable);
    assert.equal(isMotionPlaceable(casterProxy), false, 'CasterProxy must be rejected');
    assert.equal(isMotionPlaceable(targetProxy), false, 'TargetProxy must be rejected');

    // Reject Regions (by documentName, shapes, or isRegionOrigin)
    const regionPlaceable = {
        id: 'reg-1',
        shapes: [{ type: 'rectangle', x: 0, y: 0, width: 100, height: 100 }],
        document: { id: 'reg-1', uuid: 'Scene.s1.Region.reg-1', documentName: 'Region', shapes: [] }
    };
    const regionDocOnly = { id: 'reg-2', documentName: 'Region' };
    const regionFlagged = { id: 'reg-3', isRegionOrigin: true, mesh: {} };
    assert.equal(isMotionPlaceable(regionPlaceable), false, 'Region placeable must be rejected');
    assert.equal(isMotionPlaceable(regionDocOnly), false, 'Region document must be rejected');
    assert.equal(isMotionPlaceable(regionFlagged), false, 'Region-origin proxy must be rejected');

    // Reject Actors, MeasuredTemplates, plain coordinates, and primitives
    assert.equal(isMotionPlaceable({ id: 'act-1', documentName: 'Actor', items: [] }), false);
    assert.equal(isMotionPlaceable({ id: 'tmpl-1', documentName: 'MeasuredTemplate' }), false);
    assert.equal(isMotionPlaceable({ x: 100, y: 200 }), false);
    assert.equal(isMotionPlaceable(null), false);
    assert.equal(isMotionPlaceable(undefined), false);
    assert.equal(isMotionPlaceable('Scene.s1.Token.tok-1'), false);
    assert.equal(isMotionPlaceable(42), false);
});

test('resolveMotionTarget unwraps document.object to concrete placeable and returns null for non-motion targets', () => {
    const tokenPlaceable = {
        id: 'tok-1',
        document: { id: 'tok-1', uuid: 'Scene.s1.Token.tok-1', documentName: 'Token' }
    };
    const tokenDoc = {
        id: 'tok-1',
        uuid: 'Scene.s1.Token.tok-1',
        documentName: 'Token',
        object: tokenPlaceable
    };
    const regionDoc = {
        id: 'reg-1',
        documentName: 'Region',
        object: { id: 'reg-1', document: { documentName: 'Region' }, shapes: [] }
    };

    assert.equal(resolveMotionTarget(tokenPlaceable), tokenPlaceable);
    assert.equal(resolveMotionTarget(tokenDoc), tokenPlaceable);
    assert.equal(resolveMotionTarget(regionDoc), null);
    assert.equal(resolveMotionTarget({ isTrapCasterProxy: true, document: { documentName: 'Token' } }), null);
    assert.equal(resolveMotionTarget(null), null);
});

test('endEffectsAndMotions stops both Sequencer EffectManager and MotionManager for concrete placeables', async () => {
    const origEndEffects = Sequencer.EffectManager.endEffects;
    const origEndMotions = Sequencer.MotionManager.endMotions;
    const effectCalls = [];
    const motionCalls = [];

    Sequencer.EffectManager.endEffects = async (opts) => {
        effectCalls.push(opts);
    };
    Sequencer.MotionManager.endMotions = (target, opts) => {
        motionCalls.push({ target, opts });
        return 1;
    };

    try {
        const token = {
            id: 'tok-fly',
            document: { id: 'tok-fly', uuid: 'Scene.s1.Token.tok-fly', documentName: 'Token' }
        };

        await endEffectsAndMotions(token, 'fly - tok-fly');
        assert.equal(effectCalls.length, 1);
        assert.deepEqual(effectCalls[0], { name: 'fly - tok-fly', object: token });
        assert.equal(motionCalls.length, 1);
        assert.equal(motionCalls[0].target, token);
        assert.deepEqual(motionCalls[0].opts, { name: 'fly - tok-fly' });

        // With explicit settle duration
        await endEffectsAndMotions(token, 'levitation - tok-fly', { settle: 600 });
        assert.equal(motionCalls.length, 2);
        assert.deepEqual(motionCalls[1].opts, { name: 'levitation - tok-fly', settle: 600 });

        // With non-motion proxy target: still ends effects, skips MotionManager safely
        const casterProxy = { id: 'proxy-1', isTrapCasterProxy: true };
        await endEffectsAndMotions(casterProxy, 'trap - proxy-1');
        assert.equal(effectCalls.length, 3);
        assert.equal(motionCalls.length, 2, 'MotionManager.endMotions must not be called for trap proxies');
    } finally {
        Sequencer.EffectManager.endEffects = origEndEffects;
        Sequencer.MotionManager.endMotions = origEndMotions;
    }
});

test('computeCenterDelta computes relative pixel delta from placeable center to destination center', () => {
    const token = {
        x: 100,
        y: 200,
        center: { x: 150, y: 250 },
        document: { width: 1, height: 1 }
    };

    assert.deepEqual(computeCenterDelta(token, { x: 450, y: 150 }), { x: 300, y: -100 });
    assert.deepEqual(computeCenterDelta(token, { x: 150, y: 250 }), { x: 0, y: 0 });
    assert.deepEqual(computeCenterDelta(null, { x: 100, y: 100 }), { x: 0, y: 0 });
});
