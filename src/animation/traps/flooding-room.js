/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';

import { adapter } from "../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../utils/sound.js";
const DEFAULT_CONFIG = {
    fadeTime: 10000,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { fadeTime, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    const tileDoc = tile.document ?? tile;

    // Retrieve water spray origin tiles from flags, falling back to tag search for backward compatibility
    const originIds = tileDoc.getFlag?.(MODULE_ID, 'trap.floodingRoomSplashOrigins') ?? [];
    let splashOrigins = originIds.map(id => canvas.tiles.get(id)).filter(Boolean);
    
    if (splashOrigins.length === 0 && Tagger) {
        const taggedOrigins = await Tagger.getByTag('Flooding Room Trap Origin');
        splashOrigins = taggedOrigins.map(t => t.object ?? t).filter(Boolean);
    }

    let seq = new Sequence();
    applySound(seq, sound);
    seq = seq
        .canvasPan()
        .shake({ duration: 500, strength: 2, rotation: false })
        .wait(500);

    const tileBounds = adapter.getTileBounds(tile);
    const tileCenter = tileBounds.center;

    // Spawn persistent water splashes at each origin tile pointing towards the water tile
    if (splashOrigins.length > 0) {
        splashOrigins.forEach(origin => {
            const originDoc = origin.document ?? origin;
            const originBounds = adapter.getTileBounds(origin);
            const originCenter = originBounds.center;

            seq = seq
                .effect()
                .name(`flooding-room-splash-${tile.id}`)
                .file(closest('jb2a.water_splash.cone.01.blue'))
                .atLocation(originCenter)
                .rotateTowards(tileCenter)
                .size({ width: 2 * originBounds.width, height: 2 * originBounds.height })
                .fadeIn(1000, { ease: 'easeOutCubic' })
                .elevation(originDoc.elevation ?? origin.elevation ?? 0)
                .persist()
                .belowTokens();
        });
    }

    // Fade in the water tile representation and tint it blue
    seq = seq
        .animation()
        .on(tile)
        .fadeIn(fadeTime, { ease: 'easeInSine' })
        .opacity(1)
        .tint('#4d90fe');

    return seq;
}

async function play(tile, targets, config = {}) {
    config = settingsOverride(config);
    const seq = await create(tile, targets, config);
    return seq.play();
}

async function stop(tile, config = {}) {
    // Clear water splash effects
    await Sequencer.EffectManager.endEffects({ name: `flooding-room-splash-${tile.id}` });

    // Reset water tile opacity back to 0 and restore original tint
    await new Sequence()
        .animation()
        .on(tile)
        .fadeOut(1000)
        .opacity(0)
        .tint('#ffffff')
        .play();
}

async function setup(config = {}) {
    const setupConfig = {
        extraTiles: [
            {
                key: 'floodingRoomSplashOrigins',
                label: 'Water Splash Origin Tile(s)',
                prompt: 'Select the **Water Splash Origin Tile(s)** on the canvas (where the water sprays out from).'
            }
        ],
        ...config
    };
    return matt.trap.setup('eskie.traps.floodingRoom', setupConfig);
}

export const floodingRoom = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
