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
    location?: { x: number; y: number } | null;
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
    location: null,
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
 * Checks whether a target is a Token placeable or Token document.
 * @param {unknown} target
 * @returns {boolean}
 */
function isToken(target: unknown): target is Token {
    if (!target || typeof target !== 'object') return false;
    return ('center' in target && 'document' in target) || ('documentName' in target && (target as any).documentName === 'Token');
}

/**
 * Checks whether a target is an Actor document.
 * @param {unknown} target
 * @returns {boolean}
 */
function isActor(target: unknown): target is Actor {
    if (!target || typeof target !== 'object') return false;
    return ('documentName' in target && (target as any).documentName === 'Actor') || ('items' in target && !('document' in target) && 'uuid' in target);
}

/**
 * Spawns a summoned token on the canvas via Foundry Summons (or directly at a configured location).
 * @param {Token} token Caster token
 * @param {Actor | string | TokensOfTheDepartedConfig} [actorOrConfig={}] Actor document, name, UUID, or configuration options
 * @param {TokensOfTheDepartedConfig} [config={}] Additional configuration options if actor was passed first
 * @returns {Promise<Token | null>} The summoned Token placeable or null
 */
async function spawn(
    token: Token,
    actorOrConfig: Actor | string | TokensOfTheDepartedConfig = {},
    config: TokensOfTheDepartedConfig = {}
): Promise<Token | null> {
    let baseConfig: TokensOfTheDepartedConfig;
    if (typeof actorOrConfig === 'string') {
        baseConfig = { ...config, actor: actorOrConfig };
    } else if (isActor(actorOrConfig)) {
        baseConfig = { ...config, actor: actorOrConfig, uuid: actorOrConfig.uuid };
    } else {
        baseConfig = (actorOrConfig as TokensOfTheDepartedConfig) ?? config;
    }

    const mergedConfig = settingsOverride(baseConfig);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, mergedConfig);
    const { changeLight, light, tint, crosshairParameters, location } = mConfig;

    let targetActor = mConfig.actor;
    let targetUuid = mConfig.uuid;

    if (!targetUuid && !targetActor) {
        const defaultActor = game.actors.getName('Token of the Departed') ?? game.actors.getName('Tokens of the Departed');
        if (defaultActor) {
            targetUuid = defaultActor.uuid;
        }
    } else if (targetActor && typeof targetActor === 'object' && 'uuid' in targetActor) {
        targetUuid = (targetActor as Actor).uuid;
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

    // Direct location placement if explicit coordinates are provided
    if (location && typeof location === 'object' && typeof location.x === 'number' && typeof location.y === 'number') {
        let actorDoc: Actor | null = null;
        if (targetActor && typeof targetActor === 'object' && 'getTokenDocument' in targetActor) {
            actorDoc = targetActor as Actor;
        } else if (targetUuid) {
            actorDoc = (await fromUuid(targetUuid)) as Actor | null;
        } else if (typeof targetActor === 'string') {
            actorDoc = game.actors.getName(targetActor) ?? null;
        }

        if (actorDoc?.getTokenDocument && canvas.scene) {
            const tokenDocData = await actorDoc.getTokenDocument({
                x: location.x,
                y: location.y,
                ...tokenData
            });
            const tokenDataObj = 'toObject' in tokenDocData && typeof tokenDocData.toObject === 'function' ? tokenDocData.toObject() : tokenDocData;
            const created = await (canvas.scene as any).createEmbeddedDocuments('Token', [tokenDataObj]);
            const firstCreated = Array.isArray(created) ? created[0] : created;
            const placeable = (firstCreated?.object ?? adapter.getPlaceable(firstCreated?.id)) as Token;
            return placeable ?? null;
        }
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
    const summonRotation = adapter.getTokenRotation(summonToken);

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
            .spriteRotation(-summonRotation)
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
 * If summonTarget is a Token placeable, plays the animation directly with that token.
 * If summonTarget is an Actor document, summons a new token of that actor at a location first, then plays the animation.
 * If omitted or a configuration is provided, summons using the configured default actor.
 *
 * @param {Token} token Caster token
 * @param {Token | Actor | string | TokensOfTheDepartedConfig} [summonTargetOrConfig] Summoned token, actor to summon, or configuration
 * @param {TokensOfTheDepartedConfig} [config={}] Configuration options
 * @returns {Promise<any>}
 */
async function play(
    token: Token,
    summonTargetOrConfig?: Token | Actor | string | TokensOfTheDepartedConfig,
    config: TokensOfTheDepartedConfig = {}
): Promise<any> {
    let summonToken: Token | null = null;
    let cfg: TokensOfTheDepartedConfig;

    if (isToken(summonTargetOrConfig)) {
        summonToken = ('object' in summonTargetOrConfig && summonTargetOrConfig.object ? summonTargetOrConfig.object : summonTargetOrConfig) as Token;
        cfg = config;
    } else if (isActor(summonTargetOrConfig)) {
        cfg = { ...config, actor: summonTargetOrConfig, uuid: summonTargetOrConfig.uuid };
        summonToken = await spawn(token, cfg);
    } else if (typeof summonTargetOrConfig === 'string') {
        cfg = { ...config, actor: summonTargetOrConfig };
        summonToken = await spawn(token, cfg);
    } else {
        cfg = (summonTargetOrConfig as TokensOfTheDepartedConfig) ?? config;
        summonToken = await spawn(token, cfg);
    }

    if (!summonToken) return null;

    const sequence = await create(token, summonToken, cfg);
    if (sequence) return sequence.play();
}

/**
 * Stops persistent Tokens of the Departed visual effects on the summoned token.
 * @param {Token} token Caster token
 * @param {Token | Actor} [summonTarget] Summoned token or actor
 * @param {TokensOfTheDepartedConfig} [config={}] Configuration options
 * @returns {Promise<void>}
 */
async function stop(token: Token, summonTarget?: Token | Actor, config: TokensOfTheDepartedConfig = {}): Promise<void> {
    const target = summonTarget ?? token;
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

adapter.autorec.register('tokensOfTheDeparted', 'token', 'eskie.summon.tokensOfTheDeparted', DEFAULT_CONFIG, '0.0.2', 'Tokens of the Departed');

