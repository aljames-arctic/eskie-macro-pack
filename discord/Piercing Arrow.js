//Last Updated: 8/28/2026
//Author: .eskie

let position = await Sequencer.Crosshair.show({
  t:"ray",
  distance:30,
  width:5,
  icon: { texture: this.img },
  gridHighlight: false,
  borderAlpha: 0,
  location:{ obj: token, lockToEdge:true},
  
}, {
    [Sequencer.Crosshair.CALLBACKS.SHOW]: (crosshair) => {
    new Sequence()

      .wait(50) ///Add wait time to ensure the crosshair spawns first 
      
      .effect()
        .name("Ray Crosshair")
        .file(`eskie.crosshair.ray.fantasy_01.white.full`)
        .attachTo(crosshair) //Attach the effect to the crosshair
        // Stretch the effect to the crosshair. 
        // Set attachTo and onlyX options to true.
        .stretchTo(crosshair,{attachTo:true, onlyX:true}) 
        .scale((canvas.grid.size / 300) * 0.8) //Automatically scale the effect according to the scenes grid size.
        .locally() //Only show the effect to the macro user
        .persist() //Persist the effect
    .play();
    },
    [Sequencer.Crosshair.CALLBACKS.PLACED]: (crosshair) => {

    Sequencer.EffectManager.endEffects({ name: `Ray Crosshair` })
      
    },
    [Sequencer.Crosshair.CALLBACKS.CANCEL]: (crosshair) => {
      
    Sequencer.EffectManager.endEffects({ name: `Ray Crosshair` })
      
    }
});

let targets = Array.from(game.user.targets);

new Sequence()

  .effect()
  .file("eskie.velocity.02.white")
  .atLocation(token)
  .rotateTowards(position)
  .size(token.document.width*2, {gridUnits:true})
  .spriteOffset({x:-1}, {gridUnits:true})
  .tint("#ecc432")
  .opacity(0.85)
  .fadeIn(500)

  .effect()
  .file("jb2a.energy_strands.in.green.01")
  .atLocation(token)
  .rotateTowards(position)
  .size(token.document.width*2, {gridUnits:true})
  .spriteScale({x:0.75})
  .spriteOffset({x:-0.3}, {gridUnits:true})
  .playbackRate(1.5)
  .waitUntilFinished()

  .effect()
  .file("eskie.star.02.yellow")
  .atLocation(token)
  .rotateTowards(position)
  .scaleToObject(1)
  .spriteOffset({x:-0.1}, {gridUnits:true})

  .wait(250)

  .effect()
  .file("eskie.attack.ranged.arrow.ray.physical.green")
  .atLocation(token)
  .stretchTo(position)
  .scale(2)
  .zIndex(2)

  .thenDo(function(){

    for (let i = 0; i <= targets.length-1; i++) {

      new Sequence()

        .wait(1+i*50)  

        .effect()
        .copySprite(targets[i])
        .attachTo(targets[i])
        .scaleToObject(1,{considerTokenScale:true})
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
        .opacity(0.5)
        .duration(1000)
        .fadeOut(250)

        .effect()
        .file("eskie.damage.piercing.01.yellow")
        .attachTo(targets[i], {bindAlpha: false, bindVisibility: false})
        .scaleToObject(1.5, {considerTokenScale: true})
        .zIndex(1)      

      .play()  
    }

  })

.play();