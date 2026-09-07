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
    reveal: true,
    smokeSize: 2,
    fallenScale: 0.3,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { reveal, smokeSize, fallenScale, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    if (!tile) return new Sequence();

    const tileBounds = adapter.getTileBounds(tile);
    const tileCenter = tileBounds.center;
    const tileWidth = tileBounds.width;
    const tileHeight = tileBounds.height;

    const finalTargets = (targets && targets.length > 0) ? targets : adapter.getTokensInTile(tile);

    let seq = new Sequence();
    applySound(seq, sound);
    seq = seq
        // Dust puff when trap opens
        .effect()
        .file(closest('jb2a.smoke.puff.ring.01.white.1'))
        .atLocation(tileCenter)
        .opacity(1)
        .size({ width: tileWidth * smokeSize, height: tileHeight * smokeSize })
        .belowTokens();

    if (reveal) {
        seq = seq
            .animation()
            .on(tile)
            .show()
            .opacity(1);
    }

    if (finalTargets.length > 0) {
        finalTargets.forEach(target => {
            const targetWidth = target.document?.width ?? target.width ?? 1;
            const fallenEffectName = `pitfall-fallen-${target.id}`;

            seq = seq
                // Visual transition representing token falling down
                .effect()
                .copySprite(target)
                .spriteRotation(-(target.document?.rotation ?? target.rotation ?? 0))
                .attachTo(target, { bindAlpha: false })
                .scaleToObject(1, { considerTokenScale: true })
                .fadeOut(750, { ease: 'easeOutCubic' })
                .duration(1500)
                .scaleOut(0, 1000, { ease: 'easeOutCubic' })
                .opacity(1)

                // Hide the actual token
                .animation()
                .delay(200)
                .on(target)
                .opacity(0)

                // Mini copy sprite representing the token sitting at the bottom of the pit
                .effect()
                .name(fallenEffectName)
                .copySprite(target)
                .spriteRotation(-(target.document?.rotation ?? target.rotation ?? 0))
                .attachTo(target, { offset: { y: -0.4 * targetWidth }, gridUnits: true, bindAlpha: false })
                .scaleToObject(fallenScale, { considerTokenScale: false })
                .scaleIn(0, 500, { ease: 'easeOutBack' })
                .opacity(0.9)
                .aboveLighting()
                .persist()
                .zIndex(1)
                .delay(1500)

                // Bouncing chevron pointer showing token location (attached directly to target)
                .effect()
                .name(fallenEffectName)
                .file(closest('icons/pings/chevron.webp'))
                .attachTo(target, { offset: { y: -0.4 * targetWidth + 0.2 * targetWidth }, gridUnits: true, bindAlpha: false })
                .scaleToObject(0.25, { considerTokenScale: false })
                .scaleIn(0, 500, { ease: 'easeOutBack' })
                .loopProperty('spriteContainer', 'position.y', { from: 0, to: 0.025, duration: 1500, pingPong: true, gridUnits: true, ease: 'easeInSine' })
                .tint(game.user?.color?.css ?? '#ffffff')
                .opacity(0.9)
                .aboveLighting()
                .persist()
                .delay(1500);
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
    config = settingsOverride(config);
    const { sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    if (!tile) return;

    const finalTargets = adapter.getTokensInTile(tile);

    let seq = new Sequence();
    applySound(seq, sound);
    seq = seq
        // Reset/hide the pit tile
        .animation()
        .on(tile)
        .fadeOut(1000)
        .opacity(0);

    if (finalTargets.length > 0) {
        finalTargets.forEach(target => {
            const fallenEffectName = `pitfall-fallen-${target.id}`;

            seq = seq
                // End visual effects and restore token opacity
                .thenDo(function () {
                    Sequencer.EffectManager.endEffects({ name: fallenEffectName, object: target });
                })
                .animation()
                .on(target)
                .opacity(1);
        });
    }

    await seq.play();
}

async function setup(config = {}) {
    return matt.trap.setup('eskie.traps.pitfall', config);
}

export const pitfall = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
