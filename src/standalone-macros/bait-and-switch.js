// Standalone Macro: Bait and Switch
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Bait and Switch' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const tokenCenter = token.center ?? { x: token.x ?? 0, y: token.y ?? 0 };
const targetCenter = target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };
const tokenDelta = { x: targetCenter.x - tokenCenter.x, y: targetCenter.y - tokenCenter.y };
const targetDelta = { x: tokenCenter.x - targetCenter.x, y: tokenCenter.y - targetCenter.y };
const dist = Math.hypot(tokenDelta.x, tokenDelta.y);

const targetMoveDuration = Math.max(1, Math.round((dist / 500) * 1000));
const tokenMoveDuration = Math.max(1, Math.round((dist / 300) * 1000));
const targetArrive = Math.max(750, 250 + targetMoveDuration);
const tokenArrive = Math.max(1000, 500 + tokenMoveDuration);

let blurDirectionX = 0;
let blurDirectionY = 0;
if (token.x === target.x) blurDirectionY = 15;
if (token.y === target.y) blurDirectionX = 20;

const sequence = new Sequence();

if (dist >= 1) {
    sequence
        .motion(target)
            .zIndex(0.2)
            .moveBy(targetDelta, {
                delay: 250,
                duration: targetMoveDuration,
                ease: "easeInBack",
                return: false,
            })
            .persistUntilUpdate()

        .motion(token)
            .moveBy(tokenDelta, {
                delay: 500,
                duration: tokenMoveDuration,
                ease: "easeOutCubic",
                return: false,
            })
            .persistUntilUpdate();
}

sequence
    .effect()
        .copySprite(token)
        .atLocation(tokenCenter)
        .scaleToObject(1, { considerTokenScale: true })
        .moveTowards(targetCenter, { rotate: false, ease: "easeOutCubic", delay: 500 })
        .moveSpeed(300)
        .duration(1250)
        .opacity(0.85)
        .fadeIn(50, { delay: 500 })
        .fadeOut(500, { ease: "easeOutQuint" })
        .filter("Blur", { blurX: blurDirectionX, blurY: blurDirectionY })
        .zIndex(0.1)

    .effect()
        .file(closest("eskie.smoke.01.white"))
        .atLocation(targetCenter)
        .rotateTowards(tokenCenter)
        .scaleToObject(1.5, { considerTokenScale: true })
        .belowTokens()
        .delay(750)
        .opacity(0.4)
        .spriteOffset({ x: -0.5 }, { gridUnits: true })
        .mirrorX()
        .spriteRotation(180);

if (dist >= 1) {
    sequence
        .animation()
            .delay(targetArrive)
            .on(target)
            .teleportTo(tokenCenter, { relativeToCenter: true })
            .snapToGrid()

        .animation()
            .delay(tokenArrive)
            .on(token)
            .teleportTo(targetCenter, { relativeToCenter: true })
            .snapToGrid();
}

await sequence.play();
