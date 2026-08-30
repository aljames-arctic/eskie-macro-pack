//Last Updated: 8/28/2026
//Author: .eskie

let target = Array.from(game.user.targets)[0]

new Sequence()

  .effect()
  .file("eskie.casting.physical.03.side.one_shot.purple")
  .attachTo(token)
  .rotateTowards(target)
  .scaleToObject(1)
  .zIndex(2)
  .waitUntilFinished(-1250)

  .effect()
  .copySprite(target)
  .attachTo(target, {bindAlpha: false, bindVisibility: false})
  .scaleToObject(1, {considerTokenScale: true})
  .duration(2000)
  .scaleOut(0, 1000, {ease: "easeInOutCubic"})
  .rotateOut(360, 1000, {ease: "easeInOutQuint"})

  .wait(500)

  .animation()
  .on(target)
  .hide()

  .effect()
  .file("eskie.attack.ranged.arrow.01.physical.medium.purple.slow")
  .atLocation(token)
  .stretchTo(target)
  .zIndex(2)
  .waitUntilFinished(-750)

  .effect()
  .file("eskie.damage.piercing.01.red")
  .attachTo(target, {bindAlpha: false, bindVisibility: false})
  .scaleToObject(1.5, {considerTokenScale: true})
  .filter("ColorMatrix", { hue: -75 })
  .zIndex(1)

  .effect()
  .file("jb2a.portals.horizontal.vortex.purple")
  .attachTo(target, {bindAlpha: false, bindVisibility: false})
  .scaleToObject(0.25, {considerTokenScale: true})
  .fadeIn(250)
  .scaleIn(0, 250, {ease: "easeOutBack"})
  .scaleOut(0, 900, {ease: "easeInSine"})
  .duration(1150)

  .effect()
  .delay(250)
  .file("jb2a.cast_generic.02.dark_purple")
  .attachTo(target, {bindAlpha: false, bindVisibility: false})
  .scaleToObject(1, {considerTokenScale: true})
  .zIndex(1)

  .effect()
  .file("jb2a.energy_strands.in.purple.01")
  .attachTo(target, {bindAlpha: false, bindVisibility: false})
  .scaleToObject(1.5, {considerTokenScale: true})
  .playbackRate(2)
  .scaleOut(0, 1000, {ease: "easeInSine"})
  .fadeOut(250)

  .effect()
  .delay(1000)
  .file("eskie.star.02.purple")
  .attachTo(target, {bindAlpha: false, bindVisibility: false})
  .scaleToObject(0.8, {considerTokenScale: true})
  .zIndex(2)

  .effect()
  .name(`${target.document.name} Banishing Arrow`)  
  .file("jb2a.extras.tmfx.outflow.circle.04")
  .attachTo(target, {bindVisibility: false, bindAlpha:false})
  .scaleToObject(1)
  .rotateIn(-360, 500, {ease: "easeOutCubic"})
  .scaleIn(0, 600, {ease: "easeInOutCirc"})
  .fadeOut(1000)
  .opacity(1)
  .belowTokens()
  .persist()
  .filter("ColorMatrix", { brightness:-1 })
  .waitUntilFinished()

  .thenDo(function(){

    new Sequence()

      .animation()
      .on(target)
      .show()

    .play()

  })  

.play()