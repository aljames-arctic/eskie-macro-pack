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

const closest = (path) => {
    if (typeof eskie !== "undefined" && eskie.util?.file?.closest) {
        return eskie.util.file.closest(path);
    }
    const apiClosest = game.modules?.get("eskie-macros")?.api?.util?.closest;
    if (typeof apiClosest === "function") {
        return apiClosest(path);
    }
    return path;
};

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

// 1. Departure Blue/Cyan explosion flash at source token
sequence.effect()
    .name(id)
    .file(closest("jb2a.explosion.07.bluewhite"))
    .atLocation(token)
    .scaleIn(0, 500, { ease: "easeOutCubic" })
    .fadeOut(1000)
    .scale({ x: tokenWidth / 4, y: tokenHeight / 4 });

// Rapid sequential bonus action yellow/cyan portal departure rings
sequence.effect()
    .name(id)
    .file(closest("jb2a.portals.vertical.vortex.yellow"))
    .atLocation(token)
    .scaleToObject(1.5)
    .duration(800)
    .fadeOut(300)
    .belowTokens();

sequence.effect()
    .name(id)
    .file(closest("jb2a.portals.vertical.vortex.cyan"))
    .atLocation(token)
    .scaleToObject(1.8)
    .delay(100)
    .duration(800)
    .fadeOut(300)
    .belowTokens();

// Hide token during step motion
sequence.animation()
    .on(token)
    .opacity(0);

// 2. Rapid sequential yellow & cyan energy strand portal step streaks stretching from token to destination
sequence.effect()
    .name(id)
    .file(closest("jb2a.energy_strands.range.standard.blue.04"))
    .atLocation(token)
    .stretchTo(position)
    .filter("ColorMatrix", { hue: 180, saturate: 1.5 })
    .playbackRate(1.5)
    .opacity(0.95);

sequence.effect()
    .name(id)
    .file(closest("jb2a.energy_strands.range.standard.blue.04"))
    .atLocation(token)
    .stretchTo(position)
    .filter("ColorMatrix", { hue: 45, saturate: 2.0, brightness: 1.2 })
    .delay(50)
    .playbackRate(1.75)
    .opacity(0.85)
    .waitUntilFinished(-1800);

// Speed motion trail ghost copy during transit
sequence.effect()
    .name(id)
    .copySprite(token)
    .spriteRotation(-(token.document?.rotation ?? 0))
    .atLocation(token)
    .stretchTo(position)
    .filter("ColorMatrix", { hue: 40, saturate: 2 })
    .filter("Blur", { blurX: 8, blurY: 2 })
    .duration(400)
    .fadeOut(200);

// 3. Arrival explosion & yellow/cyan portal rings at destination
sequence.effect()
    .name(id)
    .file(closest("jb2a.explosion.07.bluewhite"))
    .atLocation(position)
    .scale({ x: tokenWidth / 4, y: tokenHeight / 4 })
    .scaleIn(0, 500, { ease: "easeOutCubic" })
    .fadeOut(1000);

sequence.effect()
    .name(id)
    .file(closest("jb2a.portals.vertical.vortex.yellow"))
    .atLocation(position)
    .scaleToObject(1.6)
    .duration(700)
    .fadeOut(250);

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

// Lingering yellow/cyan speed momentum particle trail on token
sequence.effect()
    .name(`${id}-con`)
    .file(closest("jb2a.particles.outward.cyan.01.03"))
    .atLocation(token)
    .attachTo(token, { bindAlpha: false })
    .scaleToObject(1.5)
    .duration(1200)
    .fadeIn(200)
    .fadeOut(400)
    .belowTokens();

// 6. Restore token visibility
sequence.animation()
    .on(token)
    .opacity(1);

await sequence.play();
