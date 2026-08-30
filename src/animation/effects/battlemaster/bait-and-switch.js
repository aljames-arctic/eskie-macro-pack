// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'baitAndSwitch',
    sound: {
        ...DEFAULT_SOUND_CONFIG,
        enable: false,
        file: '',
    },
};

async function create(token, target, config = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound } = mConfig;

    if (!token || !target) return;

    const tokenCenter = token.center ?? { x: token.x ?? 0, y: token.y ?? 0 };
    const targetCenter = target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };

    let blurDirectionX = 0;
    let blurDirectionY = 0;
    if (token.x === target.x) blurDirectionY = 15;
    if (token.y === target.y) blurDirectionX = 20;

    const sequence = new Sequence();
    applySound(sequence, sound);

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
            .moveTowards(token, { rotate: false, ease: 'easeInBack', delay: 250 })
            .moveSpeed(500)
            .duration(1000)
            .zIndex(0.2)

        .effect()
            .copySprite(token)
            .scaleToObject(1, { considerTokenScale: true })
            .moveTowards(target, { rotate: false, ease: 'easeOutCubic', delay: 500 })
            .moveSpeed(300)
            .duration(1250)

        .effect()
            .copySprite(token)
            .scaleToObject(1, { considerTokenScale: true })
            .moveTowards(target, { rotate: false, ease: 'easeOutCubic', delay: 500 })
            .moveSpeed(300)
            .duration(1250)
            .opacity(0.85)
            .fadeIn(50, { delay: 500 })
            .fadeOut(500, { ease: 'easeOutQuint' })
            .filter('Blur', { blurX: blurDirectionX, blurY: blurDirectionY })
            .zIndex(0.1)

        .effect()
            .file(closest('eskie.smoke.01.white'))
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

    return sequence;
}

async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

function stop() {
    // Transient animation
}

export const baitAndSwitch = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register('baitAndSwitch', 'melee-target', 'eskie.effect.battlemaster.baitAndSwitch', DEFAULT_CONFIG, '0.0.1', 'Bait and Switch');
