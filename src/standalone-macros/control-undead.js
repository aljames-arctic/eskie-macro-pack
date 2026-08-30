// Standalone Macro: Channel Divinity: Control Undead
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Control Undead' macro requires the 'Sequencer' module to be installed and active!");
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
const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "Control Undead";
const casterName = token.document?.name ?? token.name ?? "Caster";

// 3. Toggle / Re-entrant Persistent Effect Handling
const isEffectActive = (target) => {
    const targetId = target.id ?? target.document?.id ?? "";
    const label = `${id}-${targetId}`;
    const legacyLabel = `${id} ${casterName}`;
    return Sequencer.EffectManager.getEffects({ name: label, object: target }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: legacyLabel, object: target }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: id, object: target }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: label }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: legacyLabel }).length > 0;
};

const stopEffect = (target) => {
    const targetId = target.id ?? target.document?.id ?? "";
    const label = `${id}-${targetId}`;
    const legacyLabel = `${id} ${casterName}`;
    Sequencer.EffectManager.endEffects({ name: label, object: target });
    Sequencer.EffectManager.endEffects({ name: legacyLabel, object: target });
    Sequencer.EffectManager.endEffects({ name: id, object: target });
    Sequencer.EffectManager.endEffects({ name: label });
    Sequencer.EffectManager.endEffects({ name: legacyLabel });
    Sequencer.EffectManager.endEffects({ name: id });
};

const anyActive = targets.some(target => isEffectActive(target));

if (anyActive) {
    targets.forEach(target => stopEffect(target));
} else {
    const sequence = new Sequence();

    const casterScaleX = token.document?.texture?.scaleX ?? 1;

    // Outflow dark aura under caster token
    sequence.effect()
        .attachTo(token)
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .scaleToObject(1.5 * casterScaleX)
        .opacity(1)
        .belowTokens()
        .randomRotation()
        .filter("ColorMatrix", { brightness: 0 })
        .fadeIn(500)
        .fadeOut(500);

    for (const target of targets) {
        const targetId = target.id ?? target.document?.id ?? "";
        const label = `${id}-${targetId}`;
        const targetRotation = target.document?.rotation ?? target.rotation ?? 0;
        const mirrorX = token.document?.mirrorX ?? token.mirrorX ?? false;

        // Intro necromancy red rune under targeted undead token
        sequence.effect()
            .name(label)
            .file(closest("jb2a.magic_signs.rune.necromancy.intro.red"))
            .attachTo(target)
            .scaleToObject(0.5)
            .scaleOut(0, 1000, { ease: "easeInBack" })
            .fadeOut(500, { ease: "easeInCubic" })
            .zIndex(1);

        // Dark red beam/marker ray from caster toward target
        sequence.effect()
            .name(label)
            .file(closest("jb2a.markers.02.red"))
            .atLocation(token)
            .rotateTowards(target)
            .spriteOffset({ x: -0.2 }, { gridUnits: true })
            .spriteScale({ x: 0.8, y: 1 })
            .filter("ColorMatrix", { saturate: 0.5, hue: -2 })
            .rotate(0)
            .scaleToObject(1)
            .scaleIn(0, 1500, { ease: "easeOutCubic" })
            .animateProperty("spriteContainer", "position.x", { from: -0.5, to: 0.05, duration: 1000, gridUnits: true, ease: "easeOutBack", delay: 0 })
            .animateProperty("sprite", "width", { from: 0.8, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack", delay: 1500 })
            .animateProperty("sprite", "height", { from: 1, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack", delay: 1500 })
            .filter("Glow", { color: 0x000000 })
            .fadeOut(1000)
            .zIndex(1);

        // Red particle beam from caster pointing to target
        sequence.effect()
            .name(label)
            .file(closest("jb2a.particle_burst.01.circle.bluepurple"))
            .atLocation(token)
            .rotateTowards(target)
            .spriteOffset({ x: -0.2 }, { gridUnits: true })
            .spriteScale({ x: 0.8, y: 1 })
            .filter("ColorMatrix", { saturate: 0.5, hue: -2 })
            .rotate(0)
            .scaleToObject(1)
            .scaleIn(0, 1500, { ease: "easeOutCubic" })
            .animateProperty("spriteContainer", "position.x", { from: -0.5, to: 0.05, duration: 1000, gridUnits: true, ease: "easeOutBack", delay: 0 })
            .tint("#e51e19")
            .zIndex(0);

        // Red particle burst shockwave on target
        sequence.effect()
            .name(label)
            .file(closest("jb2a.particle_burst.01.circle.bluepurple"))
            .attachTo(target)
            .scaleToObject(1.5)
            .filter("ColorMatrix", { saturate: 0.5, hue: -2 })
            .tint("#e51e19")
            .belowTokens()
            .zIndex(0);

        // Dark black smoke puff around undead target
        sequence.effect()
            .name(label)
            .delay(550)
            .file(closest("jb2a.smoke.puff.centered.dark_black"))
            .attachTo(target)
            .scaleToObject(1.8)
            .scaleOut(0, 1000, { ease: "easeInBack" })
            .randomRotation()
            .belowTokens();

        // Dynamic red energy particles streaming from caster to undead target
        sequence.effect()
            .name(label)
            .delay(750)
            .file(closest("jb2a.particles.outward.red.01.03"))
            .atLocation(token)
            .rotateTowards(target)
            .spriteOffset({ x: -0.5, y: -0.1 }, { gridUnits: true })
            .filter("ColorMatrix", { saturate: 1, hue: -2 })
            .spriteScale({ x: 0.8, y: 1 })
            .scaleToObject(2.5)
            .scaleIn(0, 1500, { ease: "easeOutCubic" })
            .tint("#e51e19")
            .duration(1500)
            .fadeOut(1500)
            .waitUntilFinished(-1500);

        // Crimson spectral shadow pulse over target token
        sequence.effect()
            .name(label)
            .copySprite(target)
            .spriteRotation(-targetRotation)
            .attachTo(target, { bindAlpha: false })
            .scaleToObject(1, { considerTokenScale: true })
            .opacity(0.75)
            .mirrorX(mirrorX)
            .tint("#e51e19")
            .fadeIn(500)
            .fadeOut(500)
            .duration(1000);

        // Dark oathbreaker skull halo ascending particle beam command rising from target
        sequence.effect()
            .name(label)
            .delay(100)
            .file(closest("jb2a.particles.outward.white.01.03"))
            .attachTo(target, { offset: { y: 0.2 }, gridUnits: true, bindRotation: false })
            .scaleToObject()
            .duration(1000)
            .fadeOut(800)
            .scaleIn(0, 1000, { ease: "easeOutCubic" })
            .animateProperty("sprite", "width", { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack" })
            .animateProperty("sprite", "height", { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
            .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.6, duration: 1000, gridUnits: true })
            .tint("#e51e19")
            .filter("Blur", { blurX: 0, blurY: 5 })
            .opacity(0.8)
            .zIndex(0.3);

        // Dark red static electricity crackle over undead target
        sequence.effect()
            .name(label)
            .delay(750)
            .file(closest("jb2a.static_electricity.03.dark_red"))
            .atLocation(target)
            .size(1.25, { gridUnits: true })
            .opacity(1)
            .playbackRate(1)
            .randomRotation()
            .zIndex(0.3);

        // PERSISTENT: Dark outflow ring below controlled undead token
        sequence.effect()
            .name(label)
            .delay(500)
            .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
            .attachTo(target, { cacheLocation: true, offset: { y: 0 }, gridUnits: true, bindAlpha: false })
            .scaleToObject(1.45, { considerTokenScale: true })
            .randomRotation()
            .fadeIn(1000)
            .fadeOut(500)
            .belowTokens()
            .opacity(0.45)
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
            .filter("ColorMatrix", { brightness: 0 })
            .persist();

        // PERSISTENT: Paladin dark oathbreaker crimson dominate aura glow on controlled undead target
        sequence.effect()
            .name(label)
            .delay(500)
            .copySprite(target)
            .spriteRotation(-targetRotation)
            .attachTo(target, { bindAlpha: false })
            .scaleToObject(1, { considerTokenScale: true })
            .belowTokens()
            .mirrorX(mirrorX)
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
            .filter("Glow", { color: 0xe51e19, distance: 5, outerStrength: 4, innerStrength: 0 })
            .fadeIn(1000)
            .fadeOut(500)
            .persist()
            .zIndex(0.1);
    }

    await sequence.play();
}
