// Standalone Macro: Draining Kiss
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Draining Kiss' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please select at least one target!");
}

const DEFAULT_CONFIG = {
    id: "draining-kiss",
    duration: 10000,
};

const id = DEFAULT_CONFIG.id ?? "draining-kiss";
const duration = DEFAULT_CONFIG.duration ?? 10000;

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct database key if running as a standalone copy-paste macro.
 */
const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

// 3. Toggle / Re-entrant Persistent Effect Handling
let isPlaying = false;
for (const target of targets) {
    const label = `${id}-${token.id}-${target.id}`;
    if (
        Sequencer.EffectManager.getEffects({ name: label }).length > 0 ||
        Sequencer.EffectManager.getEffects({ name: id, object: target }).length > 0 ||
        Sequencer.EffectManager.getEffects({ name: id, object: token }).length > 0
    ) {
        isPlaying = true;
        break;
    }
}
if (!isPlaying && Sequencer.EffectManager.getEffects({ name: id }).length > 0) {
    isPlaying = true;
}

if (isPlaying) {
    for (const target of targets) {
        const label = `${id}-${token.id}-${target.id}`;
        Sequencer.EffectManager.endEffects({ name: label });
        Sequencer.EffectManager.endEffects({ name: id, object: target });
    }
    Sequencer.EffectManager.endEffects({ name: id, object: token });
    Sequencer.EffectManager.endEffects({ name: id });
    return;
}

const sequence = new Sequence();

for (const target of targets) {
    const label = `${id}-${token.id}-${target.id}`;
    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;
    const gridScale = canvas.grid?.size ?? 100;

    // Seductive heart projectile sent from caster towards target
    sequence.effect()
        .name(label)
        .file(closest("jb2a.icon.heart.pink"))
        .atLocation(token)
        .moveTowards(target, { ease: "easeOutCubic", rotate: false })
        .moveSpeed(1000)
        .zeroSpriteRotation()
        .scaleToObject(0.8)
        .filter("ColorMatrix", { hue: -30 })
        .scaleIn(0, 200, { ease: "linear" })
        .duration(duration)
        .animateProperty("spriteContainer", "scale.x", {
            from: Math.abs((token.x - target.x) / gridScale),
            to: 0,
            duration: 300,
            ease: "easeInOutBack",
        })
        .animateProperty("spriteContainer", "scale.y", {
            from: Math.abs((token.y - target.y) / gridScale),
            to: 0,
            duration: 300,
            ease: "easeInOutBack",
        })
        .zIndex(3);

    // Outward purple particles on target upon impact
    sequence.effect()
        .name(label)
        .file(closest("jb2a.particles.outward.purple.01.03"))
        .atLocation(target)
        .delay(200)
        .scaleToObject(2)
        .zIndex(4)
        .scaleIn(0, 250, { ease: "easeOutCubic" })
        .duration(8000)
        .fadeOut(2000);

    // Seductive dark pink heart icon marker on target
    sequence.effect()
        .name(label)
        .file(closest("jb2a.icon.heart.pink"))
        .atLocation(target)
        .attachTo(target)
        .scaleToObject(0.5)
        .filter("ColorMatrix", { hue: -30 })
        .zIndex(3)
        .delay(1000)
        .duration(duration)
        .private();

    // Dark purple burst impact on target
    sequence.effect()
        .name(label)
        .file(closest("jb2a.impact.004.dark_purple"))
        .atLocation(target)
        .delay(200)
        .scaleToObject(1.25)
        .opacity(1)
        .randomRotation()
        .zIndex(2)
        .waitUntilFinished(-2000);

    // Target copySprite flash with vibrant dark pink siphon tint (#ed44fc)
    sequence.effect()
        .name(label)
        .copySprite(target)
        .spriteRotation(-targetRotation)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .attachTo(target)
        .delay(200)
        .fadeOut(250)
        .duration(500)
        .tint("#ed44fc")
        .opacity(0.5)
        .filter("Blur", { blurX: 10, blurY: 20 })
        .filter("ColorMatrix", { brightness: 2 })
        .zIndex(1)
        .waitUntilFinished(-500);

    // Life siphon beam: purple energy strands stretching from target back to caster
    sequence.effect()
        .name(label)
        .file(closest("jb2a.energy_strands.range.multiple.purple.01"))
        .atLocation(target)
        .stretchTo(token, { attachTo: true })
        .playbackRate(1)
        .zIndex(2)
        .duration(duration)
        .private();

    // Purple static aura border around caster token receiving life force
    sequence.effect()
        .name(label)
        .file(closest("jb2a.token_border.circle.static.purple.012"))
        .atLocation(token)
        .attachTo(token)
        .opacity(0.6)
        .delay(500)
        .fadeIn(3000, { ease: "easeInOutQuad" })
        .scaleIn(0, 2000, { ease: "easeOutCubic" })
        .scaleToObject(1.9, { considerTokenScale: true })
        .filter("ColorMatrix", { saturate: 0 })
        .belowTokens()
        .duration(duration)
        .private();

    // Purple ground cracks effect under target during siphon
    sequence.effect()
        .name(label)
        .file(closest("jb2a.impact.ground_crack.02.purple"))
        .atLocation(target)
        .scaleToObject(0.9)
        .delay(500)
        .opacity(0.75)
        .attachTo(target)
        .filter("ColorMatrix", { brightness: 0 })
        .fadeIn(1000, { ease: "easeInOutQuad" })
        .scaleIn(0, 3000, { ease: "easeOutCubic" })
        .zIndex(1)
        .duration(duration)
        .private()
        .mask(target);

    // Desaturated shadow echo image lingering on target
    sequence.effect()
        .name(label)
        .copySprite(target)
        .spriteRotation(-targetRotation)
        .scaleToObject(1, { considerTokenScale: true })
        .delay(1500)
        .fadeIn(10000)
        .attachTo(target)
        .filter("Blur", { blurX: 20, blurY: 20 })
        .opacity(0.5)
        .filter("ColorMatrix", { saturate: -1, brightness: 0.5 })
        .duration(duration)
        .zIndex(0);
}

await sequence.play();
