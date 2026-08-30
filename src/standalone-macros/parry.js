// Standalone Macro: Parry
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Parry' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first() ?? token;

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const slowParry = false;
const type = "slashing";
const weight = "medium";
const color = "blue";

const deg = (rad) => (rad * 180) / Math.PI;
const src = token.center ?? { x: token.x ?? 0, y: token.y ?? 0 };
const tgtCenter = target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };

const baseRad = Math.atan2(tgtCenter.y - src.y, tgtCenter.x - src.x);
const baseDeg = deg(baseRad);

const tokenWidth = token.document?.width ?? token.width ?? 1;

const sequence = new Sequence();

sequence
    .animation()
        .on(token)
        .opacity(0)
        .delay(100)

    .effect()
        .name("Parry")
        .copySprite(token)
        .atLocation(token)
        .rotateTowards(target)
        .animateProperty("sprite", "position.x", { from: 0, to: -0.6, duration: 250, gridUnits: true, ease: "easeOutCubic", delay: 100 })
        .animateProperty("sprite", "position.x", { from: 0, to: 0.6, duration: 400, gridUnits: true, ease: "easeOutSine", delay: 450 })
        .duration(1000)
        .spriteRotation(-baseDeg)
        .spriteOffset({ x: -0.5 }, { gridUnits: true });

if (!slowParry) {
    sequence
        .effect()
            .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.normal.01`))
            .atLocation(token)
            .rotateTowards(target)
            .scaleToObject(2, { considerTokenScale: true })
            .spriteOffset({ x: -1.675 * tokenWidth }, { gridUnits: true })
            .randomizeMirrorY()
            .zIndex(1)

        .effect()
            .file(closest("eskie.particle.05.orange"))
            .atLocation(token)
            .scaleToObject(2, { considerTokenScale: true })
            .randomRotation()
            .zIndex(1.1);
} else {
    sequence
        .effect()
            .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.slow.01`))
            .atLocation(token)
            .rotateTowards(target)
            .scaleToObject(2, { considerTokenScale: true })
            .spriteOffset({ x: -1.675 * tokenWidth }, { gridUnits: true })
            .randomizeMirrorY()
            .zIndex(1)

        .effect()
            .file(closest("eskie.particle.07.orange"))
            .atLocation(token)
            .rotateTowards(target)
            .scaleToObject(1.5, { considerTokenScale: true })
            .zIndex(1.1)
            .spriteOffset({ x: -1.25 * tokenWidth }, { gridUnits: true });
}

sequence
    .wait(850)
    .animation()
        .on(token)
        .opacity(1);

await sequence.play({ preload: true });
