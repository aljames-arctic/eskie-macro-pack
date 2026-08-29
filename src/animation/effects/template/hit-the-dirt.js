import { closest } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

import { adapter } from "../../../adapters/index.js";
//Last Updated: 4/30/2024
//Author: EskieMoh#2969

const DEFAULT_CONFIG = {
    id: 'hitTheDirt',
    label: 'Hit the Dirt',
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token, config, options) {
    if (options?.type == 'aefx') return;
    const { id, template, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    const cfg = {
        radius: 1,
        icon: 'icons/magic/control/silhouette-fall-slip-prone.webp',
        label: 'Hit The Dirt!'
    };
    let [position, _] = await templatelib.getPosition(template, cfg);
    if (!position) { return; }

    let seq = new Sequence();
    applySound(seq, sound);
    seq = seq
        .animation()
        .delay(100)
        .on(token)
        .opacity(0)

        .effect()
        .delay(100)
        .file(closest("eskie.smoke.06.white"))
        .atLocation(token)
        .scaleToObject(1.1)
        .belowTokens()
        .playbackRate(1.5)
        .opacity(0.5)

        .effect()
        .copySprite(token)
        .spriteRotation(-token.document.rotation)
        .atLocation(token)
        .scaleToObject(0.85, { considerTokenScale: true })
        .moveTowards(position, { delay: 100, rotate: false, ease: "easeOutQuint" })
        .duration(1600)
        .belowTokens()
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.5)

        .effect()
        .delay(900)
        .file(closest("eskie.smoke.01.white"))
        .atLocation(position)
        .rotateTowards(token)
        .scaleToObject(1.5)
        .belowTokens()
        .spriteOffset({ x: -1.25 }, { gridUnits: true })
        .spriteRotation(-180)
        .opacity(0.5)

        // Animate the token jumping
        .effect()
        .copySprite(token)
        .spriteRotation(-token.document.rotation)
        .atLocation(token)
        .scaleToObject(1, { considerTokenScale: true })
        .moveTowards(position, { delay: 100, rotate: false, ease: "easeOutQuint" })    // Horizontal Movement
        .duration(1300)
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.8, duration: 550, delay: 100, gridUnits: true, ease: "easeOutQuint" })
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.8, duration: 550, delay: 650, gridUnits: true, ease: "easeOutQuad" })
        .animateProperty('sprite', 'rotation', { from: 0, to: 90, duration: 500, delay: 100, ease: "easeOutCubic" })
        .waitUntilFinished(-200)

        // Update the actual token
        .animation()
        .on(token)
        .teleportTo(position, { relativeToCenter: true })
        .rotate(token.document.rotation + 90)
        .opacity(1);
    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

function destroy(token, config = {}) {
    let seq = new Sequence()
        .animation()
        .on(token)
        .rotate(token.document.rotation - 90);
    return seq;
}

async function stop(token, config = {}) {
    const seq = destroy(token, config);
    if (seq) return seq.play();
}

export const hitTheDirt = {
    create,
    play,
    destroy,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register("hitTheDirt", 'template', 'eskie.effect.hitTheDirt', DEFAULT_CONFIG, "0.0.1", "Hit the Dirt");
autorec.register("hitTheDirt", 'effect', 'eskie.effect.hitTheDirt', DEFAULT_CONFIG, "0.0.1", "Hit the Dirt");