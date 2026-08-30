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

let blurDirectionX = 0;
let blurDirectionY = 0;
if (token.x === target.x) blurDirectionY = 15;
if (token.y === target.y) blurDirectionX = 20;

const sequence = new Sequence();

sequence
    .animation()
        .on(target)
        .opacity(0)
        .delay(150)

    .animation()
        .on(token)
        .opacity(0)
        .delay(250)

    .effect()
        .copySprite(target)
        .scaleToObject(1, { considerTokenScale: true })
        .moveTowards(token, { rotate: false, ease: "easeInBack", delay: 250 })
        .moveSpeed(500)
        .duration(1000)
        .zIndex(0.2)

    .effect()
        .copySprite(token)
        .scaleToObject(1, { considerTokenScale: true })
        .moveTowards(target, { rotate: false, ease: "easeOutCubic", delay: 500 })
        .moveSpeed(300)
        .duration(1250)

    .effect()
        .copySprite(token)
        .scaleToObject(1, { considerTokenScale: true })
        .moveTowards(target, { rotate: false, ease: "easeOutCubic", delay: 500 })
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
        .spriteRotation(180)

    .animation()
        .delay(1000)
        .on(token)
        .teleportTo(targetCenter, { relativeToCenter: false })
        .snapToGrid()
        .opacity(1)

    .animation()
        .delay(750)
        .on(target)
        .teleportTo(tokenCenter, { relativeToCenter: false })
        .snapToGrid()
        .opacity(1);

await sequence.play();
