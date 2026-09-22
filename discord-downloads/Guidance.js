//Last Updated: 9/19/2026
//Author: .eskie

const target = Array.from(game.user.targets)[0];

new Sequence()

  .effect()
    .file(`eskie.casting.divine.01.side.one_shot.yellow`)
    .attachTo(token)
    .scaleToObject(1)
    .rotateTowards(target)
    .animateProperty("sprite", "position.x", { from: -0.5, to: 0.05, duration: 750, gridUnits: true, ease: "easeOutSine" })
    .waitUntilFinished(-750)

  .effect()
    .file("eskie.buff.one_shot.simple.orange")
    .attachTo(target, {bindRotation:false})
    .scaleToObject(1)
    .playbackRate(1.5)
    .filter("ColorMatrix", {hue: 27}) 

  .effect()
    .file("jb2a.impact.002.yellow")
    .attachTo(target)
    .scaleToObject(0.8)
    .zIndex(2)

  .effect()
    .name(`${target.document.name} Guidance`)
    .file("jb2a.ward.star.yellow.01")
    .attachTo(target)
    .scaleToObject(0.8)
    .fadeIn(500)
    .fadeOut(500)
    .duration(1500)

  .effect()
    .name(`${target.document.name} Guidance`)
    .file("eskie.environment.lighting.shine.01.gold")
    .attachTo(target)
    .scaleToObject(1.8)
    .fadeIn(1000)
    .fadeOut(500)
    .persist()
    .waitUntilFinished()

.play()