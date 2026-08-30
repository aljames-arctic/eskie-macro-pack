// Standalone Macro: Gate
// Original Author: EskieMoh#2969, Carnage Asada#3647
// Modular Conversion: bakanabaka

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const effectLabel = `${token.id} - Gate`;

// Check if effect is already playing (toggle / re-entrant persistent effect handling)
const activeEffects = Sequencer.EffectManager.getEffects({ name: effectLabel });
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: effectLabel });
    return;
}

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const DEFAULT_DESTINATIONS = [
    { label: 'First World', value: 'First World' },
    { label: 'Astral Plane', value: 'Astral Plane' },
    { label: 'Ethereal Plane', value: 'Ethereal Plane' },
    { label: 'Shadow Plane', value: 'Shadow Plane' },
    { label: 'Plane of Air', value: 'Plane of Air' },
    { label: 'Plane of Earth', value: 'Plane of Earth' },
    { label: 'Plane of Fire', value: 'Plane of Fire' },
    { label: 'Plane of Water', value: 'Plane of Water' },
    { label: 'Negative Energy Plane', value: 'Negative Energy Plane' },
    { label: 'Positive Energy Plane', value: 'Positive Energy Plane' },
    { label: 'Heaven', value: 'Heaven' },
    { label: 'Nirvana', value: 'Nirvana' },
    { label: 'Elysium', value: 'Elysium' },
    { label: 'Axis', value: 'Axis' },
    { label: 'Boneyard', value: 'Boneyard' },
    { label: 'Maelstrom', value: 'Maelstrom' },
    { label: 'Hell', value: 'Hell' },
    { label: 'Abaddon', value: 'Abaddon' },
    { label: 'Abyss', value: 'Abyss' }
];

async function getDestination(destinations) {
    let content = `
        <div class="form-group" style="padding: 4px 0;">
            <label style="font-weight: 600; display: block; margin-bottom: 6px;">Destination:</label>
            <select id="destination-select" style="width: 100%; padding: 4px 8px;">`;
    for (const dest of destinations) {
        content += `<option value="${dest.value}">${dest.label}</option>`;
    }
    content += `
            </select>
        </div>`;

    const dialogCls = foundry.applications?.api?.DialogV2;
    if (dialogCls?.prompt) {
        return dialogCls.prompt({
            window: { title: 'Select a Destination' },
            content,
            ok: {
                label: 'OK',
                icon: 'fa-solid fa-check',
                callback: (event, button, dialog) => {
                    return button.form?.elements?.['destination-select']?.value
                        ?? button.form?.querySelector?.('#destination-select')?.value
                        ?? destinations[0]?.value;
                }
            },
            rejectClose: false
        });
    }

    return new Promise((resolve) => {
        new Dialog({
            title: 'Select a Destination',
            content: content,
            buttons: {
                ok: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'OK',
                    callback: (html) => {
                        const selected = html.find('#destination-select').val();
                        resolve(selected);
                    },
                },
            },
            default: 'ok',
            close: () => {
                resolve(null);
            },
        }).render(true);
    });
}

function getPlaneConfig(destination) {
    const planeConfigs = {
        'First World': { portalColor: 'green', circleColor: 'green', castColor: 'green', planeImage: 'https://i.imgur.com/nilqRZB.png', pulseColor: 'green', saturation: 0, hue: 0 },
        'Astral Plane': { portalColor: 'purple', circleColor: 'purple', castColor: 'purple', planeImage: 'https://i.imgur.com/iqkmZHK.png', pulseColor: 'purple', saturation: 0, hue: 0 },
        'Ethereal Plane': { portalColor: 'green', circleColor: 'green', castColor: 'green', planeImage: 'https://i.imgur.com/xhjyhbf.png', pulseColor: 'green', saturation: 0, hue: 0 },
        'Shadow Plane': { portalColor: 'purple', circleColor: 'purple', castColor: 'purple', planeImage: 'https://i.imgur.com/TjMKbrj.png', pulseColor: 'purple', saturation: 0, hue: 0 },
        'Plane of Air': { portalColor: 'purple', circleColor: 'purple', castColor: 'purple', planeImage: 'https://i.imgur.com/aiXrfBa.png', pulseColor: 'blue', saturation: 0, hue: 0 },
        'Plane of Earth': { portalColor: 'green', circleColor: 'green', castColor: 'green', planeImage: 'https://i.imgur.com/sOEc80k.png', pulseColor: 'green', saturation: 0, hue: 0 },
        'Plane of Fire': { portalColor: 'orange', circleColor: 'yellow', castColor: 'yellow', planeImage: 'https://i.imgur.com/uCSWfpK.png', pulseColor: 'yellow', saturation: 0, hue: 0 },
        'Plane of Water': { portalColor: 'blue', circleColor: 'blue', castColor: 'blue', planeImage: 'https://i.imgur.com/M7ge7ba.png', pulseColor: 'blue', saturation: 0, hue: 0 },
        'Negative Energy Plane': { portalColor: 'purple', circleColor: 'dark_purple', castColor: 'purple', planeImage: 'https://i.imgur.com/vbHQrhx.png', pulseColor: 'purple', saturation: -1, hue: 0 },
        'Positive Energy Plane': { portalColor: 'yellow', circleColor: 'dark_yellow', castColor: 'yellow', planeImage: 'https://i.imgur.com/jAPMC6E.png', pulseColor: 'yellow', saturation: -0.25, hue: 0 },
        'Heaven': { portalColor: 'yellow', circleColor: 'yellow', castColor: 'yellow', planeImage: 'https://i.imgur.com/CPmQviZ.png', pulseColor: 'yellow', saturation: 0, hue: 0 },
        'Nirvana': { portalColor: 'red', circleColor: 'red', castColor: 'white', planeImage: 'https://i.imgur.com/6fOXEiB.png', pulseColor: 'red', saturation: -0.45, hue: -20 },
        'Elysium': { portalColor: 'green', circleColor: 'green', castColor: 'green', planeImage: 'https://i.imgur.com/sQE9mdV.png', pulseColor: 'green', saturation: 0, hue: 0 },
        'Axis': { portalColor: 'yellow', circleColor: 'yellow', castColor: 'yellow', planeImage: 'https://i.imgur.com/9659xZV.png', pulseColor: 'yellow', saturation: 0, hue: 0 },
        'Boneyard': { portalColor: 'blue', circleColor: 'blue', castColor: 'blue', planeImage: 'https://i.imgur.com/Mp620An.png', pulseColor: 'blue', saturation: -0.5, hue: 0 },
        'Maelstrom': { portalColor: 'blue', circleColor: 'blue', castColor: 'blue', planeImage: 'https://i.imgur.com/xjcZLpj.png', pulseColor: 'blue', saturation: 0, hue: 0 },
        'Hell': { portalColor: 'red', circleColor: 'red', castColor: 'yellow', planeImage: 'https://i.imgur.com/7IFdFh6.png', pulseColor: 'red', saturation: 0, hue: 0 },
        'Abaddon': { portalColor: 'green', circleColor: 'green', castColor: 'green', planeImage: 'https://i.imgur.com/J8QPuFk.png', pulseColor: 'green', saturation: -0.5, hue: 0 },
        'Abyss': { portalColor: 'purple', circleColor: 'purple', castColor: 'purple', planeImage: 'https://i.imgur.com/fBApWFK.png', pulseColor: 'purple', saturation: 0, hue: 0 },
    };
    return planeConfigs[destination];
}

const selectedDestination = await getDestination(DEFAULT_DESTINATIONS);
if (!selectedDestination) return;

const planeConfig = getPlaneConfig(selectedDestination);
if (!planeConfig) {
    ui.notifications.warn(`No configuration found for destination: ${selectedDestination}`);
    return;
}

const gridDistance = canvas.grid?.distance ?? 5;
const portalSize = 20 / gridDistance;
const width = portalSize ?? 4;
const height = portalSize ?? 4;

const portalEntry = Sequencer.Database.getEntry(closest("jb2a.portals.vertical.vortex.purple"));
const portalPath = portalEntry?.file ?? portalEntry?.files?.[0] ?? portalEntry;

const position = await Sequencer.Crosshair.show({
    size: portalSize,
    icon: portalPath,
    label: 'Gate'
});
if (!position || position.cancelled) return;

const portalColor = planeConfig.portalColor ?? 'purple';
const circleColor = planeConfig.circleColor ?? 'purple';
const castColor = planeConfig.castColor ?? 'purple';
const planeImage = planeConfig.planeImage ?? '';
const pulseColor = planeConfig.pulseColor ?? 'purple';
const saturation = planeConfig.saturation ?? 0;
const hue = planeConfig.hue ?? 0;

const seq = new Sequence()
    // Base rotating conjuration symbol loop
    .effect()
        .name(effectLabel)
        .file(closest(`jb2a.magic_signs.circle.02.conjuration.loop.${circleColor}`))
        .atLocation(position)
        .opacity(0.35)
        .size({ width: width, height: height }, { gridUnits: true })
        .fadeIn(5000, { ease: "easeInExpo" })
        .loopProperty('sprite', "rotation", { from: 0, to: 360, duration: 180000 })
        .filter("ColorMatrix", { saturate: saturation })
        .belowTokens()
        .persist()

    // Summon sequence flame outburst
    .effect()
        .file(closest(`jb2a.sacred_flame.source.${castColor}`))
        .atLocation(position)
        .anchor({ x: 0.5, y: 0.6 })
        .scale(1.2)
        .fadeOut(2000, { ease: "easeInBack" })
        .filter("ColorMatrix", { saturate: saturation })
        .waitUntilFinished(-1500)

    // Energy pulse
    .effect()
        .file(closest(`eskie.pulse.energy.01.yellow.${pulseColor}`))
        .atLocation(position)
        .opacity(0.6)
        .scale(2)

    // High-tier planar portal ambient loop
    .effect()
        .name(effectLabel)
        .file(closest(`jb2a.portals.vertical.vortex_masked.${portalColor}`))
        .atLocation(position)
        .persist()
        .anchor({ x: 0.5, y: 0.57 })
        .rotateTowards(token)
        .size({ width: width - 1, height: height - 1 }, { gridUnits: true })
        .animateProperty('spriteContainer', "scale.x", { from: 0, to: 5.25, duration: 750, delay: 100, ease: "easeOutExpo" })
        .animateProperty('spriteContainer', "scale.y", { from: 6, to: 5.25, duration: 50, delay: 100, ease: "easeOutExpo" })
        .filter("ColorMatrix", { hue: hue, saturate: saturation })
        .rotate(90)
        .zIndex(2)

    // Interdimensional planar portal ring opening
    .effect()
        .name(effectLabel)
        .file(closest(`jb2a.wall_of_force.sphere.${portalColor}`))
        .atLocation(position)
        .persist()
        .anchor({ x: 0.5, y: 0.6 })
        .rotateTowards(token)
        .size({ width: width, height: height }, { gridUnits: true })
        .animateProperty('spriteContainer', "scale.x", { from: 0, to: 3, duration: 750, delay: 100, ease: "easeOutExpo" })
        .animateProperty('spriteContainer', "scale.y", { from: 1.5, to: 0.87, duration: 50, delay: 100, ease: "easeOutExpo" })
        .filter("ColorMatrix", { hue: hue, saturate: saturation })
        .rotate(90)
        .zIndex(1)

    // Cosmic starlight planar vista background
    .effect()
        .name(effectLabel)
        .file(planeImage)
        .atLocation(position)
        .persist()
        .anchor({ x: 0.5, y: 0.6 })
        .rotateTowards(token)
        .opacity(1)
        .delay(50)
        .size({ width: width, height: height }, { gridUnits: true })
        .animateProperty('spriteContainer', "scale.x", { from: 0, to: 1.8, duration: 750, delay: 200, ease: "easeOutExpo" })
        .animateProperty('spriteContainer', "scale.y", { from: 1.5, to: 0.75, duration: 50, delay: 200, ease: "easeOutExpo" })
        .rotate(90)
        .zIndex(0);

await seq.play();
