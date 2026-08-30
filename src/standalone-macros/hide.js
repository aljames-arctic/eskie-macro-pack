// Standalone Macro: Hide
// Original Author: EskieMoh#2969 / .eskie
// Integration: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Hide' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const id = "hide";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

// Toggle / re-entrant persistent effect handling: stop hide if active
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
if ((activeEffects?.length ?? 0) > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    await new Sequence()
        .animation()
            .on(token)
            .opacity(1)
            .tint("#FFFFFF")
        .play();
    return;
}

const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;

const sequence = new Sequence();

// Stealth shadow smoke dissolve puff 1
sequence.effect()
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .attachTo(token)
    .scaleToObject(1, { considerTokenScale: true })
    .duration(1500)
    .animateProperty('sprite', 'width', { from: 0, to: 0.05, duration: 400, gridUnits: true, ease: "easeOutCubic" })
    .animateProperty('sprite', 'height', { from: 0, to: 0.05, duration: 400, gridUnits: true, ease: "easeOutCubic" })
    .animateProperty('sprite', 'width', { from: 0, to: -0.05, duration: 250, gridUnits: true, ease: "easeOutCubic", delay: 500 })
    .animateProperty('sprite', 'height', { from: 0, to: -0.05, duration: 250, gridUnits: true, ease: "easeOutCubic", delay: 500 })
    .filter("Glow", { color: 0x000000 })
    .tint("#696969")
    .fadeIn(500, { delay: 150 })
    .fadeOut(1000);

// Stealth shadow smoke dissolve puff 2
sequence.effect()
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .attachTo(token)
    .scaleToObject(1, { considerTokenScale: true })
    .duration(750)
    .animateProperty('sprite', 'width', { from: 0, to: 0.05, duration: 400, gridUnits: true, ease: "easeOutCubic" })
    .animateProperty('sprite', 'height', { from: 0, to: 0.05, duration: 400, gridUnits: true, ease: "easeOutCubic" })
    .animateProperty('sprite', 'width', { from: 0, to: -0.05, duration: 250, gridUnits: true, ease: "easeOutCubic", delay: 500 })
    .animateProperty('sprite', 'height', { from: 0, to: -0.05, duration: 250, gridUnits: true, ease: "easeOutCubic", delay: 500 })
    .fadeOut(250)
    .zIndex(1)
    .waitUntilFinished(-250);

// Black smoke burst
sequence.effect()
    .file(closest("eskie.smoke.03.black"))
    .attachTo(token)
    .scaleToObject(1.75)
    .opacity(1)
    .randomRotation()
    .fadeOut(1000)
    .zIndex(2)
    .tint("#696969");

// Reduced token opacity and grey tint stealth state
sequence.animation()
    .on(token)
    .tint("#696969")
    .opacity(0.8);

// Persistent tracking effect for macro toggle support
sequence.effect()
    .name(label)
    .attachTo(token)
    .persist()
    .private();

await sequence.play();
