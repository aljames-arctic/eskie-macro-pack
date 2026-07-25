// Standalone Macro: Faerie Fire
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const DEFAULT_CONFIG = {
    id: 'Faerie Fire',
    color: 'green',
    aoeDistance: 10,
};

const closest = (path) => {
    if (typeof eskie !== "undefined" && eskie.util?.file?.closest) {
        return eskie.util.file.closest(path);
    }
    if (game.modules.get('eskie-macros')?.api?.util?.closest) {
        return game.modules.get('eskie-macros').api.util.closest(path);
    }
    return path;
};

function getTintAndHue(color) {
    switch (color) {
        case 'blue':
            return { tintColor: '0x91c5d2', hue: '160' };
        case 'green':
            return { tintColor: '0xd3eb6a', hue: '45' };
        case 'purple':
            return { tintColor: '0xdcace3', hue: '250' };
        default:
            return { tintColor: '0xd3eb6a', hue: '45' };
    }
}

async function getPosition(templateDoc, config = {}) {
    if (templateDoc) {
        let primary, secondary;
        if (templateDoc.documentName === 'Region' || templateDoc.shapes) {
            const shape = templateDoc.shapes?.[0];
            primary = { x: shape?.x ?? 0, y: shape?.y ?? 0 };
            const distance = shape?.radius ?? shape?.distance ?? 0;
            if (shape?.rotation !== undefined && distance > 0) {
                const rad = Math.toRadians(shape.rotation);
                secondary = {
                    x: primary.x + Math.cos(rad) * distance,
                    y: primary.y + Math.sin(rad) * distance
                };
            } else {
                secondary = { x: primary.x, y: primary.y };
            }
        } else {
            const farpoint = templateDoc.object?.ray?.B;
            secondary = { x: farpoint?.x ?? templateDoc.x, y: farpoint?.y ?? templateDoc.y };
            primary = { x: templateDoc.x, y: templateDoc.y };
        }
        return [primary, secondary];
    } else {
        const portalEntry = Sequencer.Database.getEntry(closest("jb2a.portals.vertical.vortex.purple"));
        const portalPath = typeof portalEntry === "string" ? portalEntry : (portalEntry?.file ?? portalEntry?.files?.[0]);
        const cfg = {
            radius: config.radius ?? 20,
            max: config.max ?? 60,
            icon: config.icon ?? portalPath,
            label: config.label ?? 'Faerie Fire'
        };
        const position = await Sequencer.Crosshair.show(cfg);
        if (position?.cancelled) { return []; }
        return [position, undefined];
    }
}

async function runFaerieFire(casterToken, config = {}) {
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const id = mergedConfig.id ?? 'Faerie Fire';
    const color = mergedConfig.color ?? 'green';
    const targets = game.user.targets.size > 0 ? Array.from(game.user.targets) : [];

    // Toggle Check: Check if active persistent effect exists anywhere on canvas or target
    const globalFaerieFx = Sequencer.EffectManager.getEffects({ name: `*${id}*` });
    if (globalFaerieFx.length > 0) {
        Sequencer.EffectManager.endEffects({ name: `*${id}*` });
        Sequencer.EffectManager.endEffects({ name: id });
        return ui.notifications.info("Cleared Faerie Fire aura glow.");
    }

    // Determine target location for cloud blast
    const portalEntryCloud = Sequencer.Database.getEntry(closest("jb2a.portals.vertical.vortex.purple"));
    const portalPathCloud = typeof portalEntryCloud === "string" ? portalEntryCloud : (portalEntryCloud?.file ?? portalEntryCloud?.files?.[0]);
    const cfg = {
        radius: 20,
        max: 60,
        icon: portalPathCloud,
        label: id
    };
    const [position, _] = await getPosition(mergedConfig.template, cfg);
    if (!position) { return; }

    const { tintColor, hue } = getTintAndHue(color);

    const sequence = new Sequence();

    // 1. Fairies circle cloud
    sequence.effect()
        .file(closest(`jb2a.fairies.loop.01.greenyellow`))
        .atLocation(position)
        .scale(0.05)
        .playbackRate(1)
        .duration(1500)
        .opacity(0.75)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { brightness: 0, hue: hue })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .animateProperty('sprite', 'width', { from: 0, to: -0.25, duration: 2500, gridUnits: true, ease: "easeInOutBack" })
        .animateProperty('sprite', 'height', { from: 0, to: -0.25, duration: 2500, gridUnits: true, ease: "easeInOutBack" })
        .belowTokens();

    // 2. White outward particles
    sequence.effect()
        .file(closest(`jb2a.particles.outward.white.01.03`))
        .atLocation(position)
        .scale(0.025)
        .playbackRate(1)
        .duration(1500)
        .fadeIn(1500)
        .scaleIn(0, 1500, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { hue: hue })
        .animateProperty('sprite', 'width', { from: 0, to: 0.5, duration: 2500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty('sprite', 'height', { from: 0, to: 1, duration: 2500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.45, duration: 2500, gridUnits: true });

    // 3. Sacred flame vertical rise
    sequence.effect()
        .file(closest(`jb2a.sacred_flame.target.${color}`))
        .atLocation(position)
        .scale(0.05)
        .playbackRate(1)
        .duration(1500)
        .scaleIn(0, 1500, { ease: "easeOutCubic" })
        .animateProperty('sprite', 'width', { from: 0, to: 0.5, duration: 2500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty('sprite', 'height', { from: 0, to: 0.5, duration: 2500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.25, duration: 2500, gridUnits: true, ease: "easeOutBack" })
        .waitUntilFinished(-200);

    // 4. Impact burst
    sequence.effect()
        .file(closest(`jb2a.impact.010.${color}`))
        .atLocation(position, { offset: { y: -0.25 }, gridUnits: true })
        .scale(0.45)
        .randomRotation()
        .zIndex(1);

    // 5. Glow cloud
    sequence.effect()
        .file(closest("jb2a.particles.outward.white.01.03"))
        .scaleIn(0, 500, { ease: "easeOutQuint" })
        .fadeOut(1000)
        .atLocation(position, { offset: { y: -0.25 }, gridUnits: true })
        .randomRotation()
        .duration(2500)
        .size(3, { gridUnits: true })
        .filter("Glow", { color: tintColor, distance: 10 })
        .zIndex(2);

    // 6. Swirling fireflies
    sequence.effect()
        .file(closest(`jb2a.fireflies.{{Pfew}}.02.${color}`))
        .atLocation({ x: position.x, y: position.y }, { randomOffset: 3.5 })
        .scaleToObject(1.8)
        .randomRotation()
        .duration(750)
        .fadeOut(500)
        .setMustache({
            "Pfew": () => {
                const Pfews = [`few`, `many`];
                return Pfews[Math.floor(Math.random() * Pfews.length)];
            }
        })
        .repeats(10, 75, 75)
        .zIndex(1);

    // 7. Yellow/tinted energy pulse back
    sequence.effect()
        .file(closest(`eskie.pulse.energy.01.yellow.yellow`))
        .atLocation(position, { offset: { y: -0.25 }, gridUnits: true })
        .size(5, { gridUnits: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 2, hue: hue })
        .fadeOut(250)
        .filter("Blur", { blurX: 10, blurY: 10 })
        .zIndex(0.5);

    // 8. Yellow/tinted energy pulse delayed front
    sequence.effect()
        .delay(50)
        .file(closest(`eskie.pulse.energy.01.yellow.yellow`))
        .atLocation(position, { offset: { y: -0.25 }, gridUnits: true })
        .size(5, { gridUnits: true })
        .filter("ColorMatrix", { hue: hue })
        .zIndex(0.5);

    // Attach target effects for targeted tokens (or selected token if no targets)
    if (targets.length > 0) {
        for (const target of targets) {
            const targetSeq = new Sequence();
            targetSeq.wait(1000);

            targetSeq.effect()
                .name(`${id} - ${target.name}`)
                .file(closest(`jb2a.fireflies.many.01.${color}`))
                .attachTo(target)
                .scaleToObject(1.4)
                .randomRotation()
                .fadeIn(500, { delay: 500 })
                .fadeOut(1500, { ease: "easeInSine" })
                .persist()
                .private();

            targetSeq.effect()
                .name(`${id} - ${target.name}`)
                .copySprite(target)
                .belowTokens()
                .attachTo(target, { locale: true })
                .scaleToObject(1, { considerTokenScale: true })
                .spriteRotation(-target.document.rotation)
                .filter("Glow", { color: tintColor, distance: 20 })
                .fadeIn(1500, { delay: 500 })
                .fadeOut(1500, { ease: "easeInSine" })
                .zIndex(0.1)
                .persist();

            sequence.addSequence(targetSeq);
        }
    }

    return sequence.play();
}

await runFaerieFire(token);
