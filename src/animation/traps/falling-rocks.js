/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { setupTrap } from './trap-manager.js';
import { MODULE_ID } from '../../lib/constants.js';

import { adapter } from "../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../utils/sound.js";
const DEFAULT_CONFIG = {
    label: 'Falling Rocks',
    dustBrightness: 0.8,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { label, dustBrightness, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    if (!tile) return new Sequence();

    const finalTargets = (targets && targets.length > 0) ? targets : adapter.getTokensInPlaceable(tile);

    const tileDoc = tile.document ?? tile;
    const tileBounds = adapter.getBounds(tile);
    const tileCenter = tileBounds.center;
    const tileWidth = tileBounds.width;
    const tileHeight = tileBounds.height;

    const num = Math.floor(Math.random() * 2);
    const mirrorX = Math.random() >= 0.5;
    const mirrorY = Math.random() >= 0.5;

    let seq = new Sequence();
    applySound(seq, sound);
    seq = seq
        .canvasPan()
        .shake({ duration: 250, strength: 2, rotation: false })

        // Falling rocks animation
        .effect()
        .file(closest(`jb2a.falling_rocks.top.1x1.grey.${num}`))
        .atLocation(tileCenter)
        .size({ width: tileWidth * 2.5, height: tileHeight * 2.5 })
        .mirrorX(mirrorX)
        .mirrorY(mirrorY)
        .fadeOut(500)
        .waitUntilFinished(-4000)

        // Persistent rock rubble on the tile
        .effect()
        .name(`${label}-${tile.id}`)
        .delay(3500)
        .file(closest(`jb2a.falling_rocks.endframe.top.1x1.grey.${num}`))
        .atLocation(tileCenter)
        .size({ width: tileWidth * 2.5, height: tileHeight * 2.5 })
        .belowTokens()
        .mirrorX(mirrorX)
        .mirrorY(mirrorY)
        .fadeOut(500)
        .persist()

        // Impact shockwave
        .effect()
        .file(closest('jb2a.impact.white.01'))
        .atLocation(tileCenter)
        .scaleIn(0, 500, { ease: 'easeOutCubic' })
        .belowTokens()
        .size({ width: tileWidth * 1.5, height: tileHeight * 1.5 })
        .opacity(0.5)

        // Dust smoke cloud
        .effect()
        .delay(100)
        .file(closest('jb2a.smoke.puff.centered.grey'))
        .atLocation(tileCenter)
        .playbackRate(0.65)
        .fadeIn(250)
        .fadeOut(1500)
        .size({ width: tileWidth * 3, height: tileHeight * 3 })
        .randomRotation()
        .opacity(0.5)
        .filter('ColorMatrix', { brightness: dustBrightness })
        .zIndex(4)

        .canvasPan()
        .delay(200)
        .shake({ duration: 500, strength: 2, rotation: false });

    if (finalTargets.length > 0) {
        const currentPinnedIds = tileDoc.getFlag(MODULE_ID, `${label} - pinned`) ?? [];
        const finalTargetIds = finalTargets.map(token => token.id);
        await tileDoc.setFlag(MODULE_ID, `${label} - pinned`, [...currentPinnedIds, ...finalTargetIds]);
        
        finalTargets.forEach(target => {
            const buryEffectName = `${label}-${target.name}-${target.id}`;

            seq = seq
                // Persistent copy sprite under rocks
                .effect()
                .name(buryEffectName)
                .copySprite(target)
                .attachTo(target, { bindAlpha: false })
                .spriteRotation(-adapter.getTokenRotation(target))
                .scaleToObject(1, { considerTokenScale: true })
                .fadeOut(750, { ease: 'easeOutCubic' })
                .persist()

                // Hide the actual token
                .animation()
                .on(target)
                .opacity(0);
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
    const { label } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const tileDoc = tile.document;
    
    // 1. Retrieve the pinned IDs from the tile's flags (fallback to an empty array if none)
    const pinnedIds = tileDoc.getFlag(MODULE_ID, `${label} - pinned`) ?? [];

    // 2. Clear rock rubble effect on the tile
    await Sequencer.EffectManager.endEffects({ name: `${label}-${tile.id}` });

    if (pinnedIds.length > 0) {
        // 3. Convert IDs to actual canvas token objects, filtering out any that no longer exist
        const tokensToClean = pinnedIds
            .map(tokenId => adapter.getPlaceable(tokenId))
            .filter(Boolean);

        // 4. Trigger the unbury sequence for all tokens simultaneously and wait for them to finish
        const cleanPromises = tokensToClean.map(token => cleanToken(token, config));
        await Promise.all(cleanPromises);

        // 5. Clean up the flag so these tokens aren't accidentally processed again later
        await tileDoc.unsetFlag?.(MODULE_ID, `${label} - pinned`);
    }
}

async function cleanToken(token, config = {}) {
    const { label } = adapter.mergeObject(DEFAULT_CONFIG, config);
    await Sequencer.EffectManager.endEffects({ name: `${label}-${token.name}-${token.id}` });
    // Restore token opacity
    return new Sequence()
        .animation()
        .on(token)
        .opacity(1)
        .play();
}

async function setup(config = {}) {
    return setupTrap('eskie.traps.fallingRocks', config);
}

export const fallingRocks = {
    create,
    cleanToken, // Clears the opacity flag of a token
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
