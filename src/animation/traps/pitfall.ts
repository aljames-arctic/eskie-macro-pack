/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { setupTrap } from './trap-manager.js';

import { adapter } from "../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../utils/sound.js";
import type { SoundConfig, TrapConfig, TrapModule } from '../../types/animation.js';

export interface PitfallTrapConfig extends TrapConfig {
    reveal?: boolean;
    smokeSize?: number;
    fallenScale?: number;
    sound?: SoundConfig;
}

const DEFAULT_CONFIG: PitfallTrapConfig = {
    reveal: true,
    smokeSize: 2,
    fallenScale: 0.3,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(trapObject: Tile, targets: Token[] = [], config: PitfallTrapConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const { reveal, smokeSize, fallenScale, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    if (!trapObject) return new Sequence();

    const trapBounds = adapter.getBounds(trapObject);
    const trapCenter = trapBounds.center;
    const trapWidth = trapBounds.width;
    const trapHeight = trapBounds.height;

    let seq = new Sequence();
    applySound(seq, sound);
    seq = seq
        // Dust puff when trap opens
        .effect()
        .file(closest('jb2a.smoke.puff.ring.01.white.1'))
        .atLocation(trapCenter)
        .opacity(1)
        .size({ width: trapWidth * smokeSize, height: trapHeight * smokeSize })
        .belowTokens();

    if (reveal && adapter.isDocumentOfType(trapObject, 'Tile')) {
        seq = seq
            .animation()
            .on(trapObject)
            .show()
            .opacity(1);
    }

    if (targets.length > 0) {
        targets.forEach(target => {
            const targetWidth = target.document.width;
            const targetRotation = adapter.getTokenRotation(target);
            const fallenEffectName = `pitfall-fallen-${target.id}`;

            seq = seq
                // Visual transition representing token falling down
                .effect()
                .name(fallenEffectName)
                .copySprite(target)
                .spriteRotation(-targetRotation)
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
                .spriteRotation(-targetRotation)
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
                .tint(game.user.color?.css ?? '#ffffff')
                .opacity(0.9)
                .aboveLighting()
                .persist()
                .delay(1500);
        });
    }

    return seq;
}

async function play(trapObject: Tile, targets: Token[] = [], config: PitfallTrapConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const seq = await create(trapObject, targets, config);
    return seq.play();
}

async function stop(trapObject: Tile, config: PitfallTrapConfig = {}): Promise<void> {
    config = settingsOverride(config);
    const { sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    if (!trapObject) return;

    const finalTargets = adapter.getTokensInPlaceable(trapObject);

    let seq = new Sequence();
    applySound(seq, sound);
    if (adapter.isDocumentOfType(trapObject, 'Tile')) {
        seq = seq
            // Reset/hide the pit tile
            .animation()
            .on(trapObject)
            .fadeOut(1000)
            .opacity(0);
    }

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

async function setup(config: Record<string, unknown> = {}): Promise<any> {
    return setupTrap('eskie.traps.pitfall', config);
}

export const pitfall: TrapModule<PitfallTrapConfig> = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
