// Standalone Macro: Lightning Bolt
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Lightning Bolt' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const DEFAULT_CONFIG = {
    id: 'lightningBolt',
    deleteTemplate: true,
    tintMap: true,
    sound: {
        enabled: true,
        volume: 0.5
    }
};

const label = DEFAULT_CONFIG.id ?? 'lightningBolt';
const castingLabel = `Casting ${token.document?.name ?? token.name}`;

// Toggle / re-entrant check
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0
    || Sequencer.EffectManager.getEffects({ name: label }).length > 0
    || Sequencer.EffectManager.getEffects({ name: castingLabel }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    Sequencer.EffectManager.endEffects({ name: castingLabel });
    return;
}

/**
 * Resolves origin position and secondary aim target position
 * via aim point (crosshair / target token) or template document coordinates.
 */
async function getTargetOrPoint(templateDoc, config = {}) {
    const tokenCenter = token.center ?? { x: token.x, y: token.y };
    let primary = tokenCenter;
    let secondary;

    if (templateDoc) {
        if (templateDoc.documentName === 'Region' || templateDoc.shapes) {
            const shape = templateDoc.shapes?.[0];
            const origin = { x: shape?.x ?? 0, y: shape?.y ?? 0 };
            const distance = shape?.radius ?? shape?.distance ?? 0;
            if (shape?.rotation !== undefined && distance > 0) {
                const rad = Math.toRadians(shape.rotation);
                secondary = {
                    x: origin.x + Math.cos(rad) * distance,
                    y: origin.y + Math.sin(rad) * distance
                };
            } else {
                secondary = { x: origin.x, y: origin.y };
            }
            primary = origin;
        } else {
            primary = { x: templateDoc.x ?? tokenCenter.x, y: templateDoc.y ?? tokenCenter.y };
            const farpoint = templateDoc.object?.ray?.B;
            if (farpoint) {
                secondary = { x: farpoint.x, y: farpoint.y };
            } else if (templateDoc.direction !== undefined && templateDoc.distance) {
                const rad = Math.toRadians(templateDoc.direction);
                const distGrid = canvas.dimensions?.distance ?? 5;
                const gridSize = canvas.dimensions?.size ?? canvas.grid?.size ?? 100;
                const distPx = (templateDoc.distance / distGrid) * gridSize;
                secondary = {
                    x: primary.x + Math.cos(rad) * distPx,
                    y: primary.y + Math.sin(rad) * distPx
                };
            } else {
                secondary = { x: templateDoc.x ?? tokenCenter.x, y: templateDoc.y ?? tokenCenter.y };
            }
        }
        if (config.deleteTemplate && templateDoc.delete) {
            templateDoc.delete();
        }
    } else if (game.user.targets.size > 0) {
        const target = Array.from(game.user.targets)[0];
        secondary = target.center ?? { x: target.x, y: target.y };
        primary = tokenCenter;
    } else {
        const portalEntry = Sequencer.Database.getEntry(closest("jb2a.portals.vertical.vortex.purple"));
        const portalPath = portalEntry?.file ?? portalEntry?.files?.[0] ?? portalEntry;
        const crosshairCfg = {
            radius: 1,
            max: 500,
            icon: portalPath,
            label: label
        };
        const point = await Sequencer.Crosshair.show(crosshairCfg);
        if (!point || point.cancelled) return null;
        secondary = point;
        primary = tokenCenter;
    }

    const isSamePoint = !secondary || (Math.hypot(secondary.x - primary.x, secondary.y - primary.y) < 1);
    if (isSamePoint) {
        if (tokenCenter && Math.hypot(primary.x - tokenCenter.x, primary.y - tokenCenter.y) >= 1) {
            secondary = primary;
            primary = tokenCenter;
        } else {
            const dir = templateDoc?.direction ?? token?.document?.rotation ?? 0;
            const rad = Math.toRadians(dir);
            const dist = templateDoc?.distance ?? 100;
            const distGrid = canvas.dimensions?.distance ?? 5;
            const gridSize = canvas.dimensions?.size ?? canvas.grid?.size ?? 100;
            const distPx = (dist / distGrid) * gridSize;
            secondary = {
                x: primary.x + Math.cos(rad) * distPx,
                y: primary.y + Math.sin(rad) * distPx
            };
        }
    }

    if (secondary && (Math.hypot(secondary.x - primary.x, secondary.y - primary.y) < 1)) {
        ui.notifications.error("Unable to resolve coordinates for Lightning Bolt");
        return null;
    }

    return [primary, secondary];
}

const targetPoints = await getTargetOrPoint(scope?.template, DEFAULT_CONFIG);
if (!targetPoints) return;
let [primary, secondary] = targetPoints;
if (!primary || !secondary) return;

const sound = DEFAULT_CONFIG.sound ?? { enabled: true, volume: 0.5 };
const tintMap = DEFAULT_CONFIG.tintMap ?? true;

const sequence = new Sequence();

if (sound.enabled) {
    sequence.sound()
        .file(closest("psfx.3rd-level-spells.call-lightning.v1.secondary"))
        .volume(sound.volume ?? 0.5);
    sequence.sound()
        .file(closest("psfx.3rd-level-spells.call-lightning.v1.primary"))
        .volume(sound.volume ?? 0.5)
        .delay(500);
}

const bgSrc = canvas.scene?.background?.src;
if (bgSrc && tintMap) {
    const canvasWidth = canvas.dimensions?.width ?? canvas.scene?.width ?? 4000;
    const canvasHeight = canvas.dimensions?.height ?? canvas.scene?.height ?? 3000;
    const gridPx = canvas.grid?.size ?? canvas.dimensions?.size ?? 100;
    const sceneGridWidth = (canvas.scene?.width ?? canvasWidth) / gridPx;
    const sceneGridHeight = (canvas.scene?.height ?? canvasHeight) / gridPx;
    const offsetX = canvas.scene?.background?.offsetX ?? 0;
    const offsetY = canvas.scene?.background?.offsetY ?? 0;

    sequence.effect()
        .name(castingLabel)
        .file(bgSrc)
        .filter("ColorMatrix", { saturate: 1, brightness: 0.6 })
        .atLocation({ x: canvasWidth / 2, y: canvasHeight / 2 })
        .size({ width: sceneGridWidth, height: sceneGridHeight }, { gridUnits: true })
        .persist()
        .fadeIn(500)
        .fadeOut(3000)
        .tint("#9eecff")
        .belowTokens()
        .spriteOffset({ x: -offsetX, y: -offsetY });
}

sequence.effect()
    .name(label)
    .file(closest("jb2a.static_electricity.01.blue"))
    .atLocation(token)
    .fadeIn(500)
    .fadeOut(500)
    .scaleToObject(1.5)
    .duration(5000)
    .mask()
    .zIndex(2)

    .effect()
    .name(label)
    .file(closest("eskie.lightning.02.blue"))
    .atLocation(token)
    .rotateTowards(secondary)
    .size({ width: 2, height: 1.8 }, { gridUnits: true })
    .spriteOffset({ x: -0.25 }, { gridUnits: true })
    .spriteScale({ x: 1.25 })
    .filter("ColorMatrix", { hue: -12, saturate: 2 })
    .zIndex(1)
    .waitUntilFinished()

    .effect()
    .name(label)
    .file(closest("eskie.lightning.03.blue"))
    .atLocation(token)
    .rotateTowards(secondary)
    .size({ width: 2, height: 1.8 }, { gridUnits: true })
    .spriteOffset({ x: -0.5 }, { gridUnits: true })
    .spriteScale({ x: 1.25 })
    .filter("ColorMatrix", { hue: -12, saturate: 2 })
    .rotate(180)
    .zIndex(2)

    .canvasPan()
    .shake({ duration: 500, strength: 1.5, rotation: false, fadeOut: 250 })

    .effect()
    .name(label)
    .file(closest("eskie.lightning.lightning_bolt.blue"))
    .atLocation(primary)
    .stretchTo(secondary, { tiling: false, onlyX: true })
    .filter("ColorMatrix", { hue: -12, saturate: 2 })
    .zIndex(3)
    .waitUntilFinished(-250)

    .thenDo(function () {
        Sequencer.EffectManager.endEffects({ name: castingLabel });
    })

    .effect()
    .name(label)
    .file(closest("eskie.lightning.04.blue"))
    .atLocation(token)
    .rotateTowards(secondary)
    .size({ width: 1.2, height: 1 }, { gridUnits: true })
    .spriteScale({ x: 1.25 })
    .filter("ColorMatrix", { hue: -12, saturate: 2 })
    .zIndex(1);

await sequence.play({ preload: true });
