//Last Updated: 8/22/2026
//Author: .eskie

//Set Push Distance
let pushDistance =15;
//Set Attack type (slashing, piercing, bludgeoning)
let type = "bludgeoning";
//Set Attack Weight (light,medium, or heavy)
let weight = "heavy";
//Set Attack Color
let color = "blue";

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

//Determine Animation positions
const position = {
  x: target.center.x - (canvas.grid.size*(pushDistance/5) * Math.sign(token.center.x - target.center.x)),
  y: target.center.y - (canvas.grid.size*(pushDistance/5) * Math.sign(token.center.y - target.center.y))
};

const backposition = {
  x: (target.center.x - token.center.x)* -0.1,
  y: (target.center.y - token.center.y)*  -0.1,
};

const middleposition = {
  x: (target.center.x - token.center.x)* 0.26,
  y: (target.center.y - token.center.y)* 0.26,
};

const distanceX = Math.abs(token.center.x - target.center.x);
const distanceY = Math.abs(token.center.y - target.center.y);

if (distanceY < distanceX) {
  position.y = target.center.y;
  middleposition.y = 0;
  backposition.y = 0;
  
} else if (distanceX < distanceY) {
  position.x = target.center.x;
  middleposition.x = 0;
  backposition.x = 0;
}

await new Sequence()

  .animation()
  .on(token)
  .opacity(0)
  .delay(100)

  .effect()
  .file("eskie.smoke.02.white")
  .atLocation({x:token.center.x-backposition.x, y:token.center.y-backposition.y})
  .rotateTowards(target)
  .size(token.document.width*2.15, {gridUnits:true})
  .spriteOffset({x:-1.5},{gridUnits:true})
  .spriteRotation(180)
  .belowTokens()
  .delay(150)

  .canvasPan()
  .delay(250)
  .shake({duration: 250, strength: 2, rotation: false })

  .effect()
  .copySprite(token)
  .atLocation(token)
  .scaleToObject(1, {considerTokenScale:true})
  .animateProperty("sprite", "position.x", { from: 0, to: backposition.x, duration: 250, ease:"easeOutExpo",delay:200})
  .animateProperty("sprite", "position.y", { from: 0, to: backposition.y, duration: 250, ease:"easeOutExpo",delay:200})
  .animateProperty("sprite", "position.x", { from: 0, to: middleposition.x-backposition.x, duration: 150, ease:"easeOutExpo", delay:1000})
  .animateProperty("sprite", "position.y", { from: 0, to: middleposition.y-backposition.y, duration: 150, ease:"easeOutExpo", delay:1000})
  .animateProperty("sprite", "position.x", { from: 0, to: -middleposition.x, duration: 450, ease:"easeOutQuad", delay: 1150})
  .animateProperty("sprite", "position.y", { from: 0, to: -middleposition.y, duration: 450, ease:"easeOutQuad", delay: 1150})
  .scaleToObject(1, {considerTokenScale: true})
  .duration(1750)

  .animation()
  .on(token)
  .opacity(1)
  .delay(1650)

  .effect()
  .file(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.slow`)
  .atLocation(token)
  .rotateTowards(targetSquare)
  .scaleToObject(effectSize)
  .spriteOffset({ x: effectOffset * token.document.width }, { gridUnits: true })
  .randomizeMirrorY()
  .zIndex(1)
  .delay(1000)

  .effect()
  .file("jb2a.gust_of_wind.veryfast")
  .atLocation(token)
  .stretchTo(position, {onlyX:true})
  .opacity(0.75)
  .belowTokens()
  .fadeOut(1000)
  .delay(1500)   

  .effect()
  .delay(1000)
  .file("eskie.trail.token.generic.01.white")
  .atLocation(token)
  .rotateTowards(position)
  .scaleToObject(1.5)
  .startTime(750)
  .spriteOffset({x:-0.75-0.5},{gridUnits:true})

  .wait(1000)

  .effect()
  .file(`eskie.damage.${type}.01.yellow`)
  .atLocation(target)
  .size(token.document.width*1.5, {gridUnits:true})
  .zIndex(1)

  .wait(250)

  .animation()
  .on(target)
  .opacity(0)
  .delay(100)

  .effect()
  .copySprite(target)
  .atLocation(target)
  .scaleToObject(1, {considerTokenScale:true})
  .moveTowards(position, {rotate: false, ease: "easeOutCirc",delay:200})
  .moveSpeed(1250)
  .waitUntilFinished(-100)

  .animation()
  .on(target)
  .moveTowards(position, {relativeToCenter:true})
  .snapToGrid()
  .opacity(1)

.play()