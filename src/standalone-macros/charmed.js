// Standalone Macro: Charmed
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Charmed' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const id = "charmed";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id}-${tokenId}`;

// Toggle / re-entrant persistent effect handling
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
if ((activeEffects?.length ?? 0) > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    return;
}

const seq = new Sequence();

// Expanding ground/out-flow pink heart symbol template
seq.effect()
    .file(closest("jb2a.template_circle.symbol.out_flow.heart.pink"))
    .scaleIn(0, 1000, { ease: "easeOutQuint" })
    .fadeOut(2000)
    .atLocation(token)
    .belowTokens()
    .duration(3000)
    .scaleToObject(3);

// Rising pink heart icon attached to token
seq.effect()
    .file(closest("jb2a.icon.heart.pink"))
    .atLocation(token)
    .scaleIn(0, 500, { ease: "easeOutQuint" })
    .fadeOut(1000)
    .scaleToObject(1)
    .duration(2000)
    .attachTo(token)
    .playbackRate(1);

// Secondary floating semi-transparent pink heart icon offset upwards
seq.effect()
    .file(closest("jb2a.icon.heart.pink"))
    .atLocation(token)
    .scaleToObject(3)
    .anchor({ y: 0.45 })
    .scaleIn(0, 500, { ease: "easeOutQuint" })
    .fadeOut(1000)
    .duration(1000)
    .attachTo(token)
    .playbackRate(1)
    .opacity(0.5);

// Outpulse border circle pulse
seq.effect()
    .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
    .atLocation(token)
    .scaleToObject(2);

// Persistent charming heart marker loop around target token
seq.effect()
    .name(label)
    .file(closest("jb2a.markers.heart.pink.03"))
    .atLocation(token)
    .scaleToObject(2)
    .delay(500)
    .center()
    .fadeIn(1000)
    .playbackRate(1)
    .attachTo(token)
    .persist();

await seq.play();
