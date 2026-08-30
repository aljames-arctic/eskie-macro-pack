// Standalone Macro: Benign Transportation
// Original Author: .Doomrule
// Modular Conversion: Bakana

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Benign Transportation' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please target a token to swap places with!");
if (target === token) return ui.notifications.warn("You must select a different token to swap with!");

const label = "Benign Transportation";
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label, object: target });
    new Sequence()
        .animation().on(token).opacity(1)
        .animation().on(target).opacity(1)
        .play();
    return;
}

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const soundFile = "psfx.2nd-level-spells.misty-step.v1.outro.fire";
const soundVolume = 0.5;
const animOutFile = "jb2a.misty_step.01.blue";
const animOutUntil = -2000;
const animInFile = "jb2a.misty_step.02.blue";
const animInUntil = -3500;

const A = target;
const B = token;

const centerA = { x: A.center?.x ?? A.x ?? 0, y: A.center?.y ?? A.y ?? 0 };
const centerB = { x: B.center?.x ?? B.x ?? 0, y: B.center?.y ?? B.y ?? 0 };

const seq = new Sequence();

seq.sound()
    .file(closest(soundFile))
    .volume(soundVolume);

seq.effect()
    .name(label)
    .file(closest(animOutFile))
    .atLocation(A)
    .scaleToObject(2)
.effect()
    .name(label)
    .file(closest(animOutFile))
    .atLocation(B)
    .scaleToObject(2)
    .waitUntilFinished(animOutUntil);

seq.animation()
    .on(A)
    .opacity(0)
.animation()
    .on(B)
    .opacity(0);

seq.animation()
    .on(A)
    .teleportTo(centerB)
    .snapToGrid()
.animation()
    .on(B)
    .teleportTo(centerA)
    .snapToGrid();

seq.effect()
    .name(label)
    .file(closest(animInFile))
    .atLocation(A)
    .scaleToObject(2)
.effect()
    .name(label)
    .file(closest(animInFile))
    .atLocation(B)
    .scaleToObject(2)
    .waitUntilFinished(animInUntil);

seq.animation()
    .on(A)
    .opacity(1)
.animation()
    .on(B)
    .opacity(1);

await seq.play();
