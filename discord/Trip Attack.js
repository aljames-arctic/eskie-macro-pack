//Last Updated: 8/22/2026
//Author: .eskie

//Set Attack type (slashing, piercing, bludgeoning)
let type = "bludgeoning";
//Set Attack Weight (light,medium, or heavy)
let weight = "heavy";
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

new Sequence()

  .effect()
  .file(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.normal.01`)
  .atLocation(token)
  .rotateTowards(targetSquare)
  .scaleToObject(effectSize)
  .spriteOffset({ x: effectOffset * token.document.width }, { gridUnits: true })
  .zIndex(1)

  .animation()
  .delay(100)
  .on(target)
  .opacity(0)

  .effect()
  .copySprite(target)
  .attachTo(target, {bindAlpha:false, bindRotation:false,local:false})
  .scaleToObject(0.9)
  .zIndex(0.1)
  .belowTokens()
  .filter("ColorMatrix", { brightness:0 })
  .filter("Blur", { blurX: 5, blurY: 10 })
  .opacity(0.65)
  .duration(1200)

  .effect()
  .delay(100)
  .file(`eskie.damage.${type}.01.yellow`)
  .attachTo(target,{bindAlpha:false,bindRotation:false})
  .scaleToObject(2)
  .opacity(1)
  .zIndex(1)
  .belowTokens()
  .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 500, ease: "easeOutCubic", gridUnits: true })

  .effect()
  .copySprite(target)
  .attachTo(target, {bindAlpha:false, bindRotation:false,local:false})
  .scaleToObject(1)
  .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 500, ease: "easeOutCubic", delay:100, gridUnits: true })
  .animateProperty("spriteContainer", "position.y", { from: 0, to: 0.5, duration: 250, ease: "easeOutCubic", delay:600, gridUnits: true })
  .animateProperty("sprite", "rotation", { from: 0, to: 90, duration: 250, ease: "easeOutCubic", delay:100 })  
  .zIndex(2)
  .duration(1200)
  .waitUntilFinished(-500)

  .effect()
  .file("eskie.smoke.03.white")
  .attachTo(target,{bindAlpha:false,bindRotation:false})
  .scaleToObject(2)
  .opacity(0.8)
  .belowTokens()

  .animation()
  .delay(300)
  .on(target)
  .opacity(1)
  .rotate(target.document.rotation+90)

.play();