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

// Toggle / re-entrant persistent effect & motion handling
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
const endedMotions = Sequencer.MotionManager.endMotions(token, { name: label });
if (activeEffects.length > 0 || endedMotions > 0) {
    await Sequencer.EffectManager.endEffects({ name: label, object: token });
    return;
}

const gridSize = canvas.grid?.size ?? 100;
const rotation = -(token.document?.rotation ?? token.rotation ?? 0);

const sequence = new Sequence();

// Ground shadow sprite (shadow blur shrink anchored under token)
sequence.effect()
    .name(label)
    .copySprite(token)
    .spriteRotation(rotation)
    .atLocation(token, { ignoreMotion: true })
    .scaleToObject(0.9, { considerTokenScale: true })
    .opacity(0.5)
    .belowTokens()
    .filter("ColorMatrix", { brightness: -1 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .animateProperty("spriteContainer", "scale.x", { from: 1, to: 0.6, duration: 2000, ease: "easeOutCubic" })
    .animateProperty("spriteContainer", "scale.y", { from: 1, to: 0.6, duration: 2000, ease: "easeOutCubic" })
    .attachTo(token, { bindAlpha: false, ignoreMotion: true })
    .zIndex(1)
    .persist();

// Bless magical aura loop effect (anchored on ground)
sequence.effect()
    .name(label)
    .atLocation(token, { ignoreMotion: true })
    .attachTo(token, { bindAlpha: false, ignoreMotion: true })
    .file(closest("jb2a.bless.200px.loop.blue"))
    .fadeIn(500)
    .fadeOut(500)
    .scaleToObject(2)
    .tint(tint)
    .persist();

// Wind particle aura stream effect (anchored on ground)
sequence.effect()
    .name(label)
    .atLocation(token, { ignoreMotion: true })
    .attachTo(token, { bindAlpha: false, ignoreMotion: true })
    .file(closest("jb2a.wind_stream.200.white"))
    .fadeIn(500)
    .fadeOut(500)
    .rotate(90)
    .tint(tint)
    .scaleToObject(1)
    .belowTokens()
    .persist();

// Gravity-defying levitating token motion (exact lift + 3 independent sine oscillations)
sequence.motion(token)
    .name(label)
    .zIndex(3)
    .moveBy({ y: -0.6 }, { gridUnits: true, duration: 2000, ease: "easeOutCubic", returnDuration: 500, easeOut: "easeInOutQuad" })
    .oscillate({ period: 2200, waveform: "sine", fadeOutDuration: 500, rotation: { amplitude: 10, phase: 1.5 * Math.PI } })
    .oscillate({ period: 4000, waveform: "sine", fadeOutDuration: 500, x: { amplitude: gridSize / 9, phase: 1.5 * Math.PI } })
    .oscillate({ period: 6000, waveform: "sine", fadeOutDuration: 500, y: { amplitude: gridSize / 9, phase: 1.5 * Math.PI } })
    .persist();

// Levitating token border magic ring (automatically tracks token motion X/Y displacement)
sequence.effect()
    .name(label)
    .attachTo(token, { bindAlpha: false })
    .file(closest("jb2a.token_border.circle.static.blue.012"))
    .fadeIn(500)
    .fadeOut(500)
    .scaleToObject(2)
    .belowTokens()
    .loopProperty("sprite", "rotation", { from: -10, to: 10, duration: 1100, pingPong: true, ease: "easeInOutSine" })
    .zIndex(2)
    .persist();

await sequence.play();
