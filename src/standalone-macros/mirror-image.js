// Standalone Macro: Mirror Image
// Original Author: .eskie / EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Mirror Image' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const tokenId = token.id ?? token.document?.id ?? "";
const tokenName = token.name ?? token.document?.name ?? "Token";

// Toggle / re-entrant persistent effect handling: stop active mirror image if present
const activeEffects = [
    ...Sequencer.EffectManager.getEffects({ name: `mirrorImage - ${tokenId}*` }),
    ...Sequencer.EffectManager.getEffects({ name: `${tokenName} Mirror Image *` })
];

if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: `mirrorImage - ${tokenId}*` });
    Sequencer.EffectManager.endEffects({ name: `${tokenName} Mirror Image *` });
    await new Sequence()
        .animation()
            .on(token)
            .fadeIn(1000)
            .opacity(1)
        .play();
    return ui.notifications.info(`Ended Mirror Image on ${tokenName}.`);
}

// Dialog for selection between visual styles (similar to Rage)
const choice = await Dialog.wait({
    title: "Mirror Image",
    content: "<p style='text-align: center;'>Select a visual style for Mirror Image:</p>",
    buttons: {
        v2: {
            icon: '<i class="fas fa-sparkles" style="color: #dca9fe;"></i>',
            label: "Rising Stars (V2)",
            callback: () => "v2"
        },
        v1: {
            icon: '<i class="fas fa-clone" style="color: #d0c2ff;"></i>',
            label: "Classic Shimmer (V1)",
            callback: () => "v1"
        }
    },
    default: "v2",
    close: () => null
});

if (!choice) return;

const imageNumber = 3;

if (choice === "v1") {
    // V1 - Classic Shimmer
    const label = `mirrorImage - ${tokenId}`;
    const sequence = new Sequence();

    sequence
        .effect()
            .file(closest("jb2a.shimmer.01.purple"))
            .opacity(0.5)
            .rotate(-90)
            .scaleToObject(1.25)
            .atLocation(token)

        .animation()
            .on(token)
            .opacity(0)

        .effect()
            .file(closest("jb2a.particles.outward.orange.02.03"))
            .scaleToObject(2.5)
            .atLocation(token)
            .fadeIn(1000)
            .duration(10000)
            .fadeOut(2000)
            .randomRotation()

        .effect()
            .copySprite(token)
            .spriteRotation(-token.document.rotation)
            .atLocation(token)
            .scaleToObject(1, { considerTokenScale: true })
            .belowTokens()
            .animateProperty("spriteContainer", "position.x", { from: -80, to: 80, duration: 1500, pingPong: true })
            .duration(1500)
            .opacity(0.75)
            .tint("#d0c2ff")
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })

        .effect()
            .copySprite(token)
            .spriteRotation(-token.document.rotation)
            .atLocation(token)
            .scaleToObject(1, { considerTokenScale: true })
            .belowTokens()
            .animateProperty("spriteContainer", "position.x", { from: 80, to: -80, duration: 1500, pingPong: true })
            .duration(1500)
            .opacity(0.75)
            .tint("#d0c2ff")
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })

        .wait(500)

        // Image 1
        .effect()
            .name(`${label} (1)`)
            .copySprite(token)
            .spriteRotation(-token.document.rotation)
            .atLocation(token)
            .scaleToObject(1, { considerTokenScale: true })
            .anchor({ x: 0.9 + (imageNumber * 0.05) })
            .belowTokens()
            .attachTo(token, { bindAlpha: false, bindRotation: false })
            .persist()
            .animateProperty("sprite", "rotation", { from: 180, to: -10, duration: 500 })
            .loopProperty("spriteContainer", "position.x", { from: -5, to: 5, duration: 2500, pingPong: true })
            .zeroSpriteRotation()
            .opacity(0.75)
            .tint("#d0c2ff")
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })
            .zIndex(4)

        // Image 2
        .effect()
            .name(`${label} (2)`)
            .copySprite(token)
            .spriteRotation(-token.document.rotation)
            .scaleToObject(1, { considerTokenScale: true })
            .playIf(imageNumber >= 2)
            .atLocation(token)
            .anchor({ x: 0.9 + (imageNumber * 0.05) })
            .belowTokens()
            .attachTo(token, { bindAlpha: false, bindRotation: false })
            .persist()
            .animateProperty("sprite", "rotation", { from: 0, to: 190, duration: 500 })
            .loopProperty("spriteContainer", "position.x", { from: -5, to: 5, duration: 2500, pingPong: true, delay: 250 })
            .zeroSpriteRotation()
            .opacity(0.75)
            .tint("#d0c2ff")
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })
            .zIndex(4)

        // Image 3
        .effect()
            .name(`${label} (3)`)
            .copySprite(token)
            .spriteRotation(-token.document.rotation)
            .scaleToObject(1, { considerTokenScale: true })
            .playIf(imageNumber === 3)
            .atLocation(token)
            .anchor({ x: 0.9 + (imageNumber * 0.05) })
            .belowTokens()
            .attachTo(token, { bindAlpha: false, bindRotation: false })
            .persist()
            .animateProperty("sprite", "rotation", { from: 0, to: 90, duration: 250 })
            .loopProperty("spriteContainer", "position.x", { from: -5, to: 5, duration: 2500, pingPong: true })
            .zeroSpriteRotation()
            .opacity(0.75)
            .tint("#d0c2ff")
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })
            .delay(100)
            .zIndex(4)

        .wait(200)

        .effect()
            .file(closest("jb2a.shimmer.01.purple"))
            .opacity(0.5)
            .rotate(90)
            .scaleToObject(1.25)
            .atLocation(token)

        .animation()
            .on(token)
            .fadeIn(1000)
            .opacity(1);

    await sequence.play();
} else {
    // V2 - Rising Stars
    const label = `${tokenName} Mirror Image`;
    const sequence = new Sequence();

    sequence
        .animation()
            .delay(250)
            .on(token)
            .opacity(0)

        .effect()
            .file(closest("eskie.casting.arcane.01.center.one_shot.purple"))
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(0.8, { considerTokenScale: true })
            .zIndex(2)

        .effect()
            .copySprite(token)
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(1, { considerTokenScale: true })
            .animateProperty("sprite", "alpha", { from: 0, to: -0.5, duration: 500, ease: "easeOutCubic", delay: 250 })
            .animateProperty("sprite", "alpha", { from: 0, to: 0.5, duration: 250, ease: "easeInCubic", delay: 750 })
            .duration(1250)

        .effect()
            .file(closest("blfx.spell.template.circle.particles.3.rise.star1.loop.color1"))
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(1.75, { considerTokenScale: true })
            .zIndex(1)
            .startTime(1000)
            .animateProperty("spriteContainer", "position.x", { from: 0.25, to: -0.25, duration: 500, gridUnits: true, ease: "easeOutCubic" })
            .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.25, duration: 250, gridUnits: true, ease: "easeInCubic", delay: 500 })
            .duration(2250)
            .fadeIn(500, { ease: "easeOutCubic" })
            .fadeOut(500, { ease: "easeInCubic" })
            .opacity(0.8)
            .belowTokens()

        .effect()
            .copySprite(token)
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(1, { considerTokenScale: true })
            .zIndex(0)
            .opacity(0.5)
            .tint("#dca9fe")
            .animateProperty("spriteContainer", "position.x", { from: 0.25, to: -0.25, duration: 500, gridUnits: true, ease: "easeOutCubic" })
            .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.25, duration: 250, gridUnits: true, ease: "easeInCubic", delay: 500 })
            .duration(1250)
            .fadeIn(500, { ease: "easeOutCubic" })
            .fadeOut(500, { ease: "easeInCubic" })
            .belowTokens()

        .effect()
            .file(closest("blfx.spell.template.circle.particles.3.rise.star1.loop.color1"))
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(1.75, { considerTokenScale: true })
            .zIndex(1)
            .startTime(1000)
            .animateProperty("spriteContainer", "position.x", { from: -0.25, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutCubic" })
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.25, duration: 250, gridUnits: true, ease: "easeInCubic", delay: 500 })
            .duration(2250)
            .fadeIn(500, { ease: "easeOutCubic" })
            .fadeOut(500, { ease: "easeInCubic" })
            .opacity(0.8)
            .belowTokens()

        .effect()
            .copySprite(token)
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(1, { considerTokenScale: true })
            .zIndex(0)
            .opacity(0.5)
            .tint("#dca9fe")
            .animateProperty("spriteContainer", "position.x", { from: -0.25, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutCubic" })
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.25, duration: 250, gridUnits: true, ease: "easeInCubic", delay: 500 })
            .duration(1250)
            .fadeIn(500, { ease: "easeOutCubic" })
            .fadeOut(500, { ease: "easeInCubic" })
            .belowTokens()

        .animation()
            .delay(1000)
            .on(token)
            .opacity(1)

        .effect()
            .delay(750)
            .file(closest("jb2a.particles.outward.purple.02.04"))
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(1.25, { considerTokenScale: true })
            .zIndex(1)
            .scaleIn(0, 500, { ease: "easeOutCubic" })
            .fadeOut(500)
            .duration(1000);

    const radius = 0.45;
    for (let i = 0; i < imageNumber; i++) {
        const angle = (Math.PI * 2 / imageNumber) * i - Math.PI / 2;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;

        const imgSeq = new Sequence()
            .wait(750)
            .effect()
                .name(`${label} ${i + 1}`)
                .copySprite(token)
                .attachTo(token, { offset: { x: offsetX, y: offsetY }, gridUnits: true, bindAlpha: false, local: false })
                .scaleToObject(1, { considerTokenScale: true })
                .zIndex(0)
                .opacity(0.5)
                .tint("#dca9fe")
                .animateProperty("spriteContainer", "position.x", { from: -offsetX, to: 0, duration: 500, gridUnits: true, ease: "easeOutCubic" })
                .animateProperty("spriteContainer", "position.y", { from: -offsetY, to: 0, duration: 500, gridUnits: true, ease: "easeOutCubic" })
                .duration(1500)
                .fadeIn(500, { ease: "easeOutCubic" })
                .fadeOut(1000)
                .belowTokens()
                .persist()
                .loopProperty("sprite", "alpha", { from: 0.5, to: 0.35, duration: 3000, ease: "easeInOutSine", pingPong: true })
                .loopProperty("spriteContainer", "position.x", { from: 0, to: -offsetX / 8, duration: 3000, gridUnits: true, ease: "easeInOutSine", pingPong: true })
                .loopProperty("spriteContainer", "position.y", { from: 0, to: -offsetY / 8, duration: 3000, gridUnits: true, ease: "easeInOutSine", pingPong: true })

            .effect()
                .name(`${label} ${i + 1}`)
                .file(closest("blfx.spell.template.circle.particles.3.rise.star1.loop.color1"))
                .attachTo(token, { bindAlpha: false })
                .scaleToObject(1.75, { considerTokenScale: true })
                .zIndex(1)
                .startTime(1000)
                .animateProperty("spriteContainer", "position.x", { from: 0, to: offsetX, duration: 500, gridUnits: true, ease: "easeOutCubic" })
                .animateProperty("spriteContainer", "position.y", { from: 0, to: offsetY, duration: 500, gridUnits: true, ease: "easeOutCubic" })
                .duration(2250)
                .fadeIn(500, { ease: "easeOutCubic" })
                .fadeOut(1000, { ease: "easeInCubic" })
                .opacity(0.8)
                .belowTokens();

        sequence.addSequence(imgSeq);
    }

    await sequence.play();
}
