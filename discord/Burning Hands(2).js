//Last Updated: 11/12/2025
//Author: .eskie

//Set Cone Angle
let angle = 53.13;
//Set Cone Size (options: "thin", "wide")
let coneSize = "thin";

let tokenOffset = (token.document.width-1)/2

new Sequence()

  .crosshair("position")
    .type("cone")
    .location(token, { lockToEdge: true, lockToEdgeDirection: true })
    .distance(15)
    .angle(angle)
    .borderColor("#ffffff",{alpha:0}) 
    .fillColor("#000000",{alpha:0.1})
    .icon(this.img)
    .callback(Sequencer.Crosshair.CALLBACKS.SHOW, function(crosshair) {
   
      new Sequence()
  
        .wait(50)
        
        .effect()
          .name(`Cone Crosshair`)
          .file(`eskie.crosshair.cone.${coneSize}.fantasy_01.white.full`)
          .attachTo(crosshair)
          .stretchTo(crosshair,{attachTo:true})
          .opacity(0.8)
          .belowTokens()
          .locally()
          .persist()
        
      .play();
      
    })
  .callback(Sequencer.Crosshair.CALLBACKS.PLACED, function(crosshair) {
    Sequencer.EffectManager.endEffects({ name: `Cone Crosshair` })
  })
  .callback(Sequencer.Crosshair.CALLBACKS.CANCEL, function(crosshair) {
    Sequencer.EffectManager.endEffects({ name: `Cone Crosshair` })
  })

  .effect()
    .file("jb2a.energy_strands.in.yellow.01")
    .attachTo(token)
    .rotateTowards("position", {attachTo:true})
    .size(1, {gridUnits:true})
    .spriteScale({x:0.75, y:1.25})
    .spriteOffset({x:0.1+tokenOffset}, {gridUnits:true})
    .playbackRate(1.5)
    .filter("ColorMatrix", {saturate:0.5, hue: -0})
    .waitUntilFinished(-350)

  .effect()
    .file("jb2a.template_line_piercing.generic.01.orange")
    .attachTo(token)
    .rotateTowards("position", {attachTo:true})
    .size({width:1, height:0.25}, {gridUnits:true})
    .spriteOffset({x:0.35+tokenOffset, y:0}, {gridUnits:true})
    .spriteScale({x:1.25})
    .filter("ColorMatrix", {saturate:0.5, hue: 10})
    .spriteRotation(-180)
    .zIndex(1)
    .waitUntilFinished()

  .effect()
    .file("jb2a.impact.010.orange")
    .attachTo(token)
    .rotateTowards("position")
    .size(1, {gridUnits:true})
    .spriteScale({x:0.75, y:1.25})
    .spriteOffset({x:0.1+tokenOffset}, {gridUnits:true})
    .playbackRate(1.5)
    .filter("ColorMatrix", {saturate:0.5, hue: -0})

  .effect()
    .file("eskie.star.03.orange")
    .attachTo(token)
    .rotateTowards("position")
    .size(2.5, {gridUnits:true})
    .spriteOffset({x:-0.8+tokenOffset}, {gridUnits:true})
    .spriteRotation(90)
    .playbackRate(1.5)
    .filter("ColorMatrix", {saturate:0.5, hue: -0})
    .zIndex(2)

  .effect()
    .file("eskie.particle.02.orange")
    .attachTo(token)
    .rotateTowards("position",{attachTo:true})
    .spriteOffset({x:-0.9+tokenOffset}, {gridUnits:true})
    .size(1.5, {gridUnits:true})
    .fadeIn(250)
    .fadeOut(500)
    .zIndex(1)

  .effect()
    .name(`${token.document.name} Burning Hands`)
    .file("eskie.smoke.04.black")
    .attachTo(token)
    .rotateTowards("position",{attachTo:true})
    .spriteOffset({x:-1.55+tokenOffset}, {gridUnits:true})
    .size(2.5, {gridUnits:true})
    .opacity(0.8)
    .persist()

  .effect()
    .file("jb2a.burning_hands.02.orange")
    .attachTo(token,{offset:{x:0.35+tokenOffset}, gridUnits:true, local: true})
    .stretchTo("position",{attachTo:true})
    .zIndex(1)
    .waitUntilFinished(-1400)

  .thenDo(function(){

    Sequencer.EffectManager.endEffects({ name: `${token.document.name} Burning Hands`, object: token })

  })

.play({preload:true})