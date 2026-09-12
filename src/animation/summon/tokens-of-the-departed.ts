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

export interface SummonOptions {
    actor?: Actor | string | null;
    uuid?: string | null;
    crosshairParameters?: Record<string, unknown>;
    crosshairCallbacks?: Record<string, unknown>;
    tokenData?: Record<string, unknown>;
    location?: { x: number; y: number } | null;
    drawPing?: boolean;
    changeLight?: boolean;
    light?: TokensOfTheDepartedLightConfig;
    tint?: string;
    [key: string]: unknown;
}

export interface TokensOfTheDepartedConfig {
    id?: string;
    actor?: Actor | string | null;
    uuid?: string | null;
    location?: { x: number; y: number } | null;
    summonConfig?: SummonOptions;
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
    summonConfig: {},
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
    if (adapter.isDocumentOfType(target, 'Token')) return true;
    return 'document' in target || 'center' in target;
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
 * Summons a token onto the canvas for an actor.
 * @param {Actor | string} actor Actor document, name, or UUID
 * @param {SummonOptions} [summonConfig={}] Summoning placement options (crosshairs, location, tokenData)
 * @returns {Promise<Token | null>} The summoned Token placeable or null
 */
async function summon(
    actor: Actor | string,
    summonConfig: SummonOptions = {}
): Promise<Token | null> {
    if (!actor) return null;

    let targetUuid: string | null = null;
    let actorDoc: Actor | null = null;

    if (isActor(actor)) {
        actorDoc = actor;
        targetUuid = actor.uuid;
    } else if (actor.includes('.')) {
        targetUuid = actor;
    } else {
        actorDoc = game.actors.getName(actor) ?? null;
        if (!actorDoc) return null;
        targetUuid = actorDoc.uuid;
    }

    if (!targetUuid) return null;

    const tokenData: Record<string, unknown> = {
        alpha: 0,
        ...summonConfig.tokenData
    };

    if (summonConfig.changeLight !== false) {
        tokenData.light = summonConfig.light ?? {
            ...DEFAULT_CONFIG.light,
            ...(summonConfig.tint ? { color: summonConfig.tint } : {})
        };
    }

    const location = summonConfig.location;
    if (location) {
        if (!actorDoc && targetUuid) {
            actorDoc = (await fromUuid(targetUuid)) as Actor | null;
        }
        if (!actorDoc || !canvas.scene) return null;

        const tokenDocData = await actorDoc.getTokenDocument({
            x: location.x,
            y: location.y,
            ...tokenData
        });
        const tokenDataObj = 'toObject' in tokenDocData && typeof tokenDocData.toObject === 'function'
            ? tokenDocData.toObject()
            : tokenDocData;
        const created = await (canvas.scene as any).createEmbeddedDocuments('Token', [tokenDataObj]);
        const firstCreated = Array.isArray(created) ? created[0] : created;
        return (firstCreated?.object ?? adapter.getPlaceable(firstCreated?.id)) as Token;
    }

    const pickOptions: Record<string, unknown> = {
        crosshairParameters: summonConfig.crosshairParameters ?? DEFAULT_CONFIG.crosshairParameters,
        ...summonConfig,
        tokenData,
        uuid: targetUuid,
        drawPing: summonConfig.drawPing ?? false
    };

    return adapter.summons.pick(pickOptions);
}

/**
 * Builds the Sequence animation.
 * If only a single token is provided, adjusts the copySprite on that token without summoning anything.
 * If a caster token and a summoned token are provided, builds the sequence from caster to summoned token.
 *
 * @param {Token} token Target token to adjust, or caster token if summonToken is also provided
 * @param {Token | TokensOfTheDepartedConfig} [summonTokenOrConfig={}] Summoned token or configuration options
 * @param {TokensOfTheDepartedConfig} [config={}] Configuration options
 * @returns {Promise<Sequence | null>}
 */
async function create(
    token: Token,
    summonTokenOrConfig?: Token | TokensOfTheDepartedConfig,
    config: TokensOfTheDepartedConfig = {}
): Promise<any> {
    if (!token) return null;

    let casterToken: Token | null = null;
    let targetToken: Token;
    let mConfig: TokensOfTheDepartedConfig;

    if (isToken(summonTokenOrConfig)) {
        casterToken = token;
        targetToken = summonTokenOrConfig;
        mConfig = adapter.mergeObject(DEFAULT_CONFIG, settingsOverride(config));
    } else {
        targetToken = token;
        mConfig = adapter.mergeObject(DEFAULT_CONFIG, settingsOverride(summonTokenOrConfig));
    }

    const { sound, tint } = mConfig;
    const sequence = new Sequence();
    applySound(sequence, sound);

    const effectTint = tint ?? '#58feb0';
    const targetRotation = adapter.getTokenRotation(targetToken);

    if (casterToken) {
        sequence
            .effect()
                .file(closest('jb2a.extras.tmfx.border.circle.outpulse.01.fast'))
                .atLocation(casterToken, { offset: { y: -0 }, gridUnits: true, bindRotation: false })
                .scaleToObject(0.25)
                .filter('ColorMatrix', { hue: -50 })
                .zIndex(1)
                .duration(1500)
                .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.25, duration: 250, ease: 'easeOutSine', gridUnits: true, delay: 500 })
                .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.25, duration: 750, ease: 'easeOutSine', gridUnits: true, delay: 750 })
                .moveTowards(targetToken, { delay: 500, ease: 'easeOutCubic', rotate: false })
                .scaleOut(0, 1000, { ease: 'easeOutSine' })
                .tint(effectTint)

            .effect()
                .file(closest('eskie.star.03.blue'))
                .atLocation(casterToken, { offset: { y: -0 }, gridUnits: true, bindRotation: false })
                .scaleToObject(0.75)
                .filter('ColorMatrix', { hue: -50 })
                .zIndex(1)
                .duration(1500)
                .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.25, duration: 250, ease: 'easeOutSine', gridUnits: true, delay: 500 })
                .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.25, duration: 750, ease: 'easeOutSine', gridUnits: true, delay: 750 })
                .animateProperty('sprite', 'rotation', { from: 0, to: 360 * 2, duration: 1500, delay: 500, ease: 'easeOutCubic' })
                .moveTowards(targetToken, { delay: 500, ease: 'easeOutCubic', rotate: false })
                .scaleOut(0, 1000, { ease: 'easeOutSine' })
                .waitUntilFinished(-500);
    }

    sequence
        .effect()
            .file(closest('eskie.poison.circle.01.teal'))
            .atLocation(targetToken)
            .scaleToObject(1.5)
            .zIndex(2)

        .effect()
            .name(`${targetToken.name} Tokens of the Departed`)
            .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
            .attachTo(targetToken, { bindAlpha: false })
            .scaleToObject(1.45, { considerTokenScale: true })
            .randomRotation()
            .belowTokens()
            .opacity(0.45)
            .tint(effectTint)
            .fadeIn(2500, { ease: 'easeInSine' })
            .persist()

        .effect()
            .name(`${targetToken.name} Tokens of the Departed`)
            .copySprite(targetToken)
            .spriteRotation(-targetRotation)
            .attachTo(targetToken, { bindAlpha: false })
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
 * If omitted, summons using the configured default actor.
 *
 * @param {Token} token Caster token
 * @param {Token | Actor} [summonTarget] Summoned token or actor to summon
 * @param {TokensOfTheDepartedConfig} [config={}] Configuration options
 * @returns {Promise<any>}
 */
async function play(
    token: Token,
    summonTarget?: Token | Actor,
    config: TokensOfTheDepartedConfig = {}
): Promise<any> {
    if (!token) return null;

    let summonToken: Token | null = null;
    if (isToken(summonTarget)) {
        summonToken = summonTarget;
    } else {
        const actor = summonTarget ?? config.actor;
        if (!actor) return null;
        summonToken = await summon(actor, config.summonConfig);
    }

    if (!summonToken) return null;

    const sequence = await create(token, summonToken, config);
    return sequence?.play();
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
    summon,
    spawn: summon,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('tokensOfTheDeparted', 'token', 'eskie.summon.tokensOfTheDeparted', DEFAULT_CONFIG, '0.0.3', 'Tokens of the Departed');


