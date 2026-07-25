// Standalone Macro: Spike Growth
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Spike Growth' macro requires the 'Sequencer' module to be installed and active!");
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

const DEFAULT_CONFIG = {
    id: 'spikeGrowth',
    size: 8, // Default size for crosshairs and initial effect
    tint: "#033b0cff", // Default tint for spikes
};

const id = DEFAULT_CONFIG.id ?? 'spikeGrowth';
const size = DEFAULT_CONFIG.size ?? 8;
const tint = DEFAULT_CONFIG.tint ?? "#033b0cff";
const tokenName = token.document?.name ?? token.name ?? "Token";
const effectName = `Spike Growth ${tokenName} ${id}`;

// Check if effect is already playing (toggle stop support)
const isPlaying = Sequencer.EffectManager.getEffects({ name: effectName }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: effectName });
    return;
}

const portalEntry = Sequencer.Database.getEntry(closest("jb2a.portals.vertical.vortex.purple"));
const portalPath = typeof portalEntry === "string" ? portalEntry : (portalEntry?.file ?? portalEntry?.files?.[0]);

const position = await Sequencer.Crosshair.show({
    size: size,
    icon: portalPath,
    label: 'Spike Growth'
});
if (!position || position.cancelled) return;

const sequence = new Sequence();

// Initial casting animation at central position
sequence
    .effect()
    .file(closest("jb2a.cast_generic.earth.01.browngreen.1"))
    .atLocation(position)
    .size(3, { gridUnits: true })
    .filter("ColorMatrix", { hue: -30, saturate: 0.25, brightness: 0.8 })

    .effect()
    .file(closest("jb2a.plant_growth.02.ring.4x4.pulse.greenred"))
    .atLocation(position)
    .size(size, { gridUnits: true })
    .belowTokens()
    .filter("ColorMatrix", { brightness: 0 })
    .playbackRate(1.5)
    .opacity(0.65)

    .effect()
    .file(closest("jb2a.plant_growth.02.ring.4x4.pulse.greenred"))
    .atLocation(position)
    .size(4, { gridUnits: true })
    .belowTokens()
    .filter("ColorMatrix", { brightness: 0 })
    .playbackRate(1.5)
    .opacity(0.65);

// Persistent Spikes & Green Entangling Vine Particles around central position
const gridSize = canvas.grid?.size ?? 100;
const locations = [
    { x: position.x, y: position.y - gridSize * 2 },
    { x: position.x + gridSize * 2, y: position.y },
    { x: position.x, y: position.y + gridSize * 2 },
    { x: position.x - gridSize * 2, y: position.y },
];

for (let i = 0; i < locations.length; i++) {
    // Green entangling vine particles (persistent loop)
    sequence
        .effect()
        .name(effectName)
        .delay(550)
        .file(closest("jb2a.plant_growth.02.round.4x4.loop.greenred"))
        .atLocation(locations[i])
        .belowTokens()
        .size(3.8, { gridUnits: true })
        .fadeIn(500)
        .persist()
        .fadeOut(500)
        .randomRotation()
        .opacity(0.85)
        .private()
        .zIndex(1);

    // Thorn burst ground spikes (persistent with loop/end time)
    sequence
        .effect()
        .name(effectName)
        .delay(30)
        .file(closest("jb2a.ice_spikes.radial.burst.grey"))
        .size(7.5, { gridUnits: true })
        .playbackRate(4)
        .atLocation(locations[i], { randomOffset: 0.25 })
        .filter("ColorMatrix", { brightness: 0 })
        .fadeIn(500, { delay: 600 })
        .scaleIn(0, 500, { ease: "easeOutBack", delay: 600 })
        .persist()
        .endTime(800)
        .belowTokens()
        .filter("Glow", { color: tint, distance: 1 })
        .loopOptions({ loops: 1 });
}

await sequence.play();
