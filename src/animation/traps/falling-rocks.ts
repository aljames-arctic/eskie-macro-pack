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
import type { SoundConfig, TrapConfig, TrapModule } from '../../types/animation.js';

export interface FallingRocksTrapConfig extends TrapConfig {
    label?: string;
    dustBrightness?: number;
    sound?: SoundConfig;
}

const DEFAULT_CONFIG: FallingRocksTrapConfig = {
    label: 'Falling Rocks',
    dustBrightness: 0.8,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(trapObject: Tile, targets?: Token[] | null, config: FallingRocksTrapConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const { label, dustBrightness, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    if (!trapObject) return new Sequence();

    const finalTargets = (targets && targets.length > 0) ? targets : adapter.getTokensInPlaceable(trapObject);

    const trapDoc = trapObject.document;
    const trapBounds = adapter.getBounds(trapObject);
    const trapCenter = trapBounds.center;
    const trapWidth = trapBounds.width;
    const trapHeight = trapBounds.height;

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
        .atLocation(trapCenter)
        .size({ width: trapWidth * 2.5, height: trapHeight * 2.5 })
        .mirrorX(mirrorX)
        .mirrorY(mirrorY)
        .fadeOut(500)
        .waitUntilFinished(-4000)

        // Persistent rock rubble on the trap
        .effect()
        .name(`${label}-${trapObject.id}`)
        .delay(3500)
        .file(closest(`jb2a.falling_rocks.endframe.top.1x1.grey.${num}`))
        .atLocation(trapCenter)
        .size({ width: trapWidth * 2.5, height: trapHeight * 2.5 })
        .belowTokens()
        .mirrorX(mirrorX)
        .mirrorY(mirrorY)
        .fadeOut(500)
        .persist()

        // Impact shockwave
        .effect()
        .file(closest('jb2a.impact.white.01'))
        .atLocation(trapCenter)
        .scaleIn(0, 500, { ease: 'easeOutCubic' })
        .belowTokens()
        .size({ width: trapWidth * 1.5, height: trapHeight * 1.5 })
        .opacity(0.5)

        // Dust smoke cloud
        .effect()
        .delay(100)
        .file(closest('jb2a.smoke.puff.centered.grey'))
        .atLocation(trapCenter)
        .playbackRate(0.65)
        .fadeIn(250)
        .fadeOut(1500)
        .size({ width: trapWidth * 3, height: trapHeight * 3 })
        .randomRotation()
        .opacity(0.5)
        .filter('ColorMatrix', { brightness: dustBrightness })
        .zIndex(4)

        .canvasPan()
        .delay(200)
        .shake({ duration: 500, strength: 2, rotation: false });

    if (finalTargets.length > 0) {
        const currentPinnedIds = trapDoc.getFlag(MODULE_ID, `${label} - pinned`) ?? [];
        const finalTargetIds = finalTargets.map(token => token.id);
        await trapDoc.setFlag(MODULE_ID, `${label} - pinned`, [...currentPinnedIds, ...finalTargetIds]);
        
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

async function play(trapObject: Tile, targets?: Token[] | null, config: FallingRocksTrapConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const seq = await create(trapObject, targets, config);
    return seq.play();
}

async function stop(trapObject: Tile, config: FallingRocksTrapConfig = {}): Promise<void> {
    const { label } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const trapDoc = trapObject.document;
    
    // 1. Retrieve the pinned IDs from the trap's flags (fallback to an empty array if none)
    const pinnedIds = trapDoc.getFlag(MODULE_ID, `${label} - pinned`) ?? [];

    // 2. Clear rock rubble effect on the trap
    await Sequencer.EffectManager.endEffects({ name: `${label}-${trapObject.id}` });

    if (pinnedIds.length > 0) {
        // 3. Convert IDs to actual canvas token objects, filtering out any that no longer exist
        const tokensToClean = pinnedIds
            .map(tokenId => adapter.getPlaceable(tokenId))
            .filter(Boolean);

        // 4. Trigger the unbury sequence for all tokens simultaneously and wait for them to finish
        const cleanPromises = tokensToClean.map(token => cleanToken(token, config));
        await Promise.all(cleanPromises);

        // 5. Clean up the flag so these tokens aren't accidentally processed again later
        await trapDoc.unsetFlag?.(MODULE_ID, `${label} - pinned`);
    }
}

async function cleanToken(token: Token, config: FallingRocksTrapConfig = {}): Promise<any> {
    const { label } = adapter.mergeObject(DEFAULT_CONFIG, config);
    await Sequencer.EffectManager.endEffects({ name: `${label}-${token.name}-${token.id}` });
    // Restore token opacity
    return new Sequence()
        .animation()
        .on(token)
        .opacity(1)
        .play();
}

async function setup(config: Record<string, unknown> = {}): Promise<any> {
    return setupTrap('eskie.traps.fallingRocks', config);
}

export interface FallingRocksModule extends TrapModule<FallingRocksTrapConfig> {
    cleanToken: (token: Token, config?: FallingRocksTrapConfig) => Promise<any>;
}

export const fallingRocks: FallingRocksModule = {
    create,
    cleanToken, // Clears the opacity flag of a token
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
