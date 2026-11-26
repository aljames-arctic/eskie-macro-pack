import assert from 'node:assert/strict';

/**
 * Recording Sequence mock that captures every section (effect, motion, animation, wait, etc.)
 * and every chained method call + arguments for contract verification against Sequencer 4.3.1.
 */
export function installRecordingSequence() {
    const OrigSequence = globalThis.Sequence;
    const sequences = [];

    class RecordingSequence {
        constructor() {
            this.sections = [];
            this.currentSection = null;
            sequences.push(this);

            const sectionStarters = new Set([
                'effect',
                'motion',
                'animation',
                'sound',
                'wait',
                'thenDo',
                'canvasPan',
                'addSequence',
            ]);

            const handler = {
                get: (target, prop) => {
                    if (prop === 'sections' || prop === 'currentSection') return target[prop];
                    if (prop === 'play') return async () => proxy;
                    if (prop === 'then') return undefined;
                    return (...args) => {
                        if (prop === 'addSequence') {
                            const sub = args[0];
                            if (sub?.sections) {
                                target.sections.push(...sub.sections);
                                target.currentSection = sub.currentSection ?? target.currentSection;
                            }
                            return proxy;
                        }
                        if (sectionStarters.has(prop)) {
                            const sec = { type: prop, initArgs: args, calls: [] };
                            target.sections.push(sec);
                            target.currentSection = sec;
                        } else if (target.currentSection) {
                            target.currentSection.calls.push({ method: prop, args });
                        }
                        return proxy;
                    };
                },
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
        },
    };
}

/**
 * Validates that every motion section in a recorded sequence satisfies all strict
 * Sequencer 4.3.1 MotionSection runtime validation contracts from motion.js.
 */
export function assertSequencer431MotionContracts(recordedSequence, label) {
    const validWaveforms = new Set(['sine', 'triangle', 'square']);
    const trackMethods = new Set([
        'moveTo',
        'moveBy',
        'rotateTo',
        'rotateBy',
        'scaleTo',
        'scaleBy',
        'fadeTo',
        'fadeBy',
        'tintTo',
    ]);
    const coordTracks = new Set(['moveTo', 'moveBy']);

    for (const sec of recordedSequence.sections) {
        if (sec.type !== 'motion') continue;
        const methods = sec.calls.map(c => c.method);
        const isPersist = methods.includes('persist');
        const isPersistUntilUpdate = methods.includes('persistUntilUpdate');

        assert.equal(
            methods.includes('rotateTowards'),
            false,
            `${label}: MotionSection does not support .rotateTowards()`
        );
        assert.equal(
            isPersist && isPersistUntilUpdate,
            false,
            `${label}: persist() and persistUntilUpdate() are mutually exclusive`
        );
        if (isPersist || isPersistUntilUpdate) {
            assert.equal(
                methods.includes('waitUntilFinished'),
                false,
                `${label}: never call waitUntilFinished() on persistent motion`
            );
        }

        for (const call of sec.calls) {
            if (trackMethods.has(call.method)) {
                const [val, opts = {}] = call.args;
                if (isPersistUntilUpdate) {
                    assert.equal(
                        opts.return,
                        false,
                        `${label}: ${call.method} under persistUntilUpdate() must set return: false`
                    );
                }

                if (opts.return === false) {
                    assert.equal(
                        opts.returnDuration,
                        undefined,
                        `${label}: ${call.method} cannot combine return: false with returnDuration`
                    );
                    assert.equal(
                        opts.returnValues,
                        undefined,
                        `${label}: ${call.method} cannot combine return: false with returnValues`
                    );
                }

                if (!Array.isArray(val)) {
                    assert.ok(
                        typeof opts.duration === 'number' && opts.duration > 0,
                        `${label}: single-target ${call.method} requires positive duration`
                    );
                    if (call.method === 'scaleTo') {
                        if (typeof val === 'number') {
                            assert.ok(val > 0, `${label}: scaleTo must be strictly > 0`);
                        } else if (val && typeof val === 'object') {
                            if (val.x !== undefined) assert.ok(val.x > 0, `${label}: scaleTo.x must be > 0`);
                            if (val.y !== undefined) assert.ok(val.y > 0, `${label}: scaleTo.y must be > 0`);
                        }
                    }
                } else {
                    assert.ok(val.length >= 2, `${label}: keyframe ${call.method} requires >= 2 entries`);
                    assert.equal(
                        val[0]?.duration,
                        undefined,
                        `${label}: keyframe ${call.method}[0] must not specify duration`
                    );

                    const hasTrackDuration = typeof opts.duration === 'number' && opts.duration > 0;
                    const perKeyCount = val.slice(1).filter(k => k && typeof k === 'object' && k.duration !== undefined).length;
                    const allPerKey = perKeyCount === val.length - 1
                        && val.slice(1).every(k => typeof k.duration === 'number' && k.duration > 0);
                    assert.ok(
                        (hasTrackDuration && perKeyCount === 0) || (!hasTrackDuration && allPerKey),
                        `${label}: keyframe ${call.method} requires EITHER track-level duration OR per-key durations on every key after index 0 (not both)`
                    );

                    if (coordTracks.has(call.method)) {
                        for (let i = 0; i < val.length; i++) {
                            const entry = val[i];
                            const coord = (entry && typeof entry === 'object' && 'v' in entry) ? entry.v : entry;
                            assert.ok(
                                coord && typeof coord.x === 'number' && typeof coord.y === 'number',
                                `${label}: keyframe ${call.method}[${i}] must provide numeric x and y`
                            );
                        }
                    }
                    if (call.method === 'scaleTo') {
                        for (let i = 0; i < val.length; i++) {
                            const entry = val[i];
                            const sv = (entry && typeof entry === 'object' && 'v' in entry) ? entry.v : entry;
                            if (typeof sv === 'number') {
                                assert.ok(sv > 0, `${label}: keyframe scaleTo[${i}] must be > 0`);
                            } else {
                                assert.ok(
                                    sv && typeof sv.x === 'number' && sv.x > 0 && typeof sv.y === 'number' && sv.y > 0,
                                    `${label}: keyframe scaleTo[${i}] object must provide positive x and y`
                                );
                            }
                        }
                    }
                }
            }

            if (call.method === 'oscillate') {
                const [opts] = call.args;
                assert.ok(typeof opts?.period === 'number' && opts.period > 0, `${label}: oscillate requires positive period`);
                assert.ok(validWaveforms.has(opts?.waveform), `${label}: oscillate requires valid waveform`);
                const axes = ['x', 'y', 'rotation', 'scale', 'alpha'].filter(a => opts[a] !== undefined);
                assert.ok(axes.length > 0, `${label}: oscillate requires at least one axis`);
                for (const axis of axes) {
                    const cfg = opts[axis];
                    const phase = cfg.phase ?? 0;
                    assert.ok(phase >= 0, `${label}: oscillate ${axis}.phase should be non-negative`);
                    if (axis === 'x' || axis === 'y') {
                        const hasAmp = cfg.amplitude !== undefined;
                        const hasScaled = cfg.strengthScaledToObject !== undefined;
                        assert.ok(hasAmp !== hasScaled, `${label}: oscillate ${axis} requires XOR(amplitude, strengthScaledToObject)`);
                    }
                }
            }

            if (call.method === 'noise') {
                const [opts] = call.args;
                assert.ok(typeof opts?.frequency === 'number' && opts.frequency > 0, `${label}: noise requires positive frequency`);
                const hasStr = opts?.strength !== undefined;
                const hasScaled = opts?.strengthScaledToObject !== undefined;
                assert.ok(hasStr !== hasScaled, `${label}: noise requires XOR(strength, strengthScaledToObject)`);
                assert.equal(opts?.gridUnits, undefined, `${label}: noise does not accept gridUnits`);
            }
        }
    }
}

export function makeToken(id, x, y, rotation = 0, width = 1, height = 1) {
    const w = width * 100;
    const h = height * 100;
    return {
        id,
        name: `Token ${id}`,
        x,
        y,
        w,
        h,
        center: { x: x + w / 2, y: y + h / 2 },
        document: {
            id,
            uuid: `Scene.s1.Token.${id}`,
            documentName: 'Token',
            x,
            y,
            width,
            height,
            rotation,
            elevation: 0,
            texture: { src: 'token.png', scaleX: 1, scaleY: 1 },
        },
    };
}

export function makeTile(id, x, y, width = 200, height = 200, rotation = 0) {
    return {
        id,
        name: `Tile ${id}`,
        x,
        y,
        w: width,
        h: height,
        center: { x: x + width / 2, y: y + height / 2 },
        document: {
            id,
            uuid: `Scene.s1.Tile.${id}`,
            documentName: 'Tile',
            x,
            y,
            width,
            height,
            rotation,
            elevation: 0,
            hidden: false,
            texture: { src: 'tile.png', scaleX: 1, scaleY: 1 },
        },
    };
}
