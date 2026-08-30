//Last Updated: 8/28/2026
//Author: .eskie

let target = Array.from(game.user.targets)[0]

new Sequence()

  .effect()
  .file("eskie.casting.physical.03.side.one_shot.green")
  .attachTo(token)
  .rotateTowards(target)
  .scaleToObject(1)
  .zIndex(2)
  .waitUntilFinished(-750)

  .effect()
  .file("eskie.attack.ranged.arrow.01.physical.medium.green.normal")
  .atLocation(token)
  .stretchTo(target)
  .zIndex(2)
  .waitUntilFinished(-750)

  .effect()
  .copySprite(target)
  .attachTo(target)
  .scaleToObject(1,{considerTokenScale:true})
  .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
  .opacity(0.5)
  .duration(1000)
  .fadeOut(250)

  .effect()
  .file("eskie.damage.poison.01.green")
  .attachTo(target, {bindAlpha: false, bindVisibility: false})
  .scaleToObject(0.95, {considerTokenScale: true})
  .zIndex(1)

  .effect()
  .file("eskie.nature.vine.normal.01.physical.green")
  .atLocation(target)
  .scaleToObject(1.25)
  .zIndex(3)

  .effect()
  .name(`Grasping Arrow ${target.document.name}`)
  .file("jb2a.plant_growth.04.ring.4x4.pulse.greenwhite")
  .attachTo(target)
  .scaleToObject(1.25)
  .zIndex(1)
  .filter("ColorMatrix", { saturate:-0, hue: -20 })

  .wait(250)

  .effect()
  .name(`Grasping Arrow ${target.document.name}`)
  .file("eskie.nature.vine.normal.circle.01.physical.green.radius_20ft")
  .attachTo(target)
  .scaleToObject(1.95, {considerTokenScale: true})
  .randomRotation()
  .zIndex(1)
  .persist()
  .mask()  

  .effect()
  .name(`Grasping Arrow ${target.document.name}`)
  .file("eskie.nature.vine.normal.circle.01.physical.green.radius_10ft")
  .attachTo(target)
  .scaleToObject(1.45, {considerTokenScale: true})
  .randomRotation()
  .zIndex(1)
  .persist()
  .belowTokens()

.play()