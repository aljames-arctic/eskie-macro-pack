//Last Updated: 2/23/2026
//Author: .eskie

//Set radius
let radius = 20
//Tint Map Effect
let tintMap =  true

const AVAILABLE_SIZES = [10, 20, 30, 60];
const pickEffectSize = (r) => AVAILABLE_SIZES.reduce(
  (acc, size) => (size <= r ? size : acc),
  AVAILABLE_SIZES[0]
);
const effectSize = pickEffectSize(radius);

let tokenOffset = (token.document.width-1)/2;

let collectedTargets = [];

new Sequence()

  .crosshair("position")
    .type("circle")
    .distance(radius)
    .borderColor("#ffffff",{alpha:0}) 
    .fillColor("#000000",{alpha:0.1})
    .icon(this.img)
    .callback(Sequencer.Crosshair.CALLBACKS.SHOW, function(crosshair) {
  
      new Sequence()
  
        .wait(50)     
               
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
    .callback(Sequencer.Crosshair.CALLBACKS.PLACED, async function(crosshair) {

      Sequencer.EffectManager.endEffects({ name: `Circle Crosshair` });
      
    })
    .callback(Sequencer.Crosshair.CALLBACKS.CANCEL, function(crosshair) {
      Sequencer.EffectManager.endEffects({ name: `Circle Crosshair` })
    })

  .effect()
    .name(`Casting ${token.document.name}`)
    .file(canvas.scene.background.src)
    .atLocation({x:(canvas.dimensions.width)/2,y:(canvas.dimensions.height)/2})
    .size({width:canvas.scene.width/canvas.grid.size, height:canvas.scene.height/canvas.grid.size}, {gridUnits: true})
    .persist()
    .fadeIn(1000, {ease: "easeOutCubic"})
    .fadeOut(3000)
    .filter("ColorMatrix", { brightness:0 })
    .belowTokens()
    .opacity(0.5)
    .spriteOffset({x:-canvas.scene.background.offsetX,y:-canvas.scene.background.offsetY})
    .playIf(canvas.scene.background)

  .effect()
    .file("eskie.smoke.07.green")
    .atLocation("position")
    .scaleIn(0, 500, {ease: "easeOutCubic"})
    .scaleToObject(1.5)
    .opacity(0.1)

  .effect()
    .file("jb2a.extras.tmfx.outflow.circle.01")
    .atLocation("position", {offset: {y:-0},gridUnits:true})
    .scaleToObject(0.75)
    .fadeIn(250)
    .fadeOut(750, {ease: "easeOutCubic"})
    .duration(2100)
    .opacity(0.1)
    .belowTokens()
    .tint("#94d123")
    .randomRotation()

  .effect()
    .file("eskie.star.03.green")
    .atLocation("position", {offset: {y:-0},gridUnits:true})
    .size({width:2.5,height:2.5}, {gridUnits:true})

  .wait(500)
  
  .effect()
    .file("eskie.poison.circle.01.green")
    .atLocation("position")
    .scaleToObject(1.1)
  
  .effect()
    .name(`Cloudkill ${token.document.name}`)
    .file("jb2a.fog_cloud.02.green")
    .atLocation("position")
    .scaleToObject()
    .opacity(0.35)
    .fadeIn(3000)
    .scaleIn(0.25, 2500, {ease: "easeOutSine"})
    .persist()
    .zIndex(1)

  .wait(5000) 
  
  .thenDo(function(){
    
    Sequencer.EffectManager.endEffects({ name: `Casting ${token.document.name}`})

  })

.play({preload:true})