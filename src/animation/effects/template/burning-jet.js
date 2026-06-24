import { closest } from '../../../lib/filemanager.js';
import { templates } from '../../../lib/templates.js';
import { autoanimations } from '../../../integration/autoanimations.js';

//Last Updated: 8/7/2023
//Author: EskieMoh#2969

const DEFAULT_CONFIG = {
    id: 'burningJet',
    label: 'Burning Jet',
}

async function create(token, config, options) {
    if (options?.type == 'aefx') return;
    const { id, template } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    const cfg = {
        radius: 1,
        icon: 'icons/magic/fire/blast-jet-stream-splash.webp',
        label: 'Burning Jet'
    };
    
    let [position, _] = await templates.getPosition(template, cfg);
    if (!position) { return; }

    const distance = Math.max(
        Math.abs(token.x - position.x) / canvas.grid.size,
        Math.abs(token.y - position.y) / canvas.grid.size
    );

    let seq = new Sequence()
      .animation()
      .on(token)
      .opacity(0)

      .effect()
      .file("animated-spell-effects-cartoon.fire.08")
      .atLocation(token)
      .rotateTowards(position)
      .spriteOffset({x:-0.8*token.document.width, y: -1.0*token.document.width}, {gridUnits:true})
      .rotate(90)
      .scale(token.document.width*0.2)
      .moveTowards(position, {ease:"easeOutCubic"})
      .scaleOut(0, 500, {ease: "easeOutCubic"})
      .animateProperty("sprite", "position.y", { from: -1.0*token.document.width, to: -0.4*token.document.width, duration: 500, gridUnits: true, ease:"easeOutCubic", fromEnd:true})
      .duration(1200)
      .zIndex(1)
      .moveSpeed(1900)

      .effect()
      .file("animated-spell-effects-cartoon.fire.30")
      .atLocation(token)
      .rotateTowards(position)
      .spriteOffset({x:-0.8*token.document.width, y: -1*token.document.width}, {gridUnits:true})
      .rotate(90)
      .scale(token.document.width*0.2)
      .moveTowards(position, {ease:"easeOutCubic"})
      .loopOptions({ loops: 1 })
      .zIndex(2)
      .duration(2000)
      .moveSpeed(1900)

      .effect()
      .file("animated-spell-effects-cartoon.fire.36")
      .atLocation(token)
      .rotateTowards(position)
      .spriteOffset({x:-1.19*token.document.width, y: -1.5*token.document.width}, {gridUnits:true})
      .rotate(90)
      .scale(token.document.width*0.3)
      .moveTowards(position, {ease:"easeOutCubic"})
      .loopOptions({ loops: 1 })
      .duration(2000)
      .moveSpeed(1900)

      .effect()
      .file("animated-spell-effects-cartoon.fire.26")
      .atLocation(position)
      .rotateTowards(token)
      .rotate(-90)
      .delay(1000)
      .zIndex(2)
      .scale(0.2*token.document.width)
      .spriteOffset({x:-0.8*token.document.width, y: -1*token.document.width}, {gridUnits:true})

      .effect()
      .copySprite(token)
      .atLocation(token)
      .moveTowards(position, {ease:"easeOutCubic", rotate:false})
      .duration(2000)
      .scaleToObject(1, {considerTokenScale: true})
      .moveSpeed(1800)
      .waitUntilFinished(-2000+distance*100) // distance is now defined

      .effect()
      .file("animated-spell-effects-cartoon.fire.40")
      .atLocation(position)
      .rotateTowards(token)
      .rotate(90)
      .zIndex(2)
      .scale(0.2*token.document.width)
      .spriteOffset({x:-0.8*token.document.width, y: -0.01*(distance*5)*token.document.width}, {gridUnits:true})
      .belowTokens()
      .waitUntilFinished()

      .animation()
      .on(token)
      .opacity(1)
      .teleportTo(position)
      .snapToGrid();
      
    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

export const burningJet = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};

autoanimations.register('Burning Jet', 'template', 'eskie.effect.burningJet', DEFAULT_CONFIG);
autoanimations.register('Burning Jet', 'effect', 'eskie.effect.burningJet', DEFAULT_CONFIG);
