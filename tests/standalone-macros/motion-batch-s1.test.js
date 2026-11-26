import test from 'node:test';
import assert from 'node:assert/strict';
import { runStandaloneMacro } from '../helpers/standalone-runner.js';

const PERSISTENT_S1_MACROS = [
    { file: 'fly.js', label: 'fly - caster1', hasShadow: true },
    { file: 'levitation.js', label: 'levitation - caster1', hasShadow: true },
    { file: 'wings.js', label: 'wings - caster1', hasShadow: true, dialogResult: 'angelic' },
    { file: 'drunk.js', label: 'drunk - caster1', hasShadow: false },
    { file: 'aerodyne-vehicle.js', label: 'Fly', hasShadow: true },
    { file: 'speak-with-dead.js', label: 'speakWithDead - caster1', hasShadow: true },
    { file: 'totemic-attunement-eagle.js', label: 'Eagle Totemic Attunement - caster1', hasShadow: true },
    { file: 'laugh.js', label: 'laugh-caster1', hasShadow: false },
];

for (const spec of PERSISTENT_S1_MACROS) {
    test(`Batch S1 standalone: ${spec.file} Run-1 uses .motion().persist(), zero opacity(0), and proper motion/ground anchoring`, async () => {
        const res = await runStandaloneMacro(spec.file, {
            dialogResult: spec.dialogResult ?? null,
        });

        assert.ok(res.sequences.length >= 1, `${spec.file}: expected at least 1 Sequence on Run-1`);
        const seq = res.sequences[0];

        // Zero animation().opacity(0) hide hacks
        const opacityZeroAnims = seq.sections.filter(
            s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity' && c.args[0] === 0)
        );
        assert.equal(opacityZeroAnims.length, 0, `${spec.file}: must not hide token with animation().opacity(0)`);

        // Exactly one persistent motion targeting the selected token
        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 1, `${spec.file}: expected 1 motion section`);
        assert.equal(motions[0].initArgs[0], res.controlled[0]);
        assert.ok(motions[0].calls.some(c => c.method === 'persist'), `${spec.file}: motion must persist()`);
        assert.ok(motions[0].calls.some(c => c.method === 'oscillate'), `${spec.file}: motion must oscillate()`);
        const nameCall = motions[0].calls.find(c => c.method === 'name');
        assert.equal(nameCall?.args[0], spec.label, `${spec.file}: motion name should match label`);

        // Ground shadow copySprite (when present) must be anchored with ignoreMotion: true, and no floating body copySprite remains
        const copySprites = seq.sections.filter(
            s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite')
        );
        if (spec.hasShadow) {
            assert.equal(copySprites.length, 1, `${spec.file}: expected exactly 1 ground-shadow copySprite`);
            assert.equal(
                copySprites[0].calls.find(c => c.method === 'attachTo')?.args[1]?.ignoreMotion,
                true,
                `${spec.file}: ground shadow copySprite must anchor with ignoreMotion: true`
            );
        } else {
            assert.equal(copySprites.length, 0, `${spec.file}: expected 0 copySprites`);
        }
    });

    test(`Batch S1 standalone: ${spec.file} Run-2 toggles off cleanly via active effects OR active motions`, async () => {
        const assertNoPersistentStart = (res, mode) => {
            const persistentSections = res.sequences.flatMap(s =>
                s.sections.filter(sec => sec.calls.some(c => c.method === 'persist'))
            );
            const motionSections = res.sequences.flatMap(s => s.sections.filter(sec => sec.type === 'motion'));
            assert.equal(persistentSections.length, 0, `${spec.file} (${mode}): toggle-off must not spawn persistent sections`);
            assert.equal(motionSections.length, 0, `${spec.file} (${mode}): toggle-off must not start new motions`);
            assert.ok(res.effectEnds.length >= 1, `${spec.file} (${mode}): toggle-off must call EffectManager.endEffects`);
            assert.ok(res.motionEnds.length >= 1, `${spec.file} (${mode}): toggle-off must call MotionManager.endMotions`);
        };

        // Toggle off when active effects exist
        const resEffects = await runStandaloneMacro(spec.file, {
            activeEffects: [{ id: 'fx1' }],
            activeMotionCount: 0,
            dialogResult: spec.dialogResult ?? null,
        });
        assertNoPersistentStart(resEffects, 'active-effects');

        // Toggle off when only a persistent motion is active (zero effects)
        const resMotionOnly = await runStandaloneMacro(spec.file, {
            activeEffects: [],
            activeMotionCount: 1,
            dialogResult: spec.dialogResult ?? null,
        });
        assertNoPersistentStart(resMotionOnly, 'motion-only');
    });
}

test('Batch S1 standalone: mirror-image.js V2 uses .motion().fadeTo(0.5) while keeping all 5 filtered illusion clones', async () => {
    const res = await runStandaloneMacro('mirror-image.js', {
        dialogResult: 'v2',
    });

    assert.equal(res.sequences.length, 4, 'mirror-image V2 creates main sequence + 3 child image sequences merged via addSequence');
    const mainSeq = res.sequences[0];

    // Zero animation().opacity(0) in V2
    assert.equal(mainSeq.sections.filter(s => s.type === 'animation').length, 0);

    // One fadeTo(0.5) motion on primary token
    const motions = mainSeq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 1);
    assert.equal(motions[0].initArgs[0], res.controlled[0]);
    const fadeCall = motions[0].calls.find(c => c.method === 'fadeTo');
    assert.ok(fadeCall);
    assert.equal(fadeCall.args[0], 0.5);

    // 2 casting split-flashes + 3 orbiting purple illusion clones remain copySprite effects
    const cloneEffects = mainSeq.sections.filter(
        s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite')
    );
    assert.equal(cloneEffects.length, 5);
});
