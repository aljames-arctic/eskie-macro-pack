/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';
import { MODULE_ID } from '../../lib/constants.js';

const DEFAULT_CONFIG = {
    label: 'Falling Rocks',
    dustBrightness: 0.8,
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { label, dustBrightness } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    if (!tile) return new Sequence();

    // Detect all tokens currently overlapping the trap tile bounds
    const tileX = tile.document?.x ?? tile.x;
    const tileY = tile.document?.y ?? tile.y;
    const tileWidth = tile.document?.width ?? tile.width;
    const tileHeight = tile.document?.height ?? tile.height;

    const tileMinX = tileX;
    const tileMaxX = tileX + tileWidth;
    const tileMinY = tileY;
    const tileMaxY = tileY + tileHeight;

    const finalTargets = canvas.tokens.placeables.filter(t => {
        const tWidth = t.w ?? ((t.document?.width ?? 1) * canvas.grid.size);
        const tHeight = t.h ?? ((t.document?.height ?? 1) * canvas.grid.size);
        const tMinX = t.document?.x ?? t.x;
        const tMaxX = tMinX + tWidth;
        const tMinY = t.document?.y ?? t.y;
        const tMaxY = tMinY + tHeight;

        // Bounding-box intersection check
        return !(tMaxX <= tileMinX || tMinX >= tileMaxX || tMaxY <= tileMinY || tMinY >= tileMaxY);
    });

    const num = Math.floor(Math.random() * 2);
    const mirrorX = Math.random() >= 0.5;
    const mirrorY = Math.random() >= 0.5;

    let seq = new Sequence()
        .canvasPan()
        .shake({ duration: 250, strength: 2, rotation: false })

        // Falling rocks animation
        .effect()
        .file(closest(`jb2a.falling_rocks.top.1x1.grey.${num}`))
        .atLocation(tile)
        .size({ width: tile.document.width * 2.5, height: tile.document.height * 2.5 })
        .mirrorX(mirrorX)
        .mirrorY(mirrorY)
        .fadeOut(500)
        .waitUntilFinished(-4000)

        // Persistent rock rubble on the tile
        .effect()
        .name(`${label}-${tile.id}`)
        .delay(3500)
        .file(closest(`jb2a.falling_rocks.endframe.top.1x1.grey.${num}`))
        .atLocation(tile)
        .size({ width: tile.document.width * 2.5, height: tile.document.height * 2.5 })
        .belowTokens()
        .mirrorX(mirrorX)
        .mirrorY(mirrorY)
        .fadeOut(500)
        .persist()

        // Impact shockwave
        .effect()
        .file(closest('jb2a.impact.white.01'))
        .atLocation(tile)
        .scaleIn(0, 500, { ease: 'easeOutCubic' })
        .belowTokens()
        .size({ width: tile.document.width * 1.5, height: tile.document.height * 1.5 })
        .opacity(0.5)

        // Dust smoke cloud
        .effect()
        .delay(100)
        .file(closest('jb2a.smoke.puff.centered.grey'))
        .atLocation(tile)
        .playbackRate(0.65)
        .fadeIn(250)
        .fadeOut(1500)
        .size({ width: tile.document.width * 3, height: tile.document.height * 3 })
        .randomRotation()
        .opacity(0.5)
        .filter('ColorMatrix', { brightness: dustBrightness })
        .zIndex(4)

        .canvasPan()
        .delay(200)
        .shake({ duration: 500, strength: 2, rotation: false });

    if (finalTargets.length > 0) {
        const currentPinnedIds = tile.document.getFlag(MODULE_ID, `${label} - pinned`) ?? [];
        const finalTargetIds = finalTargets.map(token => token.id);
        await tile.document.setFlag(MODULE_ID, `${label} - pinned`, [...currentPinnedIds, ...finalTargetIds]);
        
        finalTargets.forEach(target => {
            const targetName = target.name ?? target.document?.name ?? 'Token';
            const buryEffectName = `${label}-${targetName}-${target.id}`;

            seq = seq
                // Persistent copy sprite under rocks
                .effect()
                .name(buryEffectName)
                .copySprite(target)
                .spriteRotation(-(target.document?.rotation ?? target.rotation ?? 0))
                .attachTo(target, { bindAlpha: false })
                .scaleToObject(1, { considerTokenScale: true })
                .persist()
                .private()
                .belowTokens()

                .wait(500)

                // Hide the actual token document
                .animation()
                .on(target)
                .opacity(0)
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
    const { label } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const id = tile.id; // Or however you define the 'id' variable used in the flag key
    
    // 1. Retrieve the pinned IDs from the tile's flags (fallback to an empty array if none)
    const pinnedIds = tile.document.getFlag(MODULE_ID, `${label} - pinned`) ?? [];

    // 2. Clear rock rubble effect on the tile
    await Sequencer.EffectManager.endEffects({ name: `${label}-${tile.id}` });

    if (pinnedIds.length > 0) {
        // 3. Convert IDs to actual canvas token objects, filtering out any that no longer exist
        const tokensToClean = pinnedIds
            .map(tokenId => canvas.tokens.get(tokenId))
            .filter(token => token !== undefined);

        // 4. Trigger the unbury sequence for all tokens simultaneously and wait for them to finish
        const cleanPromises = tokensToClean.map(token => cleanToken(token, config));
        await Promise.all(cleanPromises);

        // 5. Clean up the flag so these tokens aren't accidentally processed again later
        await tile.document.unsetFlag(MODULE_ID, `${label} - pinned`);
    }
}

async function cleanToken(token, config = {}) {
    const { label } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    await Sequencer.EffectManager.endEffects({ name: `${label}-${token.name}-${token.id}` });
    // Restore token opacity
    return new Sequence()
        .animation()
        .on(token)
        .opacity(1)
        .play();
}

async function setup(config = {}) {
    return matt.trap.setup('eskie.traps.fallingRocks', config);
}

export const fallingRocks = {
    create,
    cleanToken, // Clears the opacity flag of a token
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
