// Standalone Macro: Levitation
// Original Author: Mia Del'Mori
// Updated By: Eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Levitation' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "levitation";
const tint = "#00b3ff";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

// Toggle / re-entrant persistent effect handling
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
if ((activeEffects?.length ?? 0) > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    await new Sequence()
        .animation()
            .delay(75)
            .fadeIn(500)
            .fadeOut(500)
            .on(token)
            .opacity(1)
        .play();
    return;
}

const gridSize = canvas.grid?.size ?? 100;
const rotation = -(token.document?.rotation ?? token.rotation ?? 0);

const sequence = new Sequence();

// Hide original token sprite while elevated levitation sprite is active
sequence.animation()
    .delay(75)
    .on(token)
    .opacity(0);

// Ground shadow sprite (shadow blur shrink under token)
sequence.effect()
    .name(label)
    .copySprite(token)
    .spriteRotation(rotation)
    .atLocation(token)
    .scaleToObject(0.9, { considerTokenScale: true })
    .opacity(0.5)
    .belowTokens()
    .filter("ColorMatrix", { brightness: -1 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .animateProperty("spriteContainer", "scale.x", { from: 1, to: 0.6, duration: 2000, ease: "easeOutCubic" })
    .animateProperty("spriteContainer", "scale.y", { from: 1, to: 0.6, duration: 2000, ease: "easeOutCubic" })
    .attachTo(token, { bindAlpha: false })
    .zIndex(1)
    .persist();

// Bless magical aura loop effect
sequence.effect()
    .name(label)
    .atLocation(token)
    .attachTo(token, { bindAlpha: false })
    .file(closest("jb2a.bless.200px.loop.blue"))
    .fadeIn(500)
    .fadeOut(500)
    .scaleToObject(2)
    .tint(tint)
    .persist();

// Wind particle aura stream effect
sequence.effect()
    .name(label)
    .atLocation(token)
    .attachTo(token, { bindAlpha: false })
    .file(closest("jb2a.wind_stream.200.white"))
    .fadeIn(500)
    .fadeOut(500)
    .rotate(90)
    .tint(tint)
    .scaleToObject(1)
    .belowTokens()
    .persist();

// Gravity-defying levitating token sprite (float lift Y-offset sprite loop)
sequence.effect()
    .name(label)
    .copySprite(token)
    .spriteRotation(rotation)
    .attachTo(token, { bindAlpha: false })
    .scaleToObject(1, { considerTokenScale: true })
    .fadeIn(500)
    .fadeOut(500)
    .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.6, duration: 2000, gridUnits: true, ease: "easeOutCubic" })
    .loopProperty("sprite", "rotation", { from: -10, to: 10, duration: 1100, pingPong: true, ease: "easeInOutSine" })
    .loopProperty("spriteContainer", "position.x", { from: -gridSize / 9, to: gridSize / 9, duration: 2000, pingPong: true, ease: "easeInOutSine" })
    .loopProperty("spriteContainer", "position.y", { from: -gridSize / 9, to: gridSize / 9, duration: 3000, pingPong: true, ease: "easeInOutSine" })
    .zIndex(3)
    .persist();

// Levitating token border magic ring
sequence.effect()
    .name(label)
    .attachTo(token, { bindAlpha: false })
    .file(closest("jb2a.token_border.circle.static.blue.012"))
    .fadeIn(500)
    .fadeOut(500)
    .scaleToObject(2)
    .belowTokens()
    .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.6, duration: 2000, gridUnits: true, ease: "easeOutCubic" })
    .loopProperty("sprite", "rotation", { from: -10, to: 10, duration: 1100, pingPong: true, ease: "easeInOutSine" })
    .loopProperty("spriteContainer", "position.x", { from: -gridSize / 9, to: gridSize / 9, duration: 2000, pingPong: true, ease: "easeInOutSine" })
    .loopProperty("spriteContainer", "position.y", { from: -gridSize / 9, to: gridSize / 9, duration: 3000, pingPong: true, ease: "easeInOutSine" })
    .zIndex(2)
    .persist();

await sequence.play();
