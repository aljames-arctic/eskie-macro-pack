// Standalone Macro: Banishment
// Original Author: derkreigs
// Update Author: bakanabaka
// Modular Conversion: Standalone Script Macro

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Banishment' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please select at least one target to banish!");
}

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct path if running as a standalone copy-paste macro.
 */
const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const DEFAULT_CONFIG = {
    id: "banishment",
    color: "yellow", // Colors: "yellow" (holy), "purple" or "dark_red" (dark), "blue", "green"
    sound: {
        enable: true,
        volume: 0.5,
    },
};

const id = DEFAULT_CONFIG.id ?? "banishment";
const color = DEFAULT_CONFIG.color ?? "yellow";
const sound = DEFAULT_CONFIG.sound ?? { enable: true, volume: 0.5 };

// 3. Toggle / Re-entrant Persistent Effect Handling
let anyActive = false;
for (const target of targets) {
    const targetId = target.id ?? target.document?.id ?? "";
    const effectName = `${id}-${targetId}`;
    const activeFx = Sequencer.EffectManager.getEffects({ name: effectName, object: target }) ?? [];
    const globalFx = Sequencer.EffectManager.getEffects({ name: id, object: target }) ?? [];
    if (activeFx.length > 0 || globalFx.length > 0 || target.document?.opacity === 0 || target.alpha === 0) {
        anyActive = true;
        break;
    }
}

const sequence = new Sequence();

if (anyActive) {
    // --- RETURN / UNBANISH SEQUENCE (TOGGLE OFF) ---
    for (const target of targets) {
        const targetId = target.id ?? target.document?.id ?? "";
        const effectName = `${id}-${targetId}`;

        await Sequencer.EffectManager.endEffects({ name: effectName, object: target });
        await Sequencer.EffectManager.endEffects({ name: id, object: target });
        Sequencer.MotionManager.endMotions(target, { name: effectName });

        if (sound.enable) {
            sequence.sound()
                .file(closest("psfx.2nd-level-spells.moonbeam.intro"))
                .volume(sound.volume);
        }

        sequence.effect()
            .file(closest(`jb2a.explosion.01.${color}`))
            .atLocation(target, { offset: { x: 5, y: -75 }, ignoreMotion: true })
            .scaleToObject(1.5)
            .delay(1500)
            .zIndex(1);

        sequence.effect()
            .file(closest(`jb2a.portals.vertical.vortex.${color}`))
            .atLocation(target, { offset: { x: 0, y: -75 }, ignoreMotion: true })
            .scaleToObject(2)
            .duration(6000)
            .scaleIn({ x: 0, y: 0.8 }, 500)
            .scaleOut({ x: 0, y: 0.4 }, 500, { ease: "easeOutBack" })
            .fadeOut(250)
            .zIndex(0.7)
            .belowTokens()
            .delay(1500)
            .waitUntilFinished(-4000);

        sequence.wait(1500);

        sequence.animation()
            .on(target)
            .show(true)
            .opacity(1);

        sequence.motion(target)
            .name(effectName)
            .moveBy(
                [
                    { v: { x: 0, y: -75 } },
                    { v: { x: 0, y: 0 }, duration: 500, inEase: "easeOutBounce" },
                ],
                { return: false }
            )
            .scaleTo(
                [
                    { v: 0.25 },
                    { v: 1, duration: 500, inEase: "linear" },
                ],
                { return: false }
            )
            .fadeTo(
                [
                    { v: 0 },
                    { v: 1, duration: 250, inEase: "linear" },
                ],
                { return: false }
            )
            .waitUntilFinished(-150);
    }
} else {
    // --- BANISHMENT SEQUENCE (TOGGLE ON) ---
    const RUNE_DATA = {
        animDuration: 300,
        rotationDuration: 200,
        merge: { x: 0, y: -75 },
        runes: [
            { offset: { x: -45, y: -61 }, rotation: (3 * 360) / 5 },
            { offset: { x: 0, y: 75 }, rotation: (5 * 360) / 5 },
            { offset: { x: 45, y: -61 }, rotation: (2 * 360) / 5 },
            { offset: { x: -70, y: 22 }, rotation: (4 * 360) / 5 },
            { offset: { x: 70, y: 22 }, rotation: (1 * 360) / 5 },
        ],
    };

    for (const target of targets) {
        const targetId = target.id ?? target.document?.id ?? "";
        const effectName = `${id}-${targetId}`;
        const targetRot = -(target.document?.rotation ?? target.rotation ?? 0);

        if (sound.enable) {
            sequence.sound()
                .file(closest("psfx.magic-signs.circle.v1.abjuration.complete"))
                .volume(sound.volume);
        }

        sequence.effect()
            .file(closest(`jb2a.magic_signs.circle.02.conjuration.intro.${color}`))
            .atLocation(target)
            .scaleToObject(2)
            .belowTokens();

        sequence.wait(3000);

        sequence.effect()
            .file(closest(`jb2a.magic_signs.circle.02.conjuration.loop.${color}`))
            .atLocation(target)
            .scaleToObject(2)
            .belowTokens()
            .duration(13000)
            .fadeOut(1000);

        sequence.wait(3750);

        let runeDelay = 0;
        let animationDelay = 4000;
        for (const rune of RUNE_DATA.runes) {
            if (sound.enable) {
                sequence.sound()
                    .file(closest("psfx.casting.generic.001"))
                    .volume(sound.volume)
                    .delay(runeDelay + 750);
            }
            sequence.effect()
                .file(closest(`jb2a.magic_signs.rune.conjuration.complete.${color}`))
                .atLocation(target, { offset: rune.offset })
                .scaleToObject(0.5)
                .delay(runeDelay)
                .playbackRate(0.65)
                .rotate(rune.rotation)
                .animateProperty("sprite", "rotation", {
                    from: rune.rotation,
                    to: 720 + rune.rotation,
                    duration: RUNE_DATA.rotationDuration,
                    delay: animationDelay,
                    ease: "easeInBack",
                })
                .animateProperty("spriteContainer", "position.x", {
                    from: 0,
                    to: RUNE_DATA.merge.x - rune.offset.x,
                    duration: RUNE_DATA.animDuration,
                    delay: animationDelay + RUNE_DATA.rotationDuration,
                    ease: "easeInBack",
                })
                .animateProperty("spriteContainer", "position.y", {
                    from: 0,
                    to: RUNE_DATA.merge.y - rune.offset.y,
                    duration: RUNE_DATA.animDuration,
                    delay: animationDelay + RUNE_DATA.rotationDuration,
                    ease: "easeInBack",
                })
                .duration(RUNE_DATA.animDuration + animationDelay - 800)
                .zIndex(0.1);

            runeDelay += RUNE_DATA.animDuration;
            animationDelay -= RUNE_DATA.animDuration;
        }

        sequence.wait(3000);

        if (sound.enable) {
            sequence.sound()
                .file(closest("psfx.2nd-level-spells.moonbeam.intro"))
                .volume(sound.volume);
        }

        sequence.wait(1500);

        sequence.effect()
            .file(closest(`jb2a.explosion.01.${color}`))
            .atLocation(target, { offset: { x: 5, y: -75 } })
            .delay(500)
            .scaleToObject(1.5)
            .zIndex(1);

        // Planar Holy / Dark Dimensional Portal Vortex
        sequence.effect()
            .file(closest(`jb2a.portals.vertical.vortex.${color}`))
            .atLocation(target, { offset: { x: 0, y: -75 } })
            .scaleToObject(2)
            .duration(6000)
            .scaleIn({ x: 0, y: 0.8 }, 500)
            .scaleOut({ x: 0, y: 0.4 }, 500, { ease: "easeInBack" })
            .fadeOut(250)
            .zIndex(0.7)
            .belowTokens()
            .delay(500)
            .waitUntilFinished(-5750);

        sequence.effect()
            .file(closest("jb2a.wind_stream.1200.white"))
            .atLocation(target)
            .scaleToObject(1.03)
            .rotate(90)
            .duration(6000)
            .fadeIn(250)
            .fadeOut(750);

        sequence.effect()
            .file(closest("jb2a.wind_stream.1200.white"))
            .atLocation(target, { offset: { x: 0, y: 100 } })
            .scaleToObject(1.03)
            .rotate(90)
            .duration(6000)
            .fadeIn(250)
            .fadeOut(750);

        sequence.effect()
            .file(closest(`jb2a.energy_beam.normal.${color}`))
            .atLocation(target, { offset: { x: 0, y: 50 } })
            .rotate(90)
            .size({ width: 400, height: 350 })
            .opacity(0.2)
            .duration(6000)
            .playbackRate(1.6)
            .fadeIn(250)
            .fadeOut(750);

        // Ground shadow dissipation animation anchored on floor
        sequence.effect()
            .copySprite(target)
            .spriteRotation(targetRot)
            .atLocation(target, { ignoreMotion: true })
            .scaleToObject(0.9, { considerTokenScale: true })
            .belowTokens()
            .filter("ColorMatrix", { brightness: -1 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .opacity(0.5)
            .duration(4500)
            .fadeOut(1000)
            .scaleOut(0, 4500);

        // Dimensional banishment struggle, wobble, and pull-in via .motion()
        sequence.motion(target)
            .name(effectName)
            .moveBy(
                [
                    { v: { x: 0, y: 0 } },
                    { v: { x: 0, y: -15 }, duration: 250, inEase: "easeInOutBack" },
                    { v: { x: 0, y: 0 }, duration: 2000, inEase: "easeInOutBack" },
                    { v: { x: 0, y: -40 }, duration: 500, inEase: "easeInOutBack" },
                    { v: { x: 0, y: -15 }, duration: 2000, inEase: "easeInOutBack" },
                    { v: { x: 0, y: -200 }, duration: 375, inEase: "easeInOutBack" },
                ],
                { return: false }
            )
            .rotateBy(
                [
                    { v: 0 },
                    { v: 8, duration: 500, inEase: "easeOutCubic" },
                    { v: -8, duration: 500, inEase: "easeOutCubic" },
                    { v: 8, duration: 500, inEase: "easeOutCubic" },
                    { v: -8, duration: 500, inEase: "easeInCubic" },
                    { v: 0, duration: 250, inEase: "easeOutCubic" },
                ],
                { delay: 250, return: false }
            )
            .rotateBy(
                [
                    { v: 0 },
                    { v: 8, duration: 500, inEase: "easeOutCubic" },
                    { v: -8, duration: 500, inEase: "easeOutCubic" },
                    { v: 8, duration: 500, inEase: "easeOutCubic" },
                    { v: -8, duration: 500, inEase: "easeInCubic" },
                    { v: 0, duration: 250, inEase: "easeOutCubic" },
                ],
                { delay: 2750, return: false }
            )
            .scaleTo(0.01, { delay: 4750, duration: 375, ease: "linear", return: false })
            .fadeTo(0, { delay: 5050, duration: 75, return: false })
            .waitUntilFinished(-150);

        // Hide actual token sprite on map once pulled into portal
        sequence.animation()
            .on(target)
            .opacity(0)
            .show(false);

        sequence.effect()
            .file(closest(`jb2a.explosion.02.${color}`))
            .atLocation(target, { offset: { x: 0, y: -85 }, ignoreMotion: true })
            .scaleToObject(0.5)
            .filter("ColorMatrix", { hue: 15 })
            .zIndex(0.9);

        sequence.effect()
            .file(closest(`jb2a.detect_magic.cone.${color}`))
            .rotateTowards(target, { ignoreMotion: true })
            .atLocation(target, { offset: { x: 0, y: -110 }, ignoreMotion: true })
            .scaleToObject(1)
            .playbackRate(1.5)
            .zIndex(1);

        sequence.effect()
            .file(closest(`jb2a.template_circle.out_pulse.02.loop.${color}`))
            .atLocation(target, { offset: { x: 0, y: -75 }, ignoreMotion: true })
            .scaleToObject(1.75)
            .delay(1000)
            .fadeOut(1000)
            .waitUntilFinished(-1500);

        sequence.effect()
            .file(closest(`jb2a.fireflies.many.02.${color}`))
            .atLocation(target, { offset: { x: 0, y: -75 }, ignoreMotion: true })
            .scaleToObject(0.75)
            .duration(2000)
            .fadeIn(500)
            .fadeOut(750)
            .animateProperty("spriteContainer", "position.y", { from: 0, to: 75, duration: 3000 });

        // Persistent tracking effect for toggle/stop state
        sequence.effect()
            .name(effectName)
            .atLocation(target, { ignoreMotion: true })
            .file(closest(`jb2a.magic_signs.circle.02.conjuration.loop.${color}`))
            .scaleToObject(0.1)
            .opacity(0)
            .persist();
    }
}

await sequence.play();
