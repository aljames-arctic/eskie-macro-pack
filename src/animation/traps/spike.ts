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

export interface SpikeScaleConfig {
    xScale: number;
    yScale: number;
}

export interface SpikeTrapConfig extends TrapConfig {
    delay?: number;
    spike?: SpikeScaleConfig;
    sound?: SoundConfig;
}

const DEFAULT_CONFIG: SpikeTrapConfig = {
    delay: 500,
    spike: {
        xScale: 1.5,
        yScale: 1.5,
    },
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(trapObject: Tile, targets: Token[] = [], config: SpikeTrapConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const { delay, spike: spikeConfig, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    if (!trapObject) return new Sequence();

    const trapBounds = adapter.getBounds(trapObject);
    const trapCenter = trapBounds.center;
    const { xScale, yScale } = spikeConfig;
    const effectWidth = trapBounds.width * xScale;
    const effectHeight = trapBounds.height * yScale;

    let seq = new Sequence();
    applySound(seq, sound);
    seq = seq
        // Hidden/still frame base of the spike trap below tokens
        .effect()
        .file(closest('jb2a.spike_trap.10x10ft.top.base.still_frame.hidden'))
        .atLocation(trapCenter)
        .fadeIn(250)
        .fadeOut(250)
        .duration(4000)
        .belowTokens()
        .size({ width: effectWidth, height: effectHeight })

        // The spike trap snapping/firing above tokens
        .effect()
        .file(closest('jb2a.spike_trap.10x10ft.top.no_base.normal.01.01'))
        .atLocation(trapCenter)
        .size({ width: effectWidth, height: effectHeight })
        .zIndex(1)

        .wait(delay);

    if (targets.length > 0) {
        targets.forEach(target => {
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
                .spriteRotation(-adapter.getTokenRotation(target))
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

async function play(trapObject: Tile, targets: Token[] = [], config: SpikeTrapConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const seq = await create(trapObject, targets, config);
    return seq.play();
}

async function stop(trapObject: Tile, config: SpikeTrapConfig = {}): Promise<void> {
    // No persistent effects to stop
}

async function setup(config: Record<string, unknown> = {}): Promise<any> {
    return setupTrap('eskie.traps.spike', config);
}

export const spike: TrapModule<SpikeTrapConfig> = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
