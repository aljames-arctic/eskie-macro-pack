// Original Author: .eskie
// Integration & Modular Conversion: bakanabaka

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { adapter } from '../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../utils/sound.js';
import type { SoundConfig } from '../../types/animation.js';

export interface TokensOfTheDepartedLightConfig {
    dim?: number;
    bright?: number;
    alpha?: number;
    luminosity?: number;
    color?: string;
    animation?: {
        type?: string;
        speed?: number;
        intensity?: number;
    };
    attenuation?: number;
    contrast?: number;
    shadows?: number;
}

export interface TokensOfTheDepartedConfig {
    id?: string;
    actor?: Actor | string | null;
    uuid?: string | null;
    tint?: string;
    changeLight?: boolean;
    light?: TokensOfTheDepartedLightConfig;
    sound?: SoundConfig;
    crosshairParameters?: Record<string, unknown>;
    tokenData?: Record<string, unknown>;
    [key: string]: unknown;
}

export const DEFAULT_CONFIG: TokensOfTheDepartedConfig = {
    id: 'tokensOfTheDeparted',
    actor: null,
    uuid: null,
    tint: '#58feb0',
    changeLight: true,
    light: {
        dim: 0,
        bright: 1,
        alpha: 0.25,
        luminosity: 0.55,
        color: '#58feb0',
        animation: { type: 'torch', speed: 4, intensity: 5 },
        attenuation: 0.85,
        contrast: 0,
        shadows: 0
    },
    sound: { ...DEFAULT_SOUND_CONFIG },
    crosshairParameters: {
        t: 'circle',
        distance: 2.5,
        gridHighlight: false,
        borderAlpha: 0
    }
};

/**
 * Spawns a summoned token on the canvas via Foundry Summons.
 * @param {Token} token Caster token
 * @param {TokensOfTheDepartedConfig} [config={}] Configuration options
 * @returns {Promise<Token | null>} The summoned Token placeable or null
 */
async function spawn(token: Token, config: TokensOfTheDepartedConfig = {}): Promise<Token | null> {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { changeLight, light, tint, crosshairParameters } = mConfig;

    let targetActor = mConfig.actor;
    let targetUuid = mConfig.uuid;

    if (!targetUuid && !targetActor) {
        const defaultActor = game?.actors?.getName?.('Token of the Departed') ?? game?.actors?.getName?.('Tokens of the Departed');
        if (defaultActor) {
            targetUuid = defaultActor.uuid;
        }
    }

    const tokenLight = changeLight ? (light ?? {
        dim: 0,
        bright: 1,
        alpha: 0.25,
        luminosity: 0.55,
        color: tint ?? '#58feb0',
        animation: { type: 'torch', speed: 4, intensity: 5 },
        attenuation: 0.85,
        contrast: 0,
        shadows: 0
    }) : undefined;

    const tokenData: Record<string, unknown> = {
        alpha: 0,
        ...(mConfig.tokenData ?? {})
    };
    if (tokenLight) {
        tokenData.light = tokenLight;
    }

    const pickOptions: Record<string, unknown> = {
        crosshairParameters: crosshairParameters ?? {
            t: 'circle',
            distance: 2.5,
            gridHighlight: false,
            borderAlpha: 0
        },
        tokenData,
        drawPing: false
    };

    if (targetUuid) {
        pickOptions.uuid = targetUuid;
    } else if (targetActor) {
        pickOptions.actor = targetActor;
    }

    return adapter.summons.pick(pickOptions);
}

/**
 * Builds the Sequence animation between the caster token and summoned token.
 * @param {Token} token Caster token
 * @param {Token} summonToken Summoned token
 * @param {TokensOfTheDepartedConfig} [config={}] Configuration options
 * @returns {Promise<Sequence | null>}
 */
async function create(token: Token, summonToken: Token, config: TokensOfTheDepartedConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound, tint } = mConfig;

    if (!token || !summonToken) return null;

    const sequence = new Sequence();
    applySound(sequence, sound);

    const effectTint = tint ?? '#58feb0';

    sequence
        .effect()
            .file(closest('jb2a.extras.tmfx.border.circle.outpulse.01.fast'))
            .atLocation(token, { offset: { y: -0 }, gridUnits: true, bindRotation: false })
            .scaleToObject(0.25)
            .filter('ColorMatrix', { hue: -50 })
            .zIndex(1)
            .duration(1500)
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.25, duration: 250, ease: 'easeOutSine', gridUnits: true, delay: 500 })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.25, duration: 750, ease: 'easeOutSine', gridUnits: true, delay: 750 })
            .moveTowards(summonToken, { delay: 500, ease: 'easeOutCubic', rotate: false })
            .scaleOut(0, 1000, { ease: 'easeOutSine' })
            .tint(effectTint)

        .effect()
            .file(closest('eskie.star.03.blue'))
            .atLocation(token, { offset: { y: -0 }, gridUnits: true, bindRotation: false })
            .scaleToObject(0.75)
            .filter('ColorMatrix', { hue: -50 })
            .zIndex(1)
            .duration(1500)
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.25, duration: 250, ease: 'easeOutSine', gridUnits: true, delay: 500 })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.25, duration: 750, ease: 'easeOutSine', gridUnits: true, delay: 750 })
            .animateProperty('sprite', 'rotation', { from: 0, to: 360 * 2, duration: 1500, delay: 500, ease: 'easeOutCubic' })
            .moveTowards(summonToken, { delay: 500, ease: 'easeOutCubic', rotate: false })
            .scaleOut(0, 1000, { ease: 'easeOutSine' })
            .waitUntilFinished(-500)

        .effect()
            .file(closest('eskie.poison.circle.01.teal'))
            .atLocation(summonToken)
            .scaleToObject(1.5)
            .zIndex(2)

        .effect()
            .name(`${summonToken.name} Tokens of the Departed`)
            .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
            .attachTo(summonToken, { bindAlpha: false })
            .scaleToObject(1.45, { considerTokenScale: true })
            .randomRotation()
            .belowTokens()
            .opacity(0.45)
            .tint(effectTint)
            .fadeIn(2500, { ease: 'easeInSine' })
            .persist()

        .effect()
            .name(`${summonToken.name} Tokens of the Departed`)
            .copySprite(summonToken)
            .attachTo(summonToken, { bindAlpha: false })
            .scaleToObject(1, { considerTokenScale: true })
            .opacity(0.65)
            .tint(effectTint)
            .loopProperty('sprite', 'position.x', { from: 0.025, to: -0.025, duration: 5000, gridUnits: true, pingPong: true, ease: 'easeOutSine' })
            .loopProperty('sprite', 'position.y', { from: 0, to: -0.03, duration: 2500, gridUnits: true, pingPong: true })
            .filter('ColorMatrix', { saturate: -0.2, brightness: 1.2 })
            .filter('Blur', { blurX: 0, blurY: 0.8 })
            .fadeIn(2500, { ease: 'easeInSine' })
            .persist();

    return sequence;
}

/**
 * Plays the Tokens of the Departed sequence.
 * If summonToken is not provided, summons a new token via Foundry Summons first.
 * @param {Token} token Caster token
 * @param {Token | TokensOfTheDepartedConfig} [summonTokenOrConfig] Summoned token or configuration
 * @param {TokensOfTheDepartedConfig} [config={}] Configuration options
 * @returns {Promise<any>}
 */
async function play(token: Token, summonTokenOrConfig?: Token | TokensOfTheDepartedConfig, config?: TokensOfTheDepartedConfig): Promise<any> {
    let summonToken: Token | null = null;
    let cfg: TokensOfTheDepartedConfig;

    if (summonTokenOrConfig && 'document' in summonTokenOrConfig) {
        summonToken = summonTokenOrConfig as Token;
        cfg = config ?? {};
    } else {
        cfg = (summonTokenOrConfig as TokensOfTheDepartedConfig) ?? config ?? {};
        summonToken = await spawn(token, cfg);
    }

    if (!summonToken) return null;

    const sequence = await create(token, summonToken, cfg);
    if (sequence) return sequence.play();
}

/**
 * Stops persistent Tokens of the Departed visual effects on the summoned token.
 * @param {Token} token Caster token
 * @param {Token} [summonToken] Summoned token
 * @param {TokensOfTheDepartedConfig} [config={}] Configuration options
 * @returns {Promise<void>}
 */
async function stop(token: Token, summonToken?: Token, config: TokensOfTheDepartedConfig = {}): Promise<void> {
    const target = summonToken ?? token;
    if (target) {
        Sequencer.EffectManager.endEffects({
            name: `${target.name} Tokens of the Departed`,
            object: target
        });
    }
}

export const tokensOfTheDeparted = {
    create,
    play,
    stop,
    spawn,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('tokensOfTheDeparted', 'token', 'eskie.summon.tokensOfTheDeparted', DEFAULT_CONFIG, '0.0.1', 'Tokens of the Departed');
