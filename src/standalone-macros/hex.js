// Standalone Macro: Hex
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Hex' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please select a target!");
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

const id = "hex";

// 3. Toggle / Re-entrant Persistent Effect Handling
const isEffectActive = (target) => {
    const label = `${id}-${target.id}`;
    return Sequencer.EffectManager.getEffects({ name: label, object: target }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: id, object: target }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: label }).length > 0;
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
} else {
    const sequence = new Sequence();

    for (const target of targets) {
        const label = `${id}-${target.id}`;
        const targetRotation = target.document?.rotation ?? target.rotation ?? 0;
        const scaleX = target.document?.texture?.scaleX ?? 1;

        // Outward purple particles
        sequence.effect()
            .name(label)
            .file(closest("jb2a.particles.outward.purple.01.03"))
            .attachTo(target)
            .scale(0.15)
            .playbackRate(1)
            .duration(1000)
            .fadeOut(500)
            .scaleIn(0, 1000, { ease: "easeOutCubic" })
            .filter("ColorMatrix", { hue: 0 })
            .animateProperty("sprite", "width", { from: 0, to: 0.5, duration: 500, gridUnits: true, ease: "easeOutBack" })
            .animateProperty("sprite", "height", { from: 0, to: 1.5, duration: 1000, gridUnits: true, ease: "easeOutBack" })
            .animateProperty("spriteContainer", "position.y", { from: 0, to: -1, duration: 1000, gridUnits: true })
            .zIndex(0.2);

        // Dark purple warlock curse eye/skull symbol marker
        sequence.effect()
            .name(label)
            .file(closest("eskie.symbol.eye.01.purple"))
            .attachTo(target)
            .scaleToObject(0.75)
            .scaleIn(0, 250, { ease: "easeOutCubic" })
            .zIndex(0.1)
            .persist();

        // Grey smoke puff
        sequence.effect()
            .name(label)
            .file(closest("jb2a.smoke.puff.centered.grey"))
            .attachTo(target)
            .scaleToObject(4)
            .spriteOffset({ x: 0.1, y: -0.45 }, { gridUnits: true })
            .filter("ColorMatrix", { brightness: -1 });

        // Dark purple ward rune (persistent curse marker below token)
        sequence.effect()
            .name(label)
            .file(closest("jb2a.ward.rune.dark_purple.01"))
            .attachTo(target)
            .scaleToObject(1.85)
            .fadeOut(3000)
            .opacity(1)
            .belowTokens()
            .scaleIn(0, 250, { ease: "easeOutCubic" })
            .persist();

        // Outflow circle below tokens
        sequence.effect()
            .name(label)
            .file(closest("jb2a.extras.tmfx.outflow.circle.04"))
            .attachTo(target)
            .belowTokens()
            .filter("ColorMatrix", { brightness: -1 })
            .opacity(2)
            .scaleToObject(1.35)
            .scaleIn(0, 500, { ease: "easeOutCubic" })
            .fadeOut(500);

        // Hex extra necrotic damage target token shake & purple tint flash
        sequence.effect()
            .name(label)
            .copySprite(target)
            .spriteRotation(-targetRotation)
            .attachTo(target)
            .scaleToObject(1, { considerTokenScale: true })
            .fadeOut(300)
            .loopProperty("spriteContainer", "position.x", { from: -0.05, to: 0.05, duration: 175, pingPong: true, gridUnits: true })
            .scaleToObject(scaleX)
            .duration(500)
            .tint("#dcace3")
            .opacity(0.45);
    }

    await sequence.play();
}
