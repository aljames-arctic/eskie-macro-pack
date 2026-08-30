// Standalone Macro: Wall of Fire
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Wall of Fire' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const label = `${token.name} Wall of Fire`;
const isPlaying = Sequencer.EffectManager.getEffects({ name: label }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label });
    Sequencer.EffectManager.endEffects({ name: `${token.name} Wall Fire Crosshair` });
    return ui.notifications.info(`Ended Wall of Fire for ${token.name}.`);
}

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const tokenImg = token.document?.texture?.src ?? "";

const position1 = await Sequencer.Crosshair.show(
    {
        t: "circle",
        distance: 2.5,
        icon: { texture: tokenImg },
        gridHighlight: false,
        borderAlpha: 0,
    },
    {
        [Sequencer.Crosshair.CALLBACKS.SHOW]: (crosshair) => {
            new Sequence()
                .effect()
                    .name(`${token.name} Wall Fire Crosshair`)
                    .file(closest("eskie.crosshair.circle.fantasy_01.white.no_base.radius_10ft"))
                    .attachTo(crosshair)
                    .scaleToObject(1.2)
                    .persist()
                    .locally()
                .play();
        },
        [Sequencer.Crosshair.CALLBACKS.PLACED]: () => {
            Sequencer.EffectManager.endEffects({ name: `${token.name} Wall Fire Crosshair` });
        },
        [Sequencer.Crosshair.CALLBACKS.CANCEL]: () => {
            Sequencer.EffectManager.endEffects({ name: `${token.name} Wall Fire Crosshair` });
        },
    }
);

if (!position1 || position1.cancelled) return;

const position2 = await Sequencer.Crosshair.show(
    {
        t: "circle",
        distance: 2.5,
        icon: { texture: tokenImg },
        gridHighlight: false,
        borderAlpha: 0,
    },
    {
        [Sequencer.Crosshair.CALLBACKS.SHOW]: (crosshair) => {
            new Sequence()
                .wait(50)
                .effect()
                    .name(`${token.name} Wall Fire Crosshair`)
                    .file(closest("eskie.crosshair.circle.fantasy_01.white.no_base.radius_10ft"))
                    .atLocation(position1)
                    .scaleToObject(1.2)
                    .locally()
                    .persist()
                .effect()
                    .name(`${token.name} Wall Fire Crosshair`)
                    .file(closest("eskie.crosshair.circle.fantasy_01.white.no_base.radius_10ft"))
                    .attachTo(crosshair)
                    .scaleToObject(1.2)
                    .locally()
                    .persist()
                .play();
        },
        [Sequencer.Crosshair.CALLBACKS.PLACED]: () => {
            Sequencer.EffectManager.endEffects({ name: `${token.name} Wall Fire Crosshair` });
        },
        [Sequencer.Crosshair.CALLBACKS.CANCEL]: () => {
            Sequencer.EffectManager.endEffects({ name: `${token.name} Wall Fire Crosshair` });
        },
    }
);

if (!position2 || position2.cancelled) return;

const dx = position2.x - position1.x;
const dy = position2.y - position1.y;
const gridSize = canvas?.grid?.size ?? 100;
const stepSize = gridSize / 2;
const distance = Math.hypot(dx, dy);
const midpoint = {
    x: (position1.x + position2.x) / 2,
    y: (position1.y + position2.y) / 2,
};

const steps = Math.max(Math.floor(distance / stepSize), 1);
const stepX = dx / steps;
const stepY = dy / steps;

const effectPoints = [];
for (let i = 0; i <= steps; i++) {
    effectPoints.push({
        x: position1.x + stepX * i,
        y: position1.y + stepY * i,
    });
}

let castingFlip;
if (Math.abs(position1.x - position2.x) > Math.abs(position1.y - position2.y)) {
    castingFlip = position1.x < position2.x;
} else {
    castingFlip = position1.y > position2.y;
}

const tokenCenter = token.center ?? { x: token.x ?? 0, y: token.y ?? 0 };
if (midpoint.x < tokenCenter.x || midpoint.y < tokenCenter.y) {
    castingFlip = !castingFlip;
}

const wallFiles = {
    "05ft": closest("modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_10ft_400x400.webm"),
    "15ft": closest("modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_20ft_800x400.webm"),
    "30ft": closest("modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_30ft_1200x400.webm"),
    "60ft": closest("modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_60ft_2400x400.webm"),
    "90ft": closest("modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_60ft_2400x400.webm"),
};

const sequence = new Sequence();

for (let e = 0; e <= effectPoints.length - 1; e += 2) {
    const starSeq = new Sequence()
        .effect()
            .atLocation(effectPoints[e], { offset: { y: 0 }, randomOffset: 0.5, gridUnits: true })
            .file(closest("eskie.star.03.orange"))
            .size(Math.random() * 1.5 + 1, { gridUnits: true })
            .randomizeMirrorX()
            .filter("ColorMatrix", { saturate: 1, hue: -5 })
            .randomRotation()
            .zIndex(1);

    sequence.addSequence(starSeq);
}

sequence
    .wait(750)
    .effect()
        .file(closest("jb2a.cast_generic.fire.01.orange"))
        .attachTo(token)
        .scaleToObject(2.25, { considerTokenScale: true })
        .belowTokens()
        .scaleOut(0, 1500, { ease: "easeOutCubic" })
        .zIndex(2)

    .effect()
        .file(closest("jb2a.melee_generic.slash.02.001.orange.2"))
        .atLocation(token)
        .rotateTowards(midpoint)
        .scaleToObject(2, { considerTokenScale: true })
        .playbackRate(0.8)
        .spriteOffset({ x: -0.65 }, { gridUnits: true })
        .spriteScale({ y: 1.75 })
        .mirrorY(castingFlip)

    .effect()
        .delay(150)
        .file(closest("blfx.spell.template.line.crack1.ground1.orange"))
        .atLocation(position1, { offset: { x: -1 }, gridUnits: true, local: true })
        .stretchTo(position2, { offset: { x: 1 }, gridUnits: true, onlyX: false, local: true })
        .belowTokens();

for (let e = 0; e <= effectPoints.length - 1; e++) {
    const flameSeq = new Sequence()
        .effect()
            .atLocation(effectPoints[e], { offset: { y: -1 }, gridUnits: true })
            .file(closest("jb2a.flames.02.orange"))
            .size({ width: 2, height: 1.5 }, { gridUnits: true })
            .duration(1000)
            .fadeIn(200)
            .fadeOut(800)
            .animateProperty("sprite", "height", { from: 1.5, to: Math.random() + 1.75, duration: 500, gridUnits: true, ease: "easeOutBack" })
            .randomizeMirrorX()
            .zIndex(1);

    if (e % 2 === 0) {
        flameSeq.effect()
            .name(label)
            .delay(50, 750)
            .atLocation(effectPoints[e], { offset: { y: -0.35 }, randomOffset: 0.15, gridUnits: true })
            .file(closest("eskie.particle.01.loop.orange"))
            .size({ width: 2, height: 1 }, { gridUnits: true })
            .animateProperty("sprite", "height", { from: 1.5, to: Math.random() + 1.75, duration: 500, gridUnits: true, ease: "easeOutBack" })
            .randomizeMirrorX()
            .persist()
            .zIndex(1);
    }

    sequence.addSequence(flameSeq);
}

sequence
    .effect()
        .name(label)
        .file(wallFiles)
        .atLocation(position1, { offset: { x: -0.5 }, gridUnits: true, local: true })
        .stretchTo(position2, { offset: { x: 0.5 }, gridUnits: true, local: true })
        .scale(1)
        .animateProperty("sprite", "height", { from: -1, to: 0, duration: 250, ease: "easeOutBack", gridUnits: true })
        .fadeIn(250)
        .persist();

await sequence.play();
