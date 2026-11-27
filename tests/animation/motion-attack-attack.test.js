import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    installRecordingSequence,
    assertSequencer431MotionContracts,
    makeToken,
} from '../helpers/motion-contract.js';
import { runStandaloneMacro } from '../helpers/standalone-runner.js';
import { attackAttack } from '../../src/animation/showcase/attack-attack.js';

globalThis.game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true });
globalThis.game.modules.set('eskie-effects', { id: 'eskie-effects', active: true });
globalThis.game.modules.set('psfx', { id: 'psfx', active: true });

test('attackAttack.create migrates all 3 acts to Sequencer 4.3.1 .motion() with 1:1 visual parity and zero opacity(0)', async () => {
    const rec = installRecordingSequence();
    const origEndEffects = Sequencer.EffectManager.endEffects;
    const origEndMotions = Sequencer.MotionManager.endMotions;
    const effectEnds = [];
    const motionEnds = [];
    Sequencer.EffectManager.endEffects = async (opts) => { effectEnds.push(opts); };
    Sequencer.MotionManager.endMotions = (target, opts) => { motionEnds.push({ target, opts }); return 1; };

    try {
        // Blue at col 0 (x=0), Red at col 9 (x=900) — exact 9-square duel setup
        const blue = makeToken('blue1', 0, 200);
        const red = makeToken('red1', 900, 200);

        const seq = attackAttack.create(red, blue);
        assert.ok(seq, 'attackAttack.create must return a Sequence');
        assertSequencer431MotionContracts(seq, 'attackAttack');

        // Zero animation opacity(0) or opacity(1) hacks anywhere across all 3 acts
        const opacityAnims = seq.sections.filter(
            s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity')
        );
        assert.equal(opacityAnims.length, 0, 'attackAttack must not hide/unhide tokens via animation().opacity()');

        // 10 motion sections total:
        // Act 1: blue charge, blue lock, red charge, red lock, blue recoil, red recoil (6)
        // Act 2: blue keyframes, red keyframes (2)
        // Act 3: red keyframes (non-persistent), blue keyframes (persistUntilUpdate) (2)
        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 10, 'Expected 10 motion sections across all 3 acts');

        // Act 1 lock oscillations use persist() + oscillate() with opposite phases
        const lockMotions = motions.filter(m => m.calls.some(c => c.method === 'name' && c.args[0] === 'gob-lock'));
        assert.equal(lockMotions.length, 2);
        for (const lm of lockMotions) {
            assert.ok(lm.calls.some(c => c.method === 'oscillate'));
            assert.ok(lm.calls.some(c => c.method === 'persist'));
            assert.equal(lm.calls.some(c => c.method === 'persistUntilUpdate'), false);
        }

        // Act 2 Blue & Red keyframe motions end at exact target grid offsets (+2 and +3)
        const act2Blue = motions[6];
        const act2Red = motions[7];
        assert.equal(act2Blue.initArgs[0], blue);
        assert.equal(act2Red.initArgs[0], red);
        const act2BlueFrames = act2Blue.calls.find(c => c.method === 'moveBy').args[0];
        const act2RedFrames = act2Red.calls.find(c => c.method === 'moveBy').args[0];
        assert.deepEqual(act2BlueFrames[act2BlueFrames.length - 1].v, { x: 2, y: 0 });
        assert.deepEqual(act2RedFrames[act2RedFrames.length - 1].v, { x: 3, y: 0 });
        assert.ok(act2Blue.calls.some(c => c.method === 'persistUntilUpdate'));
        assert.ok(act2Red.calls.some(c => c.method === 'persistUntilUpdate'));

        // Act 3 Red returns to r1 (net displacement 0) and MUST NOT use persistUntilUpdate()
        const act3Red = motions[8];
        const act3Blue = motions[9];
        assert.equal(act3Red.initArgs[0], red);
        assert.equal(act3Blue.initArgs[0], blue);
        assert.equal(
            act3Red.calls.some(c => c.method === 'persistUntilUpdate'),
            false,
            'Act 3 Red ends at its starting position r1 and must not set persistUntilUpdate()'
        );
        assert.equal(
            act3Red.calls.some(c => c.method === 'persist'),
            false,
            'Act 3 Red must terminate naturally at r1'
        );
        const act3RedMoves = act3Red.calls.filter(c => c.method === 'moveBy');
        assert.equal(act3RedMoves.length, 2, 'Act 3 Red has orthogonal X and Y keyframe tracks');
        assert.deepEqual(act3RedMoves[0].args[0][act3RedMoves[0].args[0].length - 1].v, { x: 0, y: 0 });
        assert.deepEqual(act3RedMoves[1].args[0][act3RedMoves[1].args[0].length - 1].v, { x: 0, y: 0 });
        assert.ok(act3Red.calls.some(c => c.method === 'rotateBy' && c.args[0] === -360));

        // Act 3 Blue travels b4 -> b1 (-5 grid units) and uses persistUntilUpdate()
        assert.ok(act3Blue.calls.some(c => c.method === 'persistUntilUpdate'));
        const act3BlueMoves = act3Blue.calls.filter(c => c.method === 'moveBy');
        assert.equal(act3BlueMoves.length, 2, 'Act 3 Blue has orthogonal X and Y keyframe tracks');
        assert.deepEqual(act3BlueMoves[0].args[0][act3BlueMoves[0].args[0].length - 1].v, { x: -5, y: 0 });
        assert.deepEqual(act3BlueMoves[1].args[0][act3BlueMoves[1].args[0].length - 1].v, { x: 0, y: 0 });
        assert.ok(act3Blue.calls.some(c => c.method === 'rotateBy' && c.args[0] === -360));

        // 1:1 visual parity: exactly 3 copySprite effects remain (Act 2 shiver overlay + Act 3 two blurred ground shadows)
        const copySprites = seq.sections.filter(
            s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite')
        );
        assert.equal(copySprites.length, 3, 'Expected only Act 2 shiver overlay + Act 3 two blurred ground shadows');

        const shiverOverlay = copySprites[0];
        assert.ok(shiverOverlay.calls.some(c => c.method === 'attachTo' && c.args[0] === red));
        assert.ok(shiverOverlay.calls.some(c => c.method === 'opacity' && c.args[0] === 0.25));

        const redShadow = copySprites[1];
        const blueShadow = copySprites[2];
        assert.ok(redShadow.calls.some(c => c.method === 'atLocation' && c.args[0] === red && c.args[1]?.ignoreMotion === true));
        assert.ok(blueShadow.calls.some(c => c.method === 'atLocation' && c.args[0] === blue && c.args[1]?.ignoreMotion === true));
        assert.ok(redShadow.calls.some(c => c.method === 'filter' && c.args[0] === 'Blur'));
        assert.ok(blueShadow.calls.some(c => c.method === 'filter' && c.args[0] === 'Blur'));

        // All 6 effects anchored via atLocation(blue|red) (4 charge trails + 2 Act 3 shadows) pass ignoreMotion: true
        const tokenAnchoredEffects = seq.sections.filter(
            s => s.type === 'effect' && s.calls.some(
                c => c.method === 'atLocation' && (c.args[0] === blue || c.args[0] === red)
            )
        );
        assert.equal(tokenAnchoredEffects.length, 6, 'Expected 4 charge trails + 2 Act 3 ground shadows anchored to tokens');
        for (const eff of tokenAnchoredEffects) {
            assert.ok(
                eff.calls.some(c => c.method === 'atLocation' && c.args[1]?.ignoreMotion === true),
                'All token-anchored trails and ground shadows must set ignoreMotion: true on atLocation()'
            );
        }

        // DB teleports: 2 in Act 1 (b3, r3), 2 in Act 2 (b4, r1), 1 in Act 3 (b1 only — Red stays at r1) = 5 total
        const teleports = seq.sections.filter(
            s => s.type === 'animation' && s.calls.some(c => c.method === 'teleportTo')
        );
        assert.equal(teleports.length, 5, 'Expected 5 DB teleport commits (Act 1 x2, Act 2 x2, Act 3 Blue only)');

        // Execute all thenDo callbacks to verify breakaway releases gob-lock motions with settle: 0
        for (const sec of seq.sections) {
            if (sec.type === 'thenDo' && typeof sec.initArgs[0] === 'function') {
                await sec.initArgs[0]();
            }
        }
        assert.ok(motionEnds.some(e => e.target === blue && e.opts?.name === 'gob-lock' && e.opts?.settle === 0));
        assert.ok(motionEnds.some(e => e.target === red && e.opts?.name === 'gob-lock' && e.opts?.settle === 0));
        assert.ok(effectEnds.some(e => e?.name === 'gob'));
        assert.ok(effectEnds.some(e => e?.name === 'Trail'));
    } finally {
        Sequencer.EffectManager.endEffects = origEndEffects;
        Sequencer.MotionManager.endMotions = origEndMotions;
        rec.restore();
    }
});

test('attackAttack.stop ends gob and gob-lock motions on both tokens plus gob and Trail effects', async () => {
    const origEndEffects = Sequencer.EffectManager.endEffects;
    const origEndMotions = Sequencer.MotionManager.endMotions;
    const effectEnds = [];
    const motionEnds = [];
    Sequencer.EffectManager.endEffects = async (opts) => { effectEnds.push(opts); };
    Sequencer.MotionManager.endMotions = (target, opts) => { motionEnds.push({ target, opts }); return 1; };

    try {
        const blue = makeToken('blueStop', 0, 200);
        const red = makeToken('redStop', 900, 200);

        await attackAttack.stop(red, blue);

        assert.ok(motionEnds.some(e => e.target === red && e.opts?.name === 'gob'));
        assert.ok(motionEnds.some(e => e.target === red && e.opts?.name === 'gob-lock'));
        assert.ok(motionEnds.some(e => e.target === blue && e.opts?.name === 'gob'));
        assert.ok(motionEnds.some(e => e.target === blue && e.opts?.name === 'gob-lock'));
        assert.ok(effectEnds.some(e => e?.name === 'gob'));
        assert.ok(effectEnds.some(e => e?.name === 'Trail'));
    } finally {
        Sequencer.EffectManager.endEffects = origEndEffects;
        Sequencer.MotionManager.endMotions = origEndMotions;
    }
});

test('attackAttack preserves token orientation (rotation, lockRotation, and considerTokenScale mirroring) on Act 2 shiver and Act 3 shadows', () => {
    const rec = installRecordingSequence();
    try {
        // Blue rotated 270 deg (unlocked), Red rotated 90 deg (unlocked)
        const blue = makeToken('blueRot', 0, 200, 270);
        const red = makeToken('redRot', 900, 200, 90);
        blue.document.lockRotation = false;
        red.document.lockRotation = false;

        const seq = attackAttack.create(red, blue);
        const copySprites = seq.sections.filter(
            s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite')
        );
        assert.equal(copySprites.length, 3);

        const [shiverOverlay, redShadow, blueShadow] = copySprites;

        // Act 2 shiver overlay unbinds attachTo rotation so horizontal shudder stays world-X,
        // zeroes copySprite container angle, and applies Red's exact visual rotation (+90)
        assert.ok(shiverOverlay.calls.some(c => c.method === 'attachTo' && c.args[1]?.bindRotation === false));
        assert.ok(shiverOverlay.calls.some(c => c.method === 'rotate' && c.args[0] === 0));
        assert.ok(shiverOverlay.calls.some(c => c.method === 'spriteRotation' && c.args[0] === 90));
        assert.ok(shiverOverlay.calls.some(c => c.method === 'scaleToObject' && c.args[1]?.considerTokenScale === true));

        // Act 3 shadows zero copySprite container angle, apply exact visual rotations (+90 / +270),
        // and preserve considerTokenScale: true (so texture.scaleX mirroring is never dropped)
        assert.ok(redShadow.calls.some(c => c.method === 'rotate' && c.args[0] === 0));
        assert.ok(redShadow.calls.some(c => c.method === 'spriteRotation' && c.args[0] === 90));
        const redScales = redShadow.calls.filter(c => c.method === 'scaleToObject');
        assert.equal(redScales.length, 1);
        assert.equal(redScales[0].args[0], 0.8);
        assert.equal(redScales[0].args[1]?.considerTokenScale, true);

        assert.ok(blueShadow.calls.some(c => c.method === 'rotate' && c.args[0] === 0));
        assert.ok(blueShadow.calls.some(c => c.method === 'spriteRotation' && c.args[0] === 270));
        const blueScales = blueShadow.calls.filter(c => c.method === 'scaleToObject');
        assert.equal(blueScales.length, 1);
        assert.equal(blueScales[0].args[0], 0.8);
        assert.equal(blueScales[0].args[1]?.considerTokenScale, true);

        // Locked-rotation tokens with non-zero document.rotation must render overlays/shadows at 0 deg
        const lockedBlue = makeToken('blueLocked', 0, 200, 180);
        const lockedRed = makeToken('redLocked', 900, 200, 90);
        lockedBlue.document.lockRotation = true;
        lockedRed.document.lockRotation = true;

        const lockedSeq = attackAttack.create(lockedRed, lockedBlue);
        const lockedSprites = lockedSeq.sections.filter(
            s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite')
        );
        for (const sprite of lockedSprites) {
            assert.ok(sprite.calls.some(c => c.method === 'rotate' && c.args[0] === 0));
            assert.ok(sprite.calls.some(c => c.method === 'spriteRotation' && c.args[0] === 0));
        }
    } finally {
        rec.restore();
    }
});

test('Standalone attack-attack.js: Run 1 uses .motion() + persistUntilUpdate + ignoreMotion trails, Run 2 toggles off cleanly via MotionManager', async () => {
    const blue = makeToken('sbBlue', 0, 200);
    const red = makeToken('sbRed', 900, 200);

    // Run 1: play duel
    const run1 = await runStandaloneMacro('attack-attack.js', {
        controlled: [red],
        targets: [blue],
        runThenDo: true,
    });
    assert.equal(run1.sequences.length, 1);
    const seq = run1.sequences[0];

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 6, 'Standalone duel creates charge + lock + recoil motions for both tokens');
    assert.equal(
        seq.sections.some(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity')),
        false,
        'Standalone attack-attack must not call animation().opacity()'
    );
    assert.equal(
        seq.sections.some(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite')),
        false,
        'Standalone attack-attack must not spawn copySprite clones'
    );

    const trails = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'name' && c.args[0] === 'Trail'));
    assert.equal(trails.length, 2);
    for (const trail of trails) {
        assert.ok(trail.calls.some(c => c.method === 'atLocation' && c.args[1]?.ignoreMotion === true));
    }

    assert.ok(run1.motionEnds.some(e => e.target === blue && e.opts?.name === 'gob-lock' && e.opts?.settle === 0));
    assert.ok(run1.motionEnds.some(e => e.target === red && e.opts?.name === 'gob-lock' && e.opts?.settle === 0));

    const teleports = seq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'teleportTo'));
    assert.equal(teleports.length, 2);

    // Run 2: toggle off when motions are active
    const run2 = await runStandaloneMacro('attack-attack.js', {
        controlled: [red],
        targets: [blue],
        activeMotionCount: 1,
    });
    assert.equal(run2.sequences.length, 0, 'Toggle-off must not spawn an opacity(1) Sequence');
    assert.ok(run2.motionEnds.some(e => e.target === red && e.opts?.name === 'gob'));
    assert.ok(run2.motionEnds.some(e => e.target === red && e.opts?.name === 'gob-lock'));
    assert.ok(run2.motionEnds.some(e => e.target === blue && e.opts?.name === 'gob'));
    assert.ok(run2.motionEnds.some(e => e.target === blue && e.opts?.name === 'gob-lock'));
    assert.ok(run2.effectEnds.some(e => e?.name === 'gob'));
    assert.ok(run2.effectEnds.some(e => e?.name === 'Trail'));
    assert.ok(run2.notifications.some(n => n.level === 'info' && n.m.includes('Stopped')));

    // Edge case: stacked tokens (0px travel) must not emit persistUntilUpdate or teleportTo
    const stackedA = makeToken('stackA', 300, 300);
    const stackedB = makeToken('stackB', 300, 300);
    const runStacked = await runStandaloneMacro('attack-attack.js', {
        controlled: [stackedA],
        targets: [stackedB],
    });
    const stackedSeq = runStacked.sequences[0];
    assert.equal(
        stackedSeq.sections.some(s => s.type === 'motion' && s.calls.some(c => c.method === 'persistUntilUpdate')),
        false,
        'Zero-travel duel must not emit persistUntilUpdate()'
    );
    assert.equal(
        stackedSeq.sections.some(s => s.type === 'animation' && s.calls.some(c => c.method === 'teleportTo')),
        false,
        'Zero-travel duel must not emit no-op teleportTo()'
    );
});
