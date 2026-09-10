/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { setupTrap } from './trap-manager.js';
import { log, notify } from '../../lib/logger.js';
import { adapter } from '../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../utils/sound.js';

export interface ProjectileTrapConfig extends TrapConfig {
    targetLocation?: { x: number; y: number } | string | null;
    projectileType?: 'arrow' | 'dart' | 'javelin' | string;
    repeats?: number;
    repeatDelay?: number;
    splashScale?: number;
    sound?: SoundConfig;
}

const DEFAULT_CONFIG: ProjectileTrapConfig = {
    targetLocation: null,
    projectileType: 'arrow',
    repeats: 10,
    repeatDelay: 50,
    splashScale: 1.5,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(trapObject: Tile, targets: Token[] = [], config: ProjectileTrapConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const { targetLocation, projectileType, sound, repeats, repeatDelay, splashScale } = adapter.mergeObject(DEFAULT_CONFIG, config);

    const trapBounds = adapter.getBounds(trapObject);
    const trapCenter = trapBounds.center;

    // Retrieve target/landing location from config
    const targetLoc = targetLocation ? adapter.getTargetLocation(targetLocation) : null;

    if (!targetLoc) {
        log.warn(`Projectile Trap: Placeable "${trapObject.id}" has no configured target location.`);
        let seq = new Sequence();
        applySound(seq, sound);
        return seq;
    }

    if (Math.hypot(targetLoc.x - trapCenter.x, targetLoc.y - trapCenter.y) < 1) {
        const errorMsg = `Projectile Trap: Placeable "${trapObject.id}" target location is identical to origin location.`;
        log.error(errorMsg);
        notify.error(errorMsg);
        throw new Error(errorMsg);
    }

    let seq = new Sequence();
    applySound(seq, sound);
    if (projectileType === 'javelin') {
        seq = seq.wait(500);
    }

    if (projectileType === 'javelin') {
        const offset = targetLoc.x < trapCenter.x ? -0.15 : 0.15;
        seq = seq
            .effect()
            .file(closest('jb2a.javelin.01.throw'))
            .atLocation(trapCenter, { offset: { y: offset }, gridUnits: true })
            .stretchTo(targetLoc)
            .startTime(750)
            .waitUntilFinished(-1500);
    } else if (projectileType === 'dart') {
        const offset = targetLoc.x < trapCenter.x ? -0.15 : 0.15;
        seq = seq
            .effect()
            .file(closest('jb2a.dart.01.throw.physical.white'))
            .atLocation(trapCenter, { offset: { y: offset }, gridUnits: true })
            .stretchTo(targetLoc, { randomOffset: 0.85, gridUnits: true })
            .startTime(750)
            .repeats(repeats, repeatDelay, repeatDelay);
    } else {
        seq = seq
            .effect()
            .file(closest('jb2a.arrow.physical.white.01'))
            .atLocation(trapCenter)
            .stretchTo(targetLoc, { randomOffset: 0.65, gridUnits: true })
            .startTime(350)
            .repeats(repeats, repeatDelay, repeatDelay);
    }

    if (targets.length > 0) {
        targets.forEach(target => {
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
                    .rotateTowards(trapCenter);
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

async function play(trapObject: Tile, targets: Token[] = [], config: ProjectileTrapConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const seq = await create(trapObject, targets, config);
    return seq.play();
}

async function stop(trapObject: Tile, config: ProjectileTrapConfig = {}): Promise<void> {
    // No persistent effects to stop
}

async function setup(config: Record<string, unknown> = {}): Promise<any> {
    let projectileType: any = config.projectileType;
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

    const playPath = (config.playPath as string | undefined) ?? 'eskie.traps.projectile';
    return setupTrap(playPath, setupConfig);
}

export const projectile: TrapModule<ProjectileTrapConfig> = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
