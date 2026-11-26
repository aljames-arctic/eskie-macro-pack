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

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const getNearestSquareCenter = (srcToken, tgtToken) => {
    if (!srcToken || !tgtToken) return null;
    const gs = canvas.grid.size;
    const srcCenter = srcToken.center;
    const w = tgtToken.document.width;
    const h = tgtToken.document.height;
    let bestPoint = null;
    let bestDist2 = Infinity;
    for (let gx = 0; gx < w; gx++) {
        for (let gy = 0; gy < h; gy++) {
            const cx = tgtToken.x + (gx + 0.5) * gs;
            const cy = tgtToken.y + (gy + 0.5) * gs;
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

const targetSquare = getNearestSquareCenter(token, target);

const deg = (rad) => (rad * 180) / Math.PI;
const src = token.center;
const tgt = target.center;

const baseRad = Math.atan2(tgt.y - src.y, tgt.x - src.x);
const counterRot = deg(baseRad);

const baseRadTarget = Math.atan2(src.y - tgt.y, src.x - tgt.x);
const targetRecoil = {
    x: -0.5 * Math.cos(baseRadTarget),
    y: -0.5 * Math.sin(baseRadTarget),
};

const tokenWidth = token.document?.width ?? token.width ?? 1;

const sequence = new Sequence();

sequence
    .motion(target)
        .moveBy(
            [
                { v: { x: 0, y: 0 } },
                { v: targetRecoil, duration: 250, inEase: "easeOutSine", hold: 250 },
                { v: { x: 0, y: 0 }, duration: 250, inEase: "easeOutCubic" },
            ],
            { gridUnits: true, delay: 250, return: false }
        )
        .rotateBy(
            [
                { v: 0 },
                { v: 20, duration: 500, inEase: "easeOutCubic" },
                { v: 0, duration: 250, inEase: "easeOutBack" },
                { v: 10, duration: 250, inEase: "easeOutSine" },
                { v: 0, duration: 250, inEase: "easeOutSine" },
            ],
            { delay: 250, return: false }
        )

    .wait(250)

    .effect()
        .copySprite(token)
        .attachTo(token, { bindAlpha: false })
        .rotateTowards(target)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.1, duration: 250, ease: "easeOutSine", gridUnits: true })
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
