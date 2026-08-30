// Standalone Macro: Energy Beam
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Beam' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select your source token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please target an enemy to beam!");

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const id = "beam";
const seq = new Sequence();

seq.effect()
    .name(id)
    .atLocation(token)
    .file(closest("jb2a.magic_signs.circle.02.transmutation.loop.dark_green"))
    .scaleToObject(1.25)
    .rotateIn(180, 600, { ease: "easeOutCubic" })
    .scaleIn(0, 600, { ease: "easeOutCubic" })
    .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000 })
    .belowTokens()
    .fadeOut(2000)
    .zIndex(0);

seq.effect()
    .name(id)
    .atLocation(token)
    .file(closest("jb2a.magic_signs.circle.02.transmutation.loop.dark_green"))
    .scaleToObject(1.25)
    .rotateIn(180, 600, { ease: "easeOutCubic" })
    .scaleIn(0, 600, { ease: "easeOutCubic" })
    .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000 })
    .belowTokens(true)
    .filter("ColorMatrix", { saturate: -1, brightness: 2 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .duration(1200)
    .fadeIn(200, { ease: "easeOutCirc", delay: 500 })
    .fadeOut(300, { ease: "linear" })
    .zIndex(0.1);

seq.effect()
    .name(id)
    .file(closest("jb2a.particles.outward.white.01.02"))
    .scaleIn(0, 1000, { ease: "easeOutQuint" })
    .delay(500)
    .fadeOut(1000)
    .atLocation(token)
    .duration(1000)
    .size(1.75, { gridUnits: true })
    .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, gridUnits: true, duration: 1000 })
    .zIndex(1);

seq.effect()
    .name(id)
    .file(closest("jb2a.particles.outward.white.01.02"))
    .scaleIn(0, 1000, { ease: "easeOutQuint" })
    .delay(500)
    .fadeOut(1000)
    .atLocation(token)
    .duration(1000)
    .size(1.75, { gridUnits: true })
    .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, gridUnits: true, duration: 1000 })
    .zIndex(1)
    .mirrorX();

seq.wait(1000);

seq.effect()
    .name(id)
    .file(closest("jb2a.extras.tmfx.border.circle.inpulse.01.fast"))
    .atLocation(token)
    .tint("#d9df53")
    .scaleToObject(1.5);

seq.wait(500);

seq.effect()
    .name(id)
    .file(closest("jb2a.disintegrate.green"))
    .atLocation(token)
    .stretchTo(target)
    .zIndex(1);

seq.wait(500);

await seq.play();
