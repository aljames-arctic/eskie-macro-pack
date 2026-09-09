import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { rollingBoulder } from '../../src/animation/traps/rolling-boulder.js';
import { MODULE_ID } from '../../src/lib/constants.js';
import { adapter } from '../../src/adapters/index.js';

class MockSequenceEffect {
    constructor(sequence) {
        this.sequence = sequence;
        this.calls = [];
    }
    file(f) { this.calls.push({ method: 'file', value: f }); return this; }
    atLocation(loc, opts) { this.calls.push({ method: 'atLocation', loc, opts }); return this; }
    scaleIn(val, dur, opts) { this.calls.push({ method: 'scaleIn', val, dur, opts }); return this; }
    fadeIn(dur) { this.calls.push({ method: 'fadeIn', dur }); return this; }
    fadeOut(dur) { this.calls.push({ method: 'fadeOut', dur }); return this; }
    size(s, opts) { this.calls.push({ method: 'size', size: s, opts }); return this; }
    duration(d) { this.calls.push({ method: 'duration', value: d }); return this; }
    filter(name, opts) { this.calls.push({ method: 'filter', name, opts }); return this; }
    opacity(o) { this.calls.push({ method: 'opacity', value: o }); return this; }
    belowTokens() { this.calls.push({ method: 'belowTokens' }); return this; }
    delay(d) { this.calls.push({ method: 'delay', value: d }); return this; }
    moveTowards(loc, opts) { this.calls.push({ method: 'moveTowards', loc, opts }); return this; }
    spriteRotation(r) { this.calls.push({ method: 'spriteRotation', value: r }); return this; }
    zIndex(z) { this.calls.push({ method: 'zIndex', value: z }); return this; }
    waitUntilFinished(d) { this.calls.push({ method: 'waitUntilFinished', value: d }); return this; }
    randomRotation() { this.calls.push({ method: 'randomRotation' }); return this; }
    playbackRate(r) { this.calls.push({ method: 'playbackRate', value: r }); return this; }
    effect() { return this.sequence.effect(); }
    get effects() { return this.sequence.effects; }
    async play() { return this.sequence.play(); }
}

class MockSequence {
    constructor() {
        this.effects = [];
        this.sounds = [];
        this.calls = [];
    }
    canvasPan() { this.calls.push({ method: 'canvasPan' }); return this; }
    delay(d) { this.calls.push({ method: 'delay', value: d }); return this; }
    shake(opts) { this.calls.push({ method: 'shake', opts }); return this; }
    effect() {
        const eff = new MockSequenceEffect(this);
        this.effects.push(eff);
        return eff;
    }
    sound() {
        const snd = new MockSequenceEffect(this);
        this.sounds.push(snd);
        return snd;
    }
    async play() {
        return this;
    }
}

globalThis.game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true });
globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });
globalThis.game.user = { isGM: true, id: 'gm-user-1' };

const origEntryExists = Sequencer.Database.entryExists;
Sequencer.Database.entryExists = (path) => String(path).includes('rolling_boulder') || String(path).includes('smoke.puff') || String(path).includes('explosion.shrapnel') || origEntryExists(path);
const origGetEntry = Sequencer.Database.getEntry;
Sequencer.Database.getEntry = (path) => (String(path).includes('rolling_boulder') || String(path).includes('smoke.puff') || String(path).includes('explosion.shrapnel')) ? { file: path } : origGetEntry(path);
const origGetPathsUnder = Sequencer.Database.getPathsUnder;
Sequencer.Database.getPathsUnder = (path) => {
    const str = String(path);
    if (str === 'jb2a') {
        return ['rolling_boulder', 'smoke', 'explosion', 'impact', ...(origGetPathsUnder ? origGetPathsUnder(path) : [])];
    }
    if (str.includes('rolling_boulder')) {
        return ['loop', '01', 'rock', 'brown', 'magma', 'mossy'];
    }
    if (str.includes('smoke')) {
        return ['puff', 'centered', 'grey'];
    }
    if (str.includes('explosion')) {
        return ['shrapnel', 'grenade', '02', 'black'];
    }
    if (str.includes('impact')) {
        return ['white', '01'];
    }
    return origGetPathsUnder ? origGetPathsUnder(path) : [];
};

test('rollingBoulder.default_config defines boulder attribute with default values', () => {
    assert.equal(rollingBoulder.default_config.targetLocation, null, 'DEFAULT_CONFIG must define targetLocation as null');
    assert.equal(rollingBoulder.default_config.targetTile, undefined, 'DEFAULT_CONFIG must not define targetTile');
    assert.ok(rollingBoulder.default_config.boulder, 'DEFAULT_CONFIG must define boulder');
    assert.equal(rollingBoulder.default_config.boulder.speed, 200, 'boulder.speed must default to 200');
    assert.equal(rollingBoulder.default_config.boulder.size, 4.25, 'boulder.size must default to 4.25');
    assert.equal(rollingBoulder.default_config.boulder.playbackRate, 1.0, 'boulder.playbackRate must default to 1.0');
    assert.equal(
        rollingBoulder.default_config.boulder.src,
        'jb2a.rolling_boulder.loop.01.rock.brown',
        'boulder.src must default to jb2a.rolling_boulder.loop.01.rock.brown'
    );
    assert.ok(rollingBoulder.default_config.sound, 'DEFAULT_CONFIG must define sound');
    assert.equal(rollingBoulder.default_config.sound.enable, false);
});

test('rollingBoulder.create dynamically calculates duration from tile distance and default speed (200)', async () => {
    globalThis.Sequence = MockSequence;

    const startTile = {
        id: 'tile-start-1',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        document: {
            id: 'tile-start-1',
            x: 100,
            y: 100,
            width: 100,
            height: 100,
        }
    };

    const endTile = {
        id: 'tile-end-1',
        x: 700,
        y: 900,
        width: 100,
        height: 100,
        document: {
            id: 'tile-end-1',
            x: 700,
            y: 900,
            width: 100,
            height: 100
        }
    };

    globalThis.canvas.tiles.get = (id) => (id === 'tile-end-1' ? endTile : (id === 'tile-start-1' ? startTile : null));

    // Distance between (150, 150) and (750, 950) is Math.hypot(600, 800) = 1000px
    // At default speed = 200 px/s: duration = (1000 / 200) * 1000 = 5000 ms
    const seq = await rollingBoulder.create(startTile, [], { targetLocation: endTile });
    assert.ok(seq instanceof MockSequence || seq instanceof MockSequenceEffect);

    // Find main rolling boulder loop effect
    const mainBoulder = seq.effects.find(eff =>
        eff.calls.some(c => c.method === 'moveTowards')
    );
    assert.ok(mainBoulder, 'Main rolling boulder loop effect must exist');

    const durationCall = mainBoulder.calls.find(c => c.method === 'duration');
    assert.equal(durationCall?.value, 5000, 'Calculated duration should be 5000ms for 1000px at speed 200');

    const sizeCall = mainBoulder.calls.find(c => c.method === 'size');
    assert.equal(sizeCall?.size, 4.25 - 0.4, 'Main boulder size should be scaled by default size 4.25');

    const rateCall = mainBoulder.calls.find(c => c.method === 'playbackRate');
    assert.equal(rateCall?.value, 1.0, 'Main boulder playbackRate should default to 1.0');

    const fileCall = mainBoulder.calls.find(c => c.method === 'file');
    assert.equal(fileCall?.value, 'jb2a.rolling_boulder.loop.01.rock.brown');

    const waitCall = mainBoulder.calls.find(c => c.method === 'waitUntilFinished');
    assert.ok(waitCall, 'Main boulder must call waitUntilFinished');
    assert.equal(waitCall.value, undefined, 'Main boulder must wait until fully finished without premature negative duration offset');

    const smokePuff = seq.effects.find(eff =>
        eff.calls.some(c => c.method === 'file' && String(c.value).includes('smoke.puff.centered'))
    );
    assert.ok(smokePuff, 'Smoke puff effect must exist');
    assert.equal(smokePuff.calls.some(c => c.method === 'delay'), false, 'Smoke puff must trigger immediately as boulder finishes');

    const grenadeExplosion = seq.effects.find(eff =>
        eff.calls.some(c => c.method === 'file' && String(c.value).includes('explosion.shrapnel.grenade'))
    );
    assert.ok(grenadeExplosion, 'Grenade explosion effect must exist');
    assert.equal(grenadeExplosion.calls.some(c => c.method === 'delay'), false, 'Grenade explosion must trigger immediately as boulder finishes');

    const impactFlashes = seq.effects.filter(eff =>
        eff.calls.some(c => c.method === 'file' && String(c.value).includes('impact.white'))
    );
    assert.equal(impactFlashes.length, 2, 'Two impact flash effects should exist (start and end)');
    const targetImpactFlash = impactFlashes[1];
    assert.equal(targetImpactFlash.calls.some(c => c.method === 'delay'), false, 'Target impact flash must trigger immediately as boulder finishes');
});

test('rollingBoulder.create respects custom boulder speed, size, playbackRate, and src config overrides', async () => {
    globalThis.Sequence = MockSequence;

    const startTile = {
        id: 'tile-start-2',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        document: {
            id: 'tile-start-2',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
        }
    };

    const endTile = {
        id: 'tile-end-2',
        x: 600,
        y: 800,
        width: 100,
        height: 100,
        document: {
            id: 'tile-end-2',
            x: 600,
            y: 800,
            width: 100,
            height: 100
        }
    };

    globalThis.canvas.tiles.get = (id) => (id === 'tile-end-2' ? endTile : null);

    // Distance between (50, 50) and (650, 850) is Math.hypot(600, 800) = 1000px
    // With speed = 500 px/s: duration = (1000 / 500) * 1000 = 2000 ms
    const customConfig = {
        targetLocation: endTile,
        boulder: {
            speed: 500,
            size: 6.0,
            playbackRate: 1.5,
            src: 'jb2a.rolling_boulder.loop.01.magma'
        }
    };

    const seq = await rollingBoulder.create(startTile, [], customConfig);
    const mainBoulder = seq.effects.find(eff =>
        eff.calls.some(c => c.method === 'moveTowards')
    );
    assert.ok(mainBoulder, 'Main rolling boulder loop effect must exist');

    const durationCall = mainBoulder.calls.find(c => c.method === 'duration');
    assert.equal(durationCall?.value, 2000, 'Calculated duration should be 2000ms for 1000px at speed 500');

    const sizeCall = mainBoulder.calls.find(c => c.method === 'size');
    assert.equal(sizeCall?.size, 6.0 - 0.4, 'Main boulder size should be scaled by custom size 6.0');

    const rateCall = mainBoulder.calls.find(c => c.method === 'playbackRate');
    assert.equal(rateCall?.value, 1.5, 'Main boulder playbackRate should be custom 1.5');

    const fileCall = mainBoulder.calls.find(c => c.method === 'file');
    assert.equal(fileCall?.value, 'jb2a.rolling_boulder.loop.01.magma');
});

test('rollingBoulder.create respects custom tile and boulder config overrides', async () => {
    globalThis.Sequence = MockSequence;

    const startTile = {
        id: 'tile-start-3',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        document: {
            id: 'tile-start-3',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
        }
    };

    const endTile = {
        id: 'tile-end-3',
        x: 400,
        y: 300,
        width: 100,
        height: 100,
        document: {
            id: 'tile-end-3',
            x: 400,
            y: 300,
            width: 100,
            height: 100
        }
    };

    globalThis.canvas.tiles.get = (id) => (id === 'tile-end-3' ? endTile : null);

    // Distance between (50, 50) and (450, 350) is Math.hypot(400, 300) = 500px
    // At speed = 400 px/s: duration = (500 / 400) * 1000 = 1250 ms
    const seq = await rollingBoulder.create(startTile, [], {
        targetLocation: endTile,
        boulder: { speed: 400, size: 5.0, playbackRate: 2.0 }
    });
    const mainBoulder = seq.effects.find(eff =>
        eff.calls.some(c => c.method === 'moveTowards')
    );

    const durationCall = mainBoulder.calls.find(c => c.method === 'duration');
    assert.equal(durationCall?.value, 1250, 'Duration should be calculated using config speed');

    const sizeCall = mainBoulder.calls.find(c => c.method === 'size');
    assert.equal(sizeCall?.size, 5.0 - 0.4, 'Size should be calculated using config size');

    const rateCall = mainBoulder.calls.find(c => c.method === 'playbackRate');
    assert.equal(rateCall?.value, 2.0, 'Playback rate should be set from config');
});

test('rollingBoulder.create warns and returns early when end tile is missing', async () => {
    globalThis.Sequence = MockSequence;

    let warned = false;
    globalThis.ui.notifications.warn = (msg) => {
        warned = true;
    };

    const tileWithoutEnd = {
        id: 'tile-no-end',
        document: {
            id: 'tile-no-end',
        }
    };

    const seq = await rollingBoulder.create(tileWithoutEnd, []);
    assert.ok(warned, 'Should warn when no end tile is configured');
    assert.equal(seq.effects.length, 0, 'No boulder effects should be created');
});

test('rollingBoulder.setup embeds tile and boulder config in MATT action code', async () => {
    const updatedTiles = new Map();
    const createMockTile = (id) => {
        const tileDoc = {
            id,
            flags: {},
            update: async (data) => {
                updatedTiles.set(id, data);
                return tileDoc;
            }
        };
        return {
            id,
            document: tileDoc,
            update: async (data) => {
                updatedTiles.set(id, data);
                return tileDoc;
            }
        };
    };

    const triggerTile = createMockTile('t-trigger');
    const trapTile = createMockTile('t-trap');
    const targetTile = createMockTile('t-target');

    globalThis.canvas.tiles = {
        controlled: [triggerTile],
        get: (id) => (id === 't-trigger' ? triggerTile : id === 't-trap' ? trapTile : id === 't-target' ? targetTile : null)
    };

    let step = 0;
    adapter.buttonDialog = async () => {
        step++;
        if (step === 1) globalThis.canvas.tiles.controlled = [triggerTile];
        else if (step === 2) globalThis.canvas.tiles.controlled = [trapTile];
        else if (step === 3) globalThis.canvas.tiles.controlled = [targetTile];
        return 'continue';
    };

    const result = await rollingBoulder.setup({
        boulder: {
            speed: 300,
            size: 5.5,
            src: 'jb2a.rolling_boulder.loop.01.rock.mossy'
        }
    });

    assert.ok(result, 'setup should complete successfully');
    const trapUpdate = updatedTiles.get('t-trap');
    assert.ok(trapUpdate, 'Trap tile should be updated with MATT actions');
    const trapAction = trapUpdate['flags.monks-active-tiles.actions'][0];
    assert.ok(trapAction.data.code.includes("const targetTile = canvas.tiles.get('t-target');"), 'Trap action code should resolve targetTile placeable');
    assert.ok(trapAction.data.code.includes('"speed":300'), 'Trap action code should include boulder speed in config');
});
