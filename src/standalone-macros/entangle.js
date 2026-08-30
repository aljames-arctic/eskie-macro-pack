// Standalone Macro: Entangle
// Author: .eskie
const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn('Please select a token!');

const label = `${token.document.name} Entangle`;
const isPlaying = Sequencer.EffectManager.getEffects({ name: label }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label });
    return ui.notifications.info(`Ended Entangle for ${token.document.name}.`);
}

const targetPos = await Sequencer.Crosshair.show({
    type: "rect",
    distance: 28.5,
    icon: token.document?.texture?.src ?? "",
    label: "Entangle",
    snapPosition: 240
});
if (!targetPos || targetPos.cancelled) return;

new Sequence()
    .effect()
    .name(label)
    .file(closest('eskie.casting.nature.01.side.loop.green'))
    .attachTo(token)
    .rotateTowards(targetPos)
    .scaleToObject(1.25, { considerTokenScale: true })
    .spriteOffset({ x: -0.25 }, { gridUnits: true })
    .duration(2000)
    .fadeOut(500)
    .effect()
    .name(label)
    .file(closest('eskie.casting.nature.01.center.loop.green'))
    .atLocation(targetPos)
    .size(1, { gridUnits: true })
    .belowTokens()
    .duration(2000)
    .fadeOut(500)
    .zIndex(1.1)
    .effect()
    .delay(500)
    .name(label)
    .file(closest('eskie.nature.vine.normal.circle.01.physical.green.radius_20ft'))
    .atLocation(targetPos)
    .scaleToObject(1.15)
    .persist()
    .belowTokens()
    .zIndex(1)
    .randomRotation()
    .effect()
    .name(label)
    .atLocation(targetPos)
    .file(closest('jb2a.magic_signs.circle.02.conjuration.complete.dark_green'))
    .size(3.5, { gridUnits: true })
    .fadeIn(600)
    .opacity(1)
    .rotateIn(180, 600, { ease: 'easeOutCubic' })
    .scaleIn(0, 600, { ease: 'easeOutCubic' })
    .belowTokens()
    .fadeOut(500)
    .duration(3000)
    .effect()
    .name(label)
    .atLocation(targetPos)
    .file(closest('jb2a.magic_signs.circle.02.conjuration.complete.dark_green'))
    .size(3.5, { gridUnits: true })
    .fadeIn(600, { delay: 2500 })
    .opacity(0.5)
    .rotateIn(180, 600, { ease: 'easeOutCubic' })
    .scaleIn(0, 600, { ease: 'easeOutCubic' })
    .persist()
    .belowTokens()
    .filter('ColorMatrix', { brightness: 0 })
    .play();
