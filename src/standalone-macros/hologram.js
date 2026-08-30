// Standalone Macro: Hologram
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Hologram' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const EFFECT_NAME = "Holo";

// Toggle off if hologram effect sequence is currently active on token
const activeEffects = Sequencer.EffectManager.getEffects({ name: EFFECT_NAME, object: token });
if (activeEffects.length > 0) {
    await Sequencer.EffectManager.endEffects({ name: EFFECT_NAME, object: token });
    return;
}

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const tint = "#00ffff";
const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;

const seq = new Sequence()
    // Cyan token ghost projection with subtle flickers / brightness increase & vertical wave float
    .effect()
    .name(EFFECT_NAME)
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .atLocation(token)
    .attachTo(token, { bindRotation: false, bindVisibility: false })
    .opacity(0.5)
    .persist()
    .aboveLighting()
    .loopProperty("spriteContainer", "position.y", { from: 0, to: -10, duration: 2500, pingPong: true })
    .animateProperty("sprite", "rotation", { from: 0, to: tokenRotation, duration: 0 })
    .filter("ColorMatrix", { brightness: 1.5 })
    .scaleIn({ x: 0.75, y: 0 }, 100)
    .scaleOut({ x: 0.75, y: 0 }, 100)
    .tint(tint)

    // Futuristic cyber scanline and scan grid projector overlay masked over the hologram
    .effect()
    .name(EFFECT_NAME)
    .file("https://i.imgur.com/DBMEF5B.png")
    .atLocation(token)
    .attachTo(token, { bindRotation: false, bindVisibility: false })
    .scaleToObject()
    .persist()
    .opacity(0.5)
    .loopProperty("spriteContainer", "position.y", { from: 0, to: 20, duration: 200, pingPong: false, ease: "linear" })
    .loopProperty("spriteContainer", "position.x", { from: -3, to: 3, duration: 1000, pingPong: false, ease: "easeInOutElastic" })
    .loopProperty("spriteContainer", "position.y", { from: 0, to: -10, duration: 2500, pingPong: true })
    .zeroSpriteRotation()
    .aboveLighting()
    .mask()
    .scaleIn({ x: 0.75, y: 0 }, 100)
    .scaleOut({ x: 0.75, y: 0 }, 100)
    .tint(tint);

await seq.play();
