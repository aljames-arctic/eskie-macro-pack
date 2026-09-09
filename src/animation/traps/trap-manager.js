import { adapter } from '../../adapters/index.js';
import { matt } from '../utils/matt-tiles.js';
import { MODULE_ID } from '../../lib/constants.js';
import { log } from '../../lib/logger.js';

/**
 * Normalizes polymorphic caller context across RegionBehavior execution,
 * Monk's Active Tile Triggers, standalone macros, or direct function invocations.
 *
 * @param {object|Scene|Tile|Region} context Trigger context object or first positional argument
 * @param {...*} rest Additional positional arguments
 * @returns {{ type: 'region'|'tile', scene?: Scene, region?: RegionDocument, behavior?: RegionBehavior, event?: object, tile?: TileDocument, token?: TokenDocument }|null}
 */
export function extractTrapTriggerContext(context, ...rest) {
    if (!context) return null;

    // Case 1: Normalized context object
    if (!context.documentName) {
        if (context.region) {
            return {
                type: 'region',
                scene: context.scene ?? context.region.parent ?? canvas?.scene ?? null,
                region: context.region.document ?? context.region,
                behavior: context.behavior ?? null,
                event: context.event ?? null,
            };
        }
        if (context.tile) {
            return {
                type: 'tile',
                tile: context.tile.document ?? context.tile,
                token: context.token ?? null,
            };
        }
    }

    // Case 2: Positional RegionBehavior arguments: (scene, region, behavior, event)
    const isScene = context.documentName === 'Scene' || Boolean(context.regions);
    if (isScene && rest[0]) {
        const region = rest[0].document ?? rest[0];
        return {
            type: 'region',
            scene: context,
            region,
            behavior: rest[1] ?? null,
            event: rest[2] ?? null,
        };
    }

    // Case 3: RegionDocument or Region placeable passed as first positional arg: (region, behavior, event)
    const isRegion = context.documentName === 'Region' || Boolean(context.shapes) || Boolean(context.behaviors);
    if (isRegion) {
        const region = context.document ?? context;
        return {
            type: 'region',
            scene: region.parent ?? canvas?.scene ?? null,
            region,
            behavior: rest[0] ?? null,
            event: rest[1] ?? null,
        };
    }

    // Case 4: TileDocument or Tile placeable passed as first positional arg: (tile, token)
    const isTile = context.documentName === 'Tile' || Boolean(context.texture) || Boolean(context.mesh);
    if (isTile) {
        return {
            type: 'tile',
            tile: context.document ?? context,
            token: rest[0] ?? null,
        };
    }

    return null;
}

/**
 * Universal trap trigger execution runner.
 * Handles trap playback from either Foundry V14+ RegionBehaviors or Monk's Active Tile Triggers.
 * Resolves activating tokens, target placeables, and linked textured tiles concurrently.
 *
 * @param {object|Scene|Tile|Region} context Trigger context
 * @param {...*} rest Additional arguments
 * @returns {Promise<void>}
 */
export async function executeTrapTrigger(context, ...rest) {
    const triggerContext = extractTrapTriggerContext(context, ...rest);
    if (!triggerContext) return;

    if (triggerContext.type === 'region') {
        const { region, event, behavior } = triggerContext;
        const activatingToken = event?.data?.token?.object;
        if (!activatingToken) return;

        const regionDoc = region.document ?? region;
        const regionPlaceable = regionDoc.object ?? canvas.regions.get(regionDoc.id);

        const animation = regionDoc.getFlag?.(MODULE_ID, 'trap.animation')
            ?? regionDoc.flags?.[MODULE_ID]?.trap?.animation
            ?? behavior?.getFlag?.(MODULE_ID, 'trap.animation')
            ?? behavior?.flags?.[MODULE_ID]?.trap?.animation;

        const promises = [];

        if (animation) {
            const trap = adapter.getProperty(globalThis, animation);
            if (trap?.play) {
                const trapConfig = adapter.duplicate(
                    regionDoc.getFlag?.(MODULE_ID, 'trap.config')
                    ?? regionDoc.flags?.[MODULE_ID]?.trap?.config
                    ?? {}
                );

                // Resolve target placeable (Region or Tile for 3-placeable traps)
                const targetIds = regionDoc.getFlag?.(MODULE_ID, 'trap.targetRegionIds')
                    ?? regionDoc.flags?.[MODULE_ID]?.trap?.targetRegionIds
                    ?? regionDoc.getFlag?.(MODULE_ID, 'trap.targetTileIds')
                    ?? regionDoc.flags?.[MODULE_ID]?.trap?.targetTileIds
                    ?? regionDoc.getFlag?.(MODULE_ID, 'trap.trapTargetTileIds')
                    ?? regionDoc.flags?.[MODULE_ID]?.trap?.trapTargetTileIds
                    ?? [];
                const targetId = targetIds[0]
                    ?? regionDoc.getFlag?.(MODULE_ID, 'trap.targetRegionId')
                    ?? regionDoc.flags?.[MODULE_ID]?.trap?.targetRegionId
                    ?? regionDoc.getFlag?.(MODULE_ID, 'trap.targetTileId')
                    ?? regionDoc.flags?.[MODULE_ID]?.trap?.targetTileId;
                if (targetId) {
                    const targetPlaceable = adapter.getPlaceable(targetId);
                    if (!targetPlaceable) return;
                    trapConfig.targetLocation = adapter.getTargetLocation(targetPlaceable);
                }

                // Identify animation placeables (Tiles or Regions)
                const tileIds = regionDoc.getFlag?.(MODULE_ID, 'trap.tileIds')
                    ?? regionDoc.flags?.[MODULE_ID]?.trap?.tileIds
                    ?? [];
                const originIds = (
                    regionDoc.getFlag?.(MODULE_ID, 'trap.originIds')
                    ?? regionDoc.flags?.[MODULE_ID]?.trap?.originIds
                    ?? []
                );

                let animPlaceables = [];
                if (tileIds.length > 0) {
                    animPlaceables = tileIds.map(id => adapter.getPlaceable(id)).filter(Boolean);
                } else if (originIds.length > 0) {
                    animPlaceables = originIds.map(id => adapter.getPlaceable(id)).filter(Boolean);
                }

                if (animPlaceables.length === 0 && regionPlaceable) {
                    animPlaceables = [regionPlaceable];
                }

                if (animPlaceables.length === 0) return;

                for (const placeable of animPlaceables) {
                    let targets = adapter.getTokensInPlaceable(placeable);
                    if (activatingToken && activatingToken.id && !targets.some(t => t.id === activatingToken.id)) {
                        targets.push(activatingToken);
                    } else if (targets.length === 0 && activatingToken) {
                        targets = [activatingToken];
                    }

                    promises.push((async () => {
                        try {
                            await trap.play(placeable, targets, { ...trapConfig });
                        } catch (err) {
                            log.error(`Failed to play trap animation "${animation}" on placeable "${placeable.id}":`, err);
                            throw err;
                        }
                    })());
                }
            }
        }

        // Trigger any external linked MATT tiles concurrently
        const originIds = (
            regionDoc.getFlag?.(MODULE_ID, 'trap.originIds')
            ?? regionDoc.flags?.[MODULE_ID]?.trap?.originIds
            ?? []
        ).filter(id => id !== regionDoc.id);

        for (const id of originIds) {
            const tile = canvas?.tiles?.get?.(id);
            if (tile?.document?.trigger) {
                promises.push(tile.document.trigger({ token: activatingToken }));
            }
        }

        await Promise.all(promises);
    } else if (triggerContext.type === 'tile') {
        const { tile, token } = triggerContext;
        const tileDoc = tile.document ?? tile;
        const tilePlaceable = tile.object ?? canvas?.tiles?.get?.(tileDoc.id) ?? tile;

        const activatingToken = token
            ? (token.object ?? canvas?.tokens?.get?.(token.id ?? token) ?? token)
            : null;

        const animation = tileDoc.getFlag?.(MODULE_ID, 'trap.animation')
            ?? tileDoc.flags?.[MODULE_ID]?.trap?.animation;

        const promises = [];

        if (animation) {
            const trap = adapter.getProperty(globalThis, animation);
            if (trap?.play) {
                const trapConfig = adapter.duplicate(
                    tileDoc.getFlag?.(MODULE_ID, 'trap.config')
                    ?? tileDoc.flags?.[MODULE_ID]?.trap?.config
                    ?? {}
                );

                // Resolve target placeable (Region or Tile for 3-placeable traps)
                const targetIds = tileDoc.getFlag?.(MODULE_ID, 'trap.targetRegionIds')
                    ?? tileDoc.flags?.[MODULE_ID]?.trap?.targetRegionIds
                    ?? tileDoc.getFlag?.(MODULE_ID, 'trap.targetTileIds')
                    ?? tileDoc.flags?.[MODULE_ID]?.trap?.targetTileIds
                    ?? tileDoc.getFlag?.(MODULE_ID, 'trap.trapTargetTileIds')
                    ?? tileDoc.flags?.[MODULE_ID]?.trap?.trapTargetTileIds
                    ?? [];
                const targetId = targetIds[0]
                    ?? tileDoc.getFlag?.(MODULE_ID, 'trap.targetRegionId')
                    ?? tileDoc.flags?.[MODULE_ID]?.trap?.targetRegionId
                    ?? tileDoc.getFlag?.(MODULE_ID, 'trap.targetTileId')
                    ?? tileDoc.flags?.[MODULE_ID]?.trap?.targetTileId;
                if (targetId) {
                    const targetPlaceable = adapter.getPlaceable(targetId);
                    if (targetPlaceable) {
                        trapConfig.targetLocation = adapter.getTargetLocation(targetPlaceable);
                    }
                }

                let targets = adapter.getTokensInPlaceable(tilePlaceable);
                const isTriggerTile = Boolean(
                    tileDoc.getFlag?.(MODULE_ID, 'trap.isTriggerTile')
                    ?? tileDoc.flags?.[MODULE_ID]?.trap?.isTriggerTile
                );
                if (isTriggerTile && activatingToken) {
                    if (!targets.some(t => t.id === activatingToken.id)) {
                        targets.push(activatingToken);
                    }
                } else if (targets.length === 0 && activatingToken) {
                    targets = [activatingToken];
                }

                promises.push((async () => {
                    try {
                        await trap.play(tilePlaceable, targets, { ...trapConfig });
                    } catch (err) {
                        log.error(`Failed to play trap animation "${animation}" on tile "${tileDoc.id}":`, err);
                        throw err;
                    }
                })());
            }
        }

        const originIds = (
            tileDoc.getFlag?.(MODULE_ID, 'trap.originIds')
            ?? tileDoc.flags?.[MODULE_ID]?.trap?.originIds
            ?? []
        ).filter(id => id !== tileDoc.id);

        for (const id of originIds) {
            const originTile = canvas?.tiles?.get?.(id);
            if (originTile?.document?.trigger) {
                promises.push(originTile.document.trigger({ token: activatingToken }));
            }
        }

        await Promise.all(promises);
    }
}

/**
 * Configure and register a trap using Foundry V14+ Regions.
 * Supports linking Regions as triggers and Tiles as visual animation placeables.
 *
 * @param {string} animation Global animation path (e.g. 'eskie.traps.pitfall')
 * @param {object} [config={}] Setup configuration options
 * @returns {Promise<{ triggerRegions: RegionDocument[], originElements: PlaceableObject[], targetElements: PlaceableObject[] }|void>}
 */
export async function setupRegionTrap(animation, config = {}) {
    if (!game.user.isGM) {
        return ui.notifications.error(game.i18n.localize('EMP.traps.setup.onlyGm'));
    }

    const pathParts = animation.split('.');
    const trapKey = pathParts[pathParts.length - 1];
    const tileCount = config.tileCount ?? 2;

    // Step 1: Prompt user to select trigger regions
    const step1Title = game.i18n.has?.(`EMP.traps.${trapKey}.step1Title`)
        ? game.i18n.localize(`EMP.traps.${trapKey}.step1Title`)
        : game.i18n.format('EMP.traps.setup.step1RegionTitle', { name: trapKey });
    const step1Content = game.i18n.has?.(`EMP.traps.${trapKey}.step1Content`)
        ? game.i18n.localize(`EMP.traps.${trapKey}.step1Content`)
        : game.i18n.localize('EMP.traps.setup.step1RegionContent');

    const triggerResult = await adapter.buttonDialog({
        title: step1Title,
        buttons: [
            { label: game.i18n.localize('EMP.traps.common.continue'), value: 'continue' },
            { label: game.i18n.localize('EMP.traps.common.cancel'), value: 'cancel' },
        ],
    }, {
        content: step1Content
    });

    if (triggerResult !== 'continue') return;

    const triggerRegions = adapter.getControlledRegions();
    if (triggerRegions.length === 0) {
        return ui.notifications.warn(game.i18n.localize('EMP.traps.setup.noTriggerRegions'));
    }

    let originElements = [];
    let targetElements = [];

    if (tileCount === 1) {
        // Pure single-region trap (e.g. Electric Door): Trigger region IS the animation region
        originElements = triggerRegions;
    } else if (tileCount === 3) {
        // Step 2: Prompt user to select trap origin/launcher placeables (Tile or Region)
        const originTitle = game.i18n.has?.(`EMP.traps.${trapKey}.step2Title`)
            ? game.i18n.localize(`EMP.traps.${trapKey}.step2Title`)
            : game.i18n.format('EMP.traps.setup.step2OriginRegionTitle', { name: trapKey });
        const originContent = game.i18n.has?.(`EMP.traps.${trapKey}.step2Content`)
            ? game.i18n.localize(`EMP.traps.${trapKey}.step2Content`)
            : game.i18n.localize('EMP.traps.setup.step2OriginRegionContent');

        const originResult = await adapter.buttonDialog({
            title: originTitle,
            buttons: [
                { label: game.i18n.localize('EMP.traps.common.continue'), value: 'continue' },
                { label: game.i18n.localize('EMP.traps.common.cancel'), value: 'cancel' },
            ],
        }, {
            content: originContent
        });

        if (originResult !== 'continue') return;

        const controlledTiles = canvas?.tiles?.controlled?.map(t => t.document ?? t) ?? [];
        const controlledRegions = adapter.getControlledRegions();

        // Enforce Tile requirement when mandatory (e.g. Bull Rush Statue)
        const requiresTile = Boolean(config.requiresTile || trapKey === 'bullRushStatue');
        if (requiresTile && controlledTiles.length === 0) {
            const warningMsg = game.i18n.has?.(`EMP.traps.${trapKey}.noTile`)
                ? game.i18n.localize(`EMP.traps.${trapKey}.noTile`)
                : game.i18n.localize('EMP.traps.setup.noOriginTiles');
            return ui.notifications.warn(warningMsg);
        }

        originElements = controlledTiles.length > 0 ? controlledTiles : controlledRegions;

        if (originElements.length === 0) {
            return ui.notifications.warn(game.i18n.localize('EMP.traps.setup.noOriginTiles'));
        }

        // Step 3: Prompt user to select trap target/landing placeables (Tile or Region)
        const targetTitle = game.i18n.has?.(`EMP.traps.${trapKey}.step3Title`)
            ? game.i18n.localize(`EMP.traps.${trapKey}.step3Title`)
            : game.i18n.format('EMP.traps.setup.step3TargetRegionTitle', { name: trapKey });
        const targetContent = game.i18n.has?.(`EMP.traps.${trapKey}.step3Content`)
            ? game.i18n.localize(`EMP.traps.${trapKey}.step3Content`)
            : game.i18n.localize('EMP.traps.setup.step3TargetRegionContent');

        const targetResult = await adapter.buttonDialog({
            title: targetTitle,
            buttons: [
                { label: game.i18n.localize('EMP.traps.common.continue'), value: 'continue' },
                { label: game.i18n.localize('EMP.traps.common.cancel'), value: 'cancel' },
            ],
        }, {
            content: targetContent
        });

        if (targetResult === 'cancel' || targetResult === false) return;

        const targetTiles = canvas?.tiles?.controlled?.map(t => t.document ?? t) ?? [];
        const targetRegions = adapter.getControlledRegions();
        targetElements = targetTiles.length > 0 ? targetTiles : targetRegions;

        if (targetElements.length === 0) {
            ui.notifications.warn(game.i18n.localize('EMP.traps.setup.noTargetTiles'));
            targetElements = triggerRegions;
        }
    } else {
        // Step 2: Prompt user to select trap animation placeables (Tile or Region)
        const animTitle = game.i18n.has?.(`EMP.traps.${trapKey}.step2Title`)
            ? game.i18n.localize(`EMP.traps.${trapKey}.step2Title`)
            : game.i18n.format('EMP.traps.setup.step2AnimRegionTitle', { name: trapKey });
        const animContent = game.i18n.has?.(`EMP.traps.${trapKey}.step2Content`)
            ? game.i18n.localize(`EMP.traps.${trapKey}.step2Content`)
            : game.i18n.localize('EMP.traps.setup.step2AnimRegionContent');

        const animResult = await adapter.buttonDialog({
            title: animTitle,
            buttons: [
                { label: game.i18n.localize('EMP.traps.common.continue'), value: 'continue' },
                { label: game.i18n.localize('EMP.traps.common.cancel'), value: 'cancel' },
            ],
        }, {
            content: animContent
        });

        if (animResult !== 'continue') return;

        const controlledTiles = canvas?.tiles?.controlled?.map(t => t.document ?? t) ?? [];
        const controlledRegions = adapter.getControlledRegions();

        // Enforce Tile requirement when mandatory (e.g. Flooding Room)
        const requiresTile = Boolean(config.requiresTile || trapKey === 'floodingRoom');
        if (requiresTile && controlledTiles.length === 0) {
            const warningMsg = game.i18n.has?.(`EMP.traps.${trapKey}.noTile`)
                ? game.i18n.localize(`EMP.traps.${trapKey}.noTile`)
                : `${trapKey} requires a Tile placeable on the canvas. Trap setup cancelled.`;
            return ui.notifications.warn(warningMsg);
        }

        originElements = controlledTiles.length > 0 ? controlledTiles : (controlledRegions.length > 0 ? controlledRegions : triggerRegions);
    }

    const extraResults = {};
    if (config.extraTiles) {
        for (const extra of config.extraTiles) {
            const extraResult = await adapter.buttonDialog({
                title: game.i18n.format('EMP.traps.setup.extraTitle', { name: extra.label }),
                buttons: [
                    { label: game.i18n.localize('EMP.traps.common.continue'), value: 'continue' },
                    { label: game.i18n.localize('EMP.traps.common.cancel'), value: 'cancel' },
                ],
            }, {
                content: `<p>${extra.prompt}</p><p>Click <strong>Continue</strong> once selected.</p>`
            });

            if (extraResult !== 'continue') return;

            const selectedTiles = canvas?.tiles?.controlled?.map(t => t.id) ?? [];
            const selectedRegions = adapter.getControlledRegions().map(r => r.id);
            const selected = selectedTiles.length > 0 ? selectedTiles : selectedRegions;

            if (selected.length === 0) {
                return ui.notifications.warn(game.i18n.format('EMP.traps.setup.noExtraTiles', { name: extra.label }));
            }
            extraResults[extra.key] = selected;
        }
    }

    const { tileCount: _tc, extraFlags: _ef, extraTiles: _et, trigger: _tr, controlled: _co, playPath: _pp, mode: _md, events: _ev, ...trapOptions } = config;

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

// Execute the trap animation for each launcher placeable
for (const placeable of animPlaceables) {
    let targets = adapter.getTokensInPlaceable(placeable);
    if (token.id && !targets.some(t => t.id === token.id)) {
        targets.push(token);
    } else if (targets.length === 0) {
        targets = [token];
    }

    await ${animation}.play(placeable, targets, ${optionsStr});
}
${tileIds.length > 0 ? `
// Trigger any linked external MATT tiles concurrently
for (const id of ${JSON.stringify(tileIds)}) {
    if (id === event.region?.id) continue;
    const tile = canvas.tiles.get(id);
    if (tile?.document?.trigger) {
        await tile.document.trigger({ token });
    }
}
` : ''}`.trim();

    const behaviorName = `${trapKey.charAt(0).toUpperCase() + trapKey.slice(1)} Trap (${MODULE_ID})`;
    const events = config.events ?? ['tokenEnter'];

    for (const triggerRegion of triggerRegions) {
        const updateData = {
            [`flags.${MODULE_ID}.trap.isTriggerRegion`]: true,
            [`flags.${MODULE_ID}.trap.animation`]: animation,
            [`flags.${MODULE_ID}.trap.originIds`]: originElements.map(e => e.id),
            [`flags.${MODULE_ID}.trap.config`]: trapOptions,
        };

        if (tileCount === 3) {
            updateData[`flags.${MODULE_ID}.trap.trapTargetTileIds`] = targetElements.map(e => e.id);
            const targetRegionIds = targetElements.filter(e => adapter.isDocumentOfType(e, 'Region')).map(e => e.id);
            const targetTileIds = targetElements.filter(e => adapter.isDocumentOfType(e, 'Tile')).map(e => e.id);
            if (targetRegionIds.length > 0) {
                updateData[`flags.${MODULE_ID}.trap.targetRegionIds`] = targetRegionIds;
                updateData[`flags.${MODULE_ID}.trap.targetRegionId`] = targetRegionIds[0];
            }
            if (targetTileIds.length > 0) {
                updateData[`flags.${MODULE_ID}.trap.targetTileIds`] = targetTileIds;
                updateData[`flags.${MODULE_ID}.trap.targetTileId`] = targetTileIds[0];
            }
        }

        if (tileIds.length > 0) {
            updateData[`flags.${MODULE_ID}.trap.tileIds`] = tileIds;
        }

        if (config.extraFlags) {
            for (const [k, v] of Object.entries(config.extraFlags)) {
                updateData[`flags.${MODULE_ID}.trap.${k}`] = v;
            }
        }

        if (config.extraTiles) {
            for (const extra of config.extraTiles) {
                updateData[`flags.${MODULE_ID}.trap.${extra.key}`] = extraResults[extra.key];
            }
        }

        await triggerRegion.update(updateData);

        // Check if an existing trap behavior is attached
        const existingBehavior = triggerRegion.behaviors?.find(
            b => b.name === behaviorName || Boolean(b.getFlag?.(MODULE_ID, 'trap.isTrapBehavior'))
        );

        if (existingBehavior) {
            await existingBehavior.update({
                system: {
                    events: Array.isArray(events) ? events : [events],
                    source: regionActionCode,
                }
            });
        } else {
            const behaviorData = adapter.formatRegionBehaviorData({
                name: behaviorName,
                events,
                source: regionActionCode,
                flags: {
                    [MODULE_ID]: {
                        trap: {
                            isTrapBehavior: true,
                            animation,
                            originIds: originElements.map(e => e.id),
                        }
                    }
                }
            });
            await adapter.createRegionBehavior(triggerRegion, behaviorData);
        }
    }

    // Flag any origin placeables that are Tiles
    for (const origin of originElements) {
        if (adapter.isDocumentOfType(origin, 'Tile')) {
            await origin.update({
                [`flags.${MODULE_ID}.trap.isTrapTile`]: true,
                [`flags.${MODULE_ID}.trap.animation`]: animation,
            });
        }
    }

    ui.notifications.info(`Successfully setup ${trapKey} trap using Regions for ${triggerRegions.length} trigger region(s) and ${originElements.length} placeable(s).`);
    return { triggerRegions, originElements, targetElements };
}

/**
 * Universal trap setup orchestrator.
 * Dynamically routes to native Foundry V14+ Regions or Monk's Active Tile Triggers (MATT).
 * On Foundry V14+, MATT is optional; if MATT is active, prompts the user to select the preferred trigger engine.
 *
 * @param {string} animation Global animation path (e.g. 'eskie.traps.pitfall')
 * @param {object} [config={}] Setup configuration options
 * @returns {Promise<object|void>}
 */
export async function setupTrap(animation, config = {}) {
    if (!game.user.isGM) {
        return ui.notifications.error(game.i18n.localize('EMP.traps.setup.onlyGm'));
    }

    let mode = config.mode;
    const isV14 = adapter.generation >= 14;

    if (!mode) {
        if (!isV14) {
            mode = 'matt';
        } else {
            const hasMatt = Boolean(game.modules?.get('monks-active-tiles')?.active);
            if (!hasMatt) {
                mode = 'region';
            } else {
                mode = await adapter.buttonDialog({
                    title: game.i18n.localize('EMP.traps.setup.modeDialogTitle'),
                    buttons: [
                        { label: game.i18n.localize('EMP.traps.setup.modeRegion'), value: 'region' },
                        { label: game.i18n.localize('EMP.traps.setup.modeMatt'), value: 'matt' },
                    ],
                }, {
                    content: game.i18n.localize('EMP.traps.setup.modeDialogContent'),
                });
                if (!mode) return;
            }
        }
    }

    if (mode === 'matt') {
        return matt.trap.setup(animation, config);
    }

    return setupRegionTrap(animation, config);
}
