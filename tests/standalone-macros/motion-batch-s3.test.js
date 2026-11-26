import test from 'node:test';
import assert from 'node:assert/strict';
import { runStandaloneMacro } from '../helpers/standalone-runner.js';
import { makeToken } from '../helpers/motion-contract.js';

function countOpacityZero(seq) {
    return seq.sections.filter(
        s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity' && c.args[0] === 0)
    ).length;
}

test('Batch S3 standalone: leap.js uses parabolic + 720deg .motion().persistUntilUpdate() and DB teleportTo', async () => {
    const res = await runStandaloneMacro('leap.js', {
        crosshairResult: { x: 450, y: 150 },
    });
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(countOpacityZero(seq), 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 1);
    assert.equal(motions[0].calls.filter(c => c.method === 'moveBy').length, 2);
    assert.equal(motions[0].calls.find(c => c.method === 'rotateBy')?.args[0], 720);
    assert.ok(motions[0].calls.some(c => c.method === 'persistUntilUpdate'));
    assert.ok(seq.sections.some(s => s.type === 'animation' && s.calls.some(c => c.method === 'teleportTo')));

    // Ground shadow copySprite remains (1 total)
    const copies = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
    assert.equal(copies.length, 1);
});

test('Batch S3 standalone: step-of-the-wind-jump.js uses parabolic + 360deg .motion().persistUntilUpdate() and DB teleportTo', async () => {
    const res = await runStandaloneMacro('step-of-the-wind-jump.js', {
        crosshairResult: { x: 450, y: 150 },
    });
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(countOpacityZero(seq), 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 1);
    assert.equal(motions[0].calls.filter(c => c.method === 'moveBy').length, 2);
    assert.equal(motions[0].calls.find(c => c.method === 'rotateBy')?.args[0], 360);
    assert.ok(motions[0].calls.some(c => c.method === 'persistUntilUpdate'));
    assert.ok(seq.sections.some(s => s.type === 'animation' && s.calls.some(c => c.method === 'teleportTo')));

    // Ground shadow copySprite remains (1 total)
    const copies = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
    assert.equal(copies.length, 1);
});

test('Batch S3 standalone: thorn-whip.js pulls target via .motion().persistUntilUpdate() + teleportTo while keeping shudder overlay', async () => {
    const res = await runStandaloneMacro('thorn-whip.js', {
        controlled: [makeToken('c1', 100, 100)],
        targets: [makeToken('t1', 500, 100)],
    });
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(countOpacityZero(seq), 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 1);
    assert.equal(motions[0].initArgs[0], res.targets[0]);
    assert.ok(motions[0].calls.some(c => c.method === 'persistUntilUpdate'));
    assert.ok(seq.sections.some(s => s.type === 'animation' && s.calls.some(c => c.method === 'teleportTo')));

    // Target shudder copySprite remains attached to target
    const copies = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
    assert.equal(copies.length, 1);
});

test('Batch S3 standalone: hook-and-pull.js pulls target via .motion().persistUntilUpdate() + teleportTo with zero opacity(0)', async () => {
    const res = await runStandaloneMacro('hook-and-pull.js', {
        controlled: [makeToken('c1', 100, 100)],
        targets: [makeToken('t1', 500, 100)],
    });
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(countOpacityZero(seq), 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 1);
    assert.equal(motions[0].initArgs[0], res.targets[0]);
    assert.ok(motions[0].calls.some(c => c.method === 'persistUntilUpdate'));
    assert.ok(seq.sections.some(s => s.type === 'animation' && s.calls.some(c => c.method === 'teleportTo')));
});

test('Batch S3 standalone: bait-and-switch.js swaps both tokens via dual .motion().persistUntilUpdate() while keeping blurred trail', async () => {
    const res = await runStandaloneMacro('bait-and-switch.js');
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(countOpacityZero(seq), 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 2);
    assert.equal(motions[0].initArgs[0], res.targets[0]);
    assert.equal(motions[1].initArgs[0], res.controlled[0]);
    assert.ok(motions.every(m => m.calls.some(c => c.method === 'persistUntilUpdate')));

    // Only 1 blurred trail copySprite remains
    const copies = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
    assert.equal(copies.length, 1);

    const teleports = seq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'teleportTo'));
    assert.equal(teleports.length, 2);
});

test('Batch S3 standalone: vortex-warp.js uses .motion() scaleTo(0.01)/rotateBy(180) out and keyframe spin-grow in', async () => {
    const res = await runStandaloneMacro('vortex-warp.js', {
        crosshairResult: { x: 650, y: 250 },
    });
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 2);
    assert.equal(motions[0].calls.find(c => c.method === 'scaleTo')?.args[0], 0.01);
    assert.ok(motions[0].calls.some(c => c.method === 'persistUntilUpdate'));
    assert.ok(Array.isArray(motions[1].calls.find(c => c.method === 'scaleTo')?.args[0]));
    assert.equal(seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite')).length, 0);
});

test('Batch S3 standalone: trip-attack.js knocks target prone via .motion().persistUntilUpdate() and anchors shadow/damage/smoke', async () => {
    const res = await runStandaloneMacro('trip-attack.js');
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(countOpacityZero(seq), 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 1);
    assert.equal(motions[0].initArgs[0], res.targets[0]);
    assert.equal(motions[0].calls.find(c => c.method === 'rotateBy')?.args[0], 90);
    assert.ok(motions[0].calls.some(c => c.method === 'persistUntilUpdate'));

    const copies = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
    assert.equal(copies.length, 1);
    assert.equal(copies[0].calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, true);
});

test('Batch S3 standalone: totemic-attunement-elk.js knocks target prone via .motion().persistUntilUpdate() with grounded shadow', async () => {
    const res = await runStandaloneMacro('totemic-attunement-elk.js');
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(countOpacityZero(seq), 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 1);
    assert.equal(motions[0].initArgs[0], res.targets[0]);
    assert.ok(motions[0].calls.some(c => c.method === 'persistUntilUpdate'));

    const copies = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
    assert.equal(copies.length, 1);
    assert.equal(copies[0].calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, true);
});

test('Batch S3 standalone: totemic-attunement-tiger.js pounces via .motion().persistUntilUpdate() + teleportTo and tracks aura', async () => {
    const res = await runStandaloneMacro('totemic-attunement-tiger.js', {
        controlled: [makeToken('c1', 100, 100)],
        targets: [makeToken('t1', 500, 100)],
    });
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(countOpacityZero(seq), 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 1);
    assert.equal(motions[0].initArgs[0], res.controlled[0]);
    assert.ok(motions[0].calls.some(c => c.method === 'persistUntilUpdate'));
    assert.ok(seq.sections.some(s => s.type === 'animation' && s.calls.some(c => c.method === 'teleportTo')));
});

test('Batch S3 standalone: totemic-attunement-wolf.js uses attacker lunge .motion() and target knockdown .motion().persistUntilUpdate()', async () => {
    const res = await runStandaloneMacro('totemic-attunement-wolf.js');
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(countOpacityZero(seq), 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 2);
    assert.equal(motions[0].initArgs[0], res.controlled[0]);
    assert.equal(motions[1].initArgs[0], res.targets[0]);
    assert.ok(motions[1].calls.some(c => c.method === 'persistUntilUpdate'));

    // Ground shadow copySprite uses ignoreMotion: true
    const shadow = seq.sections.find(
        s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite') && s.calls.some(c => c.method === 'belowTokens')
    );
    assert.ok(shadow);
    assert.equal(shadow.calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, true);
});

test('Batch S3 standalone: storming-dash-strikes.js chains additive .motion().persistUntilUpdate() segments + final DB teleportTo', async () => {
    const res = await runStandaloneMacro('storming-dash-strikes.js', {
        crosshairResults: [
            { x: 350, y: 150 },
            { x: 550, y: 350 },
            { cancelled: true },
        ],
    });

    const dashMotions = res.sequences.flatMap(s => s.sections.filter(sec => sec.type === 'motion'));
    // Main sequence merges 2 stepSeqs via addSequence; each segment creates 1 persistUntilUpdate motion
    assert.ok(dashMotions.length >= 2);
    assert.ok(dashMotions.every(m => m.calls.some(c => c.method === 'persistUntilUpdate')));

    for (const seq of res.sequences) {
        assert.equal(countOpacityZero(seq), 0);
    }

    const teleports = res.sequences.flatMap(s =>
        s.sections.filter(sec => sec.type === 'animation' && sec.calls.some(c => c.method === 'teleportTo'))
    );
    assert.ok(teleports.length >= 1);
});

test('Batch S3 standalone: starward-sword.js finisher knocks targets down via .motion() without DB rotate churn', async () => {
    const target = makeToken('t1', 350, 200);
    const res = await runStandaloneMacro('starward-sword.js', {
        targets: [target],
        crosshairResult: { x: 350, y: 200 },
        runThenDo: true,
    });

    // Finisher thenDo spawns a target knockdown sequence with a single .motion(target)
    const finisherMotions = res.sequences.flatMap(s =>
        s.sections.filter(sec => sec.type === 'motion' && sec.initArgs[0] === target)
    );
    assert.equal(finisherMotions.length, 1);
    assert.ok(finisherMotions[0].calls.some(c => c.method === 'moveBy'));
    assert.ok(finisherMotions[0].calls.some(c => c.method === 'rotateBy'));

    // Finisher sequence has zero DB rotate() animations on target
    const targetRotateAnims = res.sequences.flatMap(s =>
        s.sections.filter(
            sec =>
                sec.type === 'animation'
                && sec.calls.some(c => c.method === 'on' && c.args[0] === target)
                && sec.calls.some(c => c.method === 'rotate')
        )
    );
    assert.equal(targetRotateAnims.length, 0);
});
