/* **
   Original Author: derkreigs
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";
import { settingsOverride } from "../../../lib/settings.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'banish',
    sound: {
        enabled: true,
        volume: 0.5,
    },
    portal: {
        file: undefined,
        color: 'yellow',
        scale: 2,
        offset: { x: 0, y: -75 }
    }
};

function modifyPortal(portal, target) {
    if (portal?.file) return;
    
    let color = portal.color;
    if (game.system.id === "dnd5e") {
        const creatureType = target.actor?.system.details?.type?.value;

        // Colors -- Red, White, Purple, Blue, Green, Yellow, Orange
        if (creatureType) {
            switch (creatureType.toLowerCase()) {
                // Red
                case "fiend":
                case "ooze":
                    color = "red";
                    break;
                // White
                case "construct":
                    color = "white";
                    break;
                // Purple
                case "aberration":
                case "undead":
                case "humanoid":
                    color = "purple";
                    break;                
                // Blue
                case "dragon":     
                case "monstrosity":
                    color = "blue";
                    break;
                // Green
                case "beast":
                case "elemental":
                case "plant":
                    color = "green";
                    break;
                // Yellow
                case "celestial":
                case "giant":
                    color = "yellow";
                    break;
                // Orange
                case "fey":
                    color = "orange";
                    break;
            }
        }

        if (creatureType) {
            switch (creatureType.toLowerCase()) {
                // Oval Portal
                case "dragon":
                case "fiend":
                case "monstrosity":
                    portal.file = closest(`eskie.environment.portal.generic.01.center.one_shot.full.${color}`);
                    return;
                // MTG Warp
                case "aberration":
                    portal.scale = 3;
                    portal.offset.y = -150;
                    portal.file = closest(`eskie.environment.portal.warp.01.center.one_shot.full.${color}`);
                    return;
                // Door Front
                case "beast":
                case "elemental":
                case "plant":
                case "celestial":
                case "giant":
                case "humanoid":
                case "undead":
                    portal.file = closest(`eskie.environment.portal.doorway.01.center.one_shot.full.${color}`);
                    return;
                // Vertical MTG Warp
                case "construct":
                    portal.file = closest(`eskie.environment.portal.warp.01.side.loop.full.${color}`);
                // Vertical Tear
                case "fey":
                    portal.file = closest(`eskie.environment.portal.tear.01.center.one_shot.full.${color}`);
                    return;
                // Small Oval
                case "ooze":
                    portal.file = closest(`eskie.environment.portal.generic.01.side.one_shot.full.${color}`);
                    return;
            }
        }
    }

    // Pure default
    return closest(`jb2a.portals.vertical.vortex.${color}`);
}

async function createBanish(target, config = {}) {
    config = settingsOverride(config);
    const { sound, portal } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    modifyPortal(portal, target);

    const RUNE_DATA = {
        animDuration: 300,
        rotationDuration: 200,
        merge: { x: 0, y: -75 },
        runes: [
            { offset: { x: -45, y: -61 }, rotation: 3 * 360 / 5 },
            { offset: { x: 0, y: 75 }, rotation: 5 * 360 / 5 },
            { offset: { x: 45, y: -61 }, rotation: 2 * 360 / 5 },
            { offset: { x: -70, y: 22 }, rotation: 4 * 360 / 5 },
            { offset: { x: 70, y: 22 }, rotation: 1 * 360 / 5 },
        ]
    }

    const sequence = new Sequence();
    if (sound.enabled) {
        sequence.sound()
            .file(closest('psfx.magic-signs.circle.v1.abjuration.complete'))
            .volume(sound.volume)
    }
    sequence.effect()
        .file(closest(`jb2a.magic_signs.circle.02.conjuration.intro.${portal.color}`))
        .atLocation(target)
        .scaleToObject(2)
        .belowTokens();

    sequence.wait(3000);
    sequence.effect()
        .file(closest(`jb2a.magic_signs.circle.02.conjuration.loop.${portal.color}`))
        .atLocation(target)
        .scaleToObject(2)
        .belowTokens()
        .duration(13000)
        .fadeOut(1000);

    sequence.wait(3750);
    let runeDelay = 0;
    let animationDelay = 4000;
    for (const rune of RUNE_DATA.runes) {
        if (sound.enabled) {
            sequence.sound()
                .file(closest('psfx.casting.generic.001'))
                .volume(sound.volume)
                .delay(runeDelay + 750)
        }
        sequence.effect()
            .file(closest(`jb2a.magic_signs.rune.conjuration.complete.${portal.color}`))
            .atLocation(target, { offset: rune.offset })
            .scaleToObject(0.5)
            .delay(runeDelay)
            .playbackRate(0.65)
            .rotate(rune.rotation)
            .animateProperty('sprite', 'rotation', { from: rune.rotation, to: 720 + rune.rotation, duration: RUNE_DATA.rotationDuration, delay: animationDelay, ease: "easeInBack" })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: RUNE_DATA.merge.x - rune.offset.x, duration: RUNE_DATA.animDuration, delay: animationDelay + RUNE_DATA.rotationDuration, ease: "easeInBack" })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: RUNE_DATA.merge.y - rune.offset.y, duration: RUNE_DATA.animDuration, delay: animationDelay + RUNE_DATA.rotationDuration, ease: "easeInBack" })
            .duration(RUNE_DATA.animDuration + animationDelay - 800)
            .zIndex(0.1);
        runeDelay += RUNE_DATA.animDuration;
        animationDelay -= RUNE_DATA.animDuration;
    }

    sequence.wait(3000);
    if (sound.enabled) {
        sequence.sound()
            .file(closest('psfx.2nd-level-spells.moonbeam.intro'))
            .volume(sound.volume)
    }

    sequence.wait(1500);
    sequence.effect()
        .file(closest(`jb2a.explosion.01.${portal.color}`))
        .atLocation(target, { offset: { x: 5, y: -75 } })
        .delay(500)
        .scaleToObject(1.5)
        .zIndex(1);

    sequence.effect()
        .file(closest(portal.file))
        .atLocation(target, { offset: portal.offset })
        .scaleToObject(portal?.scale)
        .duration(6000)
        .scaleIn({ x: 0, y: 0.8 }, 500)
        .scaleOut({ x: 0, y: 0.4 }, 500, { ease: "easeInBack" })
        .fadeOut(250)
        .zIndex(0.7)
        .belowTokens()
        .delay(500)
        .waitUntilFinished(-5750);

    sequence.effect()
        .file(closest(`jb2a.wind_stream.1200.white`))
        .atLocation(target)
        .scaleToObject(1.03)
        .rotate(90)
        .duration(6000)
        .fadeIn(250)
        .fadeOut(750);

    sequence.effect()
        .file(closest(`jb2a.wind_stream.1200.white`))
        .atLocation(target, { offset: { x: 0, y: 100 } })
        .scaleToObject(1.03)
        .rotate(90)
        .duration(6000)
        .fadeIn(250)
        .fadeOut(750);

    sequence.effect()
        .file(closest(`jb2a.energy_beam.normal.${portal.color}`))
        .atLocation(target, { offset: { x: 0, y: 50 } })
        .rotate(90)
        .size({ width: 400, height: 350 })
        .opacity(0.2)
        .duration(6000)
        .playbackRate(1.6)
        .fadeIn(250)
        .fadeOut(750);

    sequence.animation()
        .on(target)
        .opacity(0)
        .show(false);

    sequence.effect()
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: -15, duration: 250, ease: "easeInOutBack" })
        .waitUntilFinished(-100);

    sequence.effect()
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty('spriteContainer', 'position.y', { from: -15, to: 0, duration: 2000, ease: "easeInOutBack" })
        .animateProperty('sprite', 'rotation', { from: 0, to: 8, duration: 500, ease: "easeOutCubic" })
        .animateProperty('sprite', 'rotation', { from: 0, to: -16, duration: 500, delay: 500, ease: "easeOutCubic" })
        .animateProperty('sprite', 'rotation', { from: 0, to: 16, duration: 500, delay: 1000, ease: "easeOutCubic" })
        .animateProperty('sprite', 'rotation', { from: 0, to: -16, duration: 500, delay: 1500, ease: "easeInCubic" })
        .waitUntilFinished(-100);

    sequence.effect()
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: -40, duration: 500, ease: "easeInOutBack" })
        .waitUntilFinished(-100);

    sequence.effect()
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty('spriteContainer', 'position.y', { from: -40, to: -15, duration: 2000, ease: "easeInOutBack" })
        .animateProperty('sprite', 'rotation', { from: 0, to: 8, duration: 500, ease: "easeOutCubic" })
        .animateProperty('sprite', 'rotation', { from: 0, to: -16, duration: 500, delay: 500, ease: "easeOutCubic" })
        .animateProperty('sprite', 'rotation', { from: 0, to: 16, duration: 500, delay: 1000, ease: "easeOutCubic" })
        .animateProperty('sprite', 'rotation', { from: 0, to: -16, duration: 500, delay: 1500, ease: "easeInCubic" })
        .waitUntilFinished(-100);

    sequence.effect()
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty('spriteContainer', 'position.y', { from: -15, to: -200, duration: 750, ease: "easeInOutBack" })
        .scaleOut(0, 750)
        .duration(375)
        .waitUntilFinished(-150);

    sequence.effect()
        .file(closest(`jb2a.explosion.02.${portal.color}`))
        .atLocation(target, { offset: { x: 0, y: -85 } })
        .scaleToObject(0.5)
        .filter("ColorMatrix", { hue: 15 })
        .zIndex(0.9);

    sequence.effect()
        .file(closest(`jb2a.detect_magic.cone.${portal.color}`))
        .rotateTowards(target)
        .atLocation(target, { offset: { x: 0, y: -110 } })
        .scaleToObject(1)
        .playbackRate(1.5)
        .zIndex(1);

    sequence.effect()
        .file(closest(`jb2a.template_circle.out_pulse.02.loop.${portal.color}`))
        .atLocation(target, { offset: { x: 0, y: -75 } })
        .scaleToObject(1.75)
        .delay(1000)
        .fadeOut(1000)
        .waitUntilFinished(-1500);

    sequence.effect()
        .file(closest(`jb2a.fireflies.many.02.${portal.color}`))
        .atLocation(target, { offset: { x: 0, y: -75 } })
        .scaleToObject(0.75)
        .duration(2000)
        .fadeIn(500)
        .fadeOut(750)
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: 75, duration: 3000 });

    return sequence;
}

async function playBanish(target, config = {}) {
    const sequence = await createBanish(target, config);
    if (sequence) return sequence.play();
}

async function createReturn(target, config = {}) {
    config = settingsOverride(config);
    const { color, sound, portal } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    modifyPortal(portal, target);

    const sequence = new Sequence();
    if (sound.enabled) {
        sequence.sound()
            .file(closest('psfx.2nd-level-spells.moonbeam.intro'))
            .volume(sound.volume)
    }
    sequence.effect()
        .file(closest(`jb2a.explosion.01.${portal.color}`))
        .atLocation(target, { offset: { x: 5, y: -75 } })
        .scaleToObject(1.5)
        .delay(1500)
        .zIndex(1);
    sequence.effect()
        .file(closest(portal.file))
        .atLocation(target, { offset: portal.offset })
        .scaleToObject(portal.scale)
        .duration(6000)
        .scaleIn({ x: 0, y: 0.8 }, 500)
        .scaleOut({ x: 0, y: 0.4 }, 500, { ease: "easeInBack" })
        .fadeOut(250)
        .zIndex(0.7)
        .belowTokens()
        .delay(1500)
        .waitUntilFinished(-4000);
    sequence.effect()
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty('spriteContainer', 'position.y', { from: -75, to: 0, duration: 500, ease: "easeOutBounce" })
        .scaleIn(0.25, 500)
        .fadeIn(250)
        .delay(1500)
        .waitUntilFinished(-150);
    sequence.animation()
        .on(target)
        .show(true)
        .opacity(1);
    return sequence;
}

async function playReturn(target, config = {}) {
    const sequence = await createReturn(target, config);
    if (sequence) return sequence.play();
}

async function clean(target, config = {}) {
    new Sequence()
        .animation()
        .on(target)
        .opacity(1)
        .show(true)
        .play();
}

export const banishment = {
    banish: {
        create: createBanish,
        play: playBanish,
        stop: playReturn,
        clean: clean,
        default_config: DEFAULT_CONFIG,
    },
    return: {
        create: createReturn,
        play: playReturn,
        default_config: DEFAULT_CONFIG,
    },
    play: playBanish,
    stop: playReturn,
    default_config: DEFAULT_CONFIG,
};

autoanimations.register("banishment", "effect", "eskie.effect.banishment", DEFAULT_CONFIG, '2.0.1', "Banishment");