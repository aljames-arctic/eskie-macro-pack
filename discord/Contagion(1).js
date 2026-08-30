//Last Updated: 2/23/2026
//Author: .eskie

let target = Array.from(game.user.targets)[0];

//Determine nearest targetSquare
function getNearestSquareCenter(token, target) {
  const gs = canvas.grid.size;
  const srcCenter = token.center;

  const w = target.document.width;  
  const h = target.document.height;  

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
let targetOffset = ({x:targetSquare.x-target.center.x,y:targetSquare.y-target.center.y})

function getSceneCoverSizeGU(target) {
  const gs = canvas.grid.size;

  const rect = canvas.dimensions.sceneRect;
  const corners = [
    { x: rect.x,                 y: rect.y },
    { x: rect.x + rect.width,    y: rect.y },
    { x: rect.x,                 y: rect.y + rect.height },
    { x: rect.x + rect.width,    y: rect.y + rect.height }
  ];

  const c = target.center;

  let maxDist = 0;

  for (const p of corners) {

    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const d = Math.hypot(dx, dy);
    if (d > maxDist) maxDist = d;

  }

  const sideGU = (2 * maxDist) / gs + 2;
  return sideGU;
}

const sceneCoverGU = getSceneCoverSizeGU(target);

new Sequence()

    .effect()
        .copySprite(token)
        .attachTo(token)
        .filter("Glow", { distance:5,color: 0x98d723 })
        .belowTokens()
        .duration(2000)
        .fadeIn(500)
        .fadeOut(1500)

    .effect()
        .delay(500)
        .file("eskie.poison.token_mask.01.green.full")
        .attachTo(target)
        .scaleToObject()
        .mask()
        .zIndex(1)

    .wait(500)

    .effect()
        .copySprite(target)
        .attachTo(target)
        .mask(target)
        .opacity(0.25)
        .loopProperty("sprite", "scale.y", { from: 1, to: 1.25, duration: 2000,  ease: "easeInOutSine" })
        .loopProperty("sprite", "scale.x", { from: 1, to: 1.25, duration: 2000,  ease: "easeInOutSine" })
        .loopProperty("sprite", "alpha", { from: 0.25, to: -0.25, duration: 2000,  ease: "easeInOutSine" })
        .duration(4000)
        .fadeOut(1500)

    .effect()
        .delay(50)
        .file("eskie.aura.token.ribbon.02.green")
        .attachTo(token)
        .rotateTowards(target)
        .scaleToObject(1.5)
        .spriteRotation(-90)
        .spriteOffset({x:-0.75*token.document.width}, {gridUnits:true})
        .opacity(0.75)

    .effect()
        .file("eskie.attack.touch.generic.01.green")
        .atLocation(token)
        .rotateTowards(targetSquare)
        .size(token.document.width+0.25, {gridUnits:true})
        .filter("ColorMatrix", {hue:-15 })
        .playbackRate(0.75)
        .spriteOffset({x:-0.15},{gridUnits:true})
        .zIndex(2)

    .effect()
        .delay(250)
        .file("jb2a.impact.004.green")
        .attachTo(target)
        .scaleToObject(1.5)
        .playbackRate(0.8)
        .filter("ColorMatrix", {hue:-15 })
        .belowTokens()

    .effect()
        .delay(250)
        .file("eskie.texture_mask.ink.01.black")
        .attachTo(target)
        .scaleIn(0, 1000, {ease: "easeOutCubic"})
        .size(sceneCoverGU, { gridUnits: true })
        .startTime(1000)
        .belowTiles()
        .opacity(0.75)
        .duration(4500)
        .fadeOut(1000)

.play()