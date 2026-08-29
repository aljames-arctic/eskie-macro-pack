// Original Author: Unknown (from Discord animations)
// Modular Conversion: bakanabaka

import { closest, absolutePath } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'DimensionDoor',
    sound: {
        teleportOut: { ...DEFAULT_SOUND_CONFIG },
        teleportIn: { ...DEFAULT_SOUND_CONFIG }
    }
};

async function create(token, config = {}) {
    const { id, template, sound } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    const cfg = { 
        radius: 1,
        max: 500,
        icon: absolutePath("jb2a.portals.vertical.vortex.purple"), 
        label: 'Dimension Door'
    };
    let [position, _] = await templatelib.getPosition(template, cfg);
    if (!position) { return; }

    let sequence = new Sequence();
    applySound(sequence, sound?.teleportOut ?? sound);

    sequence.animation()
        .on(token)
        .opacity(0)

        .effect()
            .file(closest("jb2a.fireball.beam.purple"))
            .atLocation(token)
            .stretchTo(position)
            .belowTokens()
            .playbackRate(3)
            .startTime(2200)
            .opacity(0.5)
            .zIndex(0)

        .effect()
            .file(closest("jb2a.portals.vertical.vortex.purple"))
            .atLocation(token)
            .rotateTowards(position)
            .belowTokens()
            .scaleOut(0, 400, {ease: "easeOutQuint"})
            .scale({ x:token.document.width / 2, y: token.document.height / 2 })
            .rotate(-90)
            .anchor({ x: 0.5, y: 0.8 })
            .duration(3000)
            .zIndex(1)
            .waitUntilFinished(-2000)

        .effect()
            .file(closest("jb2a.portals.vertical.vortex.purple"))
            .atLocation(position)
            .rotateTowards(token)
            .rotate(90)
            .duration(3000)
            .scaleOut(0, 400, {ease: "easeOutQuint"})
            .scale({ x:token.document.width / 2, y: token.document.height / 2 })
            .anchor({ x: 0.5, y: 0.2 })
            .mirrorY()
            .belowTokens()
            .zIndex(1)

        .effect()
            .file(closest("jb2a.side_impact.part.slow.spiral.pinkpurple"))
            .atLocation(position)
            .scale({x:0.125, y:0.15})
            .playbackRate(1.75)
            .rotateTowards(token)
            .rotate(180)
            .anchor({ x: 0.9, y: 0.5 });

    applySound(sequence, sound?.teleportIn);

    sequence.animation()
            .on(token)
            .teleportTo(position, { offset: { x: -1, y: -1 } })
            .snapToGrid()
            .waitUntilFinished()

        .animation()
            .on(token)
            .opacity(1)
            .duration(500);
        
    return sequence;
}

async function play(token, config = {}) {
    const sequence = await create(token, config);
    if (sequence) {
        sequence.play();
    }
}

export const dimensionDoor = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};

autorec.register("dimensionDoor", "template", "eskie.effect.dimensionDoor", DEFAULT_CONFIG, "0.0.1", "Dimension Door");
