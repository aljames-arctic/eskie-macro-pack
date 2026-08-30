//Last Updated: 8/22/2026
//Author: .eskie

//Set Attack type (slashing, piercing, bludgeoning)
let type = "slashing";
//Set Attack Weight (light,medium, or heavy)
let weight = "medium";
//Set Attack Color
let color = "blue";
//Set Trail Tint
let tint = "#01aafe";


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

// Determine jump direction
const dx = target.center.x - token.center.x;


let hop = -0.25;
let hopVert = 0;

if (dx === 0) {
  hop = 0;
  hopVert = -0.25;
} else if (dx < 0) {
  hop = 0.25;
  hopVert = 0;
} else {
  hop = -0.25;
  hopVert = -0;
}

new Sequence()

  .animation()
  .on(token)
  .opacity(0)
  .delay(100)

  .effect()
  .copySprite(token)
  .attachTo(token, {bindAlpha:false})
  .rotateTowards(target)
  .scaleToObject(0.9,{considerTokenScale:true})
  .animateProperty("sprite", "position.x", { from: 0, to: 0.5, duration: 500, ease:"easeOutSine", gridUnits:true, delay: 250})
  .animateProperty("sprite", "position.x", { from: 0, to: -0.5, duration: 1000, ease:"easeOutCubic", gridUnits:true,delay: 1000})
  .spriteOffset({x:-0.5},{gridUnits:true})
  .belowTokens()
  .filter("ColorMatrix", { brightness:0 })
  .filter("Blur", { blurX: 5, blurY: 10 })
  .opacity(0.65)
  .fadeOut(500)
  .duration(2100)
  .spriteRotation(-counterRot)

  .effect()
  .copySprite(token)
  .attachTo(token, {bindAlpha:false})
  .rotateTowards(target)
  .scaleToObject(1,{considerTokenScale:true})
  .animateProperty("sprite", "position.x", { from: 0, to: 0.5, duration: 500, ease:"easeOutSine", gridUnits:true, delay: 250})
  .animateProperty("sprite", "position.x", { from: 0, to: -0.5, duration: 1000, ease:"easeOutCubic", gridUnits:true,delay: 1000})
  .animateProperty("spriteContainer", "position.y", {
  from: 0, to: hop, duration: 250, ease: "easeOutCubic", gridUnits: true, delay: 250
  })
  .animateProperty("spriteContainer", "position.y", {
  from: 0, to: -hop, duration: 250, ease: "easeOutCubic", gridUnits: true, delay: 500
  })
  .animateProperty("spriteContainer", "position.x", {
  from: 0, to: hopVert, duration: 250, ease: "easeOutCubic", gridUnits: true, delay: 250
  })
  .animateProperty("spriteContainer", "position.x", {
  from: 0, to: -hopVert, duration: 250, ease: "easeOutCubic", gridUnits: true, delay: 500
  })
  .spriteOffset({x:-0.5},{gridUnits:true})
  .duration(2100)
  .spriteRotation(-counterRot)
  .zIndex(1)

  .effect()
  .delay(50)
  .copySprite(token)
  .attachTo(token, {bindAlpha:false})
  .rotateTowards(target)
  .scaleToObject(1,{considerTokenScale:true})
  .animateProperty("sprite", "position.x", { from: 0, to: 0.5, duration: 500, ease:"easeOutSine", gridUnits:true, delay: 250})
  .animateProperty("sprite", "position.x", { from: 0, to: -0.5, duration: 1000, ease:"easeOutCubic", gridUnits:true,delay: 1000})
  .animateProperty("spriteContainer", "position.y", {
  from: 0, to: hop, duration: 250, ease: "easeOutCubic", gridUnits: true, delay: 250
  })
  .animateProperty("spriteContainer", "position.y", {
  from: 0, to: -hop, duration: 250, ease: "easeOutCubic", gridUnits: true, delay: 500
  })
  .animateProperty("spriteContainer", "position.x", {
  from: 0, to: hopVert, duration: 250, ease: "easeOutCubic", gridUnits: true, delay: 250
  })
  .animateProperty("spriteContainer", "position.x", {
  from: 0, to: -hopVert, duration: 250, ease: "easeOutCubic", gridUnits: true, delay: 500
  })
  .spriteOffset({x:-0.5},{gridUnits:true})
  .duration(2100)
  .opacity(0.4)
  .fadeOut(1000, {ease:"easeOutQuint"})
  .tint(tint)
  .filter("ColorMatrix", { brightness:2 })
  .spriteRotation(-counterRot)

  .effect()
  .delay(100)
  .copySprite(token)
  .attachTo(token, {bindAlpha:false})
  .rotateTowards(target)
  .scaleToObject(1,{considerTokenScale:true})
  .animateProperty("sprite", "position.x", { from: 0, to: 0.5, duration: 500, ease:"easeOutSine", gridUnits:true, delay: 250})
  .animateProperty("sprite", "position.x", { from: 0, to: -0.5, duration: 1000, ease:"easeOutCubic", gridUnits:true,delay: 1000})
  .animateProperty("spriteContainer", "position.y", {
  from: 0, to: hop, duration: 250, ease: "easeOutCubic", gridUnits: true, delay: 250
  })
  .animateProperty("spriteContainer", "position.y", {
  from: 0, to: -hop, duration: 250, ease: "easeOutCubic", gridUnits: true, delay: 500
  })
  .animateProperty("spriteContainer", "position.x", {
  from: 0, to: hopVert, duration: 250, ease: "easeOutCubic", gridUnits: true, delay: 250
  })
  .animateProperty("spriteContainer", "position.x", {
  from: 0, to: -hopVert, duration: 250, ease: "easeOutCubic", gridUnits: true, delay: 500
  })
  .spriteOffset({x:-0.5},{gridUnits:true})
  .duration(2100)
  .opacity(0.25)
  .fadeOut(1000, {ease:"easeOutQuint"})
  .tint(tint)
  .filter("ColorMatrix", { brightness:1.5})
  .spriteRotation(-counterRot)

  .animation()
  .on(token)
  .opacity(1)
  .delay(2000)

  .wait(400)

  .effect()
  .file(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.normal.02`)
  .atLocation(token)
  .rotateTowards(targetSquare)
  .scaleToObject(effectSize)
  .spriteOffset({ x: effectOffset * token.document.width + 0.75 }, { gridUnits: true })
  .mirrorY(token.x >= target.x)
  .zIndex(2)

  .effect()
  .delay(150)
  .file(`eskie.damage.${type}.01.yellow`)
  .size(1.25 * token.document.width, { gridUnits: true })
  .atLocation(targetSquare)
  .randomRotation()
  .zIndex(0.1)

  .effect()
  .delay(150)
  .copySprite(target)
  .attachTo(target)
  .scaleToObject(1,{considerTokenScale:true})
  .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
  .opacity(0.25)
  .duration(1000)
  .fadeOut(750)

  .play();