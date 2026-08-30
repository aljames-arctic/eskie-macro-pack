//Last Updated: 8/22/2026
//Author: .eskie

//Set Attack type (slashing, piercing, bludgeoning)
let type = "slashing";
//Set Attack Weight (light,medium, or heavy)
let weight = "medium";
//Set Attack Color
let color = "blue"


let target = Array.from(game.user.targets)[0];

//Determine Attack Size
const weightIndex = { light: 0, medium: 1, heavy: 2 }[weight];

let effectSize = 2 + (0.25 * weightIndex);
let effectOffset = -0.75 - (0.25 * weightIndex);

//Determine nearest targetSquare
function getNearestSquareCenter(token, target) {
  const gs = canvas.grid.size;
  const srcCenter = token.center;

  const w = target.document.width;   // width in grid units
  const h = target.document.height;  // height in grid units

  let bestPoint = null;
  let bestDist2 = Infinity;

  for (let gx = 0; gx < w; gx++) {
    for (let gy = 0; gy < h; gy++) {
      const cx = target.document.x + (gx + 0.5) * gs;
      const cy = target.document.y + (gy + 0.5) * gs;

      const dx = cx - srcCenter.x;
      const dy = cy - srcCenter.y;
      const d2 = dx * dx + dy * dy;

      if (d2 < bestDist2) {
        bestDist2 = d2;
        bestPoint = { x: cx, y: cy };
      }
    }
  }

  return bestPoint;
}

let targetSquare = getNearestSquareCenter(token, target);

//Determine Counter Rotation
function deg(rad) { return rad * 180 / Math.PI; }
function rad(deg) { return deg * Math.PI / 180; }

const src = token.center; 
const tgt = target.center;

const baseRad = Math.atan2(tgt.y - src.y, tgt.x - src.x);
const counterRot = deg(baseRad);

const baseRadTarget = Math.atan2(src.y - tgt.y,  src.x - tgt.x);
const counterRotTarget = deg(baseRadTarget);

new Sequence()

  .animation()
  .on(target)
  .opacity(0)
  .delay(100)

  .effect()
  .copySprite(target)
  .attachTo(target, {bindAlpha:false})
  .rotateTowards(token)
  .scaleToObject(1,{considerTokenScale:true})
  .animateProperty("sprite", "position.x", { from: 0, to: -0.5, duration: 250, ease:"easeOutSine", gridUnits:true, delay: 250})
  .animateProperty("sprite", "position.x", { from: 0, to: 0.5, duration: 250, ease:"easeOutCubic", gridUnits:true,delay: 750})
  .animateProperty("sprite", "rotation", { from: 0, to: 20, duration: 500, ease:"easeOutCubic", delay: 250})
  .animateProperty("sprite", "rotation", { from:  0, to:-20, duration: 250, ease:"easeOutBack", delay: 750})
  .animateProperty("sprite", "rotation", { from:  0, to: 10, duration: 250, ease:"easeOutSine", delay: 1000})
  .animateProperty("sprite", "rotation", { from:  0, to: -10, duration: 250, ease:"easeOutSine", delay: 1250})
  .spriteOffset({x:-0.5},{gridUnits:true})
  .spriteRotation(-counterRotTarget)
  .duration(1350)

  .animation()
  .on(target)
  .opacity(1)
  .delay(1250)

  .wait(250)

  .effect()
  .copySprite(token)
  .attachTo(token, {bindAlpha:false})
  .rotateTowards(target)
  .scaleToObject(1,{considerTokenScale:true})
  .animateProperty("sprite", "position.x", { from: 0, to: 0.1, duration: 250, ease:"easeOutSine", gridUnits:true})
  .spriteOffset({x:-0.5},{gridUnits:true})
  .opacity(0.5)
  .fadeOut(300)
  .duration(500)
  .spriteRotation(-counterRot)

  .effect()
  .file(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.fast.03`)
  .atLocation(token)
  .rotateTowards(targetSquare)
  .scaleToObject(effectSize)
  .spriteOffset({ x: effectOffset * token.document.width-0.25 }, { gridUnits: true })
  .opacity(0.5)
  .zIndex(1)

  .effect()
  .file("eskie.star.02.white")
  .atLocation(token)
  .scaleToObject(0.8)
  .rotateTowards(targetSquare)
  .spriteOffset({x:0.35}, {gridUnits:true})
  .zIndex(2)

  .play();