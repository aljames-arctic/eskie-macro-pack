// Standalone Macro: Aerodyne Vehicle / Hover Jet Thrusters
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Aerodyne Vehicle' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a vehicle or hover token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const effectName = "Fly";

// Toggle hover flight state
const activeEffects = Sequencer.EffectManager.getEffects({ name: effectName, object: token }) ?? [];
const endedMotions = Sequencer.MotionManager.endMotions(token, { name: effectName });
if (activeEffects.length > 0 || endedMotions > 0) {
    if (game.modules.get('tagger')?.active) {
        await Tagger.removeTags(token, "Flying");
    }
    await Sequencer.EffectManager.endEffects({ name: effectName, object: token });
    await Sequencer.EffectManager.endEffects({ name: effectName });
    await new Sequence()
        .effect()
        .file(closest("eskie.smoke.07.white"))
        .atLocation(token, { ignoreMotion: true })
        .randomRotation()
        .scale(1.2)
        .belowTokens()
        .opacity(0.25)
        .loopProperty("sprite", "scale.x", { from: 1, to: 1.5, duration: 900 })
        .loopProperty("sprite", "scale.y", { from: 1, to: 1.5, duration: 900 })
        .play();
    return ui.notifications.info(`Landed ${token.name}.`);
}

const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;
const gridSize = canvas.grid?.size ?? 100;
const w = token.w ?? ((token.document?.width ?? 1) * gridSize);
const h = token.h ?? ((token.document?.height ?? 1) * gridSize);
const baseHoverY = -0.2 * gridSize;

const seq = new Sequence()
    .effect()
    .file(closest("eskie.smoke.07.white"))
    .atLocation(token, { ignoreMotion: true })
    .randomRotation()
    .scale(1.2)
    .opacity(0.25)
    .loopProperty("sprite", "scale.x", { from: 1, to: 1.5, duration: 900 })
    .loopProperty("sprite", "scale.y", { from: 1, to: 1.5, duration: 900 })
    .belowTokens()

    .motion(token)
    .name(effectName)
    .zIndex(2)
    .moveBy(
        [
            { v: { x: 0, y: 0 } },
            { v: { x: 0, y: baseHoverY }, duration: 500, inEase: "linear" },
            { v: { x: 0, y: baseHoverY - 10 }, duration: 1250, inEase: "linear" },
        ],
        { returnDuration: 500, ease: "linear" }
    )
    .oscillate({
        period: 5000,
        waveform: "triangle",
        delay: 1750,
        fadeOutDuration: 300,
        y: { amplitude: -10 },
    })
    .persist()

    .effect()
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .name(effectName)
    .atLocation(token, { ignoreMotion: true })
    .size({ width: w, height: h })
    .duration(1000)
    .opacity(0.5)
    .filter("ColorMatrix", { brightness: -1 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .attachTo(token, { offset: { x: 0, y: 0.25 }, gridUnits: true, bindRotation: true, bindAlpha: false, ignoreMotion: true })
    .animateProperty("sprite", "rotation", { from: 0, to: 0, duration: 0 })
    .zIndex(0)
    .persist();

const thrusterOffsets = [
    { x: 1.2, y: 1.2 },
    { x: -1.2, y: 1.2 },
    { x: 1.2, y: -1.2 },
    { x: -1.2, y: -1.2 }
];

for (const offset of thrusterOffsets) {
    seq.effect()
        .file(closest("jb2a.dancing_lights.01.blueteal"))
        .scaleToObject(0.25)
        .name(effectName)
        .atLocation(token, { offset, gridUnits: true, local: true })
        .attachTo(token, { bindAlpha: false })
        .filter("ColorMatrix", { saturate: 1 })
        .filter("Blur", { blurX: 10, blurY: 10 })
        .persist()
        .playbackRate(5)
        .spriteRotation(tokenRotation)
        .zIndex(0);
}

await seq.play();
