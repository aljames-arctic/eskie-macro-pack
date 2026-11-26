import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    installRecordingSequence,
    assertSequencer431MotionContracts,
    makeToken,
} from '../helpers/motion-contract.js';
import { aerodyneVehicle } from '../../src/animation/effects/token/aerodyne-vehicle.js';
import { speakWithDead } from '../../src/animation/effects/active-effect/speakWithDead.js';
import { eagleAttunement } from '../../src/animation/effects/active-effect/rage/totemic-attunement/eagle.js';
import { laugh } from '../../src/animation/effects/emote/laugh.js';
import { mirrorImageV2 } from '../../src/animation/effects/active-effect/mirror-image/mirror-image-v2.js';

globalThis.game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true });
globalThis.game.modules.set('eskie-effects', { id: 'eskie-effects', active: true });
globalThis.game.modules.set('boss-loot-assets-premium', { id: 'boss-loot-assets-premium', active: true });

test('Batch 2A: aerodyneVehicle uses .motion().persist(), ground-anchored smoke/shadow, motion-tracking thrusters, and MotionManager cleanup', async () => {
    const rec = installRecordingSequence();
    const origEndEffects = Sequencer.EffectManager.endEffects;
    const origEndMotions = Sequencer.MotionManager.endMotions;
    const origTagger = globalThis.Tagger;
    const motionEnds = [];
    Sequencer.EffectManager.endEffects = async () => {};
    Sequencer.MotionManager.endMotions = (t, o) => { motionEnds.push({ t, o }); return 1; };
    globalThis.Tagger = { addTags: async () => {}, removeTags: async () => {} };

    try {
        const token = makeToken('av1', 200, 200);
        const seq = await aerodyneVehicle.create(token);
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'aerodyneVehicle');

        // Zero animation().opacity(0)
        assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);

        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1);
        assert.equal(motions[0].initArgs[0], token);
        assert.ok(motions[0].calls.some(c => c.method === 'persist'));
        assert.ok(motions[0].calls.some(c => c.method === 'oscillate'));

        // Ground shadow copySprite uses ignoreMotion: true
        const shadow = seq.sections.find(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
        assert.ok(shadow);
        assert.equal(shadow.calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, true);

        // Thrusters track motion automatically without duplicate Y loopProperty
        const thrusters = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'playbackRate'));
        assert.equal(thrusters.length, 4);
        for (const thruster of thrusters) {
            assert.equal(thruster.calls.some(c => c.method === 'loopProperty'), false);
            assert.equal(thruster.calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, undefined);
        }

        await aerodyneVehicle.stop(token);
        assert.equal(motionEnds.length, 1);
        assert.equal(motionEnds[0].o.name, 'Fly');
    } finally {
        rec.restore();
        Sequencer.EffectManager.endEffects = origEndEffects;
        Sequencer.MotionManager.endMotions = origEndMotions;
        globalThis.Tagger = origTagger;
    }
});

test('Batch 2A: speakWithDead uses .motion().persist(), grounded circles/flames/shadows, motion-tracking border/rune, and MotionManager cleanup', async () => {
    const rec = installRecordingSequence();
    const origEndEffects = Sequencer.EffectManager.endEffects;
    const origEndMotions = Sequencer.MotionManager.endMotions;
    const motionEnds = [];
    const effectEnds = [];
    Sequencer.EffectManager.endEffects = async (o) => effectEnds.push(o);
    Sequencer.MotionManager.endMotions = (t, o) => { motionEnds.push({ t, o }); return 1; };

    try {
        const token = makeToken('swd1', 100, 100);
        const seq = speakWithDead.create(token);
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'speakWithDead');

        // Zero animation().opacity(0)
        assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);

        // Exactly one persistent motion with lift keyframes, overlapping head tilt, and hover oscillation
        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1);
        assert.equal(motions[0].initArgs[0], token);
        assert.ok(motions[0].calls.some(c => c.method === 'persist'));
        assert.equal(motions[0].calls.filter(c => c.method === 'rotateBy').length, 2);
        assert.equal(motions[0].calls.filter(c => c.method === 'oscillate').length, 1);

        // Only 1 copySprite remains (blurred ground shadow) and it anchors via ignoreMotion: true
        const copySprites = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
        assert.equal(copySprites.length, 1);
        assert.equal(copySprites[0].calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, true);

        await speakWithDead.stop(token);
        assert.equal(motionEnds.length, 1);
        assert.equal(motionEnds[0].o.name, 'speakWithDead - swd1');
        assert.ok(effectEnds.length >= 2, 'speakWithDead.stop must clean up both attached and unattached corner flame effects');
    } finally {
        rec.restore();
        Sequencer.EffectManager.endEffects = origEndEffects;
        Sequencer.MotionManager.endMotions = origEndMotions;
    }
});

test('Batch 2A: eagleAttunement uses .motion().persist(), grounded shadow, motion-tracking wings/aura, and MotionManager cleanup', async () => {
    const rec = installRecordingSequence();
    const origEndEffects = Sequencer.EffectManager.endEffects;
    const origEndMotions = Sequencer.MotionManager.endMotions;
    const motionEnds = [];
    Sequencer.EffectManager.endEffects = async () => {};
    Sequencer.MotionManager.endMotions = (t, o) => { motionEnds.push({ t, o }); return 1; };

    try {
        const token = makeToken('eagle1', 150, 150);
        const seq = eagleAttunement.create(token);
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'eagleAttunement');

        assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);

        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1);
        assert.ok(motions[0].calls.some(c => c.method === 'persist'));

        // Ground shadow copySprite uses ignoreMotion: true; no second floating copySprite
        const copySprites = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
        assert.equal(copySprites.length, 1);
        assert.equal(copySprites[0].calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, true);

        await eagleAttunement.stop(token);
        assert.equal(motionEnds.length, 1);
        assert.equal(motionEnds[0].o.name, 'Eagle Totemic Attunement - eagle1');
    } finally {
        rec.restore();
        Sequencer.EffectManager.endEffects = origEndEffects;
        Sequencer.MotionManager.endMotions = origEndMotions;
    }
});

test('Batch 2A: laugh supports both timed and persistent .motion() bounce+scale and MotionManager cleanup', async () => {
    const rec = installRecordingSequence();
    const origEndEffects = Sequencer.EffectManager.endEffects;
    const origEndMotions = Sequencer.MotionManager.endMotions;
    const motionEnds = [];
    Sequencer.EffectManager.endEffects = async () => {};
    Sequencer.MotionManager.endMotions = (t, o) => { motionEnds.push({ t, o }); return 1; };

    try {
        const token = makeToken('laugh1', 100, 100);

        // Timed mode (default duration 5000)
        const timedSeq = await laugh.create(token, { duration: 5000 });
        assertSequencer431MotionContracts(timedSeq, 'laugh(timed)');
        assert.equal(timedSeq.sections.filter(s => s.type === 'animation').length, 0);
        const timedMotions = timedSeq.sections.filter(s => s.type === 'motion');
        assert.equal(timedMotions.length, 1);
        assert.equal(timedMotions[0].calls.some(c => c.method === 'persist'), false);

        // Persistent mode (duration 0)
        const persistSeq = await laugh.create(token, { duration: 0 });
        assertSequencer431MotionContracts(persistSeq, 'laugh(persist)');
        const persistMotions = persistSeq.sections.filter(s => s.type === 'motion');
        assert.equal(persistMotions.length, 1);
        assert.equal(persistMotions[0].calls.some(c => c.method === 'persist'), true);

        await laugh.stop(token);
        assert.equal(motionEnds.length, 1);
        assert.equal(motionEnds[0].o.name, 'laugh');
    } finally {
        rec.restore();
        Sequencer.EffectManager.endEffects = origEndEffects;
        Sequencer.MotionManager.endMotions = origEndMotions;
    }
});

test('Batch 2A: mirrorImageV2 fades primary token via .motion().fadeTo(0.5) while keeping orbiting illusion clones intact', async () => {
    const rec = installRecordingSequence();
    try {
        const token = makeToken('mi1', 100, 100);
        const seq = await mirrorImageV2.create(token, { imageNumber: 3 });
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'mirrorImageV2');

        // Zero animation().opacity(0) hide hacks in create()
        assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);

        // Exactly one fadeTo(0.5) motion on primary token
        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1);
        const fadeCall = motions[0].calls.find(c => c.method === 'fadeTo');
        assert.ok(fadeCall);
        assert.equal(fadeCall.args[0], 0.5);

        // 2 casting split-flashes + 3 orbiting purple illusion clones remain copySprite effects
        const cloneEffects = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
        assert.equal(cloneEffects.length, 5, 'mirrorImageV2 must keep 2 casting flashes + 3 orbiting filtered illusion clones');
    } finally {
        rec.restore();
    }
});
