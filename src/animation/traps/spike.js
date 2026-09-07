/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';

import { adapter } from "../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../utils/sound.js";
const DEFAULT_CONFIG = {
    delay: 500,
    spike: {
        xScale: 1.5,
        yScale: 1.5,
    },
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { delay, spike: spikeConfig, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    if (!tile) return new Sequence();

    const tileBounds = adapter.getTileBounds(tile);
    const tileCenter = tileBounds.center;
    const { xScale, yScale } = spikeConfig;
    const effectWidth = tileBounds.width * xScale;
    const effectHeight = tileBounds.height * yScale;

    const finalTargets = (targets && targets.length > 0) ? targets : adapter.getTokensInTile(tile);

    let seq = new Sequence();
    applySound(seq, sound);
    seq = seq
        // Hidden/still frame base of the spike trap below tokens
        .effect()
        .file(closest('jb2a.spike_trap.10x10ft.top.base.still_frame.hidden'))
        .atLocation(tileCenter)
        .fadeIn(250)
        .fadeOut(250)
        .duration(4000)
        .belowTokens()
        .size({ width: effectWidth, height: effectHeight })

        // The spike trap snapping/firing above tokens
        .effect()
        .file(closest('jb2a.spike_trap.10x10ft.top.no_base.normal.01.01'))
        .atLocation(tileCenter)
        .size({ width: effectWidth, height: effectHeight })
        .zIndex(1)

        .wait(delay);

    if (finalTargets.length > 0) {
        finalTargets.forEach(target => {
            const targetDoc = target.document ?? target;
            const targetRotation = targetDoc.rotation;

            seq = seq
                // Blood splash effect on target
                .effect()
                .file(closest('jb2a.liquid.splash.red'))
                .atLocation(target)
                .scaleToObject(1.35, { considerTokenScale: true })
                .randomRotation()
                .belowTokens()
                .zIndex(0.1)

                // Shaking token effect when struck by trap
                .effect()
                .copySprite(target)
                .spriteRotation(-targetRotation)
                .scaleToObject(1, { considerTokenScale: true })
                .fadeIn(250)
                .fadeOut(750)
                .loopProperty('spriteContainer', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
                .duration(1000)
                .opacity(0.25);
        });
    }

    return seq;
}

async function play(tile, targets, config = {}) {
    config = settingsOverride(config);
    const seq = await create(tile, targets, config);
    return seq.play();
}

async function stop(tile, config = {}) {
    // No persistent effects to stop
}

async function setup(config = {}) {
    return matt.trap.setup('eskie.traps.spike', config);
}

export const spike = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
