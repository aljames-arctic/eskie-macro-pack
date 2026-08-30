import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../src/animation/utils/sound.js';

class MockSoundEffect {
    constructor() {
        this.calls = [];
    }
    file(f) { this.calls.push({ method: 'file', value: f }); return this; }
    volume(v) { this.calls.push({ method: 'volume', value: v }); return this; }
    delay(d) { this.calls.push({ method: 'delay', value: d }); return this; }
    fadeIn(f) { this.calls.push({ method: 'fadeIn', value: f }); return this; }
    fadeOut(f) { this.calls.push({ method: 'fadeOut', value: f }); return this; }
    startTime(t) { this.calls.push({ method: 'startTime', value: t }); return this; }
    endTime(t) { this.calls.push({ method: 'endTime', value: t }); return this; }
    timeRange(s, e) { this.calls.push({ method: 'timeRange', value: [s, e] }); return this; }
}

class MockSequence {
    constructor() {
        this.sounds = [];
    }
    sound() {
        const snd = new MockSoundEffect();
        this.sounds.push(snd);
        return snd;
    }
}

test('DEFAULT_SOUND_CONFIG contract specifications', () => {
    assert.equal(DEFAULT_SOUND_CONFIG.enable, false);
    assert.equal(DEFAULT_SOUND_CONFIG.file, '');
    assert.equal(DEFAULT_SOUND_CONFIG.delay, 0);
    assert.equal(DEFAULT_SOUND_CONFIG.volume, 0.5);
    assert.equal(DEFAULT_SOUND_CONFIG.fadeIn, 0);
    assert.equal(DEFAULT_SOUND_CONFIG.fadeOut, 0);
    assert.equal(DEFAULT_SOUND_CONFIG.startTime, null);
    assert.equal(DEFAULT_SOUND_CONFIG.endTime, null);
});

test('applySound ignores disabled or missing sounds', () => {
    const seq = new MockSequence();
    applySound(seq, { enable: false, file: 'audio/spell.mp3' });
    applySound(seq, { enable: true, file: '' });
    applySound(seq, null);
    assert.equal(seq.sounds.length, 0);
});

test('applySound configures single sound with full specifications and timestamps', () => {
    const seq = new MockSequence();
    const soundConfig = {
        enable: true,
        file: 'audio/cast.mp3',
        volume: 0.8,
        delay: 250,
        fadeIn: 100,
        fadeOut: 200,
        startTime: 500,
        endTime: 2500
    };

    applySound(seq, soundConfig);
    assert.equal(seq.sounds.length, 1);
    const calls = seq.sounds[0].calls;
    assert.deepEqual(calls, [
        { method: 'file', value: 'audio/cast.mp3' },
        { method: 'volume', value: 0.8 },
        { method: 'delay', value: 250 },
        { method: 'fadeIn', value: 100 },
        { method: 'fadeOut', value: 200 },
        { method: 'startTime', value: 500 },
        { method: 'endTime', value: 2500 }
    ]);
});

test('applySound supports timeRange shorthand', () => {
    const seq = new MockSequence();
    const soundConfig = {
        enable: true,
        file: 'audio/clip.mp3',
        timeRange: [1000, 3000]
    };

    applySound(seq, soundConfig);
    assert.equal(seq.sounds.length, 1);
    const timeRangeCall = seq.sounds[0].calls.find(c => c.method === 'timeRange');
    assert.deepEqual(timeRangeCall, { method: 'timeRange', value: [1000, 3000] });
});

test('applySound supports multiple sounds via named sound sections or array', () => {
    const seqNamed = new MockSequence();
    const multiNamedConfig = {
        cast: {
            enable: true,
            file: 'audio/charge.mp3',
            volume: 0.6,
            delay: 100
        },
        impact: {
            enable: true,
            file: 'audio/explosion.mp3',
            volume: 1.0,
            delay: 1200,
            fadeOut: 300
        },
        disabledSection: {
            enable: false,
            file: 'audio/unused.mp3'
        }
    };

    applySound(seqNamed, multiNamedConfig);
    assert.equal(seqNamed.sounds.length, 2);
    assert.equal(seqNamed.sounds[0].calls[0].value, 'audio/charge.mp3');
    assert.equal(seqNamed.sounds[1].calls[0].value, 'audio/explosion.mp3');

    const seqArray = new MockSequence();
    const arrayConfig = [
        { enable: true, file: 'audio/sound1.mp3' },
        { enable: true, file: 'audio/sound2.mp3' }
    ];
    applySound(seqArray, arrayConfig);
    assert.equal(seqArray.sounds.length, 2);
});

test('applySound respects global enableSounds setting', () => {
    const originalGet = game.settings.get;
    game.settings.get = (_mod, key) => key === 'enableSounds' ? false : true;

    const seq = new MockSequence();
    applySound(seq, { enable: true, file: 'audio/test.mp3' });
    assert.equal(seq.sounds.length, 0);

    game.settings.get = originalGet;
});

test('applySound standardizes strictly on enable and ignores enabled alias', () => {
    const seq = new MockSequence();
    applySound(seq, { enabled: true, file: 'audio/legacy.mp3' });
    assert.equal(seq.sounds.length, 0);
});

test('Rage sub-configs include version-specific sound configurations', async () => {
    const { rage } = await import('../../src/animation/effects/active-effect/rage/index.js');
    assert.ok(rage.default_config.config_v1.sound, 'config_v1 must have sound property');
    assert.equal(typeof rage.default_config.config_v1.sound, 'object');
    assert.equal(rage.default_config.config_v1.sound.enable, false);
    assert.equal(rage.default_config.config_v1.sound.file, '');
    assert.ok(rage.default_config.config_v2.sound, 'config_v2 must have sound property');
    assert.ok(rage.default_config.config_v3.sound, 'config_v3 must have sound property');
    assert.ok(rage.default_config.config_v4.sound, 'config_v4 must have sound property');
    assert.ok(rage.default_config.config_v5.sound, 'config_v5 must have sound property');
});

test('Mirror Image sub-configs include version-specific sound configurations', async () => {
    const { mirrorImage } = await import('../../src/animation/effects/active-effect/mirror-image.js');
    assert.ok(mirrorImage.default_config.config_v1.sound, 'config_v1 must have sound property');
    assert.equal(typeof mirrorImage.default_config.config_v1.sound, 'object');
    assert.equal(mirrorImage.default_config.config_v1.sound.enable, false);
    assert.equal(mirrorImage.default_config.config_v1.sound.file, '');
    assert.ok(mirrorImage.default_config.config_v2.sound, 'config_v2 must have sound property');
    assert.equal(typeof mirrorImage.default_config.config_v2.sound, 'object');
    assert.equal(mirrorImage.default_config.config_v2.sound.enable, false);
    assert.equal(mirrorImage.default_config.config_v2.sound.file, '');
});

test('wailsFromTheGrave DEFAULT_CONFIG uses standard unconfigured sound ready for customization', async () => {
    const { wailsFromTheGrave } = await import('../../src/animation/effects/on-target/wails-from-the-grave.js');
    assert.ok(wailsFromTheGrave.default_config.sound, 'DEFAULT_CONFIG must have sound property');
    assert.equal(typeof wailsFromTheGrave.default_config.sound, 'object');
    assert.equal(wailsFromTheGrave.default_config.sound.enable, false);
    assert.equal(wailsFromTheGrave.default_config.sound.file, '');
});


