import { adapter } from '../../adapters/index.js';
import { localize, format } from '../../lib/utils.js';

import { bullRushStatue } from './bull-rush-statue.js';
import { electricDoor } from './electric-door.js';
import { fallingRocks } from './falling-rocks.js';
import { fire } from './fire.js';
import { floodingRoom } from './flooding-room.js';
import { pitfall } from './pitfall.js';
import { fallingSky } from './falling-sky.js';
import { projectile } from './projectile.js';
import { rollingBoulder } from './rolling-boulder.js';
import { spike } from './spike.js';

// High level setup function to select between different traps to configure
async function setup (config = {}) {
    const activeTrapKeys = Object.keys(traps).filter(key => key !== 'setup');
    const buttons = activeTrapKeys.map(key => {
        const fallback = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
        const label = localize(`EMP.traps.name.${key}`, fallback);
        return { label, value: key };
    });

    const chosenTrapKey = await adapter.buttonDialog({
        title: localize('EMP.traps.setup.chooseTrapTitle'),
        buttons: buttons,
    }, {
        classes: ['emp-vertical-dialog'],
        content: localize('EMP.traps.setup.chooseTrapContent')
    });

    if (!chosenTrapKey) {
        ui.notifications.warn(localize('EMP.traps.setup.noTrapChosen'));
        return;
    }

    const trap = traps[chosenTrapKey];
    if (trap && typeof trap.setup === 'function') {
        return trap.setup(config);
    } else {
        ui.notifications.error(format('EMP.traps.setup.noSetupMethod', { name: chosenTrapKey }));
    }
}

export const traps = {
    bullRushStatue,
    electricDoor,
    fallingRocks,
    fire,
    floodingRoom,
    pitfall,
    fallingSky,
    projectile,
    rollingBoulder,
    spike,

    setup
};