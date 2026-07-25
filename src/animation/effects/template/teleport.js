// Original Author: Unknown (from discord)
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { template } from '../../../lib/templates.js';
import { teleportIn } from "./teleport/teleportIn.js";
import { teleportOut } from "./teleport/teleportOut.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'Teleportation',
};

async function create(token, config = {}) {
    const { id, template, targets } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});

    const portalEntry = Sequencer.Database.getEntry(closest("jb2a.portals.vertical.vortex.purple"));
    const portalPath = typeof portalEntry === "string" ? portalEntry : (portalEntry?.file ?? portalEntry?.files?.[0]);

    const cfg = { 
        radius: 1,
        max: 500,
        icon: portalPath, 
        label: 'Teleportation Destination',
    };
    [config.position, _] = await template.getPosition(template, cfg);
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

autoanimations.register("teleport", "template", "eskie.effect.teleport", DEFAULT_CONFIG, "0.0.0", "Teleport");