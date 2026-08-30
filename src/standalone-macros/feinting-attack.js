// Standalone Macro: Feinting Attack
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Feinting Attack' macro requires the 'Sequencer' module to be installed and active!");
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

const type = "slashing";
const weight = "medium";
const color = "blue";

const weightIndex = { light: 0, medium: 1, heavy: 2 }[weight] ?? 1;
const effectSize = 2 + (0.25 * weightIndex);
const effectOffset = -0.75 - (0.25 * weightIndex);

const targetSquare = getNearestSquareCenter(token, target) ?? target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };

const deg = (rad) => (rad * 180) / Math.PI;
const src = token.center ?? { x: token.x ?? 0, y: token.y ?? 0 };
const tgt = target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };

const baseRad = Math.atan2(tgt.y - src.y, tgt.x - src.x);
const counterRot = deg(baseRad);

const baseRadTarget = Math.atan2(src.y - tgt.y, src.x - tgt.x);
const counterRotTarget = deg(baseRadTarget);

const tokenWidth = token.document?.width ?? token.width ?? 1;

const sequence = new Sequence();

sequence
    .animation()
        .on(target)
        .opacity(0)
        .delay(100)

    .effect()
        .copySprite(target)
        .attachTo(target, { bindAlpha: false })
        .rotateTowards(token)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("sprite", "position.x", { from: 0, to: -0.5, duration: 250, ease: "easeOutSine", gridUnits: true, delay: 250 })
        .animateProperty("sprite", "position.x", { from: 0, to: 0.5, duration: 250, ease: "easeOutCubic", gridUnits: true, delay: 750 })
        .animateProperty("sprite", "rotation", { from: 0, to: 20, duration: 500, ease: "easeOutCubic", delay: 250 })
        .animateProperty("sprite", "rotation", { from: 0, to: -20, duration: 250, ease: "easeOutBack", delay: 750 })
        .animateProperty("sprite", "rotation", { from: 0, to: 10, duration: 250, ease: "easeOutSine", delay: 1000 })
        .animateProperty("sprite", "rotation", { from: 0, to: -10, duration: 250, ease: "easeOutSine", delay: 1250 })
        .spriteOffset({ x: -0.5 }, { gridUnits: true })
        .spriteRotation(-counterRotTarget)
        .duration(1350)

    .animation()
        .on(target)
        .opacity(1)
        .delay(1250)

    .wait(250)

    .effect()
        .copySprite(token)
        .attachTo(token, { bindAlpha: false })
        .rotateTowards(target)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("sprite", "position.x", { from: 0, to: 0.1, duration: 250, ease: "easeOutSine", gridUnits: true })
        .spriteOffset({ x: -0.5 }, { gridUnits: true })
        .opacity(0.5)
        .fadeOut(300)
        .duration(500)
        .spriteRotation(-counterRot)

    .effect()
        .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.fast.03`))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(effectSize, { considerTokenScale: true })
        .spriteOffset({ x: effectOffset * tokenWidth - 0.25 }, { gridUnits: true })
        .opacity(0.5)
        .zIndex(1)

    .effect()
        .file(closest("eskie.star.02.white"))
        .atLocation(token)
        .scaleToObject(0.8, { considerTokenScale: true })
        .rotateTowards(targetSquare)
        .spriteOffset({ x: 0.35 }, { gridUnits: true })
        .zIndex(2);

await sequence.play();
