// Standalone Macro: Suggestion
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Suggestion' macro requires the 'Sequencer' module to be installed and active!");
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

const id = "suggestion";

// 3. Toggle / Re-entrant Persistent Effect Handling
const isEffectActive = (target) => {
    const label = `${id}-${target.id}`;
    return Sequencer.EffectManager.getEffects({ name: label, object: target }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: id, object: target }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: label }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: id }).length > 0;
};

const stopEffect = (target) => {
    const label = `${id}-${target.id}`;
    Sequencer.EffectManager.endEffects({ name: label, object: target });
    Sequencer.EffectManager.endEffects({ name: id, object: target });
    Sequencer.EffectManager.endEffects({ name: label });
    Sequencer.EffectManager.endEffects({ name: id });
};

const anyActive = targets.some(target => isEffectActive(target));

if (anyActive) {
    targets.forEach(target => stopEffect(target));
    return;
}

const sequence = new Sequence();

const offsets = [
    { x: 0, y: -0.55 },
    { x: -0.5, y: -0.15 },
    { x: -0.3, y: 0.45 },
    { x: 0.3, y: 0.45 },
    { x: 0.5, y: -0.15 }
];

for (const target of targets) {
    const label = `${id}-${target.id}`;
    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;
    const tokenMirrorX = token.document?.mirrorX ?? false;

    // Phase 1: Runes surrounding target and imploding inwards
    sequence.thenDo(function () {
        for (let i = 0; i < offsets.length; i++) {
            new Sequence()
                .effect()
                .delay(250)
                .file(closest("jb2a.icon.runes.blue"))
                .attachTo(target, { offset: offsets[i], gridUnits: true, bindRotation: false })
                .scaleToObject(0.4)
                .scaleIn(0, 250, { ease: "easeOutBack" })
                .animateProperty("spriteContainer", "position.x", { from: 0, to: -offsets[i].x, duration: 500, gridUnits: true, delay: 500, ease: "easeInBack" })
                .animateProperty("spriteContainer", "position.y", { from: 0, to: -offsets[i].y, duration: 500, gridUnits: true, delay: 500, ease: "easeInBack" })
                .zIndex(1)
                .duration(1150)

                .effect()
                .file(closest("jb2a.template_circle.out_pulse.02.burst.bluewhite"))
                .attachTo(target, { offset: offsets[i], gridUnits: true })
                .scaleToObject(0.4)
                .opacity(0.5)
                .play();
        }
    });

    sequence.wait(1250);

    // Phase 2: Blue enchantment mental strike & impact sequence
    sequence.effect()
        .file(closest("jb2a.energy_attack.01.blue"))
        .attachTo(target, { bindRotation: false })
        .scaleToObject(2.25)
        .belowTokens()
        .startTime(500)
        .endTime(2050)
        .fadeOut(400)
        .randomRotation();

    sequence.effect()
        .file(closest("jb2a.impact.010.blue"))
        .attachTo(target)
        .scaleToObject(0.9)
        .zIndex(2)
        .waitUntilFinished(-1000);

    // Phase 3: Persistent enchantment layers on target token with toggle support
    // Blue symbol runes mask over target token
    sequence.effect()
        .name(label)
        .file(closest("jb2a.template_circle.symbol.normal.runes.blue"))
        .attachTo(target)
        .scaleToObject(1.25)
        .fadeIn(500)
        .fadeOut(1000)
        .randomRotation()
        .mask(target)
        .persist();

    // Outflow glowing ground aura ring
    sequence.effect()
        .name(label)
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .attachTo(target, { cacheLocation: true, offset: { y: 0 }, gridUnits: true, bindAlpha: false })
        .scaleToObject(1.45, { considerTokenScale: true })
        .randomRotation()
        .fadeIn(500)
        .fadeOut(1000)
        .belowTokens()
        .opacity(0.45)
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
        .tint("#30aefd")
        .persist();

    // Silhouette token glow duplicate
    sequence.effect()
        .name(label)
        .copySprite(target)
        .spriteRotation(-targetRotation)
        .attachTo(target, { bindAlpha: false })
        .scaleToObject(1, { considerTokenScale: true })
        .belowTokens()
        .mirrorX(tokenMirrorX)
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
        .filter("Glow", { color: 0x30aefd, distance: 3, outerStrength: 4, innerStrength: 0 })
        .fadeIn(500)
        .fadeOut(1000)
        .zIndex(0.1)
        .persist();

    // Subtle silver hypnosis spiral ring rotating below target token
    sequence.effect()
        .name(label)
        .file(closest("jb2a.extras.tmfx.runes.circle.simple.illusion"))
        .attachTo(target)
        .scaleToObject(1.15)
        .filter("ColorMatrix", { saturate: -1, brightness: 1.2 })
        .opacity(0.4)
        .fadeIn(800)
        .fadeOut(1000)
        .loopProperty("spriteContainer", "rotation", { from: 0, to: 360, duration: 8000 })
        .belowTokens()
        .persist();

    // Golden suggestion mind-whisper cloud particles over target token
    sequence.effect()
        .name(label)
        .file(closest("jb2a.particles.outward.yellow.01.03"))
        .attachTo(target)
        .scaleToObject(1.5)
        .opacity(0.65)
        .fadeIn(1000)
        .fadeOut(1000)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.3, duration: 3000, gridUnits: true, ease: "easeInOutSine", pingPong: true })
        .zIndex(3)
        .persist();
}

await sequence.play();
