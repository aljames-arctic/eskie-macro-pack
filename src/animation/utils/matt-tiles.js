import { time } from '../../lib/time.js';
import { dependency } from '../../lib/dependency.js';
import { socket } from '../../adapters/modules/socketlib/socketlib-module-adapter.js';
import { SECONDS, MODULE_ID } from '../../lib/constants.js';
import { adapter } from '../../adapters/index.js';
import { log, notify } from '../../lib/logger.js';
import { localize, format } from '../../lib/utils.js';

const DEFAULT_CONFIG = {
    id: 'generic-tile-movement',
};

//Determine movement direction and center point
function getCenter(tile) {
    return adapter.getCenter(tile);
}

function getLabel(id, token) {
    return `${id} - ${token.id}`;
}

async function start(token, code, config = {}) {
    dependency.required([{id: 'tagger', ref: "Tagger"},
                        {id: 'monks-active-tiles', ref: "Monk's Active Tile Triggers"}]);

    const mergedConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mergedConfig;
    const { info, ...nonInfoConfig } = mergedConfig;
    const label = getLabel(id, token);
    const tileOffset = adapter.getShapeOffset(token);
    const { widthPx, heightPx } = adapter.getTokenDimensions(token);

    const initialData = {
        "texture.src": "icons/svg/d6-grey.svg", 
        "alpha": 0,
        "hidden": true,
        "x": tileOffset.x,
        "y": tileOffset.y,
        "width": widthPx,
        "height": heightPx,
    };
    
    const [tile] = await socket.tile.create(initialData);

    const MATTtriggers = ["exit", "manual"];
    const MATTactions = [{
        id: adapter.randomID(),
        action: 'runcode',
        data: { code: code ?? `console.error(arguments)` },
    }];
    const updateData = {
        "flags.monks-active-tiles.active": true,
        "flags.monks-active-tiles.trigger": MATTtriggers,
        "flags.monks-active-tiles.actions": MATTactions,
        "flags.monks-active-tiles.controlled": "gm",
    };
    await socket.tile.edit(tile.id, updateData);
    await Tagger.addTags(tile, label);

    await adapter.attachPlaceableElements([tile], token);
    await tile.setFlag(MODULE_ID, id, { tileData: getCenter(tile) });
    await tile.setFlag(MODULE_ID, 'config', nonInfoConfig);
}

async function configure(token, tile, config = {}) {
    const { id } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const label = getLabel(id, token);

    if (!game.user.isGM || !tile) return;

    // Initial token position is where the tile was when the movement started
    // We wait until the tile has moved and calculate latency required for the animation
    const savedData = await tile.getFlag(MODULE_ID, id);
        const tileOrigin = {x: savedData.tileData.x, y: savedData.tileData.y};
        function tileMoved() {
            const currentCenter = getCenter(tile);
            const savedCenter = savedData.tileData;
            return (currentCenter.x !== savedCenter.x) || (currentCenter.y !== savedCenter.y);
        }
        let latency = await time.waitUntil(tileMoved, {timeout: 5000});
    await tile.setFlag(MODULE_ID, id, { tileData: getCenter(tile) });

    const tilePosition = getCenter(tile);
    const dx = tileOrigin.x - tilePosition.x;
    const dy = tileOrigin.y - tilePosition.y;
    const angleRadians = Math.atan2(dy, dx);
    const distance = Math.hypot(tileOrigin.x - tilePosition.x, tileOrigin.y - tilePosition.y);
    const tokenSpeed = token._getAnimationMovementSpeed();
    const speed = (tokenSpeed * adapter.getSceneDimensions().size) / (1 * SECONDS);
    const rotation = angleRadians * (180 / Math.PI);
    const travelTime = (distance / speed) - latency;

    return { rotation, travelTime, label, delta: {x: dx, y: dy} };
}

async function setup(animation, config = {}) {
    dependency.required([{ id: 'monks-active-tiles', ref: "Monk's Active Tile Triggers" }]);

    if (!game.user.isGM) return notify.error(localize('EMP.traps.setup.onlyGm'));

    const pathParts = animation.split('.');
    const trapKey = pathParts[pathParts.length - 1];
    const tileCount = config.tileCount ?? 2;

    // Step 1: Prompt user to select trigger tiles
    const triggerResult = await adapter.buttonDialog({
        title: format('EMP.traps.setup.step1Title', { name: trapKey }),
        buttons: [
            { label: localize('EMP.traps.common.continue'), value: 'continue' },
            { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
        ],
    }, {
        content: localize('EMP.traps.setup.step1Content')
    });

    if (triggerResult !== 'continue') return;

    const triggerTiles = canvas.tiles.controlled.map(t => t.document);
    if (triggerTiles.length === 0) return notify.warn(localize('EMP.traps.setup.noTriggerTiles'));

    let originTiles = [];
    let targetTiles = [];

    if (tileCount === 3) {
        // Step 2: Prompt user to select trap origin/launcher tiles
        const originResult = await adapter.buttonDialog({
            title: format('EMP.traps.setup.step2OriginTitle', { name: trapKey }),
            buttons: [
                { label: localize('EMP.traps.common.continue'), value: 'continue' },
                { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
            ],
        }, {
            content: localize('EMP.traps.setup.step2OriginContent')
        });

        if (originResult !== 'continue') return;

        originTiles = canvas.tiles.controlled.map(t => t.document);
        if (originTiles.length === 0) return notify.warn(localize('EMP.traps.setup.noOriginTiles'));

        // Step 3: Prompt user to select trap target/landing tiles
        const targetResult = await adapter.buttonDialog({
            title: format('EMP.traps.setup.step3TargetTitle', { name: trapKey }),
            buttons: [
                { label: localize('EMP.traps.common.continue'), value: 'continue' },
                { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
            ],
        }, {
            content: localize('EMP.traps.setup.step3TargetContent')
        });

        if (targetResult === 'cancel' || targetResult === false) return;

        targetTiles = canvas.tiles.controlled.map(t => t.document);
        if (targetTiles.length === 0) {
            notify.warn(localize('EMP.traps.setup.noTargetTiles'));
            targetTiles = triggerTiles;
        }
    } else {
        // Step 2: Prompt user to select trap animation tiles
        const trapResult = await adapter.buttonDialog({
            title: format('EMP.traps.setup.step2AnimTitle', { name: trapKey }),
            buttons: [
                { label: localize('EMP.traps.common.continue'), value: 'continue' },
                { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
            ],
        }, {
            content: localize('EMP.traps.setup.step2AnimContent')
        });

        if (trapResult !== 'continue') return;

        originTiles = canvas.tiles.controlled.map(t => t.document);
        if (originTiles.length === 0) {
            notify.warn(localize('EMP.traps.setup.noAnimTiles'));
            originTiles = triggerTiles;
        }
    }

    const extraTileResults = {};
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

            const selected = canvas.tiles.controlled.map(t => t.document);
            if (selected.length === 0) return notify.warn(format('EMP.traps.setup.noExtraTiles', { name: extra.label }));
            extraTileResults[extra.key] = selected.map(t => t.id);
        }
    }

    const triggerTileIds = new Set(triggerTiles.map(t => t.id));
    const originTileIds = new Set(originTiles.map(t => t.id));
    const targetTileIds = new Set(targetTiles.map(t => t.id));

    const allTiles = new Map();
    for (const t of [...triggerTiles, ...originTiles, ...targetTiles]) {
        allTiles.set(t.id, t);
    }

    for (const [tileId, tileDoc] of allTiles) {
        const isTrigger = triggerTileIds.has(tileId);
        const isTrap = originTileIds.has(tileId);
        const isTarget = targetTileIds.has(tileId);

        const updateData = {};

        if (isTrigger) {
            const existingOriginIds = tileDoc.getFlag?.(MODULE_ID, 'trap.originIds')
                ?? tileDoc.flags?.[MODULE_ID]?.trap?.originIds
                ?? [];
            const originIdList = originTiles.map(t => t.id);
            const combinedOriginIds = [...new Set([
                ...(Array.isArray(existingOriginIds) ? existingOriginIds : []),
                ...originIdList
            ])];
            updateData[`flags.${MODULE_ID}.trap.isTriggerTile`] = true;
            updateData[`flags.${MODULE_ID}.trap.originIds`] = combinedOriginIds;
        }

        if (isTrap) {
            updateData[`flags.${MODULE_ID}.trap.isTrapTile`] = true;
            updateData[`flags.${MODULE_ID}.trap.animation`] = animation;
            if (tileCount === 3) {
                updateData[`flags.${MODULE_ID}.trap.trapTargetTileIds`] = targetTiles.map(t => t.id);
                updateData[`flags.${MODULE_ID}.trap.targetTileIds`] = targetTiles.map(t => t.id);
                updateData[`flags.${MODULE_ID}.trap.targetTileId`] = targetTiles[0]?.id ?? null;
            }
            if (config.extraFlags) {
                for (const [k, v] of Object.entries(config.extraFlags)) {
                    updateData[`flags.${MODULE_ID}.trap.${k}`] = v;
                }
            }
            if (config.extraTiles) {
                for (const extra of config.extraTiles) {
                    updateData[`flags.${MODULE_ID}.trap.${extra.key}`] = extraTileResults[extra.key];
                }
            }
        }

        if (isTarget) {
            updateData[`flags.${MODULE_ID}.trap.isTargetTile`] = true;
        }

        if (isTrigger || isTrap) {
            const rawTrigger = config.trigger ?? 'enter';
            const trigger = isTrigger
                ? (Array.isArray(rawTrigger) ? (rawTrigger[0] ?? 'enter') : rawTrigger)
                : 'manual';

            const { tileCount: _tc, extraFlags: _ef, extraTiles: _et, trigger: _tr, controlled: _co, playPath: _pp, ...trapOptions } = config;
            const targetTileId = tileCount === 3 ? (targetTiles[0]?.id ?? null) : null;
            const trapConfig = { ...trapOptions };

            const trapActionCode = `
// Resolve the concrete Tile placeables from MATT execution scope
const adapter = game.modules.get('${MODULE_ID}').api.adapter;
const tilePlaceable = tile.object ?? canvas.tiles.get(tile.id);
${targetTileId ? `const targetTile = canvas.tiles.get('${targetTileId}');
const targetLocation = targetTile ? adapter.getTargetLocation(targetTile) : null;` : ''}

// Get the specific Eskie Trap Animation Function if this tile is a trap tile
const animation = ${isTrap ? `'${animation}'` : `tile.getFlag('${MODULE_ID}', 'trap.animation')`};
const promises = [];

if (animation) {
    promises.push((async () => {
        try {
            const trap = adapter.getProperty(globalThis, animation);
            // Collect all tokens contained within / overlapping this trap tile via adapter
            let targets = adapter.getTokensInTile(tilePlaceable);

            // If this trap tile is also the trigger tile, ensure the activating token that stepped on it is included
            const isTriggerTile = Boolean(tile.getFlag('${MODULE_ID}', 'trap.isTriggerTile'));
            const activatingTarget = token?.object ? token.object : token;
            if (isTriggerTile && token) {
                if (!targets.some(t => t.id === token.id)) {
                    targets.push(activatingTarget);
                }
            } else if (targets.length === 0 && token) {
                targets = [activatingTarget];
            }

            // Play the trap animation with the contained tokens as targets
            await trap.play(tilePlaceable, targets, { ...${JSON.stringify(trapConfig)}${targetTileId ? ', targetLocation' : ''} });
        } catch (err) {
            console.error('Eskie Macro Pack | Failed to play trap animation "' + animation + '" on tile "' + tile.id + '":', err);
            throw err;
        }
    })());
}

// Manually activate any other linked trap tiles concurrently
const originIds = (${isTrigger ? JSON.stringify(originTiles.map(t => t.id)) : `null`} ?? tile.getFlag('${MODULE_ID}', 'trap.originIds') ?? []).filter(id => id !== tile.id);
for (const id of originIds) {
    const originTile = canvas.tiles.get(id);
    if (!originTile) continue;
    promises.push(originTile.document.trigger({ token }));
}

await Promise.all(promises);
`;

            const existingTrigger = tileDoc.getFlag?.('monks-active-tiles', 'trigger')
                ?? tileDoc.flags?.['monks-active-tiles']?.trigger;
            const resolvedTrigger = isTrigger
                ? trigger
                : (existingTrigger ?? trigger);

            const existingActions = tileDoc.getFlag?.('monks-active-tiles', 'actions')
                ?? tileDoc.flags?.['monks-active-tiles']?.actions
                ?? [];
            const newAction = {
                id: adapter.randomID(),
                action: 'runcode',
                data: { code: trapActionCode },
            };

            updateData['flags.monks-active-tiles.active'] = true;
            updateData['flags.monks-active-tiles.trigger'] = resolvedTrigger;
            updateData['flags.monks-active-tiles.actions'] = [
                ...(Array.isArray(existingActions) ? existingActions : []),
                newAction
            ];
            updateData['flags.monks-active-tiles.controlled'] = config.controlled ?? 'gm';
        }

        await socket.tile.edit(tileId, updateData);
    }

    notify.info(`Successfully setup ${trapKey} trap links for ${triggerTiles.length} trigger tile(s) and ${originTiles.length} trap tile(s).`);
    return { triggerTiles, originTiles, targetTiles };
}

async function stop(token, label) {
    const tiles = Tagger.getByTag(label);
    await adapter.detachPlaceableElements(tiles, token);
    tiles.forEach(async (tile) => await socket.tile.destroy(tile.id));
}

export const matt = {
    movement: {
        start,
        configure,
        stop,
    },
    trap: {
        setup,
    },
    getLabel
};