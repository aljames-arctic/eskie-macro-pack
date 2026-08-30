// Standalone Macro: Halo of Spores
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Halo of Spores' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select the Druid token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const tokenId = token.id ?? token.document?.id ?? "";
const auraLabel = `HaloOfSpores - ${tokenId}`;
const opacity = 0.45;
const tokenWidth = token.document?.width ?? 1;

// If only toggling persistent aura off
const activeAura = Sequencer.EffectManager.getEffects({ name: auraLabel, object: token }) ?? [];
const target = game.user.targets.first();

if (activeAura.length > 0 && !target) {
    Sequencer.EffectManager.endEffects({ name: auraLabel, object: token });
    return ui.notifications.info("Ended persistent Halo of Spores aura.");
}

const sequence = new Sequence();

// Start aura if not already running
if (activeAura.length === 0) {
    sequence.effect()
        .name(auraLabel)
        .file(closest("jb2a.spirit_guardians.green.particles"))
        .attachTo(token)
        .filter("ColorMatrix", { hue: 60 })
        .size(3.5 + tokenWidth, { gridUnits: true })
        .belowTokens()
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .opacity(opacity)
        .fadeIn(500)
        .fadeOut(500)
        .persist();

    sequence.effect()
        .name(auraLabel)
        .file(closest("jb2a.sleep.cloud.01.green"))
        .attachTo(token)
        .size(5.5 + tokenWidth, { gridUnits: true })
        .belowTokens()
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { hue: 60 })
        .opacity(opacity)
        .fadeIn(500)
        .fadeOut(500)
        .persist();
}

// Spore reaction damage effect on targeted enemy if specified
if (target) {
    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;

    sequence.effect()
        .file(closest("jb2a.fireflies.many.02.red"))
        .atLocation(target, { randomOffset: 0 })
        .scaleToObject(1.5)
        .fadeIn(500)
        .randomRotation()
        .scaleOut(0, 1000, { ease: "easeInBack" })
        .duration(1500)
        .opacity(0.8)
        .repeats(2, 100, 100)
        .filter("ColorMatrix", { hue: 60 });

    sequence.effect()
        .delay(250)
        .file(closest("jb2a.cast_generic.ice.01.blue"))
        .atLocation(target)
        .scaleToObject(1)
        .playbackRate(2)
        .filter("ColorMatrix", { hue: -60 })
        .waitUntilFinished(0);

    sequence.effect()
        .file(closest("eskie.pulse.energy.01.green"))
        .atLocation(target)
        .scaleToObject(1.25)
        .playbackRate(1)
        .filter("ColorMatrix", { hue: 60 });

    sequence.effect()
        .file(closest("jb2a.impact.004.green"))
        .atLocation(target)
        .scaleToObject(2)
        .playbackRate(1)
        .belowTokens()
        .filter("ColorMatrix", { hue: 60 });

    sequence.effect()
        .copySprite(target)
        .spriteRotation(-targetRotation)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .fadeIn(200)
        .fadeOut(500)
        .loopProperty("spriteContainer", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .duration(1500)
        .opacity(0.25);

    sequence.effect()
        .file(closest("jb2a.particles.outward.greenyellow.01.03"))
        .scaleToObject(2)
        .scaleIn(0.15, 750, { ease: "easeOutQuint" })
        .fadeOut(1500)
        .atLocation(target)
        .duration(1500)
        .randomRotation()
        .filter("ColorMatrix", { saturate: 1, hue: 60 })
        .zIndex(5);
}

await sequence.play();
