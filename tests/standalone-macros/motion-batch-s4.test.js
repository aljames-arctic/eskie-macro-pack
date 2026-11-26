import test from 'node:test';
import assert from 'node:assert/strict';
import { runStandaloneMacro } from '../helpers/standalone-runner.js';
import { makeToken } from '../helpers/motion-contract.js';

test('Batch S4 standalone: banishment.js uses .motion() struggle/pull-in on banish and bounce-in on return toggle', async () => {
    // Run-1: Banish pull-in
    const resBanish = await runStandaloneMacro('banishment.js');
    assert.equal(resBanish.sequences.length, 1);
    const banishSeq = resBanish.sequences[0];

    const banishMotions = banishSeq.sections.filter(s => s.type === 'motion');
    assert.equal(banishMotions.length, 1);
    assert.equal(banishMotions[0].initArgs[0], resBanish.targets[0]);
    assert.equal(banishMotions[0].calls.find(c => c.method === 'scaleTo')?.args[0], 0.01);
    assert.equal(banishMotions[0].calls.filter(c => c.method === 'rotateBy').length, 2);

    // Only 1 copySprite remains (dissipating ground shadow anchored via ignoreMotion: true)
    const banishCopies = banishSeq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
    assert.equal(banishCopies.length, 1);
    assert.equal(banishCopies[0].calls.find(c => c.method === 'atLocation')?.args[1]?.ignoreMotion, true);

    // Stop-section exclusivity: target is hidden at end of banish and never shown in Run-1
    assert.ok(banishSeq.sections.some(s => s.type === 'animation' && s.calls.some(c => c.method === 'show' && c.args[0] === false)));
    assert.equal(banishSeq.sections.some(s => s.type === 'animation' && s.calls.some(c => c.method === 'show' && c.args[0] === true)), false);

    // Run-2: Return / Unbanish bounce-in
    const resReturn = await runStandaloneMacro('banishment.js', {
        activeEffects: [{ id: 'banish1' }],
    });
    assert.equal(resReturn.sequences.length, 1);
    const returnSeq = resReturn.sequences[0];
    assert.ok(resReturn.effectEnds.length >= 1);
    assert.ok(resReturn.motionEnds.length >= 1);

    const returnMotions = returnSeq.sections.filter(s => s.type === 'motion');
    assert.equal(returnMotions.length, 1);
    assert.ok(Array.isArray(returnMotions[0].calls.find(c => c.method === 'moveBy')?.args[0]));
    assert.ok(Array.isArray(returnMotions[0].calls.find(c => c.method === 'scaleTo')?.args[0]));
    assert.ok(returnSeq.sections.some(s => s.type === 'animation' && s.calls.some(c => c.method === 'show' && c.args[0] === true)));
});

test('Batch S4 standalone: banishing-arrow.js spin-shrinks via .motion(), hides exclusively until toggle-off, and ends motions', async () => {
    const resStart = await runStandaloneMacro('banishing-arrow.js');
    assert.equal(resStart.sequences.length, 1);
    const seq = resStart.sequences[0];

    // Zero copySprites remain
    assert.equal(seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite')).length, 0);

    // Spin-shrink motion targeting target
    const motions = seq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 1);
    assert.equal(motions[0].initArgs[0], resStart.targets[0]);
    assert.equal(motions[0].calls.find(c => c.method === 'scaleTo')?.args[0], 0.01);
    assert.equal(motions[0].calls.find(c => c.method === 'rotateBy')?.args[0], 360);

    // Delayed hide() fires at t=2000ms (after wait(500) + delay(1500)) and never calls show() on Run-1
    const hideAnim = seq.sections.find(s => s.type === 'animation' && s.calls.some(c => c.method === 'hide'));
    assert.ok(hideAnim);
    assert.equal(hideAnim.calls.find(c => c.method === 'delay')?.args[0], 1500);
    assert.equal(seq.sections.some(s => s.type === 'animation' && s.calls.some(c => c.method === 'show')), false);

    // Toggle-off restores show() and cleans up both effects and motions
    const resStop = await runStandaloneMacro('banishing-arrow.js', {
        activeEffects: [{ id: 'ba1' }],
    });
    assert.ok(resStop.effectEnds.length >= 1);
    assert.ok(resStop.motionEnds.length >= 1);
    assert.ok(resStop.sequences[0].sections.some(s => s.type === 'animation' && s.calls.some(c => c.method === 'show')));
});

test('Batch S4 standalone: enlarge-reduce.js uses .motion() wobble + easeOutBounce scale-in for both enlarge and reduce', async () => {
    for (const mode of ['enlarge', 'reduce']) {
        const token = makeToken(`er_${mode}`, 100, 100);
        const updates = [];
        token.document.update = async (data) => { updates.push(data); };

        const res = await runStandaloneMacro('enlarge-reduce.js', {
            controlled: [token],
            dialogResult: mode,
            runThenDo: true,
        });

        assert.equal(res.sequences.length, 1, `${mode}: expected 1 sequence`);
        const seq = res.sequences[0];

        const motions = seq.sections.filter(s => s.type === 'motion');
        assert.equal(motions.length, 2, `${mode}: expected pre-resize wobble + post-resize bounce motions`);
        assert.ok(motions[0].calls.some(c => c.method === 'oscillate'), `${mode}: first motion must oscillate rotation`);
        assert.ok(Array.isArray(motions[1].calls.find(c => c.method === 'scaleTo')?.args[0]), `${mode}: second motion must bounce scaleTo`);

        // Only 1 translucent expanding pulse copySprite remains (not 3)
        const copies = seq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
        assert.equal(copies.length, 1, `${mode}: only translucent expanding ghost copySprite should remain`);
        assert.equal(updates.length, 1, `${mode}: document resize update should run in thenDo`);
    }
});

test('Batch S4 standalone: sun-halo-dragon.js dashes via .motion().persistUntilUpdate(), keeps blurred afterimage and polygon death splits', async () => {
    const target = makeToken('tgt1', 300, 100);
    const res = await runStandaloneMacro('sun-halo-dragon.js', {
        targets: [target],
        crosshairResult: { x: 650, y: 150 },
        runThenDo: true,
    });

    // Main sequence + 1 death effect sequence
    assert.equal(res.sequences.length, 2);
    const mainSeq = res.sequences[0];

    // Zero opacity(0) on caster in main sequence
    assert.equal(
        mainSeq.sections.filter(s => s.type === 'animation' && s.calls.some(c => c.method === 'opacity' && c.args[0] === 0)).length,
        0
    );

    const motions = mainSeq.sections.filter(s => s.type === 'motion');
    assert.equal(motions.length, 1);
    assert.equal(motions[0].initArgs[0], res.controlled[0]);
    assert.ok(motions[0].calls.some(c => c.method === 'persistUntilUpdate'));
    assert.ok(mainSeq.sections.some(s => s.type === 'animation' && s.calls.some(c => c.method === 'teleportTo')));

    // Only 1 caster copySprite remains (the blurred afterimage)
    const casterCopies = mainSeq.sections.filter(s => s.type === 'effect' && s.calls.some(c => c.method === 'copySprite'));
    assert.equal(casterCopies.length, 1);
    assert.ok(casterCopies[0].calls.some(c => c.method === 'filter' && c.args[0] === 'Blur'));

    // Death effect sequence preserves polygon mask splits
    const deathSeq = res.sequences[1];
    const polygonShapes = deathSeq.sections.filter(s => s.calls.some(c => c.method === 'shape' && c.args[0] === 'polygon'));
    assert.equal(polygonShapes.length, 4);
});
