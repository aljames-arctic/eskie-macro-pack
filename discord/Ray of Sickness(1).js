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

new Sequence()

    .effect()
        .file("eskie.velocity.01.white")
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(2)
        .zIndex(3)
        .opacity(0.25)
        .spriteOffset({x:-1},{gridUnits:true})
        .tint("#98d723")

    .effect()
        .file("jb2a.eldritch_blast.green")
        .atLocation(token)
        .stretchTo(targetSquare, {offset:{x:-0.25},gridUnits:true,local:true})
        .scale(0.5)
        .startTime(1000)
        .spriteOffset({x:0.25},{gridUnits:true})
        .filter("ColorMatrix", {hue:-12 })
        .zIndex(1)
        .waitUntilFinished(-3000)

    .effect()
        .copySprite(target)
        .attachTo(target)
        .scaleToObject(1,{considerTokenScale:true})
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
        .opacity(0.5)
        .duration(1000)
        .fadeOut(250)

    .effect()
        .file("eskie.texture_mask.ink.01.black")
        .attachTo(target, {offset:targetOffset})
        .scaleToObject(((2 * target.document.width) - 1) / target.document.width)
        .playbackRate(1.5)
        .mask(target)
        .opacity(0.5)
        .startTime(1000)

    .effect()
        .file("eskie.smoke.05.green")
        .atLocation(targetSquare,{offset:{x:0,y:-0},gridUnits:true,local:false})
        .rotateTowards(token)
        .scaleIn(0, 750, {ease: "easeOutCubic"})
        .spriteAnchor({x:0.5,y:1})
        .spriteOffset({x:-0.5},{gridUnits:true})
        .spriteScale({x:1,y:1.25}, {gridUnits:true})
        .spriteRotation(90)
        .fadeOut(500)
        .duration(750)
        .scaleToObject()
        .mirrorY()
        .opacity(0.5)

    .effect()
        .file("eskie.smoke.05.green")
        .atLocation(targetSquare,{offset:{x:0,y:-0},gridUnits:true,local:false})
        .rotateTowards(token)
        .scaleIn(0, 750, {ease: "easeOutCubic"})
        .spriteAnchor({x:0.5,y:1})
        .spriteOffset({x:-0.5},{gridUnits:true})
        .spriteRotation(-45)
        .fadeOut(500)
        .duration(750)
        .scaleToObject()
        .opacity(0.5)

    .effect()
        .file("eskie.smoke.05.green")
        .atLocation(targetSquare,{offset:{x:0,y:-0},gridUnits:true,local:false})
        .rotateTowards(token)
        .scaleIn(0, 750, {ease: "easeOutCubic"})
        .spriteAnchor({x:0.5,y:1})
        .spriteOffset({x:-0.5},{gridUnits:true})
        .spriteRotation(-135)
        .fadeOut(500)
        .duration(750)
        .scaleToObject()
        .opacity(0.5)

    .effect()
        .file("eskie.poison.01.green.full")
        .attachTo(target, {offset:targetOffset})
        .size(0.65,{gridUnits:true})
        .mask(target)
        .zIndex(0)

    .effect()
        .file("eskie.damage.poison.01.green")
        .atLocation(targetSquare)
        .size(1.75,{gridUnits:true})
        .zIndex(1)

.play()