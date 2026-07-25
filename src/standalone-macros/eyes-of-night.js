// Standalone Macro: Eyes of Night (Twilight Cleric)
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Eyes of Night' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please select at least one target!");
}

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct string path if running as a standalone copy-paste macro.
 */
const closest = (path) => {
    if (typeof eskie !== "undefined" && eskie.util?.file?.closest) {
        return eskie.util.file.closest(path);
    }
    const apiClosest = game.modules.get("eskie-macros")?.api?.util?.closest;
    if (typeof apiClosest === "function") {
        return apiClosest(path);
    }
    return path;
};

const id = "eyes-of-night";
const darkMap = true;
const allTokens = [token, ...targets];

// 3. Toggle / Re-entrant Persistent Effect Handling
const isEffectActive = (t) => {
    const label = `${id}-${t.id ?? t.document?.id ?? ""}`;
    return Sequencer.EffectManager.getEffects({ name: label, object: t }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: id, object: t }).length > 0;
};

const stopEffect = (t) => {
    const label = `${id}-${t.id ?? t.document?.id ?? ""}`;
    Sequencer.EffectManager.endEffects({ name: label, object: t });
    Sequencer.EffectManager.endEffects({ name: id, object: t });
};

const anyActive = allTokens.some(t => isEffectActive(t)) ||
                  Sequencer.EffectManager.getEffects({ name: id }).length > 0;

if (anyActive) {
    allTokens.forEach(t => stopEffect(t));
    Sequencer.EffectManager.endEffects({ name: id });
    return;
}

const sequence = new Sequence();

// Night sky background darkening overlay
const bgSrc = canvas.scene?.background?.src ?? canvas.scene?.img;
if (darkMap && bgSrc) {
    const cWidth = canvas.dimensions?.width ?? canvas.scene?.width ?? 4000;
    const cHeight = canvas.dimensions?.height ?? canvas.scene?.height ?? 4000;
    const gridSize = canvas.grid?.size ?? 100;
    const sceneWidth = canvas.scene?.width ?? cWidth;
    const sceneHeight = canvas.scene?.height ?? cHeight;

    sequence.effect()
        .name(id)
        .file(bgSrc)
        .filter("ColorMatrix", { brightness: 0.5 })
        .atLocation({ x: cWidth / 2, y: cHeight / 2 })
        .size({ width: sceneWidth / gridSize, height: sceneHeight / gridSize }, { gridUnits: true })
        .spriteOffset({ x: 0 }, { gridUnits: true })
        .duration(2500)
        .fadeIn(500)
        .fadeOut(500)
        .belowTokens();
}

const tokenLabel = `${id}-${token.id ?? token.document?.id ?? ""}`;

// Caster healing/twilight bluepurple energy burst
sequence.wait(250)
    .effect()
    .file(closest("jb2a.healing_generic.03.burst.bluepurple"))
    .attachTo(token)
    .scaleToObject(2.2, { considerTokenScale: true })
    .fadeIn(500)
    .fadeOut(1000)
    .opacity(1)
    .belowTokens()
    .startTime(1000)
    .filter("ColorMatrix", { saturate: -0.5, hue: -50 })
    .zIndex(1);

// Caster persistent glowing cat-eye symbol vision aura
sequence.effect()
    .name(tokenLabel)
    .file(closest("eskie.symbol.eye.01.red"))
    .attachTo(token)
    .scaleToObject(0.6, { gridUnits: true })
    .filter("ColorMatrix", { saturate: -1, hue: 105 })
    .scaleIn(0, 500, { ease: "easeOutBack" })
    .fadeIn(500)
    .fadeOut(500)
    .zIndex(0.1)
    .persist();

// Caster persistent night sky twinkling stars projection
sequence.effect()
    .name(tokenLabel)
    .file(closest("jb2a.twinkling_stars.points08.white"))
    .attachTo(token)
    .scaleToObject(0.75, { gridUnits: true })
    .scaleIn(0, 500, { ease: "easeOutBack" })
    .fadeIn(500)
    .fadeOut(500)
    .zIndex(1)
    .persist();

// Caster yellow energy pulse
sequence.effect()
    .file(closest("eskie.pulse.energy.01.yellow.yellow"))
    .attachTo(token, { offset: { x: 0 }, gridUnits: true })
    .scaleToObject(0.7, { gridUnits: true })
    .filter("ColorMatrix", { saturate: -1 })
    .duration(2500)
    .fadeOut(500)
    .zIndex(1);

await sequence.play();

// Dynamic chain distribution from caster to target allies
let targetOrder = [token];
let targetOffsetX = [0];
let targetOffsetY = [0];

function calculateDistance(a, b) {
    const ax = a.center?.x ?? a.x ?? 0;
    const ay = a.center?.y ?? a.y ?? 0;
    const bx = b.center?.x ?? b.x ?? 0;
    const by = b.center?.y ?? b.y ?? 0;
    return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
}

function generateRandomOffset() {
    return (Math.random() - 0.5) * 0.6;
}

const uniqueTargets = targets.filter(t => (t.id ?? t.document?.id) !== (token.id ?? token.document?.id));
uniqueTargets.sort((a, b) => calculateDistance(token, a) - calculateDistance(token, b));

for (let i = 0; i < uniqueTargets.length; i++) {
    let lastAdded = targetOrder[targetOrder.length - 1];
    let closestDistance = Infinity;
    let closestIndex = -1;
    for (let j = 0; j < uniqueTargets.length; j++) {
        if (targetOrder.includes(uniqueTargets[j])) continue;
        let distance = calculateDistance(lastAdded, uniqueTargets[j]);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = j;
        }
    }
    if (closestIndex !== -1) {
        targetOrder.push(uniqueTargets[closestIndex]);
        targetOffsetX.push(generateRandomOffset());
        targetOffsetY.push(generateRandomOffset());
    }
}

for (let u = 0; u < targetOrder.length; u++) {
    if (u + 1 < targetOrder.length) {
        const nextTarget = targetOrder[u + 1];
        const nextLabel = `${id}-${nextTarget.id ?? nextTarget.document?.id ?? ""}`;

        const chainSeq = new Sequence();
        chainSeq.wait(500 + 100 * u);

        // Connecting vision aura beam from token/ally to next ally
        chainSeq.effect()
            .file(closest("jb2a.energy_beam.normal.yellow.03"))
            .atLocation(targetOrder[u], { offset: { x: targetOffsetX[u], y: targetOffsetY[u] }, gridUnits: true })
            .stretchTo(nextTarget, { offset: { x: targetOffsetX[u + 1], y: targetOffsetY[u + 1] }, gridUnits: true, onlyX: true })
            .scale(0.1)
            .duration(2000)
            .fadeIn(500)
            .fadeOut(500)
            .filter("ColorMatrix", { saturate: -1, brightness: 1.1 })
            .opacity(1);

        // Persistent twinkling stars on ally receiving night vision
        chainSeq.effect()
            .name(nextLabel)
            .delay(10 + 100 * u)
            .file(closest("jb2a.twinkling_stars.points04.white"))
            .attachTo(nextTarget, { offset: { x: targetOffsetX[u + 1], y: targetOffsetY[u + 1] }, gridUnits: true })
            .scaleToObject(0.65, { gridUnits: true })
            .scaleIn(0, 500, { ease: "easeOutBack" })
            .fadeIn(500)
            .fadeOut(500)
            .zIndex(1)
            .persist();

        // Persistent glowing cat-eye symbol vision aura on ally
        chainSeq.effect()
            .name(nextLabel)
            .delay(10 + 100 * u)
            .file(closest("eskie.symbol.eye.01.red"))
            .attachTo(nextTarget, { offset: { x: targetOffsetX[u + 1], y: targetOffsetY[u + 1] }, gridUnits: true })
            .scaleToObject(0.55, { gridUnits: true })
            .filter("ColorMatrix", { saturate: -1, hue: 105 })
            .scaleIn(0, 500, { ease: "easeOutBack" })
            .fadeIn(500)
            .fadeOut(500)
            .zIndex(0.1)
            .persist();

        // One-shot energy pulse on ally
        chainSeq.effect()
            .delay(10 + 100 * u)
            .file(closest("eskie.pulse.energy.01.yellow.yellow"))
            .attachTo(nextTarget, { offset: { x: targetOffsetX[u + 1], y: targetOffsetY[u + 1] }, gridUnits: true })
            .scaleToObject(0.6, { gridUnits: true })
            .filter("ColorMatrix", { saturate: -1 })
            .duration(2000)
            .fadeOut(500)
            .zIndex(1);

        // One-shot healing bluepurple burst on ally
        chainSeq.effect()
            .delay(10 + 100 * u)
            .file(closest("jb2a.healing_generic.03.burst.bluepurple"))
            .attachTo(nextTarget)
            .scaleToObject(2.2, { considerTokenScale: true })
            .fadeIn(500)
            .fadeOut(1000)
            .opacity(1)
            .belowTokens()
            .startTime(1000)
            .filter("ColorMatrix", { saturate: -0.5, hue: -50 })
            .zIndex(1);

        chainSeq.play();
    }
}
