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

// Toggle / re-entrant persistent effect & motion handling
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
const endedMotions = Sequencer.MotionManager.endMotions(token, { name: label });
if (activeEffects.length > 0 || endedMotions > 0) {
    await Sequencer.EffectManager.endEffects({ name: label, object: token });
    return;
}

const gridSize = canvas.grid?.size ?? 100;
const tokenHeightPx = token.h ?? ((token.document?.height ?? 1) * gridSize);
// Original used anchor({ y: 0.9 }) (+0.4*h lift) + 500ms ramp + 0..-50px linear 2500ms pingPong
const baseOffsetY = 0.4 * tokenHeightPx;
const rotation = -(token.document?.rotation ?? token.rotation ?? 0);

const sequence = new Sequence();

// Misty step launch burst (anchored on ground)
sequence.effect()
    .file(closest("jb2a.misty_step.01.blue"))
    .atLocation(token, { ignoreMotion: true })
    .scaleToObject(1.75)
    .belowTokens();

// Elevated floating token motion (exact 1:1 lift + linear bobbing cycle)
sequence.motion(token)
    .name(label)
    .zIndex(2)
    .moveBy(
        [
            { v: { x: 0, y: 0 } },
            { v: { x: 0, y: -baseOffsetY }, duration: 500, inEase: "linear" },
            { v: { x: 0, y: -(baseOffsetY + 25) }, duration: 1250, inEase: "linear" },
        ],
        { returnDuration: 500, ease: "linear" }
    )
    .oscillate({
        period: 5000,
        waveform: "triangle",
        delay: 1750,
        fadeOutDuration: 300,
        y: { amplitude: -25 },
    })
    .persist();

// Ground shadow sprite (anchored to resting document square via ignoreMotion: true)
sequence.effect()
    .copySprite(token)
    .spriteRotation(rotation)
    .name(label)
    .atLocation(token, { ignoreMotion: true })
    .scaleToObject(0.9, { considerTokenScale: true })
    .duration(1000)
    .opacity(0.5)
    .belowTokens()
    .filter("ColorMatrix", { brightness: -1 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .attachTo(token, { bindAlpha: false, ignoreMotion: true })
    .zIndex(1)
    .persist();

await sequence.play();
