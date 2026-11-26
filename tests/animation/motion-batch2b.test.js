import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    installRecordingSequence,
    assertSequencer431MotionContracts,
    makeToken,
} from '../helpers/motion-contract.js';
import { parry } from '../../src/animation/effects/battlemaster/parry.js';
import { feintingAttack } from '../../src/animation/effects/battlemaster/feinting-attack.js';
import { lungingAttack } from '../../src/animation/effects/battlemaster/lunging-attack.js';
import { stunningStrike } from '../../src/animation/effects/target/stunning-strike.js';
import { stunningFist } from '../../src/animation/effects/on-target/stunning-fist.js';
import { fireBlast } from '../../src/animation/effects/target/fire-blast.js';
import { armsOfHadar } from '../../src/animation/effects/template/arms-of-hadar.js';

globalThis.game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true });
globalThis.game.modules.set('eskie-effects', { id: 'eskie-effects', active: true });
globalThis.game.modules.set('boss-loot-assets-premium', { id: 'boss-loot-assets-premium', active: true });

test('Batch 2B: parry uses keyframe .motion().moveBy() step-back with zero opacity(0) hacks', async () => {
    const rec = installRecordingSequence();
    try {
        const token = makeToken('parrySrc', 100, 100);
        const target = makeToken('parryTgt', 200, 100);
        const seq = await parry.create(token, target);
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'parry');
        assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);

        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1);
        assert.equal(motions[0].initArgs[0], token);
        const moveCall = motions[0].calls.find(c => c.method === 'moveBy');
        assert.ok(Array.isArray(moveCall.args[0]) && moveCall.args[0].length === 3);
        // Step back is away from target (+x target => -x step-back)
        assert.ok(moveCall.args[0][1].v.x < 0);
    } finally {
        rec.restore();
    }
});

test('Batch 2B: feintingAttack migrates target recoil+wobble to .motion() while retaining translucent attacker decoy', async () => {
    const rec = installRecordingSequence();
    try {
        const token = makeToken('feintSrc', 100, 100);
        const target = makeToken('feintTgt', 200, 100);
        const seq = await feintingAttack.create(token, target);
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'feintingAttack');
        assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);

        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1);
        assert.equal(motions[0].initArgs[0], target);
        assert.ok(motions[0].calls.some(c => c.method === 'moveBy'));
        assert.ok(motions[0].calls.some(c => c.method === 'rotateBy'));

        // Translucent attacker decoy copySprite stays intact
        const copySprites = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
        assert.equal(copySprites.length, 1);
        assert.equal(copySprites[0].calls.find(c => c.method === 'copySprite').args[0], token);
    } finally {
        rec.restore();
    }
});

test('Batch 2B: lungingAttack migrates attacker lunge+hop to .motion() while grounding shadow, afterimages, and melee slash', async () => {
    const rec = installRecordingSequence();
    try {
        const token = makeToken('lungeSrc', 100, 100);
        const target = makeToken('lungeTgt', 300, 100);
        const seq = await lungingAttack.create(token, target);
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'lungingAttack');
        assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);

        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1);
        assert.equal(motions[0].initArgs[0], token);
        assert.equal(motions[0].calls.filter(c => c.method === 'moveBy').length, 2, 'parallel lunge + hop tracks');

        // Shadow + 2 tinted afterimages anchor with ignoreMotion: true so they do not double-displace
        const attackerClones = seq.sections.filter(
            s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite' && c.args[0] === token)
        );
        assert.equal(attackerClones.length, 3, 'blurred shadow + 2 ColorMatrix afterimages');
        for (const clone of attackerClones) {
            assert.equal(clone.calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, true);
        }

        // Translucent target shudder copySprite remains untouched
        const targetShudder = seq.sections.filter(
            s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite' && c.args[0] === target)
        );
        assert.equal(targetShudder.length, 1);
    } finally {
        rec.restore();
    }
});

test('Batch 2B: stunningStrike migrates attacker lunge to .motion() while keeping target shudder and dizzy stars', async () => {
    const rec = installRecordingSequence();
    try {
        const token = makeToken('ssSrc', 100, 100);
        const target = makeToken('ssTgt', 200, 100);
        const seq = await stunningStrike.create(token, target);
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'stunningStrike');
        assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);

        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1);
        assert.equal(motions[0].initArgs[0], token);

        const copySprites = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
        assert.equal(copySprites.length, 1, 'only translucent target shudder copySprite remains');
        assert.equal(copySprites[0].calls.find(c => c.method === 'copySprite').args[0], target);
    } finally {
        rec.restore();
    }
});

test('Batch 2B: stunningFist migrates attacker lunge and target knockback+rotation to .motion() while keeping translucent shudder overlay', async () => {
    const rec = installRecordingSequence();
    try {
        const token = makeToken('sfSrc', 100, 100);
        const target = makeToken('sfTgt', 200, 100);
        const seq = await stunningFist.create(token, target);
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'stunningFist');
        assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);

        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 2);
        const tgtMotion = motions.find(m => m.initArgs[0] === target);
        const atkMotion = motions.find(m => m.initArgs[0] === token);
        assert.ok(tgtMotion && atkMotion);
        assert.ok(tgtMotion.calls.some(c => c.method === 'moveBy'));
        assert.ok(tgtMotion.calls.some(c => c.method === 'rotateBy'));
        assert.ok(atkMotion.calls.some(c => c.method === 'moveBy'));

        // Only translucent target shudder copySprite remains (tracks motion position without duplicate position.x/y)
        const copySprites = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
        assert.equal(copySprites.length, 1);
        assert.equal(
            copySprites[0].calls.some(c => c.method === 'animateProperty' && c.args[1]?.startsWith('position')),
            false
        );
    } finally {
        rec.restore();
    }
});

test('Batch 2B: fireBlast migrates source recoil and target knockback to .motion() with zero opacity(0) hacks', async () => {
    const rec = installRecordingSequence();
    try {
        const source = makeToken('fbSrc', 100, 100);
        const target = makeToken('fbTgt', 400, 100);
        const seq = await fireBlast.create(source, target);
        assert.ok(seq);
        assertSequencer431MotionContracts(seq, 'fireBlast');
        assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);

        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 2);
        assert.equal(motions[0].initArgs[0], source);
        assert.equal(motions[1].initArgs[0], target);

        // Zero copySprite hacks
        assert.equal(seq.sections.some(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite')), false);
    } finally {
        rec.restore();
    }
});

test('Batch 2B: armsOfHadar pushes and recovers each target via .motion() with tracking shudder overlay and zero opacity(0)', async () => {
    const rec = installRecordingSequence();
    try {
        const caster = makeToken('aohCaster', 200, 200);
        const t1 = makeToken('aohT1', 300, 200);
        const t2 = makeToken('aohT2', 100, 300);
        const seq = await armsOfHadar.create(caster, { targets: [t1, t2] });
        assert.ok(seq);

        // Execute the thenDo block to capture per-target sequences
        const thenDoSections = seq.sections.filter(s => s.type === 'thenDo');
        assert.equal(thenDoSections.length, 1, 'preemptive opacity(0) thenDo block removed');
        thenDoSections[0].initArgs[0]();

        // Two child target sequences were spawned
        assert.equal(rec.sequences.length, 3);
        for (const childSeq of rec.sequences.slice(1)) {
            assertSequencer431MotionContracts(childSeq, 'armsOfHadar(target)');
            assert.equal(childSeq.sections.filter(s => s.type === 'animation').length, 0);
            const motions = childSeq.sections.filter(s => s.type === 'motion');
            assert.equal(motions.length, 1);
            const shudders = childSeq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
            assert.equal(shudders.length, 1, 'keeps translucent shudder overlay tracking motion');
        }
    } finally {
        rec.restore();
    }
});
