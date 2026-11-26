// Standalone Macro: Totemic Attunement - Wolf
// Last Updated: 1/27/2025
// Author: .eskie
// Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Wolf Totemic Attunement' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select your Barbarian token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "Wolf Totemic Attunement";
const color = "red";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
const endedMotions = Sequencer.MotionManager.endMotions(token, { name: label });
if (activeEffects.length > 0 || endedMotions > 0) {
    await Sequencer.EffectManager.endEffects({ name: label, object: token });
    await Sequencer.EffectManager.endEffects({ name: label });
    return ui.notifications.info("Ended Wolf Totemic Attunement.");
}

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please target an enemy for wolf pack bite strike!");

const tokenWidth = token.document?.width ?? 1;
const targetRotation = target.document?.rotation ?? target.rotation ?? 0;

const mid = {
    x: (target.center.x - token.center.x) * 0.25,
    y: (target.center.y - token.center.y) * 0.25,
};

const back = {
    x: (target.center.x - token.center.x) * -0.25,
    y: (target.center.y - token.center.y) * -0.25,
};

const seq = new Sequence();

seq.effect()
    .delay(100)
    .file(closest(`jb2a.bite.400px.${color}`))
    .atLocation(target)
    .scaleToObject(3)
    .belowTokens()
    .tint("#ff0000")
    .opacity(0.8);

seq.effect()
    .delay(150)
    .copySprite(target)
    .spriteRotation(-targetRotation)
    .attachTo(target)
    .scaleToObject(1, { considerTokenScale: true })
    .duration(1000)
    .fadeOut(500)
    .loopProperty("spriteContainer", "position.x", { from: -0.05, to: 0.05, duration: 25, gridUnits: true, pingPong: true })
    .tint("#ff0000")
    .opacity(0.35);

seq.effect()
    .delay(200)
    .file(closest(`jb2a.impact.008.${color}`))
    .atLocation(target, { offset: { x: -mid.x, y: -mid.y } })
    .size(tokenWidth + 1, { gridUnits: true })
    .zIndex(1);

seq.effect()
    .name(label)
    .file(closest(`eskie.buff.loop.simple.${color}`))
    .attachTo(token, { offset: { y: -0.05 }, gridUnits: true, bindAlpha: false })
    .scaleToObject(1)
    .opacity(0.5)
    .filter("ColorMatrix", { saturate: 1 })
    .playbackRate(1)
    .fadeOut(500)
    .duration(1600)
    .zIndex(0.2);

seq.effect()
    .file(closest(`eskie.aura.token.generic.02.${color}`))
    .name(label)
    .attachTo(token, { bindAlpha: false })
    .scaleToObject(2.1)
    .startTime(500)
    .persist()
    .zIndex(0.3);

seq.motion(token)
    .name(label)
    .zIndex(0.1)
    .moveBy(
        [
            { v: { x: 0, y: 0 } },
            { v: mid, duration: 250, inEase: "easeOutExpo", hold: 550 },
            { v: back, duration: 250, inEase: "easeOutExpo" },
            { v: { x: 0, y: 0 }, duration: 250, inEase: "easeOutSine" },
        ],
        { delay: 200, return: false }
    );

seq.wait(900);

seq.canvasPan()
    .shake({ duration: 1100, strength: 1, rotation: false, fadeOut: 500 });

seq.effect()
    .file(closest("eskie.sound.roar.01"))
    .atLocation(target, { offset: { x: -mid.x, y: -mid.y } })
    .size(tokenWidth + 5, { gridUnits: true });

seq.effect()
    .copySprite(target)
    .spriteRotation(-targetRotation)
    .attachTo(target, { bindAlpha: false, bindRotation: false, local: false, ignoreMotion: true })
    .scaleToObject(0.9, { considerTokenScale: true })
    .zIndex(0.1)
    .belowTokens()
    .filter("ColorMatrix", { brightness: 0 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .opacity(0.65)
    .duration(1200);

seq.effect()
    .delay(100)
    .file(closest(`eskie.damage.piercing.01.${color}`))
    .attachTo(target, { bindAlpha: false, bindRotation: false, ignoreMotion: true })
    .scaleToObject(1.5)
    .opacity(1)
    .zIndex(1)
    .belowTokens()
    .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 500, ease: "easeOutCubic", gridUnits: true })
    .filter("ColorMatrix", { saturate: 1 });

seq.motion(target)
    .moveBy(
        [
            { v: { x: 0, y: 0 } },
            { v: { x: 0, y: -0.5 }, duration: 500, inEase: "easeOutCubic" },
            { v: { x: 0, y: 0 }, duration: 250, inEase: "easeOutCubic" },
        ],
        { gridUnits: true, delay: 100, return: false }
    )
    .rotateBy(90, {
        delay: 100,
        duration: 250,
        ease: "easeOutCubic",
        return: false,
    })
    .persistUntilUpdate();

seq.wait(700);

seq.effect()
    .file(closest("eskie.smoke.03.tan"))
    .attachTo(target, { bindAlpha: false, bindRotation: false, ignoreMotion: true })
    .scaleToObject(2)
    .opacity(0.8)
    .belowTokens();

seq.animation()
    .delay(300)
    .on(target)
    .rotate(targetRotation + 90);

await seq.play();
