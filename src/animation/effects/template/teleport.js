// Original Author: Unknown (from discord)
// Modular Conversion: bakanabaka

import { absolutePath } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { teleportIn } from "./teleport/teleportIn.js";
import { teleportOut } from "./teleport/teleportOut.js";
import { autorec, CONCENTRATING } from "../../../adapters/modules/autorec/autorec-module-adapter.js";
import { DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";

const DEFAULT_CONFIG = {
    id: 'Teleportation',
    sound: {
        teleportOut: { ...DEFAULT_SOUND_CONFIG },
        teleportIn: { ...DEFAULT_SOUND_CONFIG }
    }
};

async function create(token, config = {}) {
    const { id, template, targets } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});

    const cfg = { 
        radius: 1,
        max: 500,
        icon: absolutePath("jb2a.portals.vertical.vortex.purple"), 
        label: 'Teleportation Destination',
    };
    [config.position, _] = await templatelib.getPosition(template, cfg);
    if (!config.position) { return; }

    let [tOut, tIn] = await Promise.all([
        teleportOut.create(token, targets, config),
        teleportIn.create(token, targets, config),
    ]);

    return new Sequence()
        .addSequence(tOut.waitUntilFinished())
        .addSequence(tIn);
}

async function play(token, config = {}) {
    let seq = await create(token, config);
    if (seq) return seq.play();
}

export const teleport = {
    play,
    create,
    in: teleportIn,
    out: teleportOut,
    default_config: DEFAULT_CONFIG,
};

autorec.register("teleport", "template", "eskie.effect.teleport", DEFAULT_CONFIG, "0.0.1", "Teleport");