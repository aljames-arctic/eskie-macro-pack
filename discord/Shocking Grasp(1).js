//Last Updated: 11/20/2025
//Author: .eskie

let target = Array.from(game.user.targets)[0];

new Sequence()

  .effect()
    .file("jb2a.breath_weapons.lightning.line.blue")
    .atLocation(token)
    .rotateTowards(target)
    .spriteOffset({x:token.document.width*0.4}, {gridUnits:true})
    .scale(0.25)
    .endTime(4000)
    .playbackRate(3)
    .animateProperty("sprite", "position.x", { from: -0.3, to: 0, duration: 750, gridUnits: true,ease:"easeInBack"})
    .waitUntilFinished(-300)

    .effect()
  .delay(250)
    .file("jb2a.impact.008.blue")
    .atLocation(token)
    .rotateTowards(target)
    .spriteOffset({x:token.document.width-1}, {gridUnits:true})
    .scale(0.25)

  .effect()
    .file("eskie.lightning.03.blue")
    .atLocation(token)
    .rotateTowards(target)
    .size(token.document.width*1.2, {gridUnits:true})
    .filter("ColorMatrix", { hue: -24, saturate: 1 })
    .spriteOffset({x:token.document.width*0.35}, {gridUnits:true})
    .zIndex(1)
    .repeats(2,500,500)
    
  .effect()
    .delay(250)
    .file("eskie.lightning.03.blue")
    .atLocation(token)
    .rotateTowards(target)
    .size(token.document.width*1.2, {gridUnits:true})
    .filter("ColorMatrix", { hue: -24, saturate: 1 })
    .spriteOffset({x:token.document.width*0.35}, {gridUnits:true})
    .mirrorY()
    .zIndex(1)
    .repeats(2,500,500)  
  
  .wait(250)
  
  .effect()
    .file("jb2a.static_electricity.03.blue")
    .attachTo(target)
    .scaleToObject(1.25)
    .opacity(1)
    .playbackRate(1)
    .fadeOut(1000)
    .randomRotation()
    .filter("ColorMatrix", { hue: -15, saturate: 1 })
    .repeats(3, 300,300)
    
  .effect()
    .copySprite(target)
    .attachTo(target)
    .scaleToObject(1, {considerTokenScale: true})
    .fadeIn(250)
    .fadeOut(1500)
    .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
    .duration(4000)
    .opacity(0.25)

.play({preload:true});