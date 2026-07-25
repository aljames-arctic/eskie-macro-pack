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
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .scaleToObject(1, { considerTokenScale: true })
    .atLocation(token)
    .animateProperty("spriteContainer", "position.x", { from: 0, to: xdelta(pos1, pos2), duration: 500, gridUnits: true, ease: "easeOutQuint", delay: 2150 })
    .animateProperty("spriteContainer", "position.y", { from: 0, to: ydelta(pos1, pos2), duration: 500, gridUnits: true, ease: "easeOutQuint", delay: 2150 })
    .duration(2650)
    .fadeIn(100, { delay: 2650 })
    .fadeOut(250)
    .filter("Blur", { blurX: 15, blurY: 0 });

seq.sound()
    .file("psfx.2nd-level-spells.misty-step.v1.intro.fire")
    .volume(0.5);

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
    .animateProperty("spriteContainer", "position.y", { from: 0, to: ydelta(pos1, pos2), duration: 500, gridUnits: true, ease: "easeOutQuint", delay: 2150 })
    .animateProperty("sprite", "rotation", { from: 0, to: 90, duration: 50, ease: "easeOutQuint", delay: 2050 });

// Dragon Eyes
seq.effect()
    .file(closest("eskie.fire.03.redorange"))
    .atLocation(token, { offset: { x: -0.3, y: -0.15 }, gridUnits: true })
    .scaleToObject(0.5)
    .playbackRate(1.2)
    .mirrorX()
    .zIndex(1);

seq.effect()
    .file(closest("eskie.fire.03.redorange"))
    .atLocation(token, { offset: { x: 0.3, y: -0.2 }, gridUnits: true })
    .scaleToObject(0.5)
    .playbackRate(1.2)
    .zIndex(1);

function createDeathEffect(targetToken, delay = 2250) {
    const gs = canvas.grid.size ?? 100;
    const cx = targetToken.center.x;
    const cy = targetToken.center.y;
    const tRot = targetToken.document?.rotation ?? targetToken.rotation ?? 0;
    const tName = targetToken.document?.name ?? targetToken.name ?? "Target";

    const dSeq = new Sequence();

    dSeq.effect()
        .delay(delay - 1000)
        .file(closest("eskie.particle.03.orange"))
        .atLocation(targetToken, { randomOffset: 0.5, gridUnits: true })
        .scaleToObject(2)
        .randomRotation()
        .zIndex(3);

    dSeq.effect()
        .delay(delay - 1000)
        .copySprite(targetToken)
        .spriteRotation(-tRot)
        .atLocation(targetToken)
        .scaleToObject(1, { considerTokenScale: true })
        .loopProperty("spriteContainer", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .duration(250)
        .opacity(0.5)
        .zIndex(3);

    dSeq.effect()
        .delay(delay)
        .file(closest("eskie.slice.01.white.rainbow"))
        .atLocation(targetToken)
        .scaleToObject(4)
        .rotate(-45)
        .zIndex(5);

    dSeq.effect()
        .delay(delay)
        .file(closest("eskie.particle.03.orange"))
        .atLocation(targetToken)
        .scaleToObject(2)
        .randomRotation()
        .zIndex(4);

    dSeq.wait(500);

    dSeq.animation()
        .on(targetToken)
        .opacity(0);

    // Top half mask copy
    dSeq.effect()
        .copySprite(targetToken)
        .spriteRotation(-tRot)
        .name(`${tName}Top`)
        .scaleToObject(1, { considerTokenScale: true })
        .atLocation(targetToken)
        .shape("polygon", {
            lineSize: 1,
            lineColor: "#FF0000",
            fillColor: "#FF0000",
            points: [{ x: -1, y: -1 }, { x: 1, y: 1 }, { x: 1, y: -1 }],
            fillAlpha: 1,
            gridUnits: true,
            isMask: true,
            name: "test"
        })
        .moveTowards(
            { x: cx + gs * 0.25, y: cy - gs * 0.25 },
            { rotate: false, ease: "easeOutCubic", delay: delay }
        )
        .duration(3000)
        .persist()
        .fadeOut(1000);

    // Bottom half mask copy
    dSeq.effect()
        .copySprite(targetToken)
        .spriteRotation(-tRot)
        .name(`${tName}Bottom`)
        .scaleToObject(1, { considerTokenScale: true })
        .atLocation(targetToken)
        .shape("polygon", {
            lineSize: 1,
            lineColor: "#FF0000",
            fillColor: "#FF0000",
            points: [{ x: -1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }],
            fillAlpha: 1,
            gridUnits: true,
            isMask: true,
            name: "test"
        })
        .duration(2500)
        .persist()
        .fadeOut(1000);

    // Burn mask top
    dSeq.effect()
        .delay(delay + 250)
        .file(closest("eskie.burn.token_mask.orange.fast"))
        .name(`${tName}Top`)
        .scaleToObject(1.1)
        .atLocation({ x: cx + gs * 0.25, y: cy - gs * 0.25 })
        .shape("polygon", {
            lineSize: 1,
            lineColor: "#FF0000",
            fillColor: "#FF0000",
            points: [{ x: -1, y: -1 }, { x: 1, y: 1 }, { x: 1, y: -1 }],
            fillAlpha: 1,
            gridUnits: true,
            isMask: true,
            name: "test"
        })
        .moveTowards(
            { x: cx + gs * 0.25, y: cy - gs * 0.25 },
            { rotate: false, ease: "easeOutCubic", delay: 2000 }
        );

    // Burn mask bottom
    dSeq.effect()
        .delay(delay + 250)
        .file(closest("eskie.burn.token_mask.orange.fast"))
        .name(`${tName}Bottom`)
        .scaleToObject(1.1)
        .atLocation(targetToken)
        .shape("polygon", {
            lineSize: 1,
            lineColor: "#FF0000",
            fillColor: "#FF0000",
            points: [{ x: -1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }],
            fillAlpha: 1,
            gridUnits: true,
            isMask: true,
            name: "test"
        })
        .zIndex(1);

    // Embers top
    dSeq.effect()
        .delay(delay + 250)
        .file(closest("eskie.burn.embers.orange"))
        .name(`${tName}Top`)
        .scaleToObject(1.5)
        .atLocation({ x: cx + gs * 0.25, y: cy - gs * 0.25 })
        .mirrorX()
        .fadeIn(500)
        .spriteOffset({ x: 0.3, y: -0.3 }, { gridUnits: true });

    // Embers bottom
    dSeq.effect()
        .delay(delay + 250)
        .file(closest("eskie.burn.embers.orange"))
        .name(`${tName}Bottom`)
        .scaleToObject(1.5)
        .atLocation(targetToken)
        .mirrorX()
        .fadeIn(500)
        .spriteOffset({ x: 0, y: 0 }, { gridUnits: true })
        .spriteRotation(-45)
        .zIndex(2);

    return dSeq;
}

seq.thenDo(() => {
    for (const tgt of targets) {
        createDeathEffect(tgt).play();
    }
});

seq.effect()
    .delay(2100)
    .file(closest("eskie.particle.04.orange"))
    .atLocation(token)
    .scaleToObject(5)
    .animateProperty("spriteContainer", "position.x", { from: 0, to: -7.5, duration: 500, gridUnits: true, ease: "easeOutQuint" })
    .belowTokens();

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

seq.sound()
    .file("psfx.casting.fire-side.001")
    .volume(0.5);

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

await seq.play();
