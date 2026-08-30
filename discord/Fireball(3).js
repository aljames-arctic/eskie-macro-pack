//Last Updated: 11/12/2025
//Author: .eskie
//Last Edit 03/05/2026
// Editor: Papa Nurgle


//Set radius
let radius = 20
//Toggle Scorched Earth
let scorchedEarth = true
//Persist ground effects?
let persistEffect = false
//Tint Map Effect
let tintMap =  true

const AVAILABLE_SIZES = [10, 20, 30, 60];
const pickEffectSize = (r) => AVAILABLE_SIZES.reduce(
  (acc, size) => (size <= r ? size : acc),
  AVAILABLE_SIZES[0]
);
const effectSize = pickEffectSize(radius);

let tokenOffset = (token.document.width-1)/2;

new Sequence()

  .crosshair("position")
    .type("circle")
    .distance(radius)
    .borderColor("#ffffff",{alpha:0}) 
    .fillColor("#000000",{alpha:0.1})
    .icon(this.img)
    .callback(Sequencer.Crosshair.CALLBACKS.SHOW, function(crosshair) {
  
      new Sequence()
  
        .wait(100)     
  
        .effect()
          .name(`Circle Crosshair`)
          .file(`eskie.crosshair.line.generic_01.white`)
          .attachTo(token)
          .stretchTo(crosshair, {attachTo:true})
          .opacity(0.8)
          .locally()
          .persist()
               
        .effect()
          .name(`Circle Crosshair`)
          .file(`eskie.crosshair.circle.fantasy_01.white.full.radius_${effectSize}ft`)
          .attachTo(crosshair)
          .scaleToObject()
          .opacity(0.8)
          .belowTokens()
          .locally()
          .persist()
        .play();
  
    })
    .callback(Sequencer.Crosshair.CALLBACKS.PLACED, function(crosshair) {
      Sequencer.EffectManager.endEffects({ name: `Circle Crosshair` })
    })
    .callback(Sequencer.Crosshair.CALLBACKS.CANCEL, function(crosshair) {
      Sequencer.EffectManager.endEffects({ name: `Circle Crosshair` })
    })
  
  .effect()
    .name(`Casting ${token.document.name}`)
    .file(canvas.scene.background.src)
    .filter("ColorMatrix", {saturate: 1, brightness: 0.6})
    .atLocation({x:(canvas.dimensions.width)/2,y:(canvas.dimensions.height)/2})
    .size({width:canvas.scene.width/canvas.grid.size, height:canvas.scene.height/canvas.grid.size}, {gridUnits: true})
    .persist()
    .fadeIn(2000)
    .fadeOut(3000)
    .filter("ColorMatrix", { brightness:0 })
    .belowTokens()
  .opacity(0.5)
    .spriteOffset({x:-canvas.scene.background.offsetX,y:-canvas.scene.background.offsetY})
    .playIf(tintMap)

  .sound()
    .file("psfx.3rd-level-spells.fireball.v1.001.beam")
    .volume(1)
  
  .effect()
    .file("jb2a.fireball.beam.orange")
    .attachTo(token,{offset: {x:0.25+tokenOffset},gridUnits:true,local:true})
    .stretchTo("position",{attachTo: true})
    .duration(1900)
    .zIndex(1)

  .effect()
    .file("eskie.pulse.energy.03.slow.orange")
    .attachTo(token,{offset: {x:-0.575-tokenOffset},gridUnits:true,local:true})
    .rotateTowards("position",{attachTo:true})
    .scaleToObject(2)
    .duration(1900)

  .effect()
    .delay(2000)
    .file("eskie.velocity.02")
    .atLocation(token)
    .rotateTowards("position")
    .size(6, {gridUnits:true})
    .spriteOffset({x:-4+tokenOffset},{gridUnits:true})
    .spriteScale({x:1,y:1.5})
    .fadeOut(2000)
    .filter("ColorMatrix", { brightness:0 })
  
  .effect()
    .file("eskie.star.twinkling_star.02.orangeyellow")
    .attachTo(token,{offset: {x:-1-tokenOffset},gridUnits:true,local:true})
    .rotateTowards("position")
    .delay(1800)
    .scaleToObject(3)
    .playbackRate(1.2)
    .spriteRotation(80)
    .waitUntilFinished(-250)

  
  .sound()
    .file("blfx.sound.spell.cast.burning_hands")
    .volume(1)
  
  .effect()
    .file("jb2a.fireball.beam.orange")
    .atLocation(token,{offset: {x:0.2+(token.document.width-1)/2},gridUnits:true,local:true})
    .stretchTo("position")
    .startTime(2000)

  .effect()
    .file("jb2a.cast_generic.fire.side01.orange.0")
    .atLocation(token)
    .rotateTowards("position")
    .size(4.5, {gridUnits:true})
    .startTime(750)

.wait(400)
  
  .effect()
    .delay(250)
    .file("eskie.star.03.orange")
    .atLocation("position")
    .scaleToObject(1)
    .zIndex(1)
    .filter("ColorMatrix", {saturate:1, hue:-5})
    .spriteRotation(5)
    .waitUntilFinished(-250)

  .canvasPan()
    .shake({ duration: 1000, strength: 3, rotation: false, fadeOut: 1000 })

.wait(450)

  .sound()
    .file("psfx.3rd-level-spells.fireball.v1.001.explosion")
    .volume(1)
  
  .effect()
    .file("jb2a.fireball.explosion.orange")
    .atLocation("position")
    .scaleToObject(1.4)
    .scaleIn(0, 500, {ease: "easeOutQuint"})
    .zIndex(2)

  .effect()
    .file("jb2a.smoke.puff.ring.02.dark_black")
    .atLocation("position")
    .scaleToObject(1.8)
    .scaleIn(0, 500, {ease: "easeOutQuint"})
    .opacity(0.5)
    .randomSpriteRotation()
    .filter("ColorMatrix", {brightness:0})
    .zIndex(1)

  .effect()
    .file("jb2a.extras.tmfx.outpulse.circle.02.normal")
    .atLocation("position")
    .scaleToObject(4)
    .scaleIn(0, 500, {ease: "easeOutQuint"})
    .opacity(0.25)
    .belowTokens()
    .randomSpriteRotation()
    .filter("ColorMatrix", {brightness:0})
    .zIndex(1)

  .effect()
    .file("jb2a.ground_cracks.orange.01")
    .atLocation("position")
    .scaleToObject(0.9)
    .randomRotation()
    .fadeOut(2000)
    .duration(5000)
    .belowTokens()
    .delay(2300)
    .persist(persistEffect)
    .playIf(() => {
       return scorchedEarth == true;
    })
    .zIndex(0.1)

  .effect()
    .file("jb2a.scorched_earth.black")
    .atLocation("position")
    .scaleToObject(0.8)
    .fadeOut(2000)
    .duration(5000)
    .opacity(0.5)
    .belowTokens()
    .delay(2300)
    .persist(persistEffect)
    .playIf(() => {
       return scorchedEarth == true;
    })
  .thenDo(function(){
    Sequencer.EffectManager.endEffects({ name: `Casting ${token.document.name}`})

  })
  
.play({preload:true})