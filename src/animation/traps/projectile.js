/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { setupTrap } from './trap-manager.js';
import { log } from '../../lib/logger.js';
import { adapter } from '../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../utils/sound.js';

const DEFAULT_CONFIG = {
    targetTile: null,
    projectileType: 'arrow',
    repeats: 10,
    repeatDelay: 50,
    splashScale: 1.5,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { targetTile, projectileType, sound, repeats, repeatDelay, splashScale } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const targetList = (targets && targets.length > 0) ? [targets].flat().filter(Boolean) : adapter.getTokensInPlaceable(tile);

    const tileBounds = adapter.getBounds(tile);
    const tileCenter = tileBounds.center;

    // Retrieve target/landing tile from config
    const targetLoc = adapter.getCenter(targetTile);

    if (!targetLoc) {
        log.warn(`Projectile Trap: Tile "${tile.id}" has no configured target tile.`);
        let seq = new Sequence();
        applySound(seq, sound);
        return seq;
    }

    let seq = new Sequence();
    applySound(seq, sound);
    if (projectileType === 'javelin') {
        seq = seq.wait(500);
    }

    if (projectileType === 'javelin') {
        const offset = targetLoc.x < tileCenter.x ? -0.15 : 0.15;
        seq = seq
            .effect()
            .file(closest('jb2a.javelin.01.throw'))
            .atLocation(tileCenter, { offset: { y: offset }, gridUnits: true })
            .stretchTo(targetLoc)
            .startTime(750)
            .waitUntilFinished(-1500);
    } else if (projectileType === 'dart') {
        const offset = targetLoc.x < tileCenter.x ? -0.15 : 0.15;
        seq = seq
            .effect()
            .file(closest('jb2a.dart.01.throw.physical.white'))
            .atLocation(tileCenter, { offset: { y: offset }, gridUnits: true })
            .stretchTo(targetLoc, { randomOffset: 0.85, gridUnits: true })
            .startTime(750)
            .repeats(repeats, repeatDelay, repeatDelay);
    } else {
        seq = seq
            .effect()
            .file(closest('jb2a.arrow.physical.white.01'))
            .atLocation(tileCenter)
            .stretchTo(targetLoc, { randomOffset: 0.65, gridUnits: true })
            .startTime(350)
            .repeats(repeats, repeatDelay, repeatDelay);
    }

    if (targetList.length > 0) {
        targetList.forEach(target => {
            const targetDoc = target.document;
            const targetWidth = targetDoc.width;
            const targetScaleX = targetDoc.texture.scaleX;
            const targetRotation = adapter.getTokenRotation(target);

            if (projectileType === 'javelin') {
                seq = seq
                    // Shaking copy sprite for target hit feedback
                    .effect()
                    .copySprite(target)
                    .spriteRotation(-targetRotation)
                    .attachTo(target)
                    .scaleToObject(1, { considerTokenScale: true })
                    .fadeIn(250)
                    .fadeOut(750)
                    .loopProperty('spriteContainer', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
                    .duration(1000)
                    .opacity(0.25)

                    // Blood splash side effect spraying from impact point
                    .effect()
                    .file(closest('jb2a.liquid.splash_side.red'))
                    .atLocation(target)
                    .size(splashScale * targetWidth * targetScaleX, { gridUnits: true })
                    .spriteOffset({ x: -0.25 }, { gridUnits: true })
                    .rotateTowards(tileCenter);
            } else if (projectileType === 'dart') {
                seq = seq
                    // Green poison tint effect
                    .effect()
                    .copySprite(target)
                    .spriteRotation(-targetRotation)
                    .delay(250)
                    .attachTo(target)
                    .scaleToObject(1, { considerTokenScale: true })
                    .fadeIn(250)
                    .fadeOut(1000)
                    .duration(5000)
                    .tint('#a7fe06')
                    .opacity(0.5)

                    // Poison hit token shake
                    .effect()
                    .copySprite(target)
                    .spriteRotation(-targetRotation)
                    .delay(250)
                    .attachTo(target)
                    .scaleToObject(1, { considerTokenScale: true })
                    .fadeIn(250)
                    .fadeOut(750)
                    .loopProperty('spriteContainer', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
                    .duration(1000)
                    .opacity(0.25)

                    // Green bubble markers
                    .effect()
                    .file(closest('jb2a.markers.bubble.02.complete.green'))
                    .delay(250)
                    .attachTo(target, { offset: { x: 0.25, y: -0.25 }, gridUnits: true })
                    .scaleToObject(0.75, { considerTokenScale: true });
            } else {
                seq = seq
                    .effect()
                    .copySprite(target)
                    .spriteRotation(-targetRotation)
                    .delay(250)
                    .attachTo(target)
                    .scaleToObject(1, { considerTokenScale: true })
                    .fadeIn(250)
                    .fadeOut(750)
                    .loopProperty('spriteContainer', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
                    .duration(1000)
                    .opacity(0.25);
            }
        });
    }

    return seq;
}

async function play(tile, targets, config = {}) {
    config = settingsOverride(config);
    const seq = await create(tile, targets, config);
    return seq.play();
}

async function stop(tile, config = {}) {
    // No persistent effects to stop
}

async function setup(config = {}) {
    let projectileType = config.projectileType;
    if (!projectileType) {
        projectileType = await adapter.buttonDialog({
            title: game.i18n.localize('EMP.traps.projectile.chooseTypeTitle'),
            buttons: [
                { label: game.i18n.localize('EMP.traps.projectile.arrow'), value: 'arrow' },
                { label: game.i18n.localize('EMP.traps.projectile.dart'), value: 'dart' },
                { label: game.i18n.localize('EMP.traps.projectile.javelin'), value: 'javelin' },
            ],
        }, {
            content: game.i18n.localize('EMP.traps.projectile.chooseTypeContent')
        });
    }

    if (!projectileType) return ui.notifications.warn(game.i18n.localize('EMP.traps.projectile.noTypeChosen'));

    const setupConfig = {
        tileCount: 3,
        projectileType: projectileType,
        ...config
    };

    const playPath = config.playPath ?? 'eskie.traps.projectile';
    return setupTrap(playPath, setupConfig);
}

export const projectile = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
