/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { setupTrap } from './trap-manager.js';

import { adapter } from "../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../utils/sound.js";
import type { SoundConfig, TrapConfig, TrapModule } from '../../types/animation.js';

export interface FallingSkyTrapConfig extends TrapConfig {
    reveal?: boolean;
    smokeSize?: number;
    startScale?: number;
    fallenScale?: number;
    randomDelay?: number;
    color?: string;
    sound?: SoundConfig;
}

const DEFAULT_CONFIG: FallingSkyTrapConfig = {
    reveal: true,
    smokeSize: 2,
    startScale: 3,
    fallenScale: 0.3,
    randomDelay: 2000,
    color: 'orange',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(trapObject: Tile, targets: Token[] = [], config: FallingSkyTrapConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const { reveal, smokeSize, startScale, fallenScale, randomDelay, color, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    let seq = new Sequence();
    applySound(seq, sound);

    if (reveal && adapter.isDocumentOfType(trapObject, 'Tile')) {
        seq = seq
            .animation()
            .on(trapObject)
            .show()
            .opacity(1);
    }

    if (targets.length > 0) {
        const targetSeqs: any[] = [];
        targets.forEach(target => {
            const { widthUnits: targetWidth, widthPx, heightPx } = adapter.getTokenDimensions(target);
            const targetRotation = adapter.getTokenRotation(target);
            const staggerDelay = Math.random() * (randomDelay);

            const targetSeq = new Sequence()
                // Hide the actual token at the start of fall
                .animation()
                .delay(staggerDelay)
                .on(target)
                .opacity(0)
                .show(true)
                .waitUntilFinished()

                // Mini copy sprite representing the token falling from high in the sky toward the ground
                .effect()
                .copySprite(target)
                .attachTo(target, { offset: { y: -0.4 * targetWidth }, gridUnits: true, bindAlpha: false })
                .scaleToObject(fallenScale, { considerTokenScale: false })
                .scaleIn(0, 500, { ease: 'easeOutBack' })
                .spriteRotation(-targetRotation)
                .opacity(0.9)
                .aboveLighting()
                .zIndex(1)
                .duration(1000)

                // Show the "extremely far away" pin for the first 1s
                .effect()
                .file(closest('icons/pings/chevron.webp'))
                .attachTo(target, { offset: { y: -0.4 * targetWidth + 0.2 * targetWidth }, gridUnits: true, bindAlpha: false })
                .scaleToObject(0.25, { considerTokenScale: false })
                .scaleIn(0, 250, { ease: 'easeOutBack' })
                .loopProperty('spriteContainer', 'position.y', { from: 0, to: 0.025, duration: 500, pingPong: true, gridUnits: true, ease: 'easeInSine' })
                .tint(game.user.color?.css ?? '#ffffff')
                .opacity(0.9)
                .duration(1000)
                .waitUntilFinished()

                // Copy sprite falls from the sky
                .effect()
                .copySprite(target)
                .attachTo(target, { bindAlpha: false })
                .scaleToObject(1, { considerTokenScale: true })
                .scaleIn(startScale, 1000, { ease: 'easeInQuad' })
                .spriteRotation(-targetRotation)
                .fadeIn(250)
                .duration(1000)
                .waitUntilFinished()

                // Smoke puff when landing
                .effect()
                .file(closest('jb2a.smoke.puff.ring.01.white'))
                .atLocation(target)
                .size({ width: widthPx * smokeSize, height: heightPx * smokeSize })
                .opacity(0.8)
                .belowTokens()

                // Ground crack impact
                .effect()
                .file(closest(`jb2a.impact.ground_crack.${color}.02`))
                .atLocation(target)
                .size({ width: widthPx * 2, height: heightPx * 2 })
                .belowTokens()

                // Ground crack still frame
                .effect()
                .file(closest('jb2a.impact.ground_crack.still_frame.02'))
                .atLocation(target)
                .size({ width: widthPx * 2, height: heightPx * 2 })
                .belowTokens()
                .fadeOut(1000)
                .duration(5000)

                // Restore token opacity
                .animation()
                .on(target)
                .opacity(1);

            targetSeqs.push(targetSeq);
        });

        seq = seq.thenDo(async () => {
            await Promise.all(targetSeqs.map(s => s.play()));
        });
    }

    return seq;
}

async function play(trapObject: Tile, targets: Token[] = [], config: FallingSkyTrapConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const seq = await create(trapObject, targets, config);
    return seq.play();
}

async function stop(trapObject: Tile, config: FallingSkyTrapConfig = {}): Promise<void> {
    if (!trapObject) return;
    if (adapter.isDocumentOfType(trapObject, 'Tile')) {
        await new Sequence()
            .animation()
            .on(trapObject)
            .fadeOut(1000)
            .opacity(0)
            .play();
    }
}

async function setup(config: Record<string, unknown> = {}): Promise<any> {
    return setupTrap('eskie.traps.fallingSky', config);
}

export const fallingSky: TrapModule<FallingSkyTrapConfig> = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
