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
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    await new Sequence().animation().on(token).opacity(1).play();
    return ui.notifications.info("Ended Tiger Totemic Attunement.");
}

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please target an enemy to tiger pounce!");

const tokenWidth = token.document?.width ?? 1;
const dx = target.center.x - token.center.x;
const dy = target.center.y - token.center.y;
const dist = Math.hypot(dx, dy) || 1;

const sizeAdjust = (tokenWidth - 1) / 2;
const totalSquares = 1 + sizeAdjust;
const totalPixels = totalSquares * (canvas.grid.size ?? 100);

const ux = dx / dist;
const uy = dy / dist;

const rawCenter = {
    x: target.center.x - ux * totalPixels,
    y: target.center.y - uy * totalPixels
};

const tokenSpan = (tokenWidth * (canvas.grid.size ?? 100)) / 2;
const rawPosition = { x: rawCenter.x - tokenSpan, y: rawCenter.y - tokenSpan };
const gridSnap = canvas.grid.getSnappedPosition ? canvas.grid.getSnappedPosition(rawPosition.x, rawPosition.y, 1) : rawPosition;
const location = { x: gridSnap.x + tokenSpan, y: gridSnap.y + tokenSpan };
const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;

let seq = new Sequence();

seq.animation()
    .delay(100)
    .on(token)
    .opacity(0);

seq.effect()
    .file(closest(`eskie.aura.token.generic.02.${color}`))
    .name(label)
    .atLocation(token)
    .scaleToObject(2.1)
    .startTime(550)
    .moveTowards(location, { relativeToCenter: true, ease: "easeOutQuint", rotate: false, delay: 240, snapToGrid: true })
    .attachTo(token)
    .persist()
    .zIndex(1);

seq.effect()
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .atLocation(token)
    .scaleToObject(1, { considerTokenScale: true })
    .duration(900)
    .moveTowards(location, { relativeToCenter: true, ease: "easeOutQuint", rotate: false, delay: 250, snapToGrid: true });

seq.effect()
    .delay(250)
    .file(closest("jb2a.teleport.01.white"))
    .atLocation(token)
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
    .atLocation(token)
    .rotateTowards(target)
    .scaleToObject(4)
    .opacity(0.5)
    .spriteOffset({ x: -2 * tokenWidth }, { gridUnits: true })
    .zIndex(3);

seq.canvasPan()
    .shake({ duration: 500, strength: 1, rotation: false, fadeOut: 500, delay: 200 });

seq.animation()
    .delay(250)
    .on(token)
    .teleportTo(location, { relativeToCenter: false })
    .snapToGrid();

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

seq.wait(850);

seq.animation()
    .on(token)
    .opacity(1);

await seq.play();
