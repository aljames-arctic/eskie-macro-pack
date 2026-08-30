// Standalone Macro: Trip Attack
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Trip Attack' macro requires the 'Sequencer' module to be installed and active!");
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

const type = "bludgeoning";
const weight = "heavy";
const color = "blue";

const weightIndex = { light: 0, medium: 1, heavy: 2 }[weight] ?? 2;
const effectSize = 2 + (0.25 * weightIndex);
const effectOffset = -0.75 - (0.25 * weightIndex);

const targetSquare = getNearestSquareCenter(token, target) ?? target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };
const tokenWidth = token.document?.width ?? token.width ?? 1;
const targetRotation = target.document?.rotation ?? target.rotation ?? 0;

const sequence = new Sequence();

sequence
    .effect()
        .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.normal.01`))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(effectSize, { considerTokenScale: true })
        .spriteOffset({ x: effectOffset * tokenWidth }, { gridUnits: true })
        .zIndex(1)

    .animation()
        .delay(100)
        .on(target)
        .opacity(0)

    .effect()
        .copySprite(target)
        .attachTo(target, { bindAlpha: false, bindRotation: false, local: false })
        .scaleToObject(0.9, { considerTokenScale: true })
        .zIndex(0.1)
        .belowTokens()
        .filter("ColorMatrix", { brightness: 0 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.65)
        .duration(1200)

    .effect()
        .delay(100)
        .file(closest(`eskie.damage.${type}.01.yellow`))
        .attachTo(target, { bindAlpha: false, bindRotation: false })
        .scaleToObject(2, { considerTokenScale: true })
        .opacity(1)
        .zIndex(1)
        .belowTokens()
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 500, ease: "easeOutCubic", gridUnits: true })

    .effect()
        .copySprite(target)
        .attachTo(target, { bindAlpha: false, bindRotation: false, local: false })
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 500, ease: "easeOutCubic", delay: 100, gridUnits: true })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: 0.5, duration: 250, ease: "easeOutCubic", delay: 600, gridUnits: true })
        .animateProperty("sprite", "rotation", { from: 0, to: 90, duration: 250, ease: "easeOutCubic", delay: 100 })
        .zIndex(2)
        .duration(1200)
        .waitUntilFinished(-500)

    .effect()
        .file(closest("eskie.smoke.03.white"))
        .attachTo(target, { bindAlpha: false, bindRotation: false })
        .scaleToObject(2, { considerTokenScale: true })
        .opacity(0.8)
        .belowTokens()

    .animation()
        .delay(300)
        .on(target)
        .opacity(1)
        .rotate(targetRotation + 90);

await sequence.play();
