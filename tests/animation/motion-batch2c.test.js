import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    installRecordingSequence,
    assertSequencer431MotionContracts,
    makeToken,
} from '../helpers/motion-contract.js';
import { leap } from '../../src/animation/effects/token/leap.js';
import { stepOfTheWindJump } from '../../src/animation/effects/template/step-of-the-wind-jump.js';
import { thornWhip } from '../../src/animation/effects/target/thorn-whip.js';
import { hookAndPull } from '../../src/animation/effects/token/hook-and-pull.js';
import { baitAndSwitch } from '../../src/animation/effects/battlemaster/bait-and-switch.js';
import { vortexWarp } from '../../src/animation/effects/target/vortex-warp.js';
import { tripAttack } from '../../src/animation/effects/battlemaster/trip-attack.js';
import { elkAttunement } from '../../src/animation/effects/active-effect/rage/totemic-attunement/elk.js';
import { tigerAttunement } from '../../src/animation/effects/active-effect/rage/totemic-attunement/tiger.js';
import { wolfAttunement } from '../../src/animation/effects/active-effect/rage/totemic-attunement/wolf.js';
import { stormingDashStrikes } from '../../src/animation/effects/token/storming-dash-strikes.js';
import { starwardSword } from '../../src/animation/effects/template/starward-sword.js';
import { template as templatelib } from '../../src/lib/templates.js';

globalThis.game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true });
globalThis.game.modules.set('eskie-effects', { id: 'eskie-effects', active: true });

test('Batch 2C: leap uses .motion().persistUntilUpdate() parabolic arc before DB teleportTo with grounded shadow', async () => {
    const rec = installRecordingSequence();
    try {
        const token = makeToken('leap1', 100, 100);
        const seq = await leap.create(token, { position: { x: 450, y: 150 } });
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'leap');

        const motionIdx = seq.sections.findIndex(s => s.type === 'motion');
        const waitIdx = seq.sections.findIndex((s, i) => i > motionIdx && s.type === 'wait');
        const teleportIdx = seq.sections.findIndex(s => s.type === 'animation' && s.calls.some(c => c.method === 'teleportTo'));
        assert.ok(motionIdx >= 0 && waitIdx > motionIdx && teleportIdx > waitIdx, 'leap must play motion -> wait -> DB teleportTo');

        // Zero opacity(0) hacks
        const opacityAnims = seq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity'));
        assert.equal(opacityAnims.length, 0);

        // Keeps blurred ground shadow copySprite
        const copySprites = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
        assert.equal(copySprites.length, 1);
    } finally {
        rec.restore();
    }
});

test('Batch 2C: stepOfTheWindJump uses .motion().persistUntilUpdate() arc+360 flip before DB teleportTo', async () => {
    const rec = installRecordingSequence();
    const origGetPos = templatelib.getPosition;
    templatelib.getPosition = async () => [{ x: 450, y: 150 }, null];
    try {
        const token = makeToken('sotw1', 100, 100);
        const seq = await stepOfTheWindJump.create(token);
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'stepOfTheWindJump');

        const motion = seq.sections.find(s => s.type === 'motion');
        assert.ok(motion);
        assert.ok(motion.calls.some(c => c.method === 'rotateBy' && c.args[0] === 360));
        assert.ok(motion.calls.some(c => c.method === 'persistUntilUpdate'));

        const opacityAnims = seq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity'));
        assert.equal(opacityAnims.length, 0);
    } finally {
        templatelib.getPosition = origGetPos;
        rec.restore();
    }
});

test('Batch 2C: thornWhip slides target via .motion().persistUntilUpdate() before DB teleportTo and keeps translucent shudder', async () => {
    const rec = installRecordingSequence();
    try {
        const caster = makeToken('twSrc', 100, 100);
        const target = makeToken('twTgt', 500, 100);
        const seq = await thornWhip.create(caster, target, { pull: true });
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'thornWhip');

        const motionIdx = seq.sections.findIndex(s => s.type === 'motion');
        const waitIdx = seq.sections.findIndex((s, i) => i > motionIdx && s.type === 'wait');
        const teleportIdx = seq.sections.findIndex(s => s.type === 'animation' && s.calls.some(c => c.method === 'teleportTo'));
        assert.ok(motionIdx >= 0 && waitIdx > motionIdx && teleportIdx > waitIdx);
        assert.equal(seq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity')).length, 0);
    } finally {
        rec.restore();
    }
});

test('Batch 2C: hookAndPull only slides target on isHit=true via .motion().persistUntilUpdate()', async () => {
    const rec = installRecordingSequence();
    try {
        const caster = makeToken('hpSrc', 100, 100);
        const target = makeToken('hpTgt', 500, 100);

        const missSeq = await hookAndPull.create(caster, target, { isHit: false });
        assert.equal(missSeq.sections.filter(s => s.type === 'motion').length, 0);

        const hitSeq = await hookAndPull.create(caster, target, { isHit: true });
        assertSequencer431MotionContracts(hitSeq, 'hookAndPull(hit)');
        assert.equal(hitSeq.sections.filter(s => s.type === 'motion').length, 1);
        assert.equal(hitSeq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity')).length, 0);
    } finally {
        rec.restore();
    }
});

test('Batch 2C: baitAndSwitch swaps both tokens via .motion().persistUntilUpdate() and retains blurred afterimage', async () => {
    const rec = installRecordingSequence();
    try {
        const token = makeToken('basSrc', 100, 100);
        const target = makeToken('basTgt', 300, 100);
        const seq = await baitAndSwitch.create(token, target);
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'baitAndSwitch');

        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 2);
        assert.ok(motions.every(m => m.calls.some(c => c.method === 'persistUntilUpdate')));
        assert.equal(seq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity')).length, 0);

        // Keeps single blurred afterimage copySprite
        const copySprites = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
        assert.equal(copySprites.length, 1);
    } finally {
        rec.restore();
    }
});

test('Batch 2C: vortexWarp uses positive scaleTo(0.01) departure and keyframe growth arrival motions', async () => {
    const rec = installRecordingSequence();
    try {
        const target = makeToken('vwTgt', 100, 100);
        const seq = await vortexWarp.create(target, { position: { x: 450, y: 250 } });
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'vortexWarp');

        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 2);
        assert.equal(motions[0].calls.some(c => c.method === 'persistUntilUpdate'), true);
        assert.equal(motions[1].calls.some(c => c.method === 'persistUntilUpdate'), false);
        assert.equal(seq.sections.some(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite')), false);
    } finally {
        rec.restore();
    }
});

test('Batch 2C: tripAttack, elkAttunement.prone, and wolfAttunement migrate 90-degree knockdown tosses to .motion().persistUntilUpdate()', async () => {
    const rec = installRecordingSequence();
    try {
        const token = makeToken('kdSrc', 100, 100);
        const target = makeToken('kdTgt', 200, 100, 45);

        const tripSeq = await tripAttack.create(token, target);
        assertSequencer431MotionContracts(tripSeq, 'tripAttack');
        assert.equal(tripSeq.sections.filter(s => s.type === 'motion').length, 1);
        assert.equal(tripSeq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity')).length, 0);

        const elkSeq = elkAttunement.prone.create(token, target);
        assertSequencer431MotionContracts(elkSeq, 'elkAttunement.prone');
        assert.equal(elkSeq.sections.filter(s => s.type === 'motion').length, 1);
        assert.equal(elkSeq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity')).length, 0);

        const wolfSeq = wolfAttunement.create(token, target);
        assertSequencer431MotionContracts(wolfSeq, 'wolfAttunement');
        const wolfMotions = wolfSeq.sections.filter(s => s.type === 'motion');
        assert.equal(wolfMotions.length, 2, 'wolf has attacker lunge + target knockdown');
        assert.equal(wolfSeq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity')).length, 0);
    } finally {
        rec.restore();
    }
});

test('Batch 2C: tigerAttunement dashes via .motion().persistUntilUpdate() before DB teleportTo', async () => {
    const rec = installRecordingSequence();
    try {
        const token = makeToken('tigSrc', 100, 100);
        const target = makeToken('tigTgt', 400, 100);
        const seq = await tigerAttunement.create(token, target);
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'tigerAttunement');

        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1);
        assert.ok(motions[0].calls.some(c => c.method === 'persistUntilUpdate'));
        assert.equal(seq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity')).length, 0);
    } finally {
        rec.restore();
    }
});

test('Batch 2C: stormingDashStrikes chains additive .motion().persistUntilUpdate() waypoints with single final DB teleportTo', async () => {
    const rec = installRecordingSequence();
    const origEndEffects = Sequencer.EffectManager.endEffects;
    const origEndMotions = Sequencer.MotionManager.endMotions;
    const motionEnds = [];
    Sequencer.EffectManager.endEffects = async () => {};
    Sequencer.MotionManager.endMotions = (t, o) => { motionEnds.push({ t, o }); return 1; };

    try {
        const source = makeToken('sds1', 100, 100);
        const positions = [
            { x: 350, y: 150 },
            { x: 350, y: 350 },
            { x: 550, y: 350 },
        ];
        const seq = await stormingDashStrikes.create(source, { positions });
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'stormingDashStrikes');

        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 3, 'one additive persistUntilUpdate motion per dash waypoint');
        const teleports = seq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'teleportTo'));
        assert.equal(teleports.length, 1, 'single DB teleportTo at the end of all dashes');
        assert.equal(seq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity')).length, 0);

        await stormingDashStrikes.stop(source);
        assert.equal(motionEnds.length, 1);
        assert.equal(motionEnds[0].o.name, 'Storm Dash Strikes');
    } finally {
        rec.restore();
        Sequencer.EffectManager.endEffects = origEndEffects;
        Sequencer.MotionManager.endMotions = origEndMotions;
    }
});

test('Batch 2C: starwardSword migrates finisher knockdown to .motion() while keeping caster clones and blur jolts untouched', async () => {
    const rec = installRecordingSequence();
    const origGetPos = templatelib.getPosition;
    templatelib.getPosition = async () => [{ x: 300, y: 300 }, null];
    try {
        const caster = makeToken('swSrc', 100, 100);
        const target = makeToken('swTgt', 300, 300);
        const seq = await starwardSword.create(caster, { targets: [target], darkMap: false });
        assert.ok(seq);

        // Trigger all thenDo callbacks to capture target knockdown sequence
        const beforeCount = rec.sequences.length;
        for (const sec of seq.sections) {
            if (sec.type === 'thenDo' && typeof sec.initArgs[0] === 'function') {
                sec.initArgs[0]();
            }
        }
        const childSeqs = rec.sequences.slice(beforeCount);
        const finisherSeq = childSeqs.find(s => s.sections.some(sec => sec.type === 'motion'));
        assert.ok(finisherSeq, 'starwardSword finisher must run .motion() on target');
        assertSequencer431MotionContracts(finisherSeq, 'starwardSword(finisher)');

        const motion = finisherSeq.sections.find(sec => sec.type === 'motion');
        assert.ok(motion.calls.some(c => c.method === 'moveBy'));
        assert.ok(motion.calls.some(c => c.method === 'rotateBy'));
        assert.equal(finisherSeq.sections.filter(s => s.type === 'animation').length, 0);
    } finally {
        templatelib.getPosition = origGetPos;
        rec.restore();
    }
});
