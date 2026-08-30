//Last Updated: 8/25/2026
//Author: .eskie

// Create the main Sequence
new Sequence()

  .crosshair("position")
    .type("rect")
    .distance(28.5) 
    .icon(this.img)
    .snapPosition(240)
    //When the crosshair is shown, run another Sequence for the crosshair effect
    .callback(Sequencer.Crosshair.CALLBACKS.SHOW, function(crosshair) {

      new Sequence()

        .wait(50) //Add wait time to ensure the crosshair spawns first      

        .effect()
          .name(`Circle Crosshair`) //Name the effect
          //Use the chosen effect size to determine our file
          .file(`eskie.crosshair.rectangle.fantasy_01.white.full.20x20ft`)
          .attachTo(crosshair) //Attach the effect to the crosshair
          .scaleToObject()
          .belowTokens()
          .locally() //Only show the effect to the macro user
          .persist() //Persist the effect
        .play();

    })
    //When the crosshair is placed, delete our crosshair effect
    .callback(Sequencer.Crosshair.CALLBACKS.PLACED, function(crosshair) {
      Sequencer.EffectManager.endEffects({ name: `Circle Crosshair` })
    })
    //When the crosshair is cancelled, delete our crosshair effect
    .callback(Sequencer.Crosshair.CALLBACKS.CANCEL, function(crosshair) {
      Sequencer.EffectManager.endEffects({ name: `Circle Crosshair` })
    })  

  .effect()
  .name("Web Casting")
  .file(`eskie.casting.arcane.01.side.loop.yellow`)
  .attachTo(token)
  .rotateTowards("position")
  .scaleToObject(1.25)
  .spriteOffset({x:-0.15},{gridUnits:true})
  .persist()

  .effect()
  .name("Web Casting")
  .file(`eskie.casting.arcane.01.center.loop.yellow`)
  .attachTo("position")
  .size(1.75, {gridUnits:true})
  .belowTokens()
  .zIndex(1.1)
  .persist()

  .effect()
  .name(`Web`)
  .atLocation("position")
  .file(`jb2a.magic_signs.circle.02.conjuration.complete.dark_yellow`)
  .size(3.5, {gridUnits: true})
  .fadeIn(600)
  .opacity(1)
  .rotateIn(180, 600, {ease: "easeOutCubic"})
  .scaleIn(0, 600, {ease: "easeOutCubic"})
  .belowTokens()
  .fadeOut(500)  
  .duration(3000)

  .effect()
  .name(`Web`)
  .atLocation("position")
  .file(`jb2a.magic_signs.circle.02.conjuration.complete.dark_yellow`)
  .size(3.5, {gridUnits: true})
  .fadeIn(600, {delay:2500})
  .fadeOut(1000)
  .opacity(0.5)
  .rotateIn(180, 600, {ease: "easeOutCubic"})
  .scaleIn(0, 600, {ease: "easeOutCubic"})
  .persist()
  .belowTokens()  
  .filter("ColorMatrix", { brightness:0 })

  .effect()
  .file("jb2a.markers.light_orb.loop.white")
  .atLocation("position")
  .scaleIn(0, 1500, {ease: "easeOutCubic"})
  .fadeIn(500)
  .duration(2500)
  .belowTokens()
  .zIndex(2)
  .size(2, {gridUnits: true})

  .effect()
  .file("jb2a.shield_themed.above.eldritch_web.01.dark_green")
  .atLocation("position")
  .scaleIn(0, 1500, {ease: "easeOutCubic"})
  .fadeIn(500)
  .duration(2500)
  .belowTokens()
  .zIndex(2.1)
  .size(0.9, {gridUnits: true})
  .opacity(0.5)
  .filter("ColorMatrix", { brightness:0, saturate: -1 })

  .wait(2250)

  .effect()
  .delay(250)
  .file("jb2a.impact.004.yellow")
  .atLocation("position")
  .scaleToObject(0.8)
  .scaleIn(0, 200, {ease: "easeOutCubic"})
  .filter("ColorMatrix", { saturate: -1 })

  .thenDo(() => {

    Sequencer.EffectManager.endEffects({ name: "Web Casting"})  

  })  

  .effect()
  .name(`Web`)
  .file("blfx.spell.template.square.nature.web.1.color1")
  .atLocation("position")
  .scaleToObject(1)
  .persist()
  .zIndex(1)

  .effect()
  .name(`Web`)
  .file("blfx.spell.template.square.nature.web.2.color1")
  .atLocation("position")
  .scaleToObject(1)
  .persist()
  .opacity(0.5)
  .zIndex(1)
  .belowTokens()
  .waitUntilFinished()

  .thenDo(() => {

    Sequencer.EffectManager.endEffects({ name: "Web"})  

  })
  
.play();