// Standalone Macro: Showcase - Sun Halo Dragon (Hinokami Kagura)
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Sun Halo Dragon' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select your Flame Hashira / Demon Slayer token!");

const targets = Array.from(game.user.targets);

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

const crosshairConfig = {
    size: 1,
    icon: "icons/magic/fire/beam-jet-stream-red.webp",
    label: "Sun Halo Dragon End Position",
    drawIcon: true,
    drawOutline: true,
    interval: 0,
    rememberControlled: true
};

const targetCoord = await Sequencer.Crosshair.show(crosshairConfig);
if (!targetCoord || targetCoord.cancelled) return;

const gridSize = canvas.grid.size ?? 100;
const pos1 = { x: token.x, y: token.y };
const pos2 = { x: targetCoord.x - gridSize / 2, y: targetCoord.y - gridSize / 2 };
const mirrorY = pos1.x > pos2.x;

const xdelta = (p1, p2) => (p2.x - p1.x) / gridSize;
const ydelta = (p1, p2) => (p2.y - p1.y) / gridSize;

const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;
const seq = new Sequence();

seq.animation()
    .on(token)
    .opacity(0);

seq.effect()
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .scaleToObject(1, { considerTokenScale: true })
    .atLocation(token)
    .animateProperty("spriteContainer", "position.x", { from: 0, to: xdelta(pos1, pos2), duration: 500, gridUnits: true, ease: "easeOutQuint", delay: 2150 })
    .animateProperty("spriteContainer", "position.y", { from: 0, to: ydelta(pos1, pos2), duration: 500, gridUnits: true, ease: "easeOutQuint", delay: 2150 })
    .duration(3500);

seq.effect()
    .file(closest("eskie.screen_overlay.speed_lines.horizontal.02.redyellow"))
    .screenSpace()
    .screenSpaceScale({ fitX: true, fitY: true })
    .mirrorX()
    .fadeOut(500)
    .duration(2500)
    .delay(200);

seq.effect()
    .file(closest("jb2a.wind_stream.white"))
    .name("Rage")
    .attachTo(token, { bindAlpha: false })
    .scaleToObject()
    .rotate(90)
    .opacity(1)
    .filter("ColorMatrix", { saturate: 1 })
    .tint("#FF5733")
    .private()
    .duration(2000)
    .delay(200)
    .fadeOut(250)
    .zIndex(5);

seq.effect()
    .file(closest("eskie.aura.token.generic.01.redorange"))
    .atLocation(token)
    .scaleToObject(2.1)
    .zIndex(0.1)
    .belowTokens()
    .animateProperty("spriteContainer", "position.x", { from: 0, to: xdelta(pos1, pos2), duration: 500, gridUnits: true, ease: "easeOutQuint", delay: 2150 })
    .animateProperty("spriteContainer", "position.y", { from: 0, to: ydelta(pos1, pos2), duration: 500, gridUnits: true, ease: "easeOutQuint", delay: 2150 });

seq.effect()
    .file(closest("eskie.velocity.01.white"))
    .atLocation(token)
    .mirrorX()
    .scaleToObject(7.5)
    .opacity(0.5)
    .zIndex(10)
    .playbackRate(1.5);

seq.canvasPan()
    .delay(2000)
    .shake({ duration: 250, strength: 1.5, rotation: false, fadeOut: 250 });

seq.wait(1000);

seq.effect()
    .file(closest("eskie.fire.fire_dragon.01"))
    .atLocation(pos1)
    .stretchTo(pos2)
    .scale(0.75)
    .belowTokens()
    .playbackRate(1.25)
    .mirrorX(true)
    .mirrorY(mirrorY);

seq.effect()
    .delay(150)
    .file(closest("eskie.slice.01_ranged.color.rainbow"))
    .atLocation(pos1)
    .stretchTo(pos2)
    .scale(1.5)
    .playbackRate(0.75)
    .zIndex(5)
    .waitUntilFinished();

seq.canvasPan()
    .shake({ duration: 500, strength: 1.5, rotation: false, fadeOut: 250 });

seq.animation()
    .on(token)
    .teleportTo(pos2)
    .opacity(1);

// Demon slice decapitation death effect on targeted enemies
for (const target of targets) {
    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;
    seq.effect()
        .copySprite(target)
        .spriteRotation(-targetRotation)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .duration(800)
        .fadeOut(300);
}

await seq.play();
