//Last Updated: 8/28/2026
//Author: .eskie

let target = Array.from(game.user.targets)[0];
let targets = Array.from(game.user.targets);

new Sequence()

  .effect()
  .file("eskie.casting.physical.03.side.one_shot.white")
  .attachTo(token)
  .rotateTowards(target)
  .scaleToObject(1)
  .zIndex(2)
  .waitUntilFinished(-750)

  .effect()
  .file("eskie.attack.ranged.arrow.01.physical.medium.white.slow")
  .atLocation(token)
  .stretchTo(target)
  .loopProperty("sprite", "position.y", { from: -0.05, to: 0.05, duration: 50, gridUnits:true, pingPong:true})
  .opacity(0.5)
  .zIndex(3)

  .effect()
  .file("eskie.attack.ranged.arrow.01.physical.medium.white.slow")
  .atLocation(token)
  .stretchTo(target)
  .zIndex(2)
  .waitUntilFinished(-750)

  .canvasPan()
  .delay(200)
  .shake({duration: 500, strength: 4, rotation: false, fadeOut: 500 })

  .thenDo(function(){

    for (let i = 0; i <= targets.length-1; i++) {

      new Sequence()

        .effect()
        .copySprite(targets[i])
        .attachTo(targets[i])
        .scaleToObject(1,{considerTokenScale:true})
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
        .opacity(0.5)
        .duration(1000)
        .fadeOut(250)

        .effect()
        .file("eskie.damage.force.01.white")
        .attachTo(targets[i], {bindAlpha: false, bindVisibility: false})
        .scaleToObject(1.5, {considerTokenScale: true})
        .zIndex(1)      

      .play()  
      
    }

  })

  .effect()
  .file("jb2a.explosion.04.blue")
  .atLocation(target)
  .size(3.5+target.document.width, {gridUnits:true})
  .opacity(0.75)
  .filter("ColorMatrix", { saturate:-1})

  .effect()
  .delay(200)
  .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
  .atLocation(target)
  .size(3.75+target.document.width, {gridUnits:true})
  .opacity(0.5)
  .belowTokens()
  .filter("ColorMatrix", { saturate:-1})
  .zIndex(1)

  .effect()
  .delay(200)
  .file("jb2a.impact.ground_crack.still_frame.01")
  .atLocation(target)
  .size(4+target.document.width, {gridUnits:true})
  .fadeIn(250)
  .fadeOut(1000)
  .duration(2500)
  .opacity(0.75)
  .belowTokens()

.play()