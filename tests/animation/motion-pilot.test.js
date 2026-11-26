import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fly } from '../../src/animation/effects/token/fly.js';
import { levitation } from '../../src/animation/effects/active-effect/levitation.js';
import { wings } from '../../src/animation/effects/token/wings.js';
import { drunk } from '../../src/animation/effects/active-effect/drunk.js';
import { pushingAttack } from '../../src/animation/effects/battlemaster/pushing-attack.js';
import { hitTheDirt } from '../../src/animation/effects/template/hit-the-dirt.js';
import { adapter } from '../../src/adapters/index.js';

globalThis.game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true });
globalThis.game.modules.set('eskie-effects', { id: 'eskie-effects', active: true });

/**
 * Recording Sequence mock that captures every section (effect, motion, animation, wait, etc.)
 * and every chained method call + arguments for contract verification against Sequencer 4.3.1.
 */
function installRecordingSequence() {
    const OrigSequence = globalThis.Sequence;
    const sequences = [];

    class RecordingSequence {
        constructor() {
            this.sections = [];
            this.currentSection = null;
            sequences.push(this);

            const sectionStarters = new Set(['effect', 'motion', 'animation', 'sound', 'wait', 'thenDo', 'canvasPan']);
            const handler = {
                get: (target, prop) => {
                    if (prop === 'sections' || prop === 'currentSection') return target[prop];
                    if (prop === 'play') return async () => proxy;
                    if (prop === 'then') return undefined;
                    return (...args) => {
                        if (sectionStarters.has(prop)) {
                            const sec = { type: prop, initArgs: args, calls: [] };
                            target.sections.push(sec);
                            target.currentSection = sec;
                        } else if (target.currentSection) {
                            target.currentSection.calls.push({ method: prop, args });
                        }
                        return proxy;
                    };
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    }

    globalThis.Sequence = RecordingSequence;
    return {
        sequences,
        restore() {
            globalThis.Sequence = OrigSequence;
        }
    };
}

/**
 * Validates that every motion section in a recorded sequence satisfies Sequencer 4.3.1 contracts:
 * - No waitUntilFinished() on persist() or persistUntilUpdate()
 * - Every track under persistUntilUpdate() passes return: false
 * - Every oscillate() passes positive period, valid waveform, non-negative phase, and axis objects
 * - Every single-target track passes positive options.duration
 */
function assertSequencer431MotionContracts(recordedSequence, label) {
    const validWaveforms = new Set(['sine', 'triangle', 'square']);
    const trackMethods = new Set(['moveTo', 'moveBy', 'rotateTo', 'rotateBy', 'scaleTo', 'scaleBy', 'fadeTo', 'fadeBy', 'tintTo']);

    for (const sec of recordedSequence.sections) {
        if (sec.type !== 'motion') continue;
        const methods = sec.calls.map(c => c.method);
        const isPersist = methods.includes('persist');
        const isPersistUntilUpdate = methods.includes('persistUntilUpdate');

        assert.equal(isPersist && isPersistUntilUpdate, false, `${label}: persist() and persistUntilUpdate() are mutually exclusive`);
        if (isPersist || isPersistUntilUpdate) {
            assert.equal(methods.includes('waitUntilFinished'), false, `${label}: never call waitUntilFinished() on persistent motion`);
        }

        for (const call of sec.calls) {
            if (trackMethods.has(call.method)) {
                const [val, opts = {}] = call.args;
                if (isPersistUntilUpdate) {
                    assert.equal(opts.return, false, `${label}: ${call.method} under persistUntilUpdate() must set return: false`);
                }
                if (!Array.isArray(val)) {
                    assert.ok(typeof opts.duration === 'number' && opts.duration > 0, `${label}: single-target ${call.method} requires positive duration`);
                } else {
                    assert.ok(val.length >= 2, `${label}: keyframe ${call.method} requires >= 2 entries`);
                    const hasTrackDuration = typeof opts.duration === 'number' && opts.duration > 0;
                    const allPerKey = val.slice(1).every(k => typeof k?.duration === 'number' && k.duration > 0);
                    assert.ok(hasTrackDuration || allPerKey, `${label}: keyframe ${call.method} requires track duration or per-key durations`);
                }
            }

            if (call.method === 'oscillate') {
                const [opts] = call.args;
                assert.ok(typeof opts?.period === 'number' && opts.period > 0, `${label}: oscillate requires positive period`);
                assert.ok(validWaveforms.has(opts?.waveform), `${label}: oscillate requires valid waveform`);
                const axes = ['x', 'y', 'rotation', 'scale', 'alpha'].filter(a => opts[a] !== undefined);
                assert.ok(axes.length > 0, `${label}: oscillate requires at least one axis`);
                for (const axis of axes) {
                    const phase = opts[axis].phase ?? 0;
                    assert.ok(phase >= 0, `${label}: oscillate ${axis}.phase should be non-negative`);
                }
            }
        }
    }
}

function makeToken(id, x, y, rotation = 0) {
    return {
        id,
        name: `Token ${id}`,
        x,
        y,
        w: 100,
        h: 100,
        center: { x: x + 50, y: y + 50 },
        document: {
            id,
            uuid: `Scene.s1.Token.${id}`,
            documentName: 'Token',
            x,
            y,
            width: 1,
            height: 1,
            rotation,
            elevation: 0,
            texture: { src: 'token.png', scaleX: 1, scaleY: 1 }
        }
    };
}

test('Phase 1 Pilot: fly uses .motion().persist(), ground-anchored shadow (ignoreMotion), zero opacity(0), and cleans up via MotionManager', async () => {
    const rec = installRecordingSequence();
    const origEndEffects = Sequencer.EffectManager.endEffects;
    const origEndMotions = Sequencer.MotionManager.endMotions;
    const motionEnds = [];
    const effectEnds = [];
    Sequencer.EffectManager.endEffects = async (o) => effectEnds.push(o);
    Sequencer.MotionManager.endMotions = (t, o) => { motionEnds.push({ t, o }); return 1; };

    try {
        const token = makeToken('fly1', 100, 100);
        const seq = await fly.create(token);
        assert.ok(seq);
        assertSequencer431MotionContracts(rec.sequences[0], 'fly');

        // Zero animation().opacity(0) hide hacks
        const hideSections = rec.sequences[0].sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity'));
        assert.equal(hideSections.length, 0, 'fly must not hide token via animation().opacity(0)');

        // Exactly one persistent motion section on token
        const motions = rec.sequences[0].sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1);
        assert.equal(motions[0].initArgs[0], token);
        assert.ok(motions[0].calls.some(c => c.method === 'persist'));

        // Ground shadow copySprite uses ignoreMotion: true
        const shadow = rec.sequences[0].sections.find(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
        assert.ok(shadow, 'fly must retain blurred ground shadow copySprite');
        const attachCall = shadow.calls.find(c => c.method === 'attachTo');
        assert.equal(attachCall.args[1]?.ignoreMotion, true, 'fly ground shadow must anchor via ignoreMotion: true');

        // stop() terminates both effects and motions
        await fly.stop(token);
        assert.equal(motionEnds.length, 1);
        assert.equal(motionEnds[0].o.name, 'fly - fly1');
        assert.equal(effectEnds.length, 1);
    } finally {
        rec.restore();
        Sequencer.EffectManager.endEffects = origEndEffects;
        Sequencer.MotionManager.endMotions = origEndMotions;
    }
});

test('Phase 1 Pilot: levitation uses .motion().persist() with 3 exact sine oscillations, grounded aura effects, motion-tracking border, and MotionManager stop', async () => {
    const rec = installRecordingSequence();
    const origEndEffects = Sequencer.EffectManager.endEffects;
    const origEndMotions = Sequencer.MotionManager.endMotions;
    const motionEnds = [];
    Sequencer.EffectManager.endEffects = async () => {};
    Sequencer.MotionManager.endMotions = (t, o) => { motionEnds.push({ t, o }); return 1; };

    try {
        const token = makeToken('lev1', 200, 200);
        const seq = levitation.create(token);
        assert.ok(seq);
        assertSequencer431MotionContracts(rec.sequences[0], 'levitation');

        assert.equal(rec.sequences[0].sections.filter(s => s.type === 'animation').length, 0);
        const motions = rec.sequences[0].sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1);
        const oscCalls = motions[0].calls.filter(c => c.method === 'oscillate');
        assert.equal(oscCalls.length, 3, 'levitation must preserve 3 independent sine oscillations (rotation, x, y)');

        // Border attaches WITHOUT ignoreMotion so it tracks motion X/Y automatically
        const effects = rec.sequences[0].sections.filter(s => s.type === 'effect');
        assert.equal(effects.length, 3, 'levitation keeps bless, wind stream, and token border (no copySprite)');
        assert.equal(effects.some(e => e.calls.some(c => c.method === 'copySprite')), false);
        assert.equal(effects[0].calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, true);
        assert.equal(effects[1].calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, true);
        assert.equal(effects[2].calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, undefined);

        await levitation.stop(token);
        assert.equal(motionEnds.length, 1);
        assert.equal(motionEnds[0].o.name, 'levitation - lev1');
    } finally {
        rec.restore();
        Sequencer.EffectManager.endEffects = origEndEffects;
        Sequencer.MotionManager.endMotions = origEndMotions;
    }
});

test('Phase 1 Pilot: wings uses .motion().persist(), ground-anchored shadow, motion-synced wings, and cleans up via MotionManager', async () => {
    const rec = installRecordingSequence();
    const origEndEffects = Sequencer.EffectManager.endEffects;
    const origEndMotions = Sequencer.MotionManager.endMotions;
    const motionEnds = [];
    Sequencer.EffectManager.endEffects = async () => {};
    Sequencer.MotionManager.endMotions = (t, o) => { motionEnds.push({ t, o }); return 1; };

    try {
        const token = makeToken('wing1', 100, 100);
        const seq = await wings.create(token);
        assert.ok(seq);
        assertSequencer431MotionContracts(rec.sequences[0], 'wings');

        assert.equal(rec.sequences[0].sections.filter(s => s.type === 'animation').length, 0);
        const motions = rec.sequences[0].sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1);

        const effects = rec.sequences[0].sections.filter(s => s.type === 'effect');
        assert.equal(effects.length, 2, 'wings keeps shadow copySprite + wing graphic only');
        assert.equal(effects[0].calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, true);
        assert.equal(effects[1].calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, undefined);
        assert.equal(effects[1].calls.some(c => c.method === 'loopProperty'), false, 'wings graphic tracks motion Y automatically without duplicate loopProperty');

        await wings.stop(token);
        assert.equal(motionEnds.length, 1);
        assert.equal(motionEnds[0].o.name, 'wings - wing1');
    } finally {
        rec.restore();
        Sequencer.EffectManager.endEffects = origEndEffects;
        Sequencer.MotionManager.endMotions = origEndMotions;
    }
});

test('Phase 1 Pilot: drunk supports both persistent (-1) and timed (>0) .motion() without token hiding', async () => {
    const rec = installRecordingSequence();
    const origEndEffects = Sequencer.EffectManager.endEffects;
    const origEndMotions = Sequencer.MotionManager.endMotions;
    const motionEnds = [];
    Sequencer.EffectManager.endEffects = async () => {};
    Sequencer.MotionManager.endMotions = (t, o) => { motionEnds.push({ t, o }); return 1; };

    try {
        const token = makeToken('drunk1', 100, 100);

        // Indefinite mode (duration: -1)
        await drunk.create(token, { duration: -1 });
        assertSequencer431MotionContracts(rec.sequences[0], 'drunk-persist');
        const persistMotion = rec.sequences[0].sections.find(s => s.type === 'motion');
        assert.ok(persistMotion.calls.some(c => c.method === 'persist'));
        assert.equal(rec.sequences[0].sections.filter(s => s.type === 'animation').length, 0);

        // Timed mode (duration: 4000)
        await drunk.create(token, { duration: 4000 });
        assertSequencer431MotionContracts(rec.sequences[1], 'drunk-timed');
        const timedMotion = rec.sequences[1].sections.find(s => s.type === 'motion');
        assert.equal(timedMotion.calls.some(c => c.method === 'persist'), false);

        await drunk.stop(token, { overlay: { applyPC: false, applyGM: false } });
        assert.equal(motionEnds.length, 1);
        assert.equal(motionEnds[0].o.name, 'drunk - drunk1');
    } finally {
        rec.restore();
        Sequencer.EffectManager.endEffects = origEndEffects;
        Sequencer.MotionManager.endMotions = origEndMotions;
    }
});

test('Phase 1 Pilot: pushingAttack uses keyframe lunge, persistUntilUpdate knockback + wait() + DB teleportTo, and guards CasterProxy', async () => {
    const rec = installRecordingSequence();

    try {
        const attacker = makeToken('atk1', 100, 100);
        const target = makeToken('trg1', 200, 100);

        await pushingAttack.create(attacker, target, { pushDistance: 15 });
        assertSequencer431MotionContracts(rec.sequences[0], 'pushingAttack');

        const motions = rec.sequences[0].sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 2, 'pushingAttack animates both attacker lunge and target knockback via .motion()');
        assert.equal(motions[0].initArgs[0], attacker);
        assert.equal(motions[1].initArgs[0], target);
        assert.ok(motions[1].calls.some(c => c.method === 'persistUntilUpdate'));

        // Final DB teleportTo commits position with snapToGrid and zero opacity(0) hides
        const anims = rec.sequences[0].sections.filter(s => s.type === 'animation');
        assert.equal(anims.length, 1);
        assert.ok(anims[0].calls.some(c => c.method === 'teleportTo'));
        assert.ok(anims[0].calls.some(c => c.method === 'snapToGrid'));
        assert.equal(anims[0].calls.some(c => c.method === 'opacity'), false);

        // Trap CasterProxy safety: skips attacker .motion(), still knocks back concrete target
        const tileOrigin = { id: 'tile-1', x: 100, y: 100, w: 100, h: 100, center: { x: 150, y: 150 }, document: { id: 'tile-1', uuid: 'Scene.s1.Tile.tile-1', documentName: 'Tile', width: 100, height: 100 } };
        const casterProxy = adapter.createCasterProxy(tileOrigin, { x: 250, y: 150 });
        await pushingAttack.create(casterProxy, target, { pushDistance: 15 });
        assertSequencer431MotionContracts(rec.sequences[1], 'pushingAttack-trap');
        const trapMotions = rec.sequences[1].sections.filter(s => s.type === 'motion');
        assert.equal(trapMotions.length, 1, 'CasterProxy must skip attacker .motion() cleanly');
        assert.equal(trapMotions[0].initArgs[0], target);
    } finally {
        rec.restore();
    }
});

test('Phase 1 Pilot: hitTheDirt combines additive horizontal moveBy, parabolic Y keyframe arc, rotateBy(90), persistUntilUpdate + wait(), and DB commit', async () => {
    const rec = installRecordingSequence();

    try {
        const token = makeToken('dive1', 100, 100, 45);
        const mockTemplate = { x: 400, y: 100, distance: 0 };

        await hitTheDirt.create(token, { template: mockTemplate });
        assertSequencer431MotionContracts(rec.sequences[0], 'hitTheDirt');

        const motions = rec.sequences[0].sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1);
        const moveByCalls = motions[0].calls.filter(c => c.method === 'moveBy');
        assert.equal(moveByCalls.length, 2, 'hitTheDirt stacks horizontal moveBy + parabolic Y keyframe moveBy');
        assert.ok(motions[0].calls.some(c => c.method === 'rotateBy' && c.args[0] === 90));
        assert.ok(motions[0].calls.some(c => c.method === 'persistUntilUpdate'));

        // Ground shadow and landing dust pass ignoreMotion: true
        const effects = rec.sequences[0].sections.filter(s => s.type === 'effect');
        assert.equal(effects[0].calls.find(c => c.method === 'atLocation')?.args[1]?.ignoreMotion, true);
        assert.equal(effects[1].calls.find(c => c.method === 'atLocation')?.args[1]?.ignoreMotion, true);
        assert.equal(effects[2].calls.find(c => c.method === 'rotateTowards')?.args[1]?.ignoreMotion, true);

        // Final DB teleportTo + rotate commits permanent prone state without opacity(0)/opacity(1)
        const anims = rec.sequences[0].sections.filter(s => s.type === 'animation');
        assert.equal(anims.length, 1);
        assert.ok(anims[0].calls.some(c => c.method === 'teleportTo'));
        assert.ok(anims[0].calls.some(c => c.method === 'rotate' && c.args[0] === 135));
        assert.equal(anims[0].calls.some(c => c.method === 'opacity'), false);
    } finally {
        rec.restore();
    }
});
