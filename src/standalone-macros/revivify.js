// Standalone Macro: Revivify
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Revivify' macro requires the 'Sequencer' module to be installed and active!");
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
 * Falls back to the default path if running as a standalone copy-paste macro.
 */
const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const id = "revivify";

// 3. Toggle / Re-entrant Persistent Effect Handling
let anyPlaying = false;
for (const target of targets) {
    const label = `${id}-${target.id}`;
    if (Sequencer.EffectManager.getEffects({ name: label }).length > 0 ||
        Sequencer.EffectManager.getEffects({ name: label, object: target }).length > 0) {
        anyPlaying = true;
        break;
    }
}

if (anyPlaying) {
    for (const target of targets) {
        const label = `${id}-${target.id}`;
        Sequencer.EffectManager.endEffects({ name: label });
        Sequencer.EffectManager.endEffects({ name: label, object: target });
    }
    return;
}

const seq = new Sequence();

for (const target of targets) {
    const label = `${id}-${target.id}`;
    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;

    seq.effect()
        .name(label)
        .file(closest("jb2a.extras.tmfx.inpulse.circle.01.normal"))
        .atLocation(target)
        .scaleToObject(1)

    .effect()
        .name(label)
        .file(closest("jb2a.misty_step.02.yellow"))
        .atLocation(target)
        .scaleToObject(1)
        .scaleOut(1, 3500, { ease: "easeOutCubic" })

    .wait(1400)

    .effect()
        .name(label)
        .file(closest("jb2a.healing_generic.burst.tealyellow"))
        .atLocation(target)
        .scaleToObject(1.5)
        .filter("ColorMatrix", { hue: 225 })
        .fadeOut(1000, { ease: "easeInExpo" })
        .belowTokens()
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .duration(1200)
        .attachTo(target, { bindAlpha: false })

    .effect()
        .name(label)
        .copySprite(target)
        .spriteRotation(-targetRotation)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 10 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .fadeIn(100)
        .opacity(1)
        .fadeOut(5000)
        .duration(6000)
        .attachTo(target)

    .effect()
        .name(label)
        .file(closest("jb2a.fireflies.few.02.yellow"))
        .atLocation(target)
        .scaleToObject(2)
        .duration(10000)
        .fadeIn(1000)
        .fadeOut(500)
        .attachTo(target)

    .effect()
        .name(label)
        .file(closest("jb2a.extras.tmfx.outflow.circle.02"))
        .atLocation(target)
        .fadeIn(200)
        .opacity(0.25)
        .duration(10000)
        .scaleToObject(2)
        .fadeOut(500)
        .fadeIn(1000)
        .belowTokens()
        .attachTo(target)

    .effect()
        .name(label)
        .file(closest("jb2a.particles.outward.blue.01.03"))
        .atLocation(target)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .fadeIn(200, { ease: "easeInExpo" })
        .duration(10000)
        .opacity(0.25)
        .scaleToObject(2)
        .fadeOut(500)
        .fadeIn(1000)
        .belowTokens()
        .attachTo(target);
}

await seq.play();
