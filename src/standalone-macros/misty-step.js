// Standalone Macro: Misty Step
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Misty Step' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const label = "Misty Step";
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    new Sequence().animation().on(token).opacity(1).play();
    return;
}

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const tokenWidth = token.document?.width ?? 1;

const crosshairConfig = {
    size: tokenWidth,
    icon: 'icons/magic/movement/trail-streak-impact-blue.webp',
    label: label,
    tag: label,
    drawIcon: true,
    drawOutline: true,
    interval: tokenWidth % 2 === 0 ? 1 : -1,
    rememberControlled: true,
};

const position = await Sequencer.Crosshair.show(crosshairConfig);
if (!position || position.cancelled) return;

const sequence = new Sequence()
    .animation()
        .delay(800)
        .on(token)
        .fadeOut(200)

    .effect()
        .name(label)
        .file(closest("jb2a.misty_step.01.blue"))
        .atLocation(token)
        .scaleToObject(2)
        .waitUntilFinished(-2000)

    .animation()
        .on(token)
        .teleportTo(position)
        .snapToGrid()
        .offset({ x: -1, y: -1 })
        .waitUntilFinished(200)

    .effect()
        .name(label)
        .file(closest("jb2a.misty_step.02.blue"))
        .atLocation(token)
        .scaleToObject(2)

    .animation()
        .delay(1400)
        .on(token)
        .fadeIn(200);

await sequence.play();
