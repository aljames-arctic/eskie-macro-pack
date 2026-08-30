// Standalone Macro: Far Step
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Far Step' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const label = "Far Step";
const id = "farStep";

// Check if effect is already running (toggle / re-entrant persistent effect handling)
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
const activeConEffects = Sequencer.EffectManager.getEffects({ name: `${id}-con`, object: token });
const activeIdEffects = Sequencer.EffectManager.getEffects({ name: id, object: token });

if (activeEffects.length > 0 || activeConEffects.length > 0 || activeIdEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: id, object: token });
    Sequencer.EffectManager.endEffects({ name: `${id}-con`, object: token });
    new Sequence().animation().on(token).opacity(1).play();
    return;
}

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const tokenWidth = token.document?.width ?? 1;
const tokenHeight = token.document?.height ?? 1;

// Sequencer Crosshairs options for picking target destination
const crosshairOptions = {
    size: tokenWidth,
    icon: 'icons/magic/movement/trail-streak-zigzag-teal.webp',
    label: label,
    tag: 'Step',
    drawIcon: true,
    drawOutline: true,
    interval: tokenWidth % 2 === 0 ? 1 : -1,
    rememberControlled: true,
    lock: token.document
};

const position = await Sequencer.Crosshair.show(crosshairOptions);
if (!position || position.cancelled) return;

const sequence = new Sequence();

// 1. Departure explosion flash at source token
sequence.effect()
    .name(id)
    .file(closest("jb2a.explosion.07.bluewhite"))
    .atLocation(token)
    .scaleIn(0, 500, { ease: "easeOutCubic" })
    .fadeOut(1000)
    .scale({ x: tokenWidth / 4, y: tokenHeight / 4 });

// Hide token during step motion
sequence.animation()
    .on(token)
    .opacity(0);

// 2. Energy strand stretching from token to destination
sequence.effect()
    .name(id)
    .file(closest("jb2a.energy_strands.range.standard.blue.04"))
    .atLocation(token)
    .stretchTo(position)
    .waitUntilFinished(-2000)
    .playbackRate(1.25);

// 3. Arrival explosion at destination
sequence.effect()
    .name(id)
    .file(closest("jb2a.explosion.07.bluewhite"))
    .atLocation(position)
    .scale({ x: tokenWidth / 4, y: tokenHeight / 4 })
    .scaleIn(0, 500, { ease: "easeOutCubic" })
    .fadeOut(1000);

// 4. Teleport token and snap to grid
sequence.animation()
    .on(token)
    .teleportTo(position, { offset: { x: -1, y: -1 } })
    .snapToGrid()
    .waitUntilFinished();

// 5. Lingering spinning condition marker on token after arrival
sequence.effect()
    .name(`${id}-con`)
    .file(closest("jb2a.token_border.circle.spinning.blue.001"))
    .scaleIn(0, 1000, { ease: "easeOutElastic" })
    .duration(1000)
    .scaleOut(0, 500, { ease: "easeOutElastic" })
    .atLocation(token)
    .attachTo(token, { bindAlpha: false })
    .scaleToObject(2)
    .waitUntilFinished();

// 6. Restore token visibility
sequence.animation()
    .on(token)
    .opacity(1);

await sequence.play();
