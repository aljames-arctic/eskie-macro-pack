//Last Updated: 9/19/2026
//Author: .eskie

const target = Array.from(game.user.targets)[0];

new Sequence()

.effect()
  .file(`eskie.casting.divine.01.side.one_shot.green`)
  .attachTo(token)
  .scaleToObject(1)
  .rotateTowards(target)
  .filter("ColorMatrix", {hue: 75})
  .waitUntilFinished(-750)

.effect()
  .file("blfx.misc.audio_animation.bell_alarm.1.loop_fast.color2")
  .attachTo(target, {bindRotation: false})
  .scaleToObject(1)
  .spriteOffset({x:0,y:-0.55}, {gridUnits:true})
  .zIndex(3)
  .fadeIn(500)
  .duration(2000)
  .animateProperty("sprite", "position.y", { from: -0.25, to: 0, duration: 500, gridUnits: true, ease: "easeOutCubic" })
  .filter("ColorMatrix", {hue: -100})
  .fadeOut(500)

.effect()
  .delay(400)
  .file("jb2a.toll_the_dead.blue.shockwave")
  .attachTo(target, {bindRotation: false})
  .scaleToObject(1)
  .spriteOffset({x:0,y:-0.55}, {gridUnits:true})
  .zIndex(2.5)
  .fadeIn(500)
  .filter("ColorMatrix", {hue: -75})
  .fadeOut(500)
  .opacity(0.8)

.wait(500)

.effect()
  .file("eskie.damage.necrotic.01.teal")
  .atLocation(target)
  .scaleToObject(1.5)
  .zIndex(2)

.effect()
  .copySprite(target)
  .attachTo(target)
  .scaleToObject(1,{considerTokenScale:true})
  .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
  .opacity(0.5)
  .duration(1000)
  .fadeOut(250)
  
.play()