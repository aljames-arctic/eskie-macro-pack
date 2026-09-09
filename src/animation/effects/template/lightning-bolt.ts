/**
 * Original Author: .eskie
 * Modular Conversion: bakanabaka
 */

import { closest } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { log } from '../../../lib/logger.js';

const DEFAULT_CONFIG = {
    id: 'Lightning Bolt',
    distance: 100,
    width: 5,
    template: undefined,
    tintMap: false,
    sound: {
        secondary: {
            ...DEFAULT_SOUND_CONFIG,
            enable: true,
            volume: 0.5,
            file: 'psfx.3rd-level-spells.call-lightning.v1.secondary'
        },
        primary: {
            ...DEFAULT_SOUND_CONFIG,
            enable: true,
            volume: 0.5,
            delay: 500,
            file: 'psfx.3rd-level-spells.call-lightning.v1.primary'
        }
    }
};

async function create(token: any, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, template, tintMap, sound } = mConfig;

    const portalEntry = Sequencer.Database.getEntry(closest("jb2a.portals.vertical.vortex.purple"));
    const portalPath = portalEntry?.file ?? portalEntry?.files?.[0] ?? portalEntry;

    const cfg = { 
        distance: mConfig.distance ?? 100,
        width: mConfig.width ?? 5,
        type: 'ray',
        max: 500,
        icon: portalPath, 
        label: id,
        token
    };
    let [primary, secondary] = await templatelib.getPosition(template, cfg);
    if (!primary || !secondary || primary.cancelled || primary.error) { return; }

    const sourcePos = adapter.getCenter(token);
    const distPx = Math.hypot(secondary.x - primary.x, secondary.y - primary.y);
    log.debug('lightningBolt.create | Points for animation:', {
        source: sourcePos ? { ...sourcePos, name: token.name } : null,
        primary,
        secondary,
        distancePx: distPx
    });

    const sequence = new Sequence();
    applySound(sequence, sound);

    const tokenName = token.name;
    const bg = adapter.getSceneBackground(canvas?.scene);
    if (bg?.src && tintMap){
        const dimensions = adapter.getSceneDimensions(canvas?.scene);
        const sceneCenter = adapter.getSceneCenter(canvas?.scene);
        sequence.effect()
            .name(`Casting ${tokenName}`)
            .file(bg.src)
            .filter("ColorMatrix", { saturate: 1, brightness: 0.6 })
            .atLocation(sceneCenter)
            .size({ width: dimensions.width / dimensions.size, height: dimensions.height / dimensions.size }, { gridUnits: true })
            .persist()
            .fadeIn(500)
            .fadeOut(3000)
            .tint("#9eecff")
            .belowTokens()
            .spriteOffset({ x: -bg.offsetX, y: -bg.offsetY });
    }

    sequence.effect()
            .file(closest("jb2a.static_electricity.01.blue"))
            .atLocation(token)
            .fadeIn(500)
            .fadeOut(500)
            .scaleToObject(1.5)
            .duration(5000)
            .mask()
            .zIndex(2)

        .effect()
            .file(closest("eskie.lightning.02.blue"))
            .atLocation(token)
            .rotateTowards(secondary)
            .size({ width: 2, height: 1.8 }, { gridUnits: true })
            .spriteOffset({ x: -0.25 }, { gridUnits: true })
            .spriteScale({ x: 1.25 })
            .filter("ColorMatrix", { hue: -12, saturate: 2 })
            .zIndex(1)
            .waitUntilFinished()
        
        .effect()
            .file(closest("eskie.lightning.03.blue"))
            .atLocation(token)
            .rotateTowards(secondary)
            .size({ width: 2, height: 1.8 }, { gridUnits: true })
            .spriteOffset({ x: -0.5 }, { gridUnits: true })
            .spriteScale({ x: 1.25 })
            .filter("ColorMatrix", { hue: -12, saturate: 2 })
            .rotate(180)
            .zIndex(2)
        
        .canvasPan()
            .shake({ duration: 500, strength: 1.5, rotation: false, fadeOut: 250 })
        
        .effect()
            .file(closest("eskie.lightning.lightning_bolt.blue"))
            .atLocation(primary)
            .stretchTo(secondary, { tiling: false, onlyX: true })
            .filter("ColorMatrix", { hue: -12, saturate: 2 })
            .zIndex(3)
            .waitUntilFinished(-250)
        
        .thenDo(function(){
            Sequencer.EffectManager.endEffects({ name: `Casting ${tokenName}` });
        })
        
        .effect()
            .file(closest("eskie.lightning.04.blue"))
            .atLocation(token)
            .rotateTowards(secondary)
            .size({ width: 1.2, height: 1 }, { gridUnits: true })
            .spriteScale({ x: 1.25 })
            .filter("ColorMatrix", { hue: -12, saturate: 2 })
            .zIndex(1);
        
    return sequence;
}

async function play(token: any, config: any = {}) {
    const sequence = await create(token, config);    
    if (sequence) return sequence.play({ preload: true });
}

function stop(token: any) {
    Sequencer.EffectManager.endEffects({ name: `Casting ${token.name}` });
}

export const lightningBolt = {
    play,
    create,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("lightningBolt", "template", "eskie.effect.lightningBolt", DEFAULT_CONFIG, "0.0.3", "Lightning Bolt");
