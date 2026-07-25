// Standalone Macro: Mirror Image
// Original Author: EskieMoh#2969
// Update Author: bakanabaka

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => {
    return game.modules.get("eskie-macros")?.api?.util?.closest?.(path) ?? path;
};

const id = "mirrorImage";
const imageNumber = 3;
const label = `${id} - ${token.id}`;

// Check if effect is already active for this token (acting as a toggle)
const isPlaying = Sequencer.EffectManager.getEffects({ name: `${label}*`, object: token }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: `${label}*`, object: token });
    Sequencer.EffectManager.endEffects({ name: `${label}*` });

    await new Sequence()
        .animation()
            .on(token)
            .fadeIn(1000)
            .opacity(1)
            .play();
} else {
    // Initial token opacity setup
    await new Sequence()
        .animation()
            .on(token)
            .opacity(0)
            .play();

    const sequence = new Sequence()
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
            .animateProperty('spriteContainer', 'position.x', { from: -80, to: 80, duration: 1500, pingPong: true })
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
            .animateProperty('spriteContainer', 'position.x', { from: 80, to: -80, duration: 1500, pingPong: true })
            .duration(1500)
            .opacity(0.75)
            .tint("#d0c2ff")
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })

        .wait(500)

        // Image 1
        .effect()
            .name(`${label} (1)`) // Unique name for stopping
            .copySprite(token)
            .spriteRotation(-token.document.rotation)
            .atLocation(token)
            .scaleToObject(1, { considerTokenScale: true })
            .anchor({ x: 0.9 + (imageNumber * 0.05) })
            .belowTokens()
            .attachTo(token, { bindAlpha: false, bindRotation: false })
            .persist()
            .animateProperty('sprite', 'rotation', { from: 180, to: -10, duration: 500 })
            .loopProperty('spriteContainer', 'position.x', { from: -5, to: 5, duration: 2500, pingPong: true })
            .zeroSpriteRotation()
            .opacity(0.75)
            .tint("#d0c2ff")
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })
            .zIndex(4)

        // Image 2
        .effect()
            .name(`${label} (2)`) // Unique name for stopping
            .copySprite(token)
            .spriteRotation(-token.document.rotation)
            .scaleToObject(1, { considerTokenScale: true })
            .playIf(imageNumber >= 2)
            .atLocation(token)
            .anchor({ x: 0.9 + (imageNumber * 0.05) })
            .belowTokens()
            .attachTo(token, { bindAlpha: false, bindRotation: false })
            .persist()
            .animateProperty('sprite', 'rotation', { from: 0, to: 190, duration: 500 })
            .loopProperty('spriteContainer', 'position.x', { from: -5, to: 5, duration: 2500, pingPong: true, delay: 250 })
            .zeroSpriteRotation()
            .opacity(0.75)
            .tint("#d0c2ff")
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })
            .zIndex(4)

        // Image 3
        .effect()
            .name(`${label} (3)`) // Unique name for stopping
            .copySprite(token)
            .spriteRotation(-token.document.rotation)
            .scaleToObject(1, { considerTokenScale: true })
            .playIf(imageNumber === 3)
            .atLocation(token)
            .anchor({ x: 0.9 + (imageNumber * 0.05) })
            .belowTokens()
            .attachTo(token, { bindAlpha: false, bindRotation: false })
            .persist()
            .animateProperty('sprite', 'rotation', { from: 0, to: 90, duration: 250 })
            .loopProperty('spriteContainer', 'position.x', { from: -5, to: 5, duration: 2500, pingPong: true })
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
            .atLocation(token);

    await sequence.play();

    // Final token opacity fade-in
    await new Sequence()
        .animation()
            .on(token)
            .fadeIn(1000)
            .opacity(1)
            .play();
}
