// Standalone Macro: Stunning Fist
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Stunning Fist' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct database key if running as a standalone copy-paste macro.
 */
const closest = (path) => {
    if (typeof eskie !== "undefined" && eskie.util?.file?.closest) {
        return eskie.util.file.closest(path);
    }
    const apiClosest = game.modules.get("eskie-macros")?.api?.util?.closest;
    if (typeof apiClosest === "function") {
        return apiClosest(path);
    }
    return path;
};

const id = "stunningFist";
const targetId = target.id ?? target.document?.id ?? "";
const label = `${id}-${targetId}`;

// 3. Toggle / Re-entrant Persistent Effect Handling
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: target }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: label }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: target });
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    return;
}

const tokenCenter = token.center ?? { x: token.x ?? 0, y: token.y ?? 0 };
const targetCenter = target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };

const middleposition = {
    x: (targetCenter.x - tokenCenter.x) * 0.25,
    y: (targetCenter.y - tokenCenter.y) * 0.25,
};

const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;
const targetRotation = target.document?.rotation ?? target.rotation ?? 0;
const scaleX = token.document?.texture?.scaleX ?? 1;
const scaleY = token.document?.texture?.scaleY ?? 1;
const tokenWidth = token.document?.width ?? token.width ?? 1;
const targetWidth = target.document?.width ?? target.width ?? 1;

let seq = new Sequence();

seq.animation()
    .delay(250)
    .on(token)
    .opacity(0);

seq.animation()
    .delay(250)
    .on(target)
    .opacity(0);

seq.effect()
    .copySprite(target)
    .attachTo(target, { bindAlpha: false })
    .scaleToObject(1, { considerTokenScale: true })
    .spriteRotation(-targetRotation)
    .animateProperty("spriteContainer", "position.x", { from: 0, to: scaleX * middleposition.x + 0.5, duration: 100, ease: "easeOutExpo", delay: 1350 })
    .animateProperty("spriteContainer", "position.y", { from: 0, to: scaleY * middleposition.y + 0.5, duration: 100, ease: "easeOutExpo", delay: 1350 })
    .animateProperty("sprite", "rotation", { from: 0, to: 45, duration: 150, ease: "easeOutCubic", delay: 1300 })
    .animateProperty("sprite", "rotation", { from: 0, to: -45, duration: 350, ease: "easeOutBack", delay: 1450 })
    .animateProperty("spriteContainer", "position.x", { from: 0, to: -scaleX * middleposition.x - 0.5, duration: 250, ease: "easeInOutQuad", delay: 1450 })
    .animateProperty("spriteContainer", "position.y", { from: 0, to: -scaleY * middleposition.y - 0.5, duration: 250, ease: "easeInOutQuad", delay: 1450 })
    .fadeIn(200, { delay: 1250 })
    .fadeOut(500)
    .loopProperty("spriteContainer", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
    .opacity(0.25)
    .duration(2500);

seq.effect()
    .copySprite(target)
    .attachTo(target, { bindAlpha: false })
    .scaleToObject(1, { considerTokenScale: true })
    .spriteRotation(-targetRotation)
    .animateProperty("spriteContainer", "position.x", { from: 0, to: scaleX * middleposition.x + 0.5, duration: 100, ease: "easeOutExpo", delay: 1350 })
    .animateProperty("spriteContainer", "position.y", { from: 0, to: scaleY * middleposition.y + 0.5, duration: 100, ease: "easeOutExpo", delay: 1350 })
    .animateProperty("sprite", "rotation", { from: 0, to: 45, duration: 150, ease: "easeOutCubic", delay: 1300 })
    .animateProperty("sprite", "rotation", { from: 0, to: -45, duration: 350, ease: "easeOutBack", delay: 1450 })
    .animateProperty("spriteContainer", "position.x", { from: 0, to: -scaleX * middleposition.x - 0.5, duration: 250, ease: "easeInOutQuad", delay: 1450 })
    .animateProperty("spriteContainer", "position.y", { from: 0, to: -scaleY * middleposition.y - 0.5, duration: 250, ease: "easeInOutQuad", delay: 1450 })
    .duration(2000);

seq.effect()
    .copySprite(token)
    .attachTo(token, { bindAlpha: false })
    .scaleToObject(1, { considerTokenScale: true })
    .spriteRotation(-tokenRotation)
    .animateProperty("spriteContainer", "position.x", { from: 0, to: scaleX * middleposition.x, duration: 100, ease: "easeOutExpo", delay: 1250 })
    .animateProperty("spriteContainer", "position.y", { from: 0, to: scaleY * middleposition.y, duration: 100, ease: "easeOutExpo", delay: 1250 })
    .animateProperty("spriteContainer", "position.x", { from: 0, to: -scaleX * middleposition.x, duration: 350, ease: "easeInOutQuad", delay: 1350 })
    .animateProperty("spriteContainer", "position.y", { from: 0, to: -scaleY * middleposition.y, duration: 350, ease: "easeInOutQuad", delay: 1350 })
    .duration(2000);

seq.effect()
    .file(closest("jb2a.sacred_flame.target.blue"))
    .atLocation(token, { offset: { y: 0 }, gridUnits: true })
    .scaleToObject(0.5)
    .playbackRate(2)
    .fadeOut(100)
    .zIndex(2);

seq.effect()
    .file(closest("eskie.aura.token.generic.02.blue"))
    .attachTo(token, { bindAlpha: false })
    .scaleToObject(2.1, { considerTokenScale: true })
    .fadeIn(1000)
    .opacity(0.75)
    .startTime(1500);

seq.effect()
    .file(closest("jb2a.particles.inward.blue.01.01"))
    .attachTo(token)
    .opacity(0.35)
    .scaleToObject(1.5)
    .filter("ColorMatrix", { saturate: 1 })
    .fadeIn(500)
    .duration(1500)
    .mask(token)
    .fadeOut(250);

seq.effect()
    .file(closest("eskie.nature.flower.particle.01.blue"))
    .atLocation(token)
    .scaleToObject(0.75)
    .duration(1500)
    .fadeOut(250)
    .opacity(1)
    .zIndex(1)
    .waitUntilFinished(-1250);

seq.wait(750);

seq.effect()
    .delay(100)
    .file(closest("eskie.slice.01.white.colorless"))
    .atLocation(target)
    .scaleToObject(5)
    .rotateTowards(token)
    .spriteOffset({ x: -3 }, { gridUnits: true })
    .playbackRate(1.5)
    .opacity(0.5)
    .belowTokens();

seq.effect()
    .file(closest("eskie.velocity.01.white"))
    .atLocation(target)
    .scaleToObject(3)
    .rotateTowards(token)
    .playbackRate(1.25)
    .spriteOffset({ x: -2 }, { gridUnits: true })
    .opacity(0.5)
    .zIndex(5);

seq.effect()
    .file(closest("jb2a.melee_generic.creature_attack.fist.002.blue"))
    .atLocation(token, { offset: { x: -0.75, y: -0.2 }, gridUnits: true, local: true })
    .rotateTowards(target, { randomOffset: 0.15 })
    .scaleToObject(3)
    .spriteOffset({ x: -0.3 - (tokenWidth - 1), y: -0.2 * tokenWidth }, { gridUnits: true })
    .zIndex(2);

seq.effect()
    .file(closest("jb2a.swirling_leaves.outburst.01.pink"))
    .scaleIn(0, 500, { ease: "easeOutCubic" })
    .filter("ColorMatrix", { saturate: 1, hue: -105 })
    .scaleToObject(0.75)
    .fadeOut(2000)
    .atLocation(token)
    .zIndex(1);

seq.canvasPan()
    .delay(250)
    .shake({ duration: 250, strength: 2, rotation: false });

seq.animation()
    .on(token)
    .opacity(1)
    .delay(600);

seq.animation()
    .on(target)
    .opacity(1)
    .delay(600);

seq.effect()
    .file(closest("jb2a.impact.010.blue"))
    .scaleIn(0, 100, { ease: "easeOutCubic" })
    .scaleToObject(2.5)
    .atLocation(target)
    .randomRotation();

seq.effect()
    .file(closest("jb2a.impact.ground_crack.blue.02"))
    .scaleIn(0, 100, { ease: "easeOutCubic" })
    .scaleToObject(2.5)
    .atLocation(target)
    .randomRotation()
    .belowTokens();

// Persistent stars daze ring over target head
seq.effect()
    .name(label)
    .delay(1000)
    .file(closest("jb2a.dizzy_stars.200px.yellow"))
    .scaleIn(0, 100, { ease: "easeOutCubic" })
    .scaleToObject(1)
    .opacity(1)
    .attachTo(target, { offset: { y: -0.5 * targetWidth }, gridUnits: true })
    .persist();

await seq.play();
