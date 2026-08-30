// Standalone Macro: Animate Dead
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Animate Dead' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to the default path if running as a standalone copy-paste macro.
 */
const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

// 2. Validate Position / Target Token
const targets = Array.from(game.user.targets);
let targetLocation = targets.length > 0 ? targets[0] : null;

if (!targetLocation) {
    const crosshairConfig = {
        size: 1,
        icon: "icons/magic/death/skeleton-skull-glowing-purple.webp",
        label: "Animate Dead Location",
        tag: "animate-dead",
        drawIcon: true,
        drawOutline: true,
        rememberControlled: true,
    };
    const position = await Sequencer.Crosshair.show(crosshairConfig);
    if (!position || position.cancelled) return;
    targetLocation = position;
}

const id = "animate-dead";
const targetId = targetLocation.id ?? `${Math.round(targetLocation.x ?? 0)}-${Math.round(targetLocation.y ?? 0)}`;
const label = `${id}-${token.id}-${targetId}`;

// 3. Toggle / Re-entrant Persistent Effect Handling
const activeEffects = Sequencer.EffectManager.getEffects({ name: label })
    .concat(Sequencer.EffectManager.getEffects({ name: id }))
    .concat(targetLocation.id ? Sequencer.EffectManager.getEffects({ name: `${id}-${targetLocation.id}`, object: targetLocation }) : []);

if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label });
    Sequencer.EffectManager.endEffects({ name: id });
    if (targetLocation.id) {
        Sequencer.EffectManager.endEffects({ name: `${id}-${targetLocation.id}`, object: targetLocation });
        new Sequence().animation().on(targetLocation).opacity(1).play();
    }
    return ui.notifications.info("Animate Dead animation stopped.");
}

const sequence = new Sequence();

// If targetLocation is a Token (e.g. spawned skeleton/zombie), prepare emergence fade-in
const isTokenTarget = Boolean(targetLocation.document || targetLocation.actor);
if (isTokenTarget) {
    sequence.animation()
        .on(targetLocation)
        .opacity(0);
}

sequence
    // -------------------------------------------------------------
    // PHASE 1: NECROMANCY DARK PURPLE RUNE CIRCLE
    // -------------------------------------------------------------
    .effect()
        .name(label)
        .wait(50)
        .atLocation(targetLocation)
        .file(closest("jb2a.magic_signs.circle.02.necromancy.complete.green"))
        .size(1.5, { gridUnits: true })
        .belowTokens()
        .filter("ColorMatrix", { saturate: 0.4, hue: -10 })
        .fadeOut(2000)
        .zIndex(0)

    .effect()
        .name(label)
        .delay(500)
        .atLocation(targetLocation)
        .file(closest("jb2a.ward.rune.dark_purple.01"))
        .size(1.25, { gridUnits: true })
        .belowTokens()
        .fadeIn(400)
        .fadeOut(1600)
        .duration(2800)
        .zIndex(0.5)

    .effect()
        .name(label)
        .delay(2250)
        .atLocation(targetLocation)
        .file(closest("jb2a.magic_signs.circle.02.necromancy.loop.green"))
        .size(1.5, { gridUnits: true })
        .belowTokens(true)
        .filter("ColorMatrix", { saturate: 0.6, brightness: 1.5 })
        .filter("Blur", { blurX: 5, blurY: 5 })
        .zIndex(1)
        .duration(600)
        .playbackRate(2)
        .fadeIn(200, { ease: "easeOutCirc" })
        .fadeOut(300, { ease: "linear" })

    .effect()
        .name(label)
        .file(closest("eskie.damage.electricity.01.purple"))
        .delay(2250)
        .atLocation(targetLocation)
        .duration(1500)
        .fadeOut(1000)
        .size(1.75, { gridUnits: true })
        .randomRotation()
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .zIndex(1)

    // Build Up Energy
    .effect()
        .name(label)
        .delay(2250)
        .file(closest("jb2a.cast_generic.ice.01.blue"))
        .atLocation(targetLocation)
        .size(1.5, { gridUnits: true })
        .opacity(0.8)
        .filter("ColorMatrix", { brightness: 0, hue: -45 })
        .playbackRate(2)
        .zIndex(2)
        .waitUntilFinished(-200)

    // -------------------------------------------------------------
    // PHASE 2: DIRT MOUND UPHEAVAL & BURST
    // -------------------------------------------------------------
    // Ground Cracking & Soil Rupture beneath grave
    .effect()
        .name(label)
        .delay(100)
        .file(closest("jb2a.impact.ground_crack.dark_red.02"))
        .atLocation(targetLocation)
        .size(2.2, { gridUnits: true })
        .belowTokens()
        .filter("ColorMatrix", { hue: -120, brightness: -0.4, saturate: -0.5 })
        .fadeIn(150)
        .fadeOut(2000)
        .duration(4500)
        .zIndex(0.2)

    // Earth Shatter & Dirt Mound Flying Soil
    .effect()
        .name(label)
        .delay(150)
        .file(closest("jb2a.impact.ground_crack.orange.01"))
        .atLocation(targetLocation)
        .size(2.3, { gridUnits: true })
        .belowTokens()
        .playbackRate(1.2)
        .randomRotation()
        .zIndex(1.4)

    // Billowing Grave Dirt Dust & Soil Upheaval Smoke
    .effect()
        .name(label)
        .delay(180)
        .file(closest("eskie.smoke.05.tan"))
        .atLocation(targetLocation, { offset: { y: -0.1 }, gridUnits: true })
        .size(1.9, { gridUnits: true })
        .filter("ColorMatrix", { brightness: -0.5, saturate: -0.3 })
        .opacity(0.75)
        .fadeIn(250)
        .fadeOut(1500)
        .duration(3200)
        .scaleIn(0.2, 700, { ease: "easeOutCubic" })
        .belowTokens()
        .zIndex(1.3)

    // Lightning Blast Explosion
    .effect()
        .name(label)
        .delay(200)
        .file(closest("eskie.lightning.lightning_bolt.blue"))
        .rotate(-90)
        .atLocation(targetLocation, { offset: { y: -0.4 }, gridUnits: true })
        .size(1.5, { gridUnits: true })
        .playbackRate(1.5)
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .mirrorY()
        .waitUntilFinished(-200)

    .effect()
        .name(label)
        .file(closest("eskie.damage.electricity.01.purple"))
        .atLocation(targetLocation)
        .size(2.25, { gridUnits: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .playbackRate(0.63)
        .fadeOut(500)
        .zIndex(2)

    .effect()
        .name(label)
        .file(closest("jb2a.impact.dark.01.red"))
        .atLocation(targetLocation)
        .size(2.5, { gridUnits: true })
        .filter("ColorMatrix", { hue: 90 })
        .randomizeMirrorX()
        .randomizeMirrorY()

    .effect()
        .name(label)
        .file(closest("jb2a.liquid.splash.red"))
        .atLocation(targetLocation)
        .size(1.65, { gridUnits: true })
        .belowTokens()
        .zIndex(0.1)

    .effect()
        .name(label)
        .delay(250)
        .file(closest("blfx.spell.template.circle.wave2.blood1.splatter.red"))
        .attachTo(targetLocation)
        .size(1.3, { gridUnits: true })
        .belowTokens()
        .fadeOut(1000)
        .duration(8000)
        .randomRotation()
        .loopOptions({ loops: 1 })
        .filter("ColorMatrix", { hue: -5, saturate: 1, brightness: 0.6 })
        .zIndex(0.2)

    // -------------------------------------------------------------
    // PHASE 3: SKELETON / ZOMBIE RAISE EMERGENCE SEQUENCE
    // -------------------------------------------------------------
    .effect()
        .name(label)
        .file(closest("jb2a.fireflies.many.02.green"))
        .atLocation(targetLocation)
        .size(1.25, { gridUnits: true })
        .duration(3000)
        .fadeIn(500)
        .fadeOut(1000)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .randomRotation()
        .zIndex(3)

    .effect()
        .name(label)
        .delay(250)
        .file(closest("jb2a.static_electricity.03.blue"))
        .atLocation(targetLocation)
        .size(1.25, { gridUnits: true })
        .belowTokens()
        .fadeOut(3000)
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .opacity(0.75)
        .playbackRate(4)
        .fadeOut(1000)
        .randomRotation()
        .repeats(5, 1000, 1500)
        .zIndex(0.3);

if (isTokenTarget) {
    sequence.animation()
        .delay(200)
        .on(targetLocation)
        .fadeIn(700)
        .opacity(1);
}

await sequence.play();
