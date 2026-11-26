// Standalone Macro: Totemic Attunement - Tiger
// Last Updated: 1/27/2025
// Author: .eskie
// Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Tiger Totemic Attunement' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select your Barbarian token!");

const id = "Tiger Totemic Attunement";
const color = "red";
const count = 2; // dual claw pounce strikes
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
const endedMotions = Sequencer.MotionManager.endMotions(token, { name: label });
if (activeEffects.length > 0 || endedMotions > 0) {
    await Sequencer.EffectManager.endEffects({ name: label, object: token });
    await Sequencer.EffectManager.endEffects({ name: label });
    return ui.notifications.info("Ended Tiger Totemic Attunement.");
}

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please target an enemy to tiger pounce!");

const tokenWidth = token.document.width;
const startCenter = token.center;
const dx = target.center.x - startCenter.x;
const dy = target.center.y - startCenter.y;
const dist = Math.hypot(dx, dy);
const safeDist = dist > 0 ? dist : 1;

const sizeAdjust = (tokenWidth - 1) / 2;
const totalSquares = 1 + sizeAdjust;
const totalPixels = totalSquares * canvas.grid.size;

const ux = dx / safeDist;
const uy = dy / safeDist;

const rawCenter = {
    x: target.center.x - ux * totalPixels,
    y: target.center.y - uy * totalPixels
};

const tokenSpan = (tokenWidth * canvas.grid.size) / 2;
const rawPosition = { x: rawCenter.x - tokenSpan, y: rawCenter.y - tokenSpan };
const gridSnap = canvas.grid.getSnappedPosition ? canvas.grid.getSnappedPosition(rawPosition.x, rawPosition.y, 1) : rawPosition;
const location = { x: gridSnap.x + tokenSpan, y: gridSnap.y + tokenSpan };
const dashDelta = { x: location.x - startCenter.x, y: location.y - startCenter.y };
const dashDist = Math.hypot(dashDelta.x, dashDelta.y);

let seq = new Sequence();

seq.effect()
    .file(closest(`eskie.aura.token.generic.02.${color}`))
    .name(label)
    .attachTo(token, { bindAlpha: false })
    .scaleToObject(2.1)
    .startTime(550)
    .persist()
    .zIndex(1);

seq.effect()
    .delay(250)
    .file(closest("jb2a.teleport.01.white"))
    .atLocation(startCenter)
    .rotateTowards(target)
    .scaleToObject(4)
    .spriteScale({ x: 1.25, y: 1 }, { gridUnits: true })
    .spriteOffset({ x: -3 * tokenWidth }, { gridUnits: true })
    .duration(900)
    .tint("#ff0000")
    .moveTowards(location, { relativeToCenter: true, ease: "easeOutQuint", rotate: false, snapToGrid: true });

seq.effect()
    .delay(100)
    .file(closest("eskie.velocity.01.white"))
    .atLocation(startCenter)
    .rotateTowards(target)
    .scaleToObject(4)
    .opacity(0.5)
    .spriteOffset({ x: -2 * tokenWidth }, { gridUnits: true })
    .zIndex(3);

seq.canvasPan()
    .shake({ duration: 500, strength: 1, rotation: false, fadeOut: 500, delay: 200 });

if (dashDist >= 1) {
    seq.motion(token)
        .name(label)
        .moveBy(dashDelta, {
            delay: 250,
            duration: 650,
            ease: "easeOutQuint",
            return: false,
        })
        .persistUntilUpdate();
}

seq.effect()
    .delay(400)
    .file(closest(`jb2a.melee_generic.creature_attack.claw.001.${color}`))
    .atLocation(location)
    .rotateTowards(target)
    .filter("ColorMatrix", { saturate: 0.5 })
    .spriteOffset({ x: -0.9, y: 0 }, { gridUnits: true })
    .rotate(-60)
    .zIndex(1)
    .rotateIn(-270, 400, { ease: "easeOutCubic" })
    .size(2 + tokenWidth, { gridUnits: true })
    .playIf(count >= 1);

seq.effect()
    .delay(450)
    .file(closest(`jb2a.melee_generic.creature_attack.claw.001.${color}`))
    .atLocation(location)
    .rotateTowards(target)
    .filter("ColorMatrix", { saturate: 0.5 })
    .spriteOffset({ x: -0.9, y: 0 }, { gridUnits: true })
    .rotate(60)
    .zIndex(1)
    .rotateIn(270, 400, { ease: "easeOutCubic" })
    .size(2 + tokenWidth, { gridUnits: true })
    .mirrorY()
    .playIf(count >= 2);

seq.wait(900);

if (dashDist >= 1) {
    seq.animation()
        .on(token)
        .teleportTo(location, { relativeToCenter: true })
        .snapToGrid();
}

await seq.play();
