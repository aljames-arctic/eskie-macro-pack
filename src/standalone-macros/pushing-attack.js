// Standalone Macro: Pushing Attack
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Pushing Attack' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");

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

const pushDistance = 15;
const type = "bludgeoning";
const weight = "heavy";
const color = "blue";

const weightIndex = { light: 0, medium: 1, heavy: 2 }[weight] ?? 2;
const effectSize = 2 + (0.25 * weightIndex);
const effectOffset = -0.75 - (0.25 * weightIndex);

const targetSquare = getNearestSquareCenter(token, target) ?? target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };
const tokenCenter = token.center ?? { x: token.x ?? 0, y: token.y ?? 0 };
const targetCenter = target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };
const gridSize = canvas?.grid?.size ?? 100;

const position = {
    x: targetCenter.x - (gridSize * (pushDistance / 5) * Math.sign(tokenCenter.x - targetCenter.x)),
    y: targetCenter.y - (gridSize * (pushDistance / 5) * Math.sign(tokenCenter.y - targetCenter.y)),
};

const backposition = {
    x: (targetCenter.x - tokenCenter.x) * -0.1,
    y: (targetCenter.y - tokenCenter.y) * -0.1,
};

const middleposition = {
    x: (targetCenter.x - tokenCenter.x) * 0.26,
    y: (targetCenter.y - tokenCenter.y) * 0.26,
};

const distanceX = Math.abs(tokenCenter.x - targetCenter.x);
const distanceY = Math.abs(tokenCenter.y - targetCenter.y);

if (distanceY < distanceX) {
    position.y = targetCenter.y;
    middleposition.y = 0;
    backposition.y = 0;
} else if (distanceX < distanceY) {
    position.x = targetCenter.x;
    middleposition.x = 0;
    backposition.x = 0;
}

const tokenWidth = token.document?.width ?? token.width ?? 1;

const sequence = new Sequence();

sequence
    .animation()
        .on(token)
        .opacity(0)
        .delay(100)

    .effect()
        .file(closest("eskie.smoke.02.white"))
        .atLocation({ x: tokenCenter.x - backposition.x, y: tokenCenter.y - backposition.y })
        .rotateTowards(target)
        .size(tokenWidth * 2.15, { gridUnits: true })
        .spriteOffset({ x: -1.5 }, { gridUnits: true })
        .spriteRotation(180)
        .belowTokens()
        .delay(150)

    .canvasPan()
        .delay(250)
        .shake({ duration: 250, strength: 2, rotation: false })

    .effect()
        .copySprite(token)
        .atLocation(token)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("spriteContainer", "position.x", { from: 0, to: backposition.x, duration: 250, ease: "easeOutExpo", delay: 200 })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: backposition.y, duration: 250, ease: "easeOutExpo", delay: 200 })
        .animateProperty("spriteContainer", "position.x", { from: 0, to: middleposition.x - backposition.x, duration: 150, ease: "easeOutExpo", delay: 1000 })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: middleposition.y - backposition.y, duration: 150, ease: "easeOutExpo", delay: 1000 })
        .animateProperty("spriteContainer", "position.x", { from: 0, to: -middleposition.x, duration: 450, ease: "easeOutQuad", delay: 1150 })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -middleposition.y, duration: 450, ease: "easeOutQuad", delay: 1150 })
        .duration(1750)

    .animation()
        .on(token)
        .opacity(1)
        .delay(1650)

    .effect()
        .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.slow`))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(effectSize, { considerTokenScale: true })
        .spriteOffset({ x: effectOffset * tokenWidth }, { gridUnits: true })
        .randomizeMirrorY()
        .zIndex(1)
        .delay(1000)

    .effect()
        .file(closest("jb2a.gust_of_wind.veryfast"))
        .atLocation(token)
        .stretchTo(position, { onlyX: true })
        .opacity(0.75)
        .belowTokens()
        .fadeOut(1000)
        .delay(1500)

    .effect()
        .delay(1000)
        .file(closest("eskie.trail.token.generic.01.white"))
        .atLocation(token)
        .rotateTowards(position)
        .scaleToObject(1.5, { considerTokenScale: true })
        .startTime(750)
        .spriteOffset({ x: -1.25 }, { gridUnits: true })

    .wait(1000)

    .effect()
        .file(closest(`eskie.damage.${type}.01.yellow`))
        .atLocation(target)
        .size(tokenWidth * 1.5, { gridUnits: true })
        .zIndex(1)

    .wait(250)

    .animation()
        .on(target)
        .opacity(0)
        .delay(100)

    .effect()
        .copySprite(target)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .moveTowards(position, { rotate: false, ease: "easeOutCirc", delay: 200 })
        .moveSpeed(1250)
        .waitUntilFinished(-100)

    .animation()
        .on(target)
        .moveTowards(position, { relativeToCenter: true })
        .snapToGrid()
        .opacity(1);

await sequence.play();
