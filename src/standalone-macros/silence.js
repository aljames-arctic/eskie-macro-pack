// Standalone Macro: Silence
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const id = "silence";
const size = 9;
const effectName = `Silence ${token.document?.name ?? token.name} ${id}`;

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to the default path if running as a standalone copy-paste macro.
 */
const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

// Check if effect is already playing (toggle stop support)
const isPlaying = Sequencer.EffectManager.getEffects({ name: effectName }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: effectName });
} else {
    const portalEntry = Sequencer.Database.getEntry(closest("jb2a.portals.vertical.vortex.purple"));
    const portalPath = portalEntry?.file ?? portalEntry?.files?.[0] ?? portalEntry;

    const position = await Sequencer.Crosshair.show({
        size: size,
        icon: portalPath,
        label: 'Silence'
    });
    if (!position || position.cancelled) return;

    const sequence = new Sequence();
    sequence
        .effect()
        .file(closest("jb2a.moonbeam.01.outro.rainbow"))
        .atLocation(position)
        .size(0.75, { gridUnits: true })
        .startTime(500)
        .playbackRate(2)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { saturate: -1 })

        .effect()
        .delay(750)
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.normal"))
        .atLocation(position)
        .size(5, { gridUnits: true })
        .opacity(0.5)
        .filter("ColorMatrix", { brightness: 0 })
        .belowTokens()

        .effect()
        .delay(750)
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.normal"))
        .atLocation(position)
        .size(size, { gridUnits: true })
        .opacity(0.75)
        .filter("ColorMatrix", { brightness: 0 })
        .belowTokens()

        .effect()
        .file(closest("jb2a.cast_generic.earth.01.browngreen.1"))
        .atLocation(position)
        .size(2, { gridUnits: true })
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { saturate: -1 })
        .belowTokens()
        .waitUntilFinished(-1000)

        .effect()
        .name(effectName)
        .file(closest("jb2a.markers.bubble.01.complete.blue"))
        .atLocation(position)
        .size(size, { gridUnits: true })
        .opacity(0.2)
        .fadeIn(500)
        .fadeOut(2000)
        .scaleIn(0.1, 1000, { ease: "easeOutBack" })
        .zIndex(2)
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .belowTokens()
        .persist()

        .effect()
        .name(effectName)
        .file(closest("jb2a.wall_of_force.sphere.blue"))
        .atLocation(position)
        .size(size, { gridUnits: true })
        .opacity(0.2)
        .fadeIn(500)
        .fadeOut(2000, { delay: 5000 })
        .scaleIn(0.1, 1000, { ease: "easeOutBack" })
        .zIndex(2)
        .playbackRate(0.8)
        .filter("Glow", { color: 0x000000, distance: 2.5, innerStrength: 3, outerStrength: 0 })
        .filter("ColorMatrix", { saturate: -1 })
        .persist()

        .effect()
        .name(effectName)
        .file(closest("jb2a.template_circle.symbol.normal.runes.blue"))
        .atLocation(position)
        .size(2, { gridUnits: true })
        .scaleIn(0, 500, { ease: "easeOutElastic" })
        .fadeOut(2000)
        .playbackRate(0.8)
        .opacity(0.35)
        .belowTokens()
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .persist();

    sequence.play();
}
