// Standalone Macro: Fly
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Fly' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "fly";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

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

// Misty step launch burst
sequence.effect()
    .file(closest("jb2a.misty_step.01.blue"))
    .atLocation(token)
    .scaleToObject(1.75)
    .belowTokens();

// Hide original token sprite while elevated flight sprite is active
sequence.animation()
    .on(token)
    .opacity(0);

// Elevated floating token sprite (wind/feather float loop animation)
sequence.effect()
    .copySprite(token)
    .spriteRotation(-(token.document?.rotation ?? token.rotation ?? 0))
    .name(label)
    .atLocation(token)
    .scaleToObject(1, { considerTokenScale: true })
    .opacity(1)
    .duration(800)
    .anchor({ x: 0.55, y: 0.9 })
    .animateProperty('spriteContainer', 'position.y', { from: 50, to: 0, duration: 500 })
    .loopProperty('spriteContainer', 'position.y', { from: 0, to: -50, duration: 2500, pingPong: true, delay: 500 })
    .attachTo(token, { bindAlpha: false })
    .zIndex(2)
    .persist();

// Ground shadow sprite (altitude elevation scale and blur shadow animation)
sequence.effect()
    .copySprite(token)
    .spriteRotation(-(token.document?.rotation ?? token.rotation ?? 0))
    .name(label)
    .atLocation(token)
    .scaleToObject(0.9, { considerTokenScale: true })
    .duration(1000)
    .opacity(0.5)
    .belowTokens()
    .filter("ColorMatrix", { brightness: -1 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .attachTo(token, { bindAlpha: false })
    .zIndex(1)
    .persist();

await sequence.play();
