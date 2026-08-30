// Standalone Macro: Drunk
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Drunk' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "drunk";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;
const tokenWidth = token.document?.width ?? token.width ?? 1;

// Toggle / re-entrant persistent effect handling
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
if ((activeEffects?.length ?? 0) > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    await new Sequence()
        .animation()
            .on(token)
            .opacity(1)
        .play();
    return;
}

const sequence = new Sequence();

// Drunk bubbles effect (bubble froth)
sequence.effect()
    .file(closest("eskie.emote.drunk_bubbles.01"))
    .zIndex(0)
    .name(label)
    .delay(0, 500)
    .atLocation(token, { offset: { x: -0.2 * tokenWidth, y: -0.3 * tokenWidth }, gridUnits: true })
    .persist()
    .scaleToObject(0.7)
    .zeroSpriteRotation()
    .loopProperty("spriteContainer", "position.x", { from: 0, to: -0.02, duration: 2000, pingPong: true, gridUnits: true, ease: "linear" })
    .loopProperty("spriteContainer", "position.y", { from: 0.15, to: -0.15, duration: 6000, pingPong: false, gridUnits: true, ease: "easeOutSine" })
    .loopProperty("sprite", "width", { from: 0, to: 0.1, duration: 6000, pingPong: false, gridUnits: true, ease: "easeOutCubic" })
    .loopProperty("sprite", "height", { from: 0, to: 0.1, duration: 6000, pingPong: false, gridUnits: true, ease: "easeOutCubic" })
    .loopProperty("alphaFilter", "alpha", { values: [-1, 1, 1, 1, 1, -1], duration: 1000, pingPong: true, ease: "easeOutCubic" })
    .attachTo(token, { bindAlpha: false, bindRotation: false })
    .private();

// Hide original token sprite while swaying stumble token sprite is active
sequence.animation()
    .on(token)
    .opacity(0);

// Floating beer/dizzy/blush icons attached to token with bobbing motion
sequence.effect()
    .file(closest("eskie.emote.blush.01"))
    .zIndex(0)
    .name(label)
    .opacity(0.85)
    .scaleToObject(0.5)
    .loopProperty("spriteContainer", "position.x", { from: -20, to: 20, duration: 2500, pingPong: true, ease: "easeInOutSine" })
    .loopProperty("spriteContainer", "position.y", { values: [0, 20, 0, 20], duration: 2500, pingPong: true })
    .loopProperty("sprite", "rotation", { from: -10, to: 10, duration: 2500, pingPong: true, ease: "easeInOutSine" })
    .persist()
    .atLocation(token)
    .spriteOffset({ x: -0.15 * tokenWidth, y: 0.15 * tokenWidth }, { gridUnits: true, local: true })
    .attachTo(token, { bindAlpha: false, bindRotation: true })
    .private();

// Wobbling drunken stumble token tilt (sway copySprite attached to token)
sequence.effect()
    .copySprite(token)
    .spriteRotation(-(token.document?.rotation ?? token.rotation ?? 0))
    .scaleToObject(1, { considerTokenScale: true })
    .name(label)
    .atLocation(token)
    .loopProperty("spriteContainer", "position.x", { from: -20, to: 20, duration: 2500, pingPong: true, ease: "easeInOutSine" })
    .loopProperty("spriteContainer", "position.y", { values: [0, 20, 0, 20], duration: 2500, pingPong: true })
    .loopProperty("sprite", "rotation", { from: -10, to: 10, duration: 2500, pingPong: true, ease: "easeInOutSine" })
    .persist()
    .attachTo(token, { bindAlpha: false });

await sequence.play();
