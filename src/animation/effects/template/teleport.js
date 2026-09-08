// Original Author: Unknown (from discord)
// Modular Conversion: bakanabaka

import { absolutePath } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { teleportIn } from "./teleport/teleportIn.js";
import { teleportOut } from "./teleport/teleportOut.js";
import { DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
import { adapter } from "../../../adapters/index.js";

const DEFAULT_CONFIG = {
    id: 'Teleportation',
    sound: {
        teleportOut: { ...DEFAULT_SOUND_CONFIG },
        teleportIn: { ...DEFAULT_SOUND_CONFIG }
    }
};

async function create(token, config = {}, options = {}) {
    if (options?.type == "aefx") return;
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, template } = mConfig;
    const targets = mConfig.targets ?? (Array.isArray(config.targets) ? config.targets : Array.from(game.user?.targets ?? []));

    const cfg = { 
        radius: 1,
        max: 500,
        icon: absolutePath("jb2a.portals.vertical.vortex.purple"), 
        label: 'Teleportation Destination',
    };
    const [position] = await templatelib.getPosition(template, cfg);
    if (!position || position.cancelled) { return; }

    const execConfig = { ...mConfig, position };

    let [tOut, tIn] = await Promise.all([
        teleportOut.create(token, targets, execConfig),
        teleportIn.create(token, targets, execConfig),
    ]);

    if (!tOut || !tIn) return;

    return new Sequence()
        .addSequence(tOut.waitUntilFinished())
        .addSequence(tIn);
}

async function play(token, config = {}, options = {}) {
    if (options?.type == "aefx") return;
    let seq = await create(token, config, options);
    if (seq) return seq.play();
}

function stop(token, { id = DEFAULT_CONFIG.id } = {}) {
    // Instantaneous sequence; stop handler provided for interface consistency
}

export const teleport = {
    play,
    create,
    stop,
    in: teleportIn,
    out: teleportOut,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("teleport", "template", "eskie.effect.teleport", DEFAULT_CONFIG, "0.0.1", "Teleport");