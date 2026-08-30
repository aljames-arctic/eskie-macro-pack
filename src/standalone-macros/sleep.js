// Standalone Macro: Sleep
// Original Author: Unknown (from discord)
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Sleep' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please select at least one target!");
}

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const id = "Sleep";

// Toggle Check: if persistent sleep effect is already active on targets, end effects to toggle off
const isEffectActive = (target) => {
    const labelId = `${id}-${target.id}`;
    const labelName = `${id}-${target.name}`;
    return Sequencer.EffectManager.getEffects({ name: labelId, object: target }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: labelName, object: target }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: labelId }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: labelName }).length > 0;
};

const anyActive = targets.some(target => isEffectActive(target));

if (anyActive) {
    for (const target of targets) {
        Sequencer.EffectManager.endEffects({ name: `${id}-${target.id}`, object: target });
        Sequencer.EffectManager.endEffects({ name: `${id}-${target.name}`, object: target });
        Sequencer.EffectManager.endEffects({ name: `${id}-${target.id}` });
        Sequencer.EffectManager.endEffects({ name: `${id}-${target.name}` });
    }
    return;
}

const crosshairConfig = {
    size: 5,
    icon: 'icons/magic/control/hypnosis-mesmerism-pendulum.webp',
    label: 'Sleep',
    tag: 'sleep',
    t: 'circle',
    drawIcon: true,
    drawOutline: true,
    interval: -1,
};

const position = await Sequencer.Crosshair.show(crosshairConfig);
if (!position || position.cancelled || !position.x) return;

const sequence = new Sequence();

// AOE glitter and sleep cloud particle rain effects at impact location
sequence.effect()
    .file(closest("jb2a.sleep.cloud.01.dark_orangepurple"))
    .scaleIn(0, 500, { ease: "easeOutQuint" })
    .fadeOut(1000)
    .atLocation(position)
    .duration(1000)
    .size(5, { gridUnits: true })
    .zIndex(3);

sequence.effect()
    .file(closest("jb2a.extras.tmfx.border.circle.outpulse.02.normal"))
    .atLocation(position)
    .size(5, { gridUnits: true })
    .duration(1000)
    .fadeOut(1000)
    .opacity(0.5)
    .zIndex(1);

sequence.effect()
    .file(closest("jb2a.particles.outward.orange.02.03"))
    .scaleIn(0, 500, { ease: "easeOutQuint" })
    .fadeOut(2000)
    .atLocation(position)
    .duration(3000)
    .size(5.5, { gridUnits: true })
    .animateProperty('spriteContainer', 'position.y', { from: 0, to: 100, duration: 3000 })
    .zIndex(5);

// Persistent floating 'Zzz' sleep condition overlay animation on targets
for (const target of targets) {
    sequence.effect()
        .file(closest("jb2a.sleep.symbol.dark_orangepurple"))
        .scaleIn(0, 500, { ease: "easeOutQuint" })
        .fadeOut(1000)
        .atLocation(target)
        .attachTo(target, { bindRotation: false, bindAlpha: false })
        .persist()
        .scaleToObject(2)
        .name(`${id}-${target.id}`);
}

await sequence.play();
