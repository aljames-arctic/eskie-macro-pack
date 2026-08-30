// Standalone Macro: Sweeping Attack
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Sweeping Attack' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const targets = Array.from(game.user.targets);
if (targets.length === 0) return ui.notifications.warn("Please select at least one target!");

const target1 = targets[0];
const target2 = targets[1] ?? target1;

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

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

const color = "blue";
const effectSize = 2 + (0.25 * 2);
const effectOffset = -0.75 - (0.25 * 2);

const p1 = getNearestSquareCenter(token, target1) ?? target1.center ?? { x: target1.x ?? 0, y: target1.y ?? 0 };
const p2 = getNearestSquareCenter(token, target2) ?? target2.center ?? { x: target2.x ?? 0, y: target2.y ?? 0 };
const targetSquare = (p1 && p2)
    ? { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
    : (p1 ?? token.center ?? { x: token.x ?? 0, y: token.y ?? 0 });

const tokenWidth = token.document?.width ?? token.width ?? 1;

const sequence = new Sequence();

sequence
    .effect()
        .file(closest(`eskie.attack.melee.generic.01.bludgeoning.heavy.${color}.fast.01`))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(effectSize, { considerTokenScale: true })
        .spriteOffset({ x: effectOffset * tokenWidth }, { gridUnits: true })
        .zIndex(1)
        .rotateIn(-270, 250, { ease: "easeInExpo" })
        .rotateOut(45, 750, { ease: "easeOutExpo" })

    .effect()
        .file(closest("eskie.smoke.01.white"))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(effectSize + 1, { considerTokenScale: true })
        .spriteOffset({ x: effectOffset * (tokenWidth * 0.5) }, { gridUnits: true })
        .belowTokens()
        .opacity(0.5)

    .effect()
        .delay(150)
        .file(closest("eskie.damage.bludgeoning.01.yellow"))
        .size(1.5 * tokenWidth, { gridUnits: true })
        .atLocation(target1)
        .randomRotation()
        .zIndex(1);

if (target2 && target2 !== target1) {
    sequence
        .effect()
            .delay(150)
            .file(closest("eskie.damage.bludgeoning.01.yellow"))
            .size(1.5 * tokenWidth, { gridUnits: true })
            .atLocation(target2)
            .randomRotation()
            .zIndex(1);
}

await sequence.play();
