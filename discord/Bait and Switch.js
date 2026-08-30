//Last Updated: 8/22/2026
//Author: .eskie

let target = Array.from(game.user.targets)[0];

var blurDirectionX = 0

let tokenCenter = token.center;
let targetCenter = target.center;

if(token.x == target.x){
var blurDirectionY = 15
}

if(token.y == target.y){
var blurDirectionX = 20
}

new Sequence()

  .animation()
  .on(target)
  .opacity(0)
  .delay(150)

  .animation()
  .on(token)
  .opacity(0)
  .delay(250)

  .effect()
  .copySprite(target)
  .scaleToObject(1, {considerTokenScale: true})
  .moveTowards(token, {rotate: false, ease:"easeInBack",delay:250})
  .moveSpeed(500)
  .duration(1000)
  .zIndex(0.2)

  .effect()
  .copySprite(token)
  .scaleToObject(1, {considerTokenScale: true})
  .moveTowards(target, {rotate: false, ease:"easeOutCubic", delay:500})
  .moveSpeed(300)
  .duration(1250)

  .effect()
  .copySprite(token)
  .scaleToObject(1, {considerTokenScale: true})
  .moveTowards(target, {rotate: false, ease:"easeOutCubic", delay:500})
  .moveSpeed(300)
  .duration(1250)
  .opacity(0.85)
  .fadeIn(50, {delay:500})  
  .fadeOut(500, {ease:"easeOutQuint"})
  .filter("Blur", { blurX: blurDirectionX, blurY: blurDirectionY })
  .zIndex(0.1)

  .effect()
  .file("eskie.smoke.01.white")
  .atLocation(targetCenter)
  .rotateTowards(tokenCenter)
  .scaleToObject(1.5)
  .belowTokens()
  .delay(750)
  .opacity(0.4)
  .spriteOffset({ x: -0.5 }, { gridUnits: true })
  .mirrorX()
  .spriteRotation(180)

  .animation()
  .delay(1000)
  .on(token)
  .teleportTo(targetCenter, {relativeToCenter:false})
  .snapToGrid()
  .opacity(1)

  .animation()
  .delay(750)
  .on(target)
  .teleportTo(tokenCenter, {relativeToCenter:false})
  .snapToGrid()
  .opacity(1)

.play();