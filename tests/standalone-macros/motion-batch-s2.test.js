import test from 'node:test';
import assert from 'node:assert/strict';
import { runStandaloneMacro } from '../helpers/standalone-runner.js';
import { makeToken } from '../helpers/motion-contract.js';

function countOpacityZero(seq) {
    return seq.sections.filter(
        s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity' && c.args[0] === 0)
    ).length;
}

test('Batch S2 standalone: pushing-attack.js uses attacker keyframe .motion() and target .persistUntilUpdate() + teleportTo', async () => {
    const res = await runStandaloneMacro('pushing-attack.js');
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(countOpacityZero(seq), 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 2);
    assert.equal(motions[0].initArgs[0], res.controlled[0]);
    assert.equal(motions[1].initArgs[0], res.targets[0]);
    assert.ok(motions[1].calls.some(c => c.method === 'persistUntilUpdate'));

    const teleportAnim = seq.sections.find(s => s.type === 'animation' && s.calls.some(c => c.method === 'teleportTo'));
    assert.ok(teleportAnim, 'pushing-attack must commit target teleportTo after motion wait');
});

test('Batch S2 standalone: hit-the-dirt.js uses parabolic .motion().persistUntilUpdate() + DB teleportTo/rotate and anchors ground shadow/dust', async () => {
    const res = await runStandaloneMacro('hit-the-dirt.js', {
        crosshairResult: { x: 450, y: 150 },
    });
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(countOpacityZero(seq), 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 1);
    assert.equal(motions[0].calls.filter(c => c.method === 'moveBy').length, 2);
    assert.equal(motions[0].calls.filter(c => c.method === 'rotateBy').length, 1);
    assert.ok(motions[0].calls.some(c => c.method === 'persistUntilUpdate'));

    // Only 1 copySprite remains (blurred ground shadow) with ignoreMotion: true
    const copySprites = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
    assert.equal(copySprites.length, 1);
    assert.equal(copySprites[0].calls.find(c => c.method === 'atLocation')?.args[1]?.ignoreMotion, true);

    // Toggle-off clears persistent effect and restores rotation
    const toggleRes = await runStandaloneMacro('hit-the-dirt.js', { activeEffects: [{ id: 'htd1' }] });
    assert.ok(toggleRes.effectEnds.length >= 1);
    assert.equal(toggleRes.sequences.length, 1);
    assert.ok(toggleRes.sequences[0].sections.some(s => s.type === 'animation' && s.calls.some(c => c.method === 'rotate')));
});

test('Batch S2 standalone: parry.js uses .motion() step-back keyframes with zero opacity(0) or copySprite', async () => {
    const res = await runStandaloneMacro('parry.js');
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);
    assert.equal(seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite')).length, 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 1);
    assert.equal(motions[0].initArgs[0], res.controlled[0]);
    assert.equal(motions[0].calls.find(c => c.method === 'name')?.args[0], 'Parry');
});

test('Batch S2 standalone: feinting-attack.js uses target .motion() flinch+wobble and retains translucent attacker feint decoy', async () => {
    const res = await runStandaloneMacro('feinting-attack.js');
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 1);
    assert.equal(motions[0].initArgs[0], res.targets[0]);
    assert.ok(motions[0].calls.some(c => c.method === 'moveBy'));
    assert.ok(motions[0].calls.some(c => c.method === 'rotateBy'));

    // Translucent attacker decoy stays copySprite
    const copySprites = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
    assert.equal(copySprites.length, 1);
    assert.equal(copySprites[0].calls.find(c => c.method === 'copySprite')?.args[0], res.controlled[0]);
});

test('Batch S2 standalone: lunging-attack.js uses .motion() lunge+hop and keeps shadow, 2 afterimages, and target shudder', async () => {
    const res = await runStandaloneMacro('lunging-attack.js');
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 1);
    assert.equal(motions[0].calls.filter(c => c.method === 'moveBy').length, 2);

    // 1 ground shadow + 2 cyan afterimages (all ignoreMotion: true) + 1 target shudder = 4 copySprites
    const copySprites = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
    assert.equal(copySprites.length, 4);
    const attackerCopySprites = copySprites.filter(
        s => s.calls.find(c => c.method === 'copySprite')?.args[0] === res.controlled[0]
    );
    assert.equal(attackerCopySprites.length, 3);
    for (const fx of attackerCopySprites) {
        assert.equal(fx.calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, true);
    }
});

test('Batch S2 standalone: stunning-strike.js uses attacker .motion() lunge, keeps target shudder and dizzy stars toggle', async () => {
    const res = await runStandaloneMacro('stunning-strike.js');
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 1);
    assert.equal(motions[0].initArgs[0], res.controlled[0]);

    const copySprites = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
    assert.equal(copySprites.length, 1);
    assert.equal(copySprites[0].calls.find(c => c.method === 'copySprite')?.args[0], res.targets[0]);
});

test('Batch S2 standalone: stunning-fist.js uses attacker + target .motion() and keeps translucent target shudder tracking motion', async () => {
    const res = await runStandaloneMacro('stunning-fist.js');
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 2);
    const targetMotion = motions.find(m => m.initArgs[0] === res.targets[0]);
    const attackerMotion = motions.find(m => m.initArgs[0] === res.controlled[0]);
    assert.ok(targetMotion && attackerMotion);
    assert.ok(targetMotion.calls.some(c => c.method === 'rotateBy'));

    const copySprites = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
    assert.equal(copySprites.length, 1);
    assert.equal(copySprites[0].calls.find(c => c.method === 'copySprite')?.args[0], res.targets[0]);
    assert.equal(copySprites[0].calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, undefined);
});

test('Batch S2 standalone: fire-blast.js uses source recoil + target knockback .motion() with zero opacity(0) or copySprite', async () => {
    const res = await runStandaloneMacro('fire-blast.js');
    assert.equal(res.sequences.length, 1);
    const seq = res.sequences[0];
    assert.equal(seq.sections.filter(s => s.type === 'animation').length, 0);
    assert.equal(seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite')).length, 0);

    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 2);
    assert.equal(motions[0].initArgs[0], res.controlled[0]);
    assert.equal(motions[1].initArgs[0], res.targets[0]);
});

test('Batch S2 standalone: arms-of-hadar.js uses per-target .motion() knockback+return and tracking shudder overlay inside thenDo', async () => {
    const t1 = makeToken('t1', 300, 100);
    const t2 = makeToken('t2', 100, 300);
    const res = await runStandaloneMacro('arms-of-hadar.js', {
        targets: [t1, t2],
        runThenDo: true,
    });

    // Main sequence + 2 per-target knockback sequences spawned in thenDo
    assert.equal(res.sequences.length, 3);
    for (const seq of res.sequences) {
        assert.equal(countOpacityZero(seq), 0);
    }

    const targetMotions = res.sequences.slice(1).flatMap(s => s.sections.filter(sec => sec.type === 'motion'));
    assert.equal(targetMotions.length, 2);
    assert.equal(targetMotions[0].initArgs[0], t1);
    assert.equal(targetMotions[1].initArgs[0], t2);

    // Each target keeps 1 translucent shudder overlay attached to target (tracks motion)
    for (const targetSeq of res.sequences.slice(1)) {
        const copies = targetSeq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
        assert.equal(copies.length, 1);
        assert.equal(copies[0].calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion, undefined);
    }
});
