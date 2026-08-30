//Last Updated: 8/25/2026
//Author: .eskie

//Set Image count
let imageNumber = 3;

new Sequence()

  .animation()
  .delay(250)
  .on(token)
  .opacity(0)

  .effect()
  .file(`eskie.casting.arcane.01.center.one_shot.purple`)
  .attachTo(token, {bindAlpha:false})
  .scaleToObject(0.8)
  .zIndex(2)

  .effect()
  .copySprite(token)
  .attachTo(token, {bindAlpha:false})
  .animateProperty("sprite", "alpha", { from: 0, to: -0.5, duration: 500, ease: "easeOutCubic", delay:250})
  .animateProperty("sprite", "alpha", { from: 0, to: 0.5, duration: 250, ease: "easeInCubic", delay:750})
  .duration(1250)

  .effect()
  .file(`blfx.spell.template.circle.particles.3.rise.star1.loop.color1`)

  .attachTo(token, {bindAlpha:false})
  .scaleToObject(1.75)
  .zIndex(1)
  .startTime(1000)
  .animateProperty("sprite", "position.x", { from: 0.25, to: -0.25, duration: 500, gridUnits:true, ease: "easeOutCubic"})
  .animateProperty("sprite", "position.x", { from: 0, to: 0.25, duration: 250, gridUnits:true, ease: "easeInCubic", delay: 500})
  .duration(2250)
  .fadeIn(500, {ease: "easeOutCubic"})
  .fadeOut(500, {ease: "easeInCubic"})
  .opacity(0.8)
  .belowTokens()

  .effect()
  .copySprite(token)
  .attachTo(token, {bindAlpha:false})
  .scaleToObject(1)
  .zIndex(0)
  .opacity(0.5)
  .tint("#dca9fe")
  .animateProperty("sprite", "position.x", { from: 0.25, to: -0.25, duration: 500, gridUnits:true, ease: "easeOutCubic"})
  .animateProperty("sprite", "position.x", { from: 0, to: 0.25, duration: 250, gridUnits:true, ease: "easeInCubic", delay: 500})
  .duration(1250)
  .fadeIn(500, {ease: "easeOutCubic"})
  .fadeOut(500, {ease: "easeInCubic"})
  .belowTokens()

  .effect()
  .file(`blfx.spell.template.circle.particles.3.rise.star1.loop.color1`)
  .attachTo(token, {bindAlpha:false})
  .scaleToObject(1.75)
  .zIndex(1)
  .startTime(1000)
  .animateProperty("sprite", "position.x", { from: -0.25, to: 0.25, duration: 500, gridUnits:true, ease: "easeOutCubic"})
  .animateProperty("sprite", "position.x", { from: 0, to: -0.25, duration: 250, gridUnits:true, ease: "easeInCubic", delay: 500})
  .duration(2250)
  .fadeIn(500, {ease: "easeOutCubic"})
  .fadeOut(500, {ease: "easeInCubic"})
  .opacity(0.8)
  .belowTokens()

  .effect()
  .copySprite(token)
  .attachTo(token, {bindAlpha:false})
  .scaleToObject(1)
  .zIndex(0)
  .opacity(0.5)
  .tint("#dca9fe")
  .animateProperty("sprite", "position.x", { from: -0.25, to: 0.25, duration: 500, gridUnits:true, ease: "easeOutCubic"})
  .animateProperty("sprite", "position.x", { from: 0, to: -0.25, duration: 250, gridUnits:true, ease: "easeInCubic", delay: 500})
  .duration(1250)
  .fadeIn(500, {ease: "easeOutCubic"})
  .fadeOut(500, {ease: "easeInCubic"})
  .belowTokens()

  .animation()
  .delay(1000)
  .on(token)
  .opacity(1)

  .effect()
  .delay(750)
  .file("jb2a.particles.outward.purple.02.04")
  .attachTo(token, {bindAlpha:false})
  .scaleToObject(1.25)
  .zIndex(1)
  .scaleIn(0, 500, {ease:"easeOutCubic"})
  .fadeOut(500)
  .duration(1000)

.play();

let radius = 0.45; // grid units away from token center

for (let i = 0; i < imageNumber; i++) {

  let angle = (Math.PI * 2 / imageNumber) * i - Math.PI / 2;

  let offsetX = Math.cos(angle) * radius;
  let offsetY = Math.sin(angle) * radius;

  new Sequence()

    .wait(750)

    .effect()
    .name(`${token.document.name} Mirror Image ${i+1}`)
    .copySprite(token)
    .attachTo(token, {offset:{x:offsetX,y:offsetY}, gridUnits:true,bindAlpha:false, local:false})
    .scaleToObject(1)
    .zIndex(0)
    .opacity(0.5)
    .tint("#dca9fe")
    .animateProperty("sprite", "position.x", { from: -offsetX, to: 0, duration: 500, gridUnits:true, ease: "easeOutCubic"})
    .animateProperty("sprite", "position.y", { from: -offsetY, to: 0, duration: 500, gridUnits:true, ease: "easeOutCubic"})
    .duration(1500)
    .fadeIn(500, {ease: "easeOutCubic"})
    .fadeOut(1000)
    .belowTokens()
    .persist()
    .loopProperty("sprite", "alpha", { from: 0.5, to: 0.35, duration: 3000, ease: "easeInOutSine", pingPong:true})
    .loopProperty("spriteContainer", "position.x", { from: -0, to: -offsetX/8, duration: 3000, gridUnits:true, ease: "easeInOutSine", pingPong:true})
    .loopProperty("spriteContainer", "position.y", { from: -0, to: -offsetY/8, duration: 3000, gridUnits:true, ease: "easeInOutSine", pingPong:true})

    .effect()
    .name(`${token.document.name} Mirror Image ${i+1}`)
    .file(`blfx.spell.template.circle.particles.3.rise.star1.loop.color1`)
    .attachTo(token, {bindAlpha:false})
    .scaleToObject(1.75)
    .zIndex(1)
    .startTime(1000)
    .animateProperty("sprite", "position.x", { from: 0, to: offsetX, duration: 500, gridUnits:true, ease: "easeOutCubic"})
    .animateProperty("sprite", "position.y", { from: 0, to: offsetY, duration: 500, gridUnits:true, ease: "easeOutCubic"})
    .duration(2250)
    .fadeIn(500, {ease: "easeOutCubic"})
    .fadeOut(1000, {ease: "easeInCubic"})
    .opacity(0.8)
    .belowTokens()

  .play();
}