// Standalone Macro: Arms of Hadar
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Arms of Hadar' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

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

const id = "armsOfHadar";
const excludeSelf = true;

// Gather targets from game.user.targets, excluding caster token if excludeSelf is true
let targets = game.user.targets.size > 0 ? Array.from(game.user.targets) : [];
if (excludeSelf) {
    targets = targets.filter(t => t.id !== token.id);
}

const casterEffects = Sequencer.EffectManager.getEffects({ name: id, object: token });
const canvasEffects = Sequencer.EffectManager.getEffects({ name: id });
const wildcardEffects = Sequencer.EffectManager.getEffects({ name: `*${id}*` });

if (casterEffects.length > 0 || canvasEffects.length > 0 || wildcardEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: id, object: token });
    Sequencer.EffectManager.endEffects({ name: id });
    Sequencer.EffectManager.endEffects({ name: `*${id}*` });
    return ui.notifications.info("Ended Arms of Hadar.");
}

const sequence = new Sequence();

sequence.thenDo(function () {
    targets.forEach(target => {
        const targetName = target?.name ?? "Target";
        const rotation = target.document?.rotation ?? target.rotation ?? 0;
        new Sequence()
            .effect()
            .name(`${targetName} ${id}`)
            .copySprite(target)
            .spriteRotation(-rotation)
            .atLocation(target)
            .scaleToObject(1, { considerTokenScale: true })
            .fadeOut(100)
            .persist()
            .wait(150)

            .animation()
            .on(target)
            .opacity(0)
            .play();
    });
});

sequence
    .effect()
    .name(id)
    .atLocation(token)
    .file(closest("jb2a.ward.rune.dark_purple.01"))
    .scaleToObject(1.85)
    .scaleIn(0, 600, { ease: "easeOutCubic" })
    .belowTokens()
    .fadeOut(2000)
    .zIndex(0)

    .effect()
    .file(closest("jb2a.arms_of_hadar.dark_purple"))
    .atLocation(token)
    .randomRotation()
    .scaleIn(0, 1500, { ease: "easeOutCirc" })
    .fadeOut(500)
    .belowTokens()
    .scaleToObject(1.75)
    .zIndex(1)

    .effect()
    .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
    .atLocation(token)
    .filter("ColorMatrix", { brightness: -1 })
    .randomRotation()
    .size(1.5, { gridUnits: true })
    .rotateIn(180, 600, { ease: "easeOutCubic" })
    .scaleIn(0, 600, { ease: "easeOutCubic" })
    .belowTokens()
    .zIndex(0.1)

    .effect()
    .file(closest("jb2a.particles.outward.purple.01.02"))
    .scaleIn(0, 1000, { ease: "easeOutQuint" })
    .delay(500)
    .fadeOut(1000)
    .atLocation(token)
    .duration(1000)
    .size(1.75, { gridUnits: true })
    .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.5, gridUnits: true, duration: 1000 })
    .filter("ColorMatrix", { brightness: -1 })
    .zIndex(1)

    .wait(1000)

    .effect()
    .file(closest("jb2a.extras.tmfx.border.circle.inpulse.01.fast"))
    .atLocation(token)
    .scaleToObject(1.5)
    .filter("ColorMatrix", { brightness: -1 })
    .waitUntilFinished()

    .effect()
    .delay(150)
    .belowTokens()
    .file(closest("jb2a.impact.ground_crack.dark_red.02"))
    .atLocation(token)
    .size(3.5, { gridUnits: true })
    .filter("ColorMatrix", { hue: -100, brightness: -1 })

    .effect()
    .delay(150)
    .file(closest("jb2a.impact.004.dark_purple"))
    .atLocation(token)
    .scaleToObject(4)
    .filter("ColorMatrix", { hue: -100, brightness: -1 })
    .scaleIn(0, 500, { ease: "easeOutCirc" })

    .effect()
    .delay(150)
    .file(closest("jb2a.arms_of_hadar.dark_purple"))
    .atLocation(token)
    .randomRotation()
    .scaleIn(0, 750, { ease: "easeOutCirc" })
    .animateProperty('sprite', 'width', { from: 5.5, to: 0, duration: 1500, delay: 1000, gridUnits: true, ease: "easeOutCirc" })
    .animateProperty('sprite', 'height', { from: 5.5, to: 0, duration: 1500, delay: 1000, gridUnits: true, ease: "easeOutCirc" })
    .fadeOut(500)
    .size(6, { gridUnits: true })
    .belowTokens()
    .zIndex(1)
    .duration(2000)

    .thenDo(function () {
        const gridSize = canvas.grid?.size ?? 100;
        const tokenCenterX = token.center?.x ?? token.x;
        const tokenCenterY = token.center?.y ?? token.y;

        targets.forEach(target => {
            const targetName = target?.name ?? "Target";
            const targetCenterX = target.center?.x ?? target.x;
            const targetCenterY = target.center?.y ?? target.y;
            const rotation = target.document?.rotation ?? target.rotation ?? 0;
            const width = target.document?.width ?? 1;

            let newX = targetCenterX - (gridSize / 2.5 * Math.sign(tokenCenterX - targetCenterX));
            let newY = targetCenterY - (gridSize / 2.5 * Math.sign(tokenCenterY - targetCenterY));

            new Sequence()
                .thenDo(function () {
                    Sequencer.EffectManager.endEffects({ name: `${targetName} ${id}`, object: target });
                })

                .effect()
                .copySprite(target)
                .spriteRotation(-rotation)
                .atLocation(target)
                .scaleToObject(width, { considerTokenScale: true })
                .moveTowards({ x: newX, y: newY }, { rotate: false, ease: "easeOutBack" })
                .duration(750)
                .loopProperty('spriteContainer', 'position.x', { from: -0.05, to: 0.05, duration: 175, pingPong: true, gridUnits: true })
                .opacity(0.15)
                .zIndex(0.1)

                .effect()
                .copySprite(target)
                .spriteRotation(-rotation)
                .atLocation(target)
                .scaleToObject(width, { considerTokenScale: true })
                .moveTowards({ x: newX, y: newY }, { rotate: false, ease: "easeOutBack" })
                .duration(750)
                .waitUntilFinished(-50)

                .effect()
                .copySprite(target)
                .spriteRotation(-rotation)
                .atLocation({ x: newX, y: newY })
                .scaleToObject(1, { considerTokenScale: true })
                .moveTowards(target, { rotate: false, ease: "easeOutBack" })
                .duration(1500)
                .waitUntilFinished(-50)

                .animation()
                .on(target)
                .opacity(1)
                .play();
        });
    });

sequence.play();
