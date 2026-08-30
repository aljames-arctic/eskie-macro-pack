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
  .filter("ColorMatrix", { hue: 50, brightness:1})
  .waitUntilFinished(-750)

  .effect()
  .file("eskie.attack.ranged.arrow.01.physical.medium.green.normal")
  .atLocation(token)
  .stretchTo(target)
  .zIndex(2)
  .filter("ColorMatrix", { hue: 50, brightness:1})
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
  .file("eskie.damage.necrotic.01.teal")
  .attachTo(target, {bindAlpha: false, bindVisibility: false})
  .scaleToObject(1.5, {considerTokenScale: true})
  .zIndex(1)  

  .effect()
  .file("jb2a.misty_step.02.blue")
  .atLocation(target)
  .scaleToObject(1.75)
  .startTime(1500)
  .filter("ColorMatrix", { hue: -75 })
  .belowTokens()  
  .zIndex(2)

  .effect()
  .name(`${target.document.name} Enfeebling Arrow`)
  .file("eskie.poison.token_mask.01.teal.full")
  .attachTo(target)
  .scaleToObject(0.95, {considerTokenScale: true})
  .fadeIn(1000)
  .fadeOut(1000)
  .persist()
  .mask(target)
  .zIndex(0)

  .effect()
  .file("jb2a.extras.tmfx.inflow.circle.01")
  .attachTo(target)
  .attachTo(target)
  .scaleToObject(1.65, {considerTokenScale: true})
  .fadeIn(500)
  .duration(10000)
  .fadeOut(1000)
  .opacity(0.75)
  .mask()
  .playbackRate(0.75)
  .tint("#51e692")
  .zIndex(1)

  .wait(10000)  

  .thenDo(function(){

    Sequencer.EffectManager.endEffects({ name: `${target.document.name} Enfeebling Arrow`, object: target });  

  })  

.play()