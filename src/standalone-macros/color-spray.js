// Standalone Macro: Color Spray
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Color Spray' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const DEFAULT_CONFIG = {
    id: 'colorSpray',
    label: 'Color Spray',
    wave_count: 4,
};

const label = DEFAULT_CONFIG.label ?? 'Color Spray';
const waveCount = DEFAULT_CONFIG.wave_count ?? 4;

// Toggle / re-entrant check
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0
    || Sequencer.EffectManager.getEffects({ name: label }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    return;
}

/**
 * Resolves origin position and secondary aim target position
 * via target token selection or interactive crosshair placement.
 */
async function getTargetOrPoint(config = {}) {
    let position = token.center ?? { x: token.x, y: token.y };
    let secondary;

    if (config.template) {
        const templateDoc = config.template;
        if (templateDoc.documentName === 'Region' || templateDoc.shapes) {
            const shape = templateDoc.shapes?.[0];
            const primary = { x: shape?.x ?? 0, y: shape?.y ?? 0 };
            const distance = shape?.radius ?? shape?.distance ?? 0;
            if (shape?.rotation !== undefined && distance > 0) {
                const rad = Math.toRadians(shape.rotation);
                secondary = {
                    x: primary.x + Math.cos(rad) * distance,
                    y: primary.y + Math.sin(rad) * distance
                };
            } else {
                secondary = { x: primary.x, y: primary.y };
            }
            position = primary;
        } else {
            const farpoint = templateDoc.object?.ray?.B;
            secondary = { x: farpoint?.x ?? templateDoc.x, y: farpoint?.y ?? templateDoc.y };
            position = { x: templateDoc.x, y: templateDoc.y };
        }
    } else if (game.user.targets.size > 0) {
        const target = Array.from(game.user.targets)[0];
        secondary = target.center ?? { x: target.x, y: target.y };
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
    }

    if (!secondary) {
        secondary = position;
    }

    return [position, secondary];
}

const targetPoints = await getTargetOrPoint(DEFAULT_CONFIG);
if (!targetPoints) return;
const [position, secondary] = targetPoints;

const tokenWidth = token.document?.width ?? token.width ?? 1;
const seq = new Sequence();

// Cast Effect
seq.effect()
    .name(label)
    .file(closest("eskie.star.02.white"))
    .atLocation(position)
    .size(tokenWidth, { gridUnits: true })
    .zIndex(3);

seq.effect()
    .name(label)
    .file(closest("jb2a.sacred_flame.target.white"))
    .atLocation(position)
    .size(tokenWidth * 0.65, { gridUnits: true })
    .zIndex(2)
    .scaleIn(0, 500, { ease: "easeOutCubic" })
    .filter("ColorMatrix", { hue: 150, brightness: 1.1 })
    .scaleOut(0, 500, { ease: "easeOutCubic" })
    .endTime(2500);

// Color Spray Effect
for (let i = 0; i < waveCount; i++) {
    const tintColor1 = `hsl(${Math.floor(Math.random() * 360)}, 100%, 60%)`;
    const tintColor2 = `hsl(${Math.floor(Math.random() * 360)}, 100%, 60%)`;
    const tintColor3 = `hsl(${Math.floor(Math.random() * 360)}, 100%, 60%)`;

    const wave = new Sequence();

    wave.effect()
        .name(label)
        .file(closest("eskie.pulse.energy.03.fast.white"))
        .atLocation(position)
        .rotateTowards(secondary)
        .spriteOffset({ x: -tokenWidth * 1.1 }, { gridUnits: true })
        .size(tokenWidth * 2, { gridUnits: true })
        .tint(tintColor1)
        .zIndex(2)
        .filter("ColorMatrix", { brightness: 2 });

    wave.effect()
        .name(label)
        .file(closest("jb2a.energy_strands.range.standard.grey"))
        .atLocation(position, { offset: { x: -0.25, y: 0 }, gridUnits: true, local: true })
        .stretchTo(secondary, { offset: { x: 0, y: 0 }, gridUnits: true, local: true })
        .fadeIn(500, { ease: "easeOutBack" })
        .fadeOut(400)
        .tint(tintColor1)
        .zIndex(1);

    wave.effect()
        .name(label)
        .delay(150)
        .file(closest("jb2a.energy_strands.range.standard.grey"))
        .atLocation(position, { offset: { x: -0.25, y: 0 }, gridUnits: true, local: true })
        .stretchTo(secondary, { offset: { x: -0.5, y: -1 }, gridUnits: true, local: true })
        .fadeIn(500, { ease: "easeOutBack" })
        .fadeOut(400)
        .mirrorY()
        .tint(tintColor2)
        .zIndex(1);

    wave.effect()
        .name(label)
        .delay(300)
        .file(closest("jb2a.energy_strands.range.standard.grey"))
        .atLocation(position, { offset: { x: -0.25, y: 0 }, gridUnits: true, local: true })
        .stretchTo(secondary, { offset: { x: -0.5, y: 1 }, gridUnits: true, local: true })
        .mirrorY()
        .fadeIn(500, { ease: "easeOutBack" })
        .fadeOut(400)
        .tint(tintColor3)
        .zIndex(1);

    wave.effect()
        .name(label)
        .delay(150)
        .file(closest("eskie.star.twinkling_star.01.white"))
        .atLocation({ x: position.x, y: position.y }, { randomOffset: 2.2 })
        .size(0.75, { gridUnits: true })
        .filter("ColorMatrix", { hue: Math.floor(Math.random() * 361), brightness: 1 })
        .randomSpriteRotation()
        .scaleIn(0, 150, { ease: "easeOutBack" })
        .duration(400)
        .repeats(5, 100, 100)
        .zIndex(3);

    seq.addSequence(wave);
    seq.wait(150);
}

await seq.play();
