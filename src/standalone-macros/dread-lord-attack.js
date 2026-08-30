// Standalone Macro: Dread Lord Attack
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Dread Lord Attack' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select your attacker token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please target an enemy to strike!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const targetRotation = target.document?.rotation ?? target.rotation ?? 0;
const sequence = new Sequence();

sequence.effect()
    .file(closest("jb2a.melee_generic.piercing.two_handed"))
    .atLocation(target)
    .spriteOffset({ x: -5.6, y: 0.1 }, { gridUnits: true })
    .size(8, { gridUnits: true })
    .rotateTowards(token)
    .playbackRate(0.8)
    .randomizeMirrorY()
    .filter("ColorMatrix", { saturate: -1, brightness: 0 })
    .rotate(180)
    .zIndex(1);

sequence.effect()
    .copySprite(target)
    .spriteRotation(-targetRotation)
    .attachTo(target)
    .scaleToObject(1, { considerTokenScale: true })
    .fadeIn(500)
    .fadeOut(500)
    .loopProperty("spriteContainer", "position.x", { from: -0.05, to: 0.05, duration: 55, pingPong: true, gridUnits: true })
    .filter("ColorMatrix", { saturate: -1, brightness: 0.5 })
    .opacity(0.65)
    .zIndex(0.1);

await sequence.play();
