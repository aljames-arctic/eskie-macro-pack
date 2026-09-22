//Last Updated: 9/19/2026
//Author: .eskie

const target = Array.from(game.user.targets)[0];

new Sequence()

  .effect()
    .file(`eskie.casting.divine.01.side.one_shot.yellow`)
    .attachTo(token)
    .scaleToObject(1)
    .rotateTowards(target)
    .waitUntilFinished(-750)

  .effect()
    .file("eskie.attack.ranged.arrow.01.physical.heavy.yellow.normal")
    .atLocation(target, {offset:{y:-0.75},gridUnits:true})
    .stretchTo(target)
    .opacity(0.6)
    .filter("ColorMatrix", {brightness: 1.5, saturate:-0.4})
    .zIndex(1)
    .fadeIn(250)

  .effect()
    .file("eskie.environment.lighting.god_ray.01.yellow")
    .atLocation(target)
    .scaleToObject(3)
    .fadeIn(250)
    .fadeOut(750)
    .zIndex(0)
    .duration(1000)
    .spriteScale({x:0.4,y:1})
    .spriteOffset({x:0,y:-0.1}, {gridUnits:true})

  .effect()
    .file("eskie.damage.radiant.01.yellow")
    .atLocation(target)
    .scaleToObject(1.5)
    .zIndex(2)
    .randomRotation()

  .effect()
    .copySprite(target)
    .attachTo(target)
    .scaleToObject(1,{considerTokenScale:true})
    .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
    .opacity(0.5)
    .duration(1000)
    .fadeOut(250)

.play()