// Standalone Macro: Bless
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Bless' macro requires the 'Sequencer' module to be installed and active!");
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

const id = "bless";
const color = "yellow";
const hue = -20;

const targets = game.user.targets.size > 0 ? Array.from(game.user.targets) : [token];

const isEffectActive = (target) => {
    const targetName = target?.name ?? "Target";
    const labelName = `${id} - ${targetName}`;
    const labelId = `${id} - ${target?.id ?? ""}`;
    return Sequencer.EffectManager.getEffects({ name: labelName, object: target }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: labelId, object: target }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: id, object: target }).length > 0;
};

const stopEffect = (target) => {
    const targetName = target?.name ?? "Target";
    const labelName = `${id} - ${targetName}`;
    const labelId = `${id} - ${target?.id ?? ""}`;
    Sequencer.EffectManager.endEffects({ name: labelName, object: target });
    Sequencer.EffectManager.endEffects({ name: labelId, object: target });
    Sequencer.EffectManager.endEffects({ name: id, object: target });
};

const anyActive = targets.some(target => isEffectActive(target)) || isEffectActive(token);

if (anyActive) {
    targets.forEach(target => stopEffect(target));
    stopEffect(token);
} else {
    const sequence = new Sequence();

    // Effect on the caster
    sequence.effect()
        .file(closest(`jb2a.bless.200px.intro.${color}`))
        .atLocation(token)
        .filter("ColorMatrix", { hue: hue });

    // Ground effects on the caster
    sequence.effect()
        .file(closest("jb2a.extras.tmfx.inflow.circle.03"))
        .atLocation(token)
        .size(12.65, { gridUnits: true })
        .spriteScale({ x: 1, y: 1 })
        .belowTokens()
        .opacity(0.15)
        .duration(1800)
        .fadeIn(250)
        .fadeOut(500)
        .delay(1200)
        .zIndex(1);

    sequence.effect()
        .file(closest("jb2a.particles.inward.blue.01.03"))
        .atLocation(token)
        .size(12.65, { gridUnits: true })
        .spriteScale({ x: 1, y: 1 })
        .belowTokens()
        .filter("ColorMatrix", { brightness: 5, saturate: -1 })
        .opacity(0.05)
        .duration(1800)
        .fadeIn(250)
        .fadeOut(500)
        .delay(1200)
        .zIndex(1);

    sequence.effect()
        .file(closest(`jb2a.markers.light.complete.${color}`))
        .atLocation(token)
        .size(20, { gridUnits: true })
        .spriteScale({ x: 0.5, y: 1.25 })
        .belowTokens()
        .opacity(0.5)
        .duration(2800)
        .randomRotation()
        .fadeIn(500)
        .fadeOut(500)
        .shape("circle", {
            lineSize: (canvas.grid.size ?? 100) * 5.2,
            lineColor: "#FF0000",
            radius: 8.85,
            gridUnits: true,
            name: "test",
            isMask: true
        })
        .zIndex(2)
        .filter("ColorMatrix", { hue: hue })
        .repeats(3, 150, 150);

    sequence.effect()
        .atLocation(token)
        .size(18, { gridUnits: true })
        .spriteScale({ x: 1, y: 1 })
        .belowTokens()
        .opacity(0.1)
        .duration(1500)
        .fadeIn(250)
        .fadeOut(500)
        .delay(1200)
        .shape("circle", {
            lineSize: (canvas.grid.size ?? 100) * 0.24,
            lineColor: "#FFFFFF",
            radius: 6.175,
            gridUnits: true,
            name: "test",
            isMask: false
        })
        .filter("Blur", { blurX: 10, blurY: 10 });

    // Effects on the targets
    for (const target of targets) {
        const targetName = target?.name ?? "Target";
        const label = `${id} - ${targetName}`;

        sequence.effect()
            .copySprite(target)
            .spriteRotation(-(target.document?.rotation ?? target.rotation ?? 0))
            .atLocation(target)
            .scaleToObject(1, { considerTokenScale: true })
            .filter("ColorMatrix", { brightness: 5, saturate: -1 })
            .filter("Blur", { blurX: 10, blurY: 10 })
            .opacity(1)
            .fadeIn(250)
            .fadeOut(500)
            .duration(1000)
            .delay(1150);

        sequence.effect()
            .file(closest(`jb2a.bless.200px.loop.${color}`))
            .name(label)
            .attachTo(target)
            .fadeIn(500, { delay: 250 })
            .fadeOut(500)
            .delay(900)
            .filter("ColorMatrix", { hue: hue })
            .zIndex(1)
            .persist();
    }

    sequence.play();
}
