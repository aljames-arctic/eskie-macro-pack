// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../../lib/filemanager.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../../utils/sound.js";
import { adapter } from "../../../../adapters/index.js";

const DEFAULT_CONFIG = {
    id: 'TeleportIn',
    sound: {
        teleportIn: { ...DEFAULT_SOUND_CONFIG }
    }
};

function create(token: any, targets: any[] = [], config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, position } = mConfig;
    if (!position) return;
    const gridSize = adapter.getSceneDimensions(canvas?.scene).size;
    const tokenCenter = adapter.getCenter(token);
    const tokenX = token?.x ?? (tokenCenter.x - gridSize / 2);
    const tokenY = token?.y ?? (tokenCenter.y - gridSize / 2);
    const maxDistance = targets.length > 0 
        ? Math.max(...targets.map(target => 3 * Math.max(Math.abs((target?.x ?? 0) - tokenX), Math.abs((target?.y ?? 0) - tokenY)) / gridSize + 1))
        : 1;
    const tokenRotation = adapter.getTokenRotation(token);

    let sequence = new Sequence();
    applySound(sequence, mConfig.sound.teleportIn);
    sequence = sequence.animation()
        .on(token)
        .teleportTo(position)
        .snapToGrid()
        .offset({ x: -1, y: -1 });
    targets.forEach(target => {
        const targetCenter = adapter.getCenter(target);
        let targetX = position.x + (targetCenter.x - tokenCenter.x);
        let targetY = position.y + (targetCenter.y - tokenCenter.y);
        sequence = sequence.animation()
            .on(target)
            .teleportTo({ x: targetX, y: targetY })
            .snapToGrid()
            .offset({ x: -1, y: -1 })
    });

    sequence = sequence.effect()
        .file(closest("jb2a.magic_signs.circle.02.conjuration.intro.blue"))
        .atLocation(token)
        .belowTokens()
        .scaleToObject(maxDistance)
        .filter("ColorMatrix", { saturate: -0.25, brightness: 1 })
        .opacity(0.8)
        .waitUntilFinished(-500);
    sequence = sequence.effect()
        .file(closest("jb2a.magic_signs.circle.02.conjuration.loop.blue"))
        .atLocation(token)
        .filter("ColorMatrix", { saturate: -0.5, brightness: 1.5 })
        .opacity(0.65)
        .belowTokens()
        .scaleToObject(maxDistance)
        .duration(2500)
        .waitUntilFinished(-1500);

    sequence = sequence.effect()
        .copySprite(token)
        .spriteRotation(-tokenRotation)
        .atLocation(token)
        .scaleToObject(1.1, { considerTokenScale: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 10 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .animateProperty('spriteContainer', 'position.y', { from: -1000, to: 0, duration: 500, ease: "easeOutCubic" })
        .duration(500)
        .attachTo(token, { bindAlpha: false });
    targets.forEach(target => {
        sequence = sequence.effect()
            .copySprite(target)
            .spriteRotation(-adapter.getTokenRotation(target))
            .atLocation(target)
            .scaleToObject(1.1, { considerTokenScale: true })
            .filter("ColorMatrix", { saturate: -1, brightness: 10 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .animateProperty('spriteContainer', 'position.y', { from: -1000, to: 0, duration: 500, ease: "easeOutCubic" })
            .duration(500)
            .attachTo(target, { bindAlpha: false });
    });

    sequence = sequence.waitUntilFinished()
    sequence = sequence.animation()
        .on(token)
        .opacity(1.0)
        .show();
    targets.forEach(target => {
        sequence = sequence.animation()
            .on(target)
            .opacity(1.0)
            .show()
    });
    
    return sequence;
}

async function play(token: any, targets: any[] = [], config: any = {}) {
    const sequence = create(token, targets, config);
    if (sequence) { return sequence.play(); }
}

function stop(token: any, { id = DEFAULT_CONFIG.id }: any = {}) {
    // Instantaneous effect
}

export const teleportIn = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
