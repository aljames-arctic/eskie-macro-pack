// Standalone Macro: Divine Strike
// Original Author: eskiemoh#2969
// Modular Conversion: standalone-macro

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Divine Strike' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please target a token!");
}

const DEFAULT_CONFIG = {
    id: "DivineStrike",
    darkMap: true,
    mode: "auto", // "auto", "melee", or "ranged"
};

const config = DEFAULT_CONFIG;
const id = config.id ?? "DivineStrike";
const darkMap = config.darkMap ?? true;
const mode = config.mode ?? "auto";
const label = `${id}-${token.id}`;

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct database key if running as a standalone copy-paste macro.
 */
const closest = (path) => {
    if (typeof eskie !== "undefined" && eskie.util?.file?.closest) {
        return eskie.util.file.closest(path);
    }
    const apiClosest = game.modules?.get("eskie-macros")?.api?.util?.closest;
    if (typeof apiClosest === "function") {
        return apiClosest(path);
    }
    return path;
};

/**
 * Calculates 3D scene distance in units (e.g. feet) between two tokens.
 */
function getDistance(t1, t2) {
    if (typeof eskie !== "undefined" && eskie.util?.tokens?.getDistance) {
        return eskie.util.tokens.getDistance(t1, t2);
    }
    const apiDist = game.modules?.get("eskie-macros")?.api?.util?.tokens?.getDistance;
    if (typeof apiDist === "function") {
        return apiDist(t1, t2);
    }

    const p1 = t1.center ?? { x: t1.x, y: t1.y };
    const p2 = t2.center ?? { x: t2.x, y: t2.y };
    const dist2DPx = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const gridSize = canvas.grid?.size ?? canvas.dimensions?.size ?? 100;
    const gridDistance = canvas.scene?.grid?.distance ?? 5;
    const dist2DUnits = (dist2DPx / gridSize) * gridDistance;
    const el1 = t1.document?.elevation ?? 0;
    const el2 = t2.document?.elevation ?? 0;
    const elDiff = el1 - el2;
    return Math.ceil(Math.hypot(dist2DUnits, elDiff));
}

// 3. Toggle / Re-entrant Persistent Effect Handling
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: label }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    for (const target of targets) {
        Sequencer.EffectManager.endEffects({ name: label, object: target });
    }
    return;
}

const tokenWidth = token.document?.width ?? 1;
const sequence = new Sequence();

for (const target of targets) {
    const dist = getDistance(token, target);
    const useMelee = mode === "melee" || (mode === "auto" && dist <= 8);

    if (useMelee) {
        // Melee Holy Strike: Radiant cleric holy weapon strike laser gleam and holy ground symbol burst
        const offsets = [
            { x: 0.3 * tokenWidth, y: -0.85 * tokenWidth },
            { x: 0.25 * tokenWidth, y: -0.45 * tokenWidth },
            { x: -0.2 * tokenWidth, y: -0.4 * tokenWidth },
            { x: -0.05 * tokenWidth, y: 0 },
        ];

        for (let i = 0; i < 4; i++) {
            sequence.effect()
                .name(label)
                .delay(10 + 50 * i)
                .file(closest("jb2a.twinkling_stars.points04.white"))
                .atLocation(target)
                .rotateTowards(token)
                .scaleToObject(0.4, { gridUnits: true })
                .scaleIn(0, 500, { ease: "easeOutBack" })
                .scaleOut(0, 250, { ease: "easeOutCubic" })
                .duration(1000 - (10 + 50 * i))
                .spriteOffset(offsets[i], { gridUnits: true })
                .zIndex(2);

            sequence.effect()
                .name(label)
                .delay(10 + 50 * i)
                .file(closest("eskie.pulse.energy.01.yellow.yellow"))
                .atLocation(target)
                .rotateTowards(token)
                .scaleToObject(0.4, { gridUnits: true })
                .spriteOffset(offsets[i], { gridUnits: true })
                .filter("ColorMatrix", { saturate: -1 })
                .zIndex(2);
        }

        if (darkMap && canvas?.scene?.background?.src) {
            const gridSize = canvas.grid?.size ?? canvas.dimensions?.size ?? 100;
            sequence.effect()
                .name(label)
                .file(closest(canvas.scene.background.src))
                .filter("ColorMatrix", { brightness: 0.5 })
                .atLocation({ x: canvas.dimensions.width / 2, y: canvas.dimensions.height / 2 })
                .size({ width: canvas.scene.width / gridSize, height: canvas.scene.height / gridSize }, { gridUnits: true })
                .spriteOffset({ x: 0 }, { gridUnits: true })
                .duration(2500)
                .fadeIn(250)
                .fadeOut(500)
                .belowTokens();
        }

        sequence.wait(500)
            .canvasPan()
            .delay(300)
            .shake({ duration: 1000, strength: 1, rotation: false, fadeOutDuration: 1000 });

        // Holy ground symbol burst
        sequence.effect()
            .name(label)
            .delay(300)
            .file(closest("jb2a.impact.ground_crack.01.purple"))
            .atLocation(target)
            .size(2.3 * tokenWidth, { gridUnits: true })
            .filter("ColorMatrix", { saturate: 0, brightness: 0 })
            .belowTokens()
            .playbackRate(0.85)
            .randomRotation();

        // Outward holy particles
        sequence.effect()
            .name(label)
            .delay(300)
            .file(closest("jb2a.particles.outward.white.02.03"))
            .scaleIn(0, 500, { ease: "easeOutQuint" })
            .fadeOut(1500)
            .atLocation(target)
            .duration(1500)
            .size(2.15, { gridUnits: true })
            .zIndex(5);

        // Radiant energy burst
        sequence.effect()
            .name(label)
            .delay(300)
            .file(closest("eskie.pulse.energy.01.yellow.yellow"))
            .atLocation(target)
            .scaleToObject(1.75)
            .filter("ColorMatrix", { saturate: -1 })
            .zIndex(1.1);

        // Radiant cleric holy weapon strike laser gleam
        sequence.effect()
            .name(label)
            .file(closest("jb2a.divine_smite.target.yellowwhite"))
            .attachTo(target, { bindScale: false })
            .rotateTowards(token)
            .scaleToObject(2)
            .spriteOffset({ x: -1.0 * tokenWidth, y: 0 }, { gridUnits: true })
            .mirrorY()
            .rotate(90)
            .filter("ColorMatrix", { saturate: -0.35, hue: 150 })
            .zIndex(1);

        sequence.wait(250);
    } else {
        // Ranged Holy Strike
        const tokenCenter = token.center ?? { x: token.x, y: token.y };
        const targetCenter = target.center ?? { x: target.x, y: target.y };

        const distance = {
            x: tokenCenter.x - targetCenter.x,
            y: tokenCenter.y - targetCenter.y,
        };

        const midpoint = {
            x: (tokenCenter.x + targetCenter.x) / 2,
            y: (tokenCenter.y + targetCenter.y) / 2,
        };

        let randomOffset;
        if (Math.abs(distance.x) > Math.abs(distance.y)) {
            randomOffset = [
                { x: 0, y: 0.2 },
                { x: 0, y: -0.35 },
                { x: 0, y: 0.35 },
                { x: 0, y: -0.2 },
            ];
        } else {
            randomOffset = [
                { x: -0.2, y: 0 },
                { x: 0.35, y: 0 },
                { x: -0.35, y: 0 },
                { x: 0.2, y: 0 },
            ];
        }

        for (let i = 0; i < 4; i++) {
            const offset = [
                { x: distance.x / 4, y: distance.y / 4 },
                { x: distance.x / 12, y: distance.y / 12 },
                { x: -distance.x / 12, y: -distance.y / 12 },
                { x: -distance.x / 4, y: -distance.y / 4 },
            ];

            sequence.effect()
                .name(label)
                .delay(10 + 50 * i)
                .file(closest("jb2a.twinkling_stars.points04.white"))
                .atLocation(midpoint, { offset: randomOffset[i], gridUnits: true })
                .scaleToObject(0.5, { gridUnits: true })
                .scaleIn(0, 500, { ease: "easeOutBack" })
                .scaleOut(0, 250, { ease: "easeOutCubic" })
                .duration(1000 - (10 + 50 * i))
                .spriteOffset(offset[i], { gridUnits: false })
                .zIndex(2);

            sequence.effect()
                .name(label)
                .delay(10 + 50 * i)
                .file(closest("eskie.pulse.energy.01.yellow.yellow"))
                .atLocation(midpoint, { offset: randomOffset[i], gridUnits: true })
                .scaleToObject(0.5, { gridUnits: true })
                .spriteOffset(offset[i], { gridUnits: false })
                .filter("ColorMatrix", { saturate: -1 })
                .zIndex(2);
        }

        if (darkMap && canvas?.scene?.background?.src) {
            const gridSize = canvas.grid?.size ?? canvas.dimensions?.size ?? 100;
            sequence.effect()
                .name(label)
                .file(closest(canvas.scene.background.src))
                .filter("ColorMatrix", { brightness: 0.5 })
                .atLocation({ x: canvas.dimensions.width / 2, y: canvas.dimensions.height / 2 })
                .size({ width: canvas.scene.width / gridSize, height: canvas.scene.height / gridSize }, { gridUnits: true })
                .spriteOffset({ x: 0 }, { gridUnits: true })
                .duration(2000)
                .fadeIn(250)
                .fadeOut(500)
                .belowTokens();
        }

        sequence.wait(500);

        sequence.effect()
            .name(label)
            .file(closest("jb2a.ranged.02.projectile.01.yellow"))
            .atLocation(token)
            .stretchTo(target)
            .opacity(1)
            .playbackRate(1.5)
            .filter("ColorMatrix", { saturate: 0.25 })
            .randomizeMirrorY()
            .filter("ColorMatrix", { saturate: -1, hue: 150 })
            .zIndex(0.2);

        sequence.effect()
            .name(label)
            .file(closest("jb2a.ranged.03.projectile.01.pinkpurple"))
            .atLocation(token)
            .stretchTo(target)
            .opacity(1)
            .playbackRate(1.5)
            .randomizeMirrorY()
            .filter("ColorMatrix", { brightness: 0 })
            .zIndex(0.1);
    }
}

await sequence.play();
