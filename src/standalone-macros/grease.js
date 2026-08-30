// Standalone Macro: Grease
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Grease' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const id = "Grease";
const castingEffectName = `Casting ${token.document?.name ?? token.name}`;

// Toggle Check: if persistent Grease effect is already active, stop it cleanly
const isPlaying = Sequencer.EffectManager.getEffects({ name: id }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: id });
    Sequencer.EffectManager.endEffects({ name: castingEffectName, object: token });
    return;
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
        const position = await Sequencer.Crosshair.show(config);
        if (position?.cancelled) { return []; }
        return [position, undefined];
    }
}

const radius = 5 / (canvas.grid?.distance ?? 5);
const portalEntry = Sequencer.Database.getEntry(closest("jb2a.portals.vertical.vortex.purple"));
const portalPath = portalEntry?.file ?? portalEntry?.files?.[0] ?? portalEntry;
const cfg = {
    radius: 1,
    max: 500,
    icon: portalPath,
    label: 'Grease'
};

const [primary, secondary] = await getPosition(globalThis.scope?.template, cfg);
if (!primary) { return; }

let position = primary;
if (secondary) {
    position = { x: (secondary.x + primary.x) / 2, y: (secondary.y + primary.y) / 2 };
}

const seq = new Sequence();

seq.effect()
    .name(castingEffectName)
    .attachTo(token)
    .file(closest("jb2a.magic_signs.circle.02.conjuration.loop.yellow"))
    .scaleToObject(1.25)
    .rotateIn(180, 600, { ease: "easeOutCubic" })
    .scaleIn(0, 600, { ease: "easeOutCubic" })
    .loopProperty('sprite', "rotation", { from: 0, to: -360, duration: 10000 })
    .belowTokens()
    .persist()
    .fadeOut(2000)
    .zIndex(0);

seq.effect()
    .attachTo(token)
    .file(closest("jb2a.magic_signs.circle.02.conjuration.complete.dark_yellow"))
    .scaleToObject(1.25)
    .rotateIn(180, 600, { ease: "easeOutCubic" })
    .scaleIn(0, 600, { ease: "easeOutCubic" })
    .loopProperty('sprite', "rotation", { from: 0, to: -360, duration: 10000 })
    .belowTokens(true)
    .filter("ColorMatrix", { saturate: -1, brightness: 2 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .zIndex(1)
    .duration(1200)
    .fadeIn(200, { ease: "easeOutCirc", delay: 500 })
    .fadeOut(300, { ease: "linear" });

seq.effect()
    .atLocation(token)
    .file(closest("jb2a.particles.outward.white.01.02"))
    .scaleIn(0, 500, { ease: "easeOutQuint" })
    .delay(500)
    .fadeOut(1000)
    .duration(1000)
    .size(1.75, { gridUnits: true })
    .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.5, gridUnits: true, duration: 1000 })
    .zIndex(1);

seq.thenDo(function () {
    Sequencer.EffectManager.endEffects({ name: castingEffectName, object: token });
});

seq.effect()
    .atLocation(position)
    .file(closest("jb2a.magic_signs.circle.02.conjuration.complete.dark_yellow"))
    .size(radius * 2, { gridUnits: true })
    .fadeIn(600)
    .fadeOut(1000)
    .duration(7200)
    .opacity(1)
    .rotateIn(180, 600, { ease: "easeOutCubic" })
    .scaleIn(0, 600, { ease: "easeOutCubic" })
    .belowTokens();

seq.wait(1000);

seq.effect()
    .file(closest("jb2a.water_splash.circle.01.black"))
    .atLocation(position)
    .scaleIn(0, 1500, { ease: "easeOutCubic" })
    .scaleOut(0, 1500, { ease: "linear" })
    .fadeIn(500)
    .fadeOut(1000)
    .belowTokens()
    .zIndex(2)
    .size(radius * 1.5, { gridUnits: true });

seq.effect()
    .delay(100)
    .file(closest("jb2a.grease.dark_brown"))
    .atLocation(position)
    .belowTokens()
    .fadeIn(5000)
    .zIndex(1)
    .randomRotation()
    .scaleOut(0, 1500, { ease: "linear" })
    .fadeOut(1000)
    .scaleIn(0, 5000, { ease: "easeOutCubic" })
    .size(radius * 2.2, { gridUnits: true })
    .persist()
    .name(id);

await seq.play();
