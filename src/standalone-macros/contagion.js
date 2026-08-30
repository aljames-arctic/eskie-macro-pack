// Standalone Macro: Contagion
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Contagion' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const getNearestSquareCenter = (srcToken, tgtToken) => {
    if (!srcToken || !tgtToken) return null;
    const gs = canvas?.grid?.size ?? 100;
    const srcCenter = srcToken.center ?? { x: srcToken.x ?? 0, y: srcToken.y ?? 0 };
    const w = tgtToken.document?.width ?? tgtToken.width ?? 1;
    const h = tgtToken.document?.height ?? tgtToken.height ?? 1;
    let bestPoint = null;
    let bestDist2 = Infinity;
    for (let gx = 0; gx < w; gx++) {
        for (let gy = 0; gy < h; gy++) {
            const cx = (tgtToken.x ?? 0) + (gx + 0.5) * gs;
            const cy = (tgtToken.y ?? 0) + (gy + 0.5) * gs;
            const dx = cx - srcCenter.x;
            const dy = cy - srcCenter.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDist2) {
                bestDist2 = d2;
                bestPoint = { x: cx, y: cy };
            }
        }
    }
    return bestPoint;
};

const getSceneCoverSizeGU = (tgt) => {
    const gs = canvas?.grid?.size ?? 100;
    const rect = canvas?.dimensions?.sceneRect ?? { x: 0, y: 0, width: 4000, height: 4000 };
    const corners = [
        { x: rect.x, y: rect.y },
        { x: rect.x + rect.width, y: rect.y },
        { x: rect.x, y: rect.y + rect.height },
        { x: rect.x + rect.width, y: rect.y + rect.height },
    ];
    const c = tgt.center ?? { x: tgt.x ?? 0, y: tgt.y ?? 0 };
    let maxDist = 0;
    for (const p of corners) {
        const d = Math.hypot(p.x - c.x, p.y - c.y);
        if (d > maxDist) maxDist = d;
    }
    return (2 * maxDist) / gs + 2;
};

const targetSquare = getNearestSquareCenter(token, target) ?? target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };
const sceneCoverGU = getSceneCoverSizeGU(target);
const tokenWidth = token.document?.width ?? token.width ?? 1;

const sequence = new Sequence();

sequence
    .effect()
        .copySprite(token)
        .attachTo(token)
        .filter("Glow", { distance: 5, color: 0x98d723 })
        .belowTokens()
        .duration(2000)
        .fadeIn(500)
        .fadeOut(1500)

    .effect()
        .delay(500)
        .file(closest("eskie.poison.token_mask.01.green.full"))
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .mask()
        .zIndex(1)

    .wait(500)

    .effect()
        .copySprite(target)
        .attachTo(target)
        .mask(target)
        .opacity(0.25)
        .loopProperty("sprite", "scale.y", { from: 1, to: 1.25, duration: 2000, ease: "easeInOutSine" })
        .loopProperty("sprite", "scale.x", { from: 1, to: 1.25, duration: 2000, ease: "easeInOutSine" })
        .loopProperty("sprite", "alpha", { from: 0.25, to: -0.25, duration: 2000, ease: "easeInOutSine" })
        .duration(4000)
        .fadeOut(1500)

    .effect()
        .delay(50)
        .file(closest("eskie.aura.token.ribbon.02.green"))
        .attachTo(token)
        .rotateTowards(target)
        .scaleToObject(1.5, { considerTokenScale: true })
        .spriteRotation(-90)
        .spriteOffset({ x: -0.75 * tokenWidth }, { gridUnits: true })
        .opacity(0.75)

    .effect()
        .file(closest("eskie.attack.touch.generic.01.green"))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .size(tokenWidth + 0.25, { gridUnits: true })
        .filter("ColorMatrix", { hue: -15 })
        .playbackRate(0.75)
        .spriteOffset({ x: -0.15 }, { gridUnits: true })
        .zIndex(2)

    .effect()
        .delay(250)
        .file(closest("jb2a.impact.004.green"))
        .attachTo(target)
        .scaleToObject(1.5, { considerTokenScale: true })
        .playbackRate(0.8)
        .filter("ColorMatrix", { hue: -15 })
        .belowTokens()

    .effect()
        .delay(250)
        .file(closest("eskie.texture_mask.ink.01.black"))
        .attachTo(target)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .size(sceneCoverGU, { gridUnits: true })
        .startTime(1000)
        .belowTiles()
        .opacity(0.75)
        .duration(4500)
        .fadeOut(1000);

await sequence.play();
