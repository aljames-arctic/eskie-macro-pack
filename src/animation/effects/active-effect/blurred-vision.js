import { adapter } from "../../../adapters/index.js";
import { blur } from "../../scene-overlays/status-blur.js";
import { autorec } from "../../../adapters/modules/autorec/autorec-module-adapter.js";
import { log } from '../../../lib/logger.js';

/* **
   Originally Published: 1/12/2023
   Author: bakanabaka
** */

const DEFAULT_CONFIG = {
    id: 'blurred-vision',
    overlay: {
        applyPC: true,
        applyGM: false,
    },
    configs: [
        { id: 'blurred-vision', opacity: 1, blur: 3, sway: 1, durationX: 6500, durationY: 11000 },
        { id: 'blurred-vision', opacity: 0.57, blur: 3, sway: -0.9, durationX: 16500, durationY: 7000 },
        { id: 'blurred-vision', opacity: 0.47, blur: 3, sway: 1.1, durationX: 13000, durationY: 10500 },
    ]
}

function create(token, config = {}) {
    const { overlay, configs } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const seq = new Sequence();
    const owners = adapter.getTokenOwners(token, { applyPC: overlay.applyPC, applyGM: overlay.applyGM });

    const SEQUENCER_DEFAULT_OPACITY = 50;
    if (!overlay.applyGM && game.settings.get('sequencer', 'user-effect-opacity') === SEQUENCER_DEFAULT_OPACITY) {
        log.warn(`Sequencer user-effect-opacity is set to default (${SEQUENCER_DEFAULT_OPACITY}). This will cause the blurred vision effect to appear for GMs as well.`);
    }

    for (const effectConfig of configs) {
        seq.addSequence(blur.create(owners, effectConfig));
    }

    return seq;
}

async function play(token, config = {}) {
    const seq = create(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
    const { id, overlay, configs } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const owners = adapter.getTokenOwners(token, { applyPC: overlay.applyPC, applyGM: overlay.applyGM });
    return Promise.all(configs.map(c => blur.stop(owners, c)));
}

export const blurredVision = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register("blurredVision", "effect", "eskie.effect.blurredVision", DEFAULT_CONFIG, "0.0.0", "Blurred Vision");
