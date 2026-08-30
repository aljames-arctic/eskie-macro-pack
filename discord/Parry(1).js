//Last Updated: 8/22/2026
//Author: .eskie

//Use slow parry?
let slowParry = false;

//Set Attack type (slashing, piercing, bludgeoning)
let type = "slashing";
//Set Attack Weight (light,medium, or heavy)
let weight = "medium";
//Set Attack Color
let color = "blue"

let target = Array.from(game.user.targets)[0];

function deg(rad) { return rad * 180 / Math.PI; }
function rad(deg) { return deg * Math.PI / 180; }

const src = token.center;                 // {x,y}
const tgt = target.center; // {x,y} or whatever point you used

// In Foundry canvas coords (Y increases downward), this matches PIXI rotation direction.
const baseRad = Math.atan2(tgt.y - src.y, tgt.x - src.x);
const baseDeg = deg(baseRad);

new Sequence()

  .animation()
  .on(token)
  .opacity(0)
  .delay(100)

  .effect()
  .name(`Parry`)
  .copySprite(token)
  .atLocation(token)
  .rotateTowards(target)
  .animateProperty("sprite", "position.x", { from: -0, to: -0.6, duration: 250,  gridUnits: true,  ease: "easeOutCubic",delay:100})   
  .animateProperty("sprite", "position.x", { from: 0, to: 0.6, duration: 400, gridUnits: true,  ease: "easeOutSine", delay: 450})  
  .duration( 1000)
  .spriteRotation(-baseDeg)
  .spriteOffset({x:-0.5},{gridUnits:true})

  .effect()
  .file(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.normal.01`)
  .atLocation(token)
  .rotateTowards(target)
  .scaleToObject(2)
  .spriteOffset({ x: -1.675 * token.document.width }, { gridUnits: true })
  .randomizeMirrorY()
  .zIndex(1)
  .playIf(!slowParry)

  .effect()
  .file(`eskie.particle.05.orange`)
  .atLocation(token)
  .scaleToObject(2)
  .randomRotation()
  .zIndex(1.1)
  .playIf(!slowParry)

  .effect()
  .file(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.slow.01`)
  .atLocation(token)
  .rotateTowards(target)
  .scaleToObject(2)
  .spriteOffset({ x: -1.675 * token.document.width }, { gridUnits: true })
  .randomizeMirrorY()
  .zIndex(1)
  .playIf(slowParry)

  .effect()
  .file(`eskie.particle.07.orange`)
  .atLocation(token)
  .rotateTowards(target)
  .scaleToObject(1.5)
  .zIndex(1.1)
  .spriteOffset({ x: -1.25 * token.document.width }, { gridUnits: true })
  .playIf(slowParry)

  .wait(850)

  .animation()
  .on(token)
  .opacity(1)
  
.play({preload: true})