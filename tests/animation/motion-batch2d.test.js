import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    installRecordingSequence,
    assertSequencer431MotionContracts,
    makeToken,
    makeTile,
} from '../helpers/motion-contract.js';
import { bullRushStatue } from '../../src/animation/traps/bull-rush-statue.js';
import { fallingSky } from '../../src/animation/traps/falling-sky.js';
import { banishment } from '../../src/animation/effects/active-effect/banishment.js';
import { banishingArrow } from '../../src/animation/effects/arcane-shot/banishing-arrow.js';
import { enlargeReduce } from '../../src/animation/effects/active-effect/enlarge-reduce.js';
import { sunHaloDragon } from '../../src/animation/showcase/sun-halo-dragon.js';

globalThis.game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true });
globalThis.game.modules.set('eskie-effects', { id: 'eskie-effects', active: true });
globalThis.game.modules.set('psfx', { id: 'psfx', active: true });

test('Batch 2D: bullRushStatue animates concrete Tile natively via .motion(tile) and preserves custom textureSrc fallback', async () => {
    const rec = installRecordingSequence();
    try {
        const tile = makeTile('statue1', 100, 100, 100, 100);
        const target = makeToken('victim1', 300, 100);

        // Native Tile motion path (no custom textureSrc)
        const seq = await bullRushStatue.create(tile, [target], {
            targetLocation: { x: 350, y: 150 },
        });
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'bullRushStatue(nativeTile)');

        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1);
        assert.equal(motions[0].initArgs[0], tile);
        assert.equal(seq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity')).length, 0);

        // Custom textureSrc fallback path keeps texture effect cleanly
        const customSeq = await bullRushStatue.create(tile, [target], {
            targetLocation: { x: 350, y: 150 },
            textureSrc: 'custom-boulder.webp',
        });
        assert.equal(customSeq.sections.filter(s => s.type === 'motion').length, 0);
    } finally {
        rec.restore();
    }
});

test('Batch 2D: fallingSky keeps Phase 1 aboveLighting preview and migrates Phase 2 sky-fall descent to .motion()', async () => {
    const rec = installRecordingSequence();
    try {
        const tile = makeTile('sky1', 100, 100);
        const target = makeToken('faller1', 100, 100);
        const seq = await fallingSky.create(tile, [target], { reveal: false, randomDelay: 0 });
        assert.ok(seq);

        // Target sequence was constructed inside create()
        const targetSeq = rec.sequences.find(s => s.sections.some(sec => sec.type === 'motion'));
        assert.ok(targetSeq, 'fallingSky must build a target sequence using .motion() for Phase 2 descent');
        assertSequencer431MotionContracts(targetSeq, 'fallingSky');

        // Phase 1 aboveLighting copySprite remains; Phase 2 copySprite is replaced by .motion()
        const copySprites = targetSeq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
        assert.equal(copySprites.length, 1);
        assert.ok(copySprites[0].calls.some(c => c.method === 'aboveLighting'));

        const motion = targetSeq.sections.find(s => s.type === 'motion');
        assert.ok(motion.calls.some(c => c.method === 'scaleTo'));
        assert.ok(motion.calls.some(c => c.method === 'fadeTo'));
    } finally {
        rec.restore();
    }
});

test('Batch 2D: banishment migrates both banish struggle/pull-in and return bounce-in to .motion() with zero copySprites', async () => {
    const rec = installRecordingSequence();
    try {
        const target = makeToken('banTgt', 200, 200);
        target.actor = { system: { details: { type: { value: 'fiend' } } } };

        const banishSeq = await banishment.banish.create(target);
        assert.ok(banishSeq);
        assertSequencer431MotionContracts(banishSeq, 'banishment.banish');
        assert.equal(banishSeq.sections.filter(s => s.type === 'motion').length, 1);
        assert.equal(banishSeq.sections.some(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite')), false);

        // Post-banish hide happens AFTER the struggle motion
        const motionIdx = banishSeq.sections.findIndex(s => s.type === 'motion');
        const hideIdx = banishSeq.sections.findIndex(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity'));
        assert.ok(hideIdx > motionIdx, 'banishment must hide token only after struggle motion finishes');

        const returnSeq = await banishment.return.create(target);
        assert.ok(returnSeq);
        assertSequencer431MotionContracts(returnSeq, 'banishment.return');
        assert.equal(returnSeq.sections.filter(s => s.type === 'motion').length, 1);
        assert.equal(returnSeq.sections.some(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite')), false);
    } finally {
        rec.restore();
    }
});

test('Batch 2D: banishingArrow migrates spin-shrink vanish to .motion() and cleans up via MotionManager in stop()', async () => {
    const rec = installRecordingSequence();
    const origEndEffects = Sequencer.EffectManager.endEffects;
    const origEndMotions = Sequencer.MotionManager.endMotions;
    const motionEnds = [];
    Sequencer.EffectManager.endEffects = async () => {};
    Sequencer.MotionManager.endMotions = (t, o) => { motionEnds.push({ t, o }); return 1; };

    try {
        const caster = makeToken('baSrc', 100, 100);
        const target = makeToken('baTgt', 400, 100);
        const seq = await banishingArrow.create(caster, target);
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'banishingArrow');

        assert.equal(seq.sections.filter(s => s.type === 'motion').length, 1);
        assert.equal(seq.sections.some(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite')), false);

        await banishingArrow.stop(caster, target);
        assert.equal(motionEnds.length, 1);
        assert.equal(motionEnds[0].o.name, `${target.name} Banishing Arrow`);
    } finally {
        rec.restore();
        Sequencer.EffectManager.endEffects = origEndEffects;
        Sequencer.MotionManager.endMotions = origEndMotions;
    }
});

test('Batch 2D: enlargeReduce migrates pre-resize rotation oscillation and post-resize bounce scale-in to .motion()', async () => {
    const rec = installRecordingSequence();
    try {
        const token = makeToken('er1', 200, 200);

        for (const [name, fn] of [['enlarge', enlargeReduce.enlarge.create], ['reduce', enlargeReduce.reduce.create]]) {
            const seq = await fn(token);
            assert.ok(seq);
            assertSequencer431MotionContracts(seq, `enlargeReduce.${name}`);

            const motions = seq.sections.filter(s => s.type === 'motion');
            assert.equal(motions.length, 2, `${name} must have pre-resize oscillation and post-resize bounce motions`);
            assert.ok(motions[0].calls.some(c => c.method === 'oscillate'));
            assert.ok(motions[1].calls.some(c => c.method === 'scaleTo'));

            // Only the translucent 0.2-opacity triple-pulse echo copySprite remains
            const copySprites = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
            assert.equal(copySprites.length, 1);
        }
    } finally {
        rec.restore();
    }
});

test('Batch 2D: sunHaloDragon migrates dash to .motion().persistUntilUpdate() before DB teleportTo while keeping blurred afterimage', async () => {
    const rec = installRecordingSequence();
    const origCrosshair = Sequencer.Crosshair;
    Sequencer.Crosshair = { show: async () => ({ x: 550, y: 150 }) };
    try {
        const token = makeToken('shd1', 100, 100);
        const seq = await sunHaloDragon.create(token, []);
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'sunHaloDragon');

        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1);
        assert.ok(motions[0].calls.some(c => c.method === 'persistUntilUpdate'));
        assert.equal(seq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity')).length, 0);

        // Keeps single blurred afterimage copySprite
        const copySprites = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
        assert.equal(copySprites.length, 1);
    } finally {
        Sequencer.Crosshair = origCrosshair;
        rec.restore();
    }
});
