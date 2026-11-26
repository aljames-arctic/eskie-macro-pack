import { adapter } from '../../adapters/index.js';
import { matt } from '../utils/matt-tiles.js';
import { MODULE_ID } from '../../lib/constants.js';
import { log, notify } from '../../lib/logger.js';
import { localize, format } from '../../lib/utils.js';

export interface TrapSetupEnvironment {
    isV14Plus: boolean;
    hasMatt: boolean;
}

/**
 * Validates GM permissions, Foundry platform generation, and MATT availability for trap setup.
 * - Below Foundry V14: requires Monk's Active Tile Triggers (MATT); errors if missing.
 * - Foundry V14+: native Regions are always supported; MATT enables optional Tile triggers.
 *
 * @param {string} [mode] Optional explicit mode override ('region' | 'matt')
 * @returns {TrapSetupEnvironment|null} Validated environment capabilities, or null if setup cannot proceed
 */
export function validateTrapSetupEnvironment(mode?: string): TrapSetupEnvironment | null {
    if (!game.user?.isGM) {
        notify.error(localize('EMP.traps.setup.onlyGm'));
        return null;
    }

    const isV14Plus = adapter.generation >= 14;
    const hasMatt = Boolean(game.modules.get('monks-active-tiles')?.active);

    if (!isV14Plus) {
        if (!hasMatt) {
            notify.error(localize(
                'EMP.traps.setup.mattRequiredBelowV14',
                "Monk's Active Tile Triggers (MATT) is required to set up traps on Foundry VTT versions below v14."
            ));
            return null;
        }
        return { isV14Plus: false, hasMatt: true };
    }

    if (mode === 'matt' && !hasMatt) {
        notify.error(localize(
            'EMP.traps.setup.tileRequiresMatt',
            "Monk's Active Tile Triggers is required to use Tiles as triggers. Select a Region on the canvas for native triggers."
        ));
        return null;
    }

    return { isV14Plus: true, hasMatt };
}

/**
 * Resolves localized trap setup dialog titles and prompt content based on whether MATT is active.
 * When MATT is inactive on Foundry V14+, prefers region-only copy over region-or-tile copy.
 *
 * @param {string} trapKey Normalized trap identifier
 * @param {string} stepKey Step property suffix (e.g. 'step1Title', 'step2Content')
 * @param {boolean} hasMatt Whether Monk's Active Tile Triggers is active
 * @param {string} genericWithMattKey Fallback key mentioning both Regions and Tiles
 * @param {string} genericRegionOnlyKey Fallback key mentioning only Regions
 * @param {Record<string, unknown>} [formatData] Optional format interpolation data
 * @returns {string}
 */
function resolveStepText(
    trapKey: string,
    stepKey: string,
    hasMatt: boolean,
    genericWithMattKey: string,
    genericRegionOnlyKey: string,
    formatData?: Record<string, unknown>
): string {
    const trapRegionOnlyKey = `EMP.traps.${trapKey}.${stepKey.replace(/^(step\d+)/, '$1RegionOnly')}`;
    const trapDefaultKey = `EMP.traps.${trapKey}.${stepKey}`;
    const genericKey = hasMatt ? genericWithMattKey : genericRegionOnlyKey;
    const genericText = formatData ? format(genericKey, formatData) : localize(genericKey);

    if (!hasMatt && game.i18n?.has?.(trapRegionOnlyKey)) {
        return localize(trapRegionOnlyKey, genericText);
    }
    return localize(trapDefaultKey, genericText);
}

/**
 * Configure and register a trap using Foundry V14+ Regions.
 * Supports linking Regions as triggers and, when MATT is active, Tiles as triggers or visual animation placeables.
 *
 * @param {string} animation Global animation path (e.g. 'eskie.traps.pitfall')
 * @param {object} [config={}] Setup configuration options
 * @param {boolean} [hasMatt=Boolean(game.modules.get('monks-active-tiles')?.active)] Whether MATT is active
 * @returns {Promise<{ triggerRegions: RegionDocument[], originElements: PlaceableObject[], targetElements: PlaceableObject[] }|void>}
 */
async function setupRegion(
    animation: string,
    config: Record<string, any> = {},
    hasMatt: boolean = Boolean(game.modules.get('monks-active-tiles')?.active)
): Promise<{ triggerRegions: any[], originElements: any[], targetElements: any[] } | void> {
    if (!game.user?.isGM) {
        return notify.error(localize('EMP.traps.setup.onlyGm'));
    }

    const pathParts = animation.split('.');
    const trapKey = pathParts[pathParts.length - 1];
    const isEskieTrap = animation.startsWith('eskie.traps.');
    const tileCount = config.tileCount ?? (isEskieTrap ? 2 : 3);

    // Step 1: Prompt user to select trigger regions (or tiles if MATT is active)
    const step1Title = resolveStepText(
        trapKey,
        'step1Title',
        hasMatt,
        'EMP.traps.setup.step1RegionTitle',
        'EMP.traps.setup.step1RegionOnlyTitle',
        { name: trapKey }
    );
    const step1Content = resolveStepText(
        trapKey,
        'step1Content',
        hasMatt,
        'EMP.traps.setup.step1RegionContent',
        'EMP.traps.setup.step1RegionOnlyContent'
    );

    const triggerResult = await adapter.buttonDialog({
        title: step1Title,
        buttons: [
            { label: localize('EMP.traps.common.continue'), value: 'continue' },
            { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
        ],
    }, {
        content: step1Content
    });

    if (triggerResult !== 'continue') return;

    const triggerRegions = adapter.getControlledRegions();
    const controlledTiles = canvas.tiles.controlled.map(t => t.document);

    if (triggerRegions.length === 0 && controlledTiles.length === 0) {
        return notify.warn(localize(
            hasMatt ? 'EMP.traps.setup.noTriggerRegions' : 'EMP.traps.setup.noTriggerRegionsOnly'
        ));
    }

    if (triggerRegions.length === 0 && controlledTiles.length > 0) {
        if (!hasMatt) {
            return notify.warn(localize(
                'EMP.traps.setup.tileRequiresMatt',
                "Monk's Active Tile Triggers is required to use Tiles as triggers. Select a Region on the canvas for native triggers."
            ));
        }
        return matt.trap.setup(animation, { ...config, triggerTiles: controlledTiles });
    }

    let originElements: any[] = [];
    let targetElements: any[] = [];

    if (tileCount === 1) {
        // Pure single-region trap (e.g. Electric Door): Trigger region IS the animation region
        originElements = triggerRegions;
    } else if (tileCount === 3) {
        // Step 2: Prompt user to select trap origin/launcher placeables
        const originTitle = resolveStepText(
            trapKey,
            'step2Title',
            hasMatt,
            'EMP.traps.setup.step2OriginRegionTitle',
            'EMP.traps.setup.step2OriginRegionOnlyTitle',
            { name: trapKey }
        );
        const originContent = resolveStepText(
            trapKey,
            'step2Content',
            hasMatt,
            'EMP.traps.setup.step2OriginRegionContent',
            'EMP.traps.setup.step2OriginRegionOnlyContent'
        );

        const originResult = await adapter.buttonDialog({
            title: originTitle,
            buttons: [
                { label: localize('EMP.traps.common.continue'), value: 'continue' },
                { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
            ],
        }, {
            content: originContent
        });

        if (originResult !== 'continue') return;

        const controlledTiles = canvas.tiles.controlled.map(t => t.document);
        const controlledRegions = adapter.getControlledRegions();

        // Enforce Tile requirement when mandatory (e.g. Bull Rush Statue)
        const requiresTile = Boolean(config.requiresTile || trapKey === 'bullRushStatue');
        if (requiresTile && controlledTiles.length === 0) {
            const warningMsg = localize(
                `EMP.traps.${trapKey}.noTile`,
                localize('EMP.traps.setup.noOriginTiles')
            );
            return notify.warn(warningMsg);
        }

        originElements = controlledTiles.length > 0 ? controlledTiles : controlledRegions;

        if (originElements.length === 0) {
            return notify.warn(localize(
                hasMatt ? 'EMP.traps.setup.noOriginRegions' : 'EMP.traps.setup.noOriginRegionsOnly'
            ));
        }

        // Step 3: Prompt user to select trap target/landing placeables
        const targetTitle = resolveStepText(
            trapKey,
            'step3Title',
            hasMatt,
            'EMP.traps.setup.step3TargetRegionTitle',
            'EMP.traps.setup.step3TargetRegionOnlyTitle',
            { name: trapKey }
        );
        const targetContent = resolveStepText(
            trapKey,
            'step3Content',
            hasMatt,
            'EMP.traps.setup.step3TargetRegionContent',
            'EMP.traps.setup.step3TargetRegionOnlyContent'
        );

        const targetResult = await adapter.buttonDialog({
            title: targetTitle,
            buttons: [
                { label: localize('EMP.traps.common.continue'), value: 'continue' },
                { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
            ],
        }, {
            content: targetContent
        });

        if (targetResult === 'cancel' || targetResult === false) return;

        const targetTiles = canvas.tiles.controlled.map(t => t.document);
        const targetRegions = adapter.getControlledRegions();
        targetElements = targetTiles.length > 0 ? targetTiles : targetRegions;

        if (targetElements.length === 0) {
            notify.warn(localize(
                hasMatt ? 'EMP.traps.setup.noTargetRegions' : 'EMP.traps.setup.noTargetRegionsOnly'
            ));
            targetElements = triggerRegions;
        }
    } else {
        // Step 2: Prompt user to select trap animation placeables
        const animTitle = resolveStepText(
            trapKey,
            'step2Title',
            hasMatt,
            'EMP.traps.setup.step2AnimRegionTitle',
            'EMP.traps.setup.step2AnimRegionOnlyTitle',
            { name: trapKey }
        );
        const animContent = resolveStepText(
            trapKey,
            'step2Content',
            hasMatt,
            'EMP.traps.setup.step2AnimRegionContent',
            'EMP.traps.setup.step2AnimRegionOnlyContent'
        );

        const animResult = await adapter.buttonDialog({
            title: animTitle,
            buttons: [
                { label: localize('EMP.traps.common.continue'), value: 'continue' },
                { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
            ],
        }, {
            content: animContent
        });

        if (animResult !== 'continue') return;

        const controlledTiles = canvas.tiles.controlled.map(t => t.document);
        const controlledRegions = adapter.getControlledRegions();

        // Enforce Tile requirement when mandatory (e.g. Flooding Room)
        const requiresTile = Boolean(config.requiresTile || trapKey === 'floodingRoom');
        if (requiresTile && controlledTiles.length === 0) {
            const warningMsg = localize(
                `EMP.traps.${trapKey}.noTile`,
                `${trapKey} requires a Tile placeable on the canvas. Trap setup cancelled.`
            );
            return notify.warn(warningMsg);
        }

        originElements = controlledTiles.length > 0 ? controlledTiles : (controlledRegions.length > 0 ? controlledRegions : triggerRegions);
    }

    const extraResults: Record<string, any> = {};
    if (config.extraTiles) {
        for (const extra of config.extraTiles) {
            const extraResult = await adapter.buttonDialog({
                title: format('EMP.traps.setup.extraTitle', { name: extra.label }),
                buttons: [
                    { label: localize('EMP.traps.common.continue'), value: 'continue' },
                    { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
                ],
            }, {
                content: `<p>${extra.prompt}</p><p>Click <strong>Continue</strong> once selected.</p>`
            });

            if (extraResult !== 'continue') return;

            const selectedTiles = canvas.tiles.controlled.map(t => t.id);
            const selectedRegions = adapter.getControlledRegions().map(r => r.id);
            const selected = selectedTiles.length > 0 ? selectedTiles : selectedRegions;

            if (selected.length === 0) {
                return notify.warn(format('EMP.traps.setup.noExtraTiles', { name: extra.label }));
            }
            extraResults[extra.key] = selected;
        }
    }

    const { tileCount: _tc, extraFlags: _ef, extraTiles: _et, trigger: _tr, controlled: _co, playPath: _pp, mode: _md, events: _ev, requiresTile: _rt, triggerTiles: _tt, ...trapOptions } = config;

    const targetId = tileCount === 3 ? (targetElements[0]?.id ?? null) : null;
    const originIds = originElements.map(e => e.id);
    const tileIds = originElements.filter(e => adapter.isDocumentOfType(e, 'Tile')).map(e => e.id);

    const hasOptions = Object.keys(trapOptions).length > 0;
    const optionsStr = targetId
        ? (hasOptions ? `{ ...${JSON.stringify(trapOptions)}, targetLocation }` : '{ targetLocation }')
        : (hasOptions ? JSON.stringify(trapOptions) : '{}');

    const regionActionCode = `
// Resolve the unified adapter from Eskie Macro Pack
const adapter = game.modules.get('${MODULE_ID}').api.adapter;

// Activating token from Region trigger event
const token = event.data?.token?.object;
if (!token) return;
${targetId ? `
// Target placeable (Region or Tile) and coordinate location
const targetPlaceable = adapter.getPlaceable('${targetId}');
if (!targetPlaceable) return;
const targetLocation = adapter.getTargetLocation(targetPlaceable);
` : ''}
// Origin / launcher placeables (Regions or Tiles)
const animPlaceables = ${JSON.stringify(originIds)}.map(id => adapter.getPlaceable(id)).filter(Boolean);
if (animPlaceables.length === 0) return;

// Execute the trap animation for all launcher placeables simultaneously
const animPromises = animPlaceables.map(placeable => {
    const trapZone = ${targetId ? 'targetPlaceable' : 'placeable'};
    let targets = adapter.getTokensInPlaceable(trapZone);
    const isTarget = adapter.isTokenInOrMovingIntoPlaceable(token, trapZone, {
        triggerRegionId: event.region?.id,
        movement: event.data?.movement ?? (event.data?.segments ? { segments: event.data.segments } : null)
    });

    if (isTarget && token.id && !targets.some(t => t.id === token.id)) {
        targets.push(token);
    }

    ${isEskieTrap
        ? `return ${animation}.play(placeable, targets, ${optionsStr});`
        : `return adapter.executeTrapEffect('${animation}', placeable, ${targetId ? 'targetPlaceable' : 'null'}, targets, ${optionsStr});`
    }
});
${tileIds.length > 0 ? `
// Trigger any linked external MATT tiles concurrently
for (const id of ${JSON.stringify(tileIds)}) {
    if (id === event.region?.id) continue;
    const tile = canvas.tiles.get(id);
    if (tile?.document?.trigger) {
        animPromises.push(tile.document.trigger({ token }));
    }
}
` : ''}
await Promise.all(animPromises);`

    const behaviorName = `${trapKey.charAt(0).toUpperCase() + trapKey.slice(1)} Trap (${MODULE_ID})`;
    const events = config.events ?? ['tokenEnter'];

    for (const triggerRegion of triggerRegions) {
        const behaviorData = adapter.formatRegionBehaviorData({
            name: behaviorName,
            events,
            source: regionActionCode,
        });
        await adapter.createRegionBehavior(triggerRegion, behaviorData);
    }

    const elementLabel = hasMatt ? 'placeable(s)' : 'region(s)';
    notify.info(`Successfully setup ${trapKey} trap using Regions for ${triggerRegions.length} trigger region(s) and ${originElements.length} ${elementLabel}.`);
    return { triggerRegions, originElements, targetElements };
}

/**
 * Universal trap setup orchestrator.
 * Validates platform generation and MATT availability before routing:
 * - Below Foundry V14: requires MATT and routes to MATT tile setup (tiles only).
 * - Foundry V14+: routes to Region setup (regions only without MATT, regions or tiles with MATT).
 *
 * @param {string} animation Global animation path (e.g. 'eskie.traps.pitfall')
 * @param {object} [config={}] Setup configuration options
 * @returns {Promise<object|void>}
 */
export async function setupTrap(animation: string, config: Record<string, any> = {}): Promise<any> {
    const env = validateTrapSetupEnvironment(config.mode);
    if (!env) return;

    const mode = config.mode ?? (env.isV14Plus ? 'region' : 'matt');

    if (mode === 'matt') {
        return matt.trap.setup(animation, config);
    }

    return setupRegion(animation, config, env.hasMatt);
}

/**
 * Constructs a Token-compatible proxy object from a Tile, Region, or Document.
 * Stands in for a caster token in animation routines (e.g. template or targeted spells fired from traps).
 *
 * @param {PlaceableObject|Document|null} placeable Origin Tile, Region, or Token
 * @param {{ x: number, y: number }|null} [targetLocation=null] Optional destination coordinates to orient rotation towards
 * @returns {CasterProxy|Token|null}
 */
export function createCasterProxy(placeable: any, targetLocation: { x: number; y: number } | null = null): any {
    return adapter.createCasterProxy(placeable, targetLocation);
}

export type TrapDispatchMode =
    | 'trap'
    | 'template'
    | 'victim'
    | 'origin'
    | 'position'
    | 'caster-to-position'
    | 'targets-only'
    | 'caster-to-targets'
    | 'caster-to-target';

const VALID_TRAP_DISPATCH_MODES = new Set<string>([
    'trap',
    'template',
    'victim',
    'origin',
    'position',
    'caster-to-position',
    'targets-only',
    'caster-to-targets',
    'caster-to-target',
]);

/**
 * Explicit trap dispatch overrides for effects whose JS entry signature differs
 * from the standard autorec trigger mapping.
 */
const TRAP_DISPATCH_OVERRIDES: Record<string, TrapDispatchMode> = {
    'eskie.effect.callLightning': 'caster-to-position',
    'eskie.effect.skyRocket': 'position',
    'eskie.effect.cloudOfSand': 'position',
    'eskie.effect.sleep': 'targets-only',
    'eskie.effect.shuffle': 'targets-only',
    'eskie.effect.chainLightning': 'caster-to-targets',
    'eskie.effect.bless': 'caster-to-targets',
    'eskie.effect.curseOfTheWerewolf': 'victim',
    'eskie.effect.animateDead': 'victim',
    'eskie.effect.wailsFromTheGrave.damage': 'victim',
    'eskie.effect.armorOfAgathys.cast': 'victim',
    'eskie.effect.trueStrike.cast': 'victim',
    'eskie.effect.disintegrate.dissolve': 'victim',
    'eskie.effect.disintegrate.reform': 'victim',
    'eskie.effect.vortexWarp': 'victim',
    'eskie.effect.frightfulMoan': 'origin',
    'eskie.effect.dreadLord': 'origin',
    'eskie.effect.bless.cast': 'origin',
    'eskie.effect.haloOfSpores.aura': 'origin',
    'eskie.effect.twilightSanctuary': 'origin',
    'eskie.effect.faerieFire': 'template',
    'eskie.effect.meteorStrike': 'template',
};

/**
 * Resolves how executeTrapEffect should invoke an effect module or function.
 * Consultation order:
 * 1. Explicit `config.type` override
 * 2. Native trap module (`eskie.traps.*` or has `.setup`)
 * 3. Explicit signature override table (`TRAP_DISPATCH_OVERRIDES` / `eskie.effect.detect.*`)
 * 4. Registered autorec trigger category (`adapter.autorec.getTrigger`)
 * 5. Fallback heuristics for custom/unregistered effects
 *
 * @param {string} animationPath Resolved animation path (if invoked by string)
 * @param {any} effectObj Resolved effect module or function
 * @param {string} [explicitType] Optional explicit `config.type` override
 * @returns {TrapDispatchMode}
 */
export function resolveTrapDispatchMode(
    animationPath: string,
    effectObj: any,
    explicitType?: string
): TrapDispatchMode {
    if (explicitType && VALID_TRAP_DISPATCH_MODES.has(explicitType)) {
        return explicitType as TrapDispatchMode;
    }

    if (Boolean(effectObj?.setup) || animationPath.includes('.traps.')) {
        return 'trap';
    }

    if (animationPath && TRAP_DISPATCH_OVERRIDES[animationPath]) {
        return TRAP_DISPATCH_OVERRIDES[animationPath];
    }

    if (animationPath.startsWith('eskie.effect.detect.')) {
        return 'origin';
    }

    const playFn = effectObj?.play ?? effectObj;
    const fnStr = playFn?.toString ? playFn.toString() : '';
    const acceptsTargetArray = /\(\s*[^,)]+\s*,\s*(?:targets|targetTokens)\b/.test(fnStr);
    const acceptsSingleTarget = /\(\s*[^,)]+\s*,\s*(?:target|ally|target1)\b/.test(fnStr);

    const autorecTrigger = adapter.autorec.getTrigger(animationPath, effectObj?.default_config);
    if (autorecTrigger) {
        if (autorecTrigger === 'template') return 'template';
        if (autorecTrigger === 'effect') return 'victim';
        if (autorecTrigger === 'aura') return 'origin';
        if (autorecTrigger === 'ranged-target' || autorecTrigger === 'melee-target') {
            return acceptsTargetArray ? 'caster-to-targets' : 'caster-to-target';
        }
        if (autorecTrigger === 'token') {
            if (acceptsTargetArray) return 'caster-to-targets';
            if (acceptsSingleTarget) return 'caster-to-target';
            return 'origin';
        }
    }

    const defaultConfig = effectObj?.default_config;
    const isFallbackTemplate = animationPath.includes('.template.')
        || animationPath.includes('templatefx')
        || Boolean(defaultConfig && (
            'radius' in defaultConfig
            || 'template' in defaultConfig
            || 'aoeDistance' in defaultConfig
            || ('distance' in defaultConfig && !('pushDistance' in defaultConfig))
        ));
    if (isFallbackTemplate) {
        return 'template';
    }

    if (acceptsTargetArray) {
        return 'caster-to-targets';
    }

    return 'caster-to-target';
}

/**
 * Executes an animation effect as a trap.
 * Origin placeable stands in for the caster, firing towards the trap target placeable / target tokens.
 * Supports template effects (e.g. Fireball, Lightning Bolt, Silence, Spike Growth),
 * targeted effects (e.g. Disintegrate, Guiding Bolt, Chain Lightning),
 * victim-only effects (e.g. Charmed, Petrified, Banishment, Emotes),
 * origin effects (e.g. Frightful Moan, Twilight Sanctuary),
 * and standard trap modules (e.g. Fire, Spike, Projectile).
 *
 * @param {string|object|Function} animation Global animation path (e.g. 'eskie.effect.fireball') or effect module
 * @param {PlaceableObject|Document|string} originPlaceable Origin Tile or Region placeable standing in for the caster
 * @param {PlaceableObject|Document|string|null} [targetPlaceable=null] Trap target Tile or Region landing zone
 * @param {Token[]} [targets=[]] Target tokens within or entering the trap placeable
 * @param {Record<string, any>} [config={}] Configuration options
 * @returns {Promise<any>}
 */
export async function executeTrapEffect(
    animation: any,
    originPlaceable: any,
    targetPlaceable: any = null,
    targets: Token[] = [],
    config: Record<string, any> = {}
): Promise<any> {
    const isStringOrigin = Boolean(originPlaceable?.substring);
    const isStringTarget = Boolean(targetPlaceable?.substring);
    const origin = isStringOrigin ? adapter.getPlaceable(originPlaceable) : originPlaceable;
    const target = isStringTarget ? adapter.getPlaceable(targetPlaceable) : targetPlaceable;

    if (!origin) {
        log.warn('executeTrapEffect | Origin placeable is missing or invalid.');
        return null;
    }

    let effectObj: any = animation;
    let animationPath = '';
    if (animation?.substring) {
        animationPath = animation;
        effectObj = adapter.getProperty(globalThis, animation);
        if (!effectObj) {
            const effectCandidate = adapter.getProperty(globalThis, `eskie.effect.${animation}`);
            if (effectCandidate) {
                animationPath = `eskie.effect.${animation}`;
                effectObj = effectCandidate;
            } else {
                const trapCandidate = adapter.getProperty(globalThis, `eskie.traps.${animation}`);
                if (trapCandidate) {
                    animationPath = `eskie.traps.${animation}`;
                    effectObj = trapCandidate;
                }
            }
        }
    }

    if (!effectObj) {
        log.error(`executeTrapEffect | Animation "${animation}" could not be resolved.`);
        return null;
    }

    const hasBoundPlay = Boolean(effectObj.play?.apply);
    const isDirectCallable = Boolean(effectObj.apply);
    if (!hasBoundPlay && !isDirectCallable) {
        log.error(`executeTrapEffect | Animation "${animation}" does not expose a playable function (specify a sub-effect such as .cast or .attack).`);
        return null;
    }

    const invokeEffect = (...args: any[]) =>
        hasBoundPlay ? effectObj.play(...args) : effectObj(...args);

    const targetLocation = config.targetLocation
        ? adapter.getTargetLocation(config.targetLocation)
        : (target ? adapter.getTargetLocation(target) : null);

    const casterProxy = adapter.createCasterProxy(origin, targetLocation);

    let resolvedTargets = Array.isArray(targets) ? [...targets] : [];
    if (resolvedTargets.length === 0) {
        const trapZone = target ?? origin;
        resolvedTargets = adapter.getTokensInPlaceable(trapZone);
    }

    const dispatchMode = resolveTrapDispatchMode(animationPath, effectObj, config.type);

    if (dispatchMode === 'trap') {
        const trapConfig = { ...config };
        if (targetLocation && !trapConfig.targetLocation) {
            trapConfig.targetLocation = targetLocation;
        }
        return invokeEffect(origin, resolvedTargets, trapConfig);
    }

    if (dispatchMode === 'template') {
        const templateConfig = {
            ...config,
            template: config.template ?? target ?? origin,
            targetLocation,
            target: config.target ?? target,
            targets: config.targets ?? resolvedTargets,
        };
        return invokeEffect(casterProxy, templateConfig);
    }

    const targetConfig = {
        ...config,
        targetLocation,
    };

    if (dispatchMode === 'origin') {
        return invokeEffect(casterProxy, targetConfig);
    }

    if (dispatchMode === 'victim') {
        if (resolvedTargets.length > 0) {
            return Promise.all(resolvedTargets.map(victim => invokeEffect(victim, targetConfig)));
        }
        if (target) {
            const targetProxy = adapter.createTargetProxy(target);
            return invokeEffect(targetProxy, targetConfig);
        }
        return null;
    }

    if (dispatchMode === 'position') {
        const resolvedPos = targetLocation
            ?? (resolvedTargets[0] ? adapter.getCenter(resolvedTargets[0]) : null)
            ?? casterProxy.center;
        return invokeEffect(resolvedPos, targetConfig);
    }

    if (dispatchMode === 'caster-to-position') {
        const resolvedPos = targetLocation
            ?? (resolvedTargets[0] ? adapter.getCenter(resolvedTargets[0]) : null)
            ?? casterProxy.center;
        return invokeEffect(casterProxy, resolvedPos, targetConfig);
    }

    if (dispatchMode === 'targets-only') {
        const targetList = resolvedTargets.length > 0
            ? resolvedTargets
            : (target ? [adapter.createTargetProxy(target)] : []);
        if (targetList.length === 0) return null;
        return invokeEffect(targetList, {
            ...targetConfig,
            position: config.position ?? targetLocation ?? casterProxy.center,
        });
    }

    if (dispatchMode === 'caster-to-targets') {
        const targetList = resolvedTargets.length > 0
            ? resolvedTargets
            : (target ? [adapter.createTargetProxy(target)] : []);
        if (targetList.length === 0) return null;
        return invokeEffect(casterProxy, targetList, targetConfig);
    }

    if (resolvedTargets.length > 0) {
        return Promise.all(resolvedTargets.map(targetToken => invokeEffect(casterProxy, targetToken, targetConfig)));
    }

    if (target) {
        const targetProxy = adapter.createTargetProxy(target);
        return invokeEffect(casterProxy, targetProxy, targetConfig);
    }

    return null;
}

export const playEffectAsTrap = executeTrapEffect;

adapter.executeTrapEffectHandler = executeTrapEffect;
