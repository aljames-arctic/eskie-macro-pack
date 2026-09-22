//Last Updated: 9/21/2026
//Author: .eskie

let position = await Sequencer.Crosshair.show(
  {
    t: "circle",
    distance: (token.document.width*token.document.texture.scaleX)*2.5,
    snap: {position:(token.document.width % 2 === 0 ? 240 : 1)},
    gridHighlight: false,
    borderAlpha: 0,  
  },
  {
    [Sequencer.Crosshair.CALLBACKS.SHOW]: (crosshair) => {
     
      new Sequence()

        .wait(50)
          
        .effect()
          .name(`${token.document.name} Black Powder Boost Crosshair`)
          .copySprite(token)
          .attachTo(crosshair)
          .scaleToObject(1)
          .opacity(0.5)
          .filter("ColorMatrix", { saturate:-1})
          .locally()
          .persist()


        .wait(50)
  
        .effect()
          .delay(50)
          .name(`${token.document.name} Black Powder Boost Crosshair`)
          .file(`eskie.crosshair.line.generic_01.white`)
          .attachTo(token)
          .stretchTo(crosshair, {attachTo:true})
          .opacity(0.8)
          .locally()
          .persist()
          .waitUntilFinished()
        
.thenDo(function(){

  
              Sequencer.EffectManager.endEffects({
        name: `${token.document.name} Black Powder Boost Crosshair`,
      });
})
        
        .play();
    },
  },
  {
    [Sequencer.Crosshair.CALLBACKS.PLACED]: (crosshair) => {

      Sequencer.EffectManager.endEffects({
        name: `${token.document.name} Black Powder Boost Crosshair`,
      });
    },
  },
  {
    [Sequencer.Crosshair.CALLBACKS.CANCEL]: (crosshair) => {

      Sequencer.EffectManager.endEffects({
        name: `${token.document.name} Black Powder Boost Crosshair`,
      });
      return;
    },
  },
)

var offsetX = 0;
var offsetY = 0;

if (token.center.x < position.x){

    offsetX = -canvas.grid.size*0.75
  
} else if (token.center.x > position.x){

    offsetX = canvas.grid.size*0.75
  
} 

if (token.center.y < position.y){

    offsetY = -canvas.grid.size*0.75
  
} else if (token.center.y > position.y){

    offsetY = canvas.grid.size*0.75
  
} 

new Sequence()

    .effect()
        .copySprite(token)
        .atLocation(token, {bindAlpha:false, bindRotation:false})
        .scaleToObject(0.9)
        .moveTowards(position, {ease: "easeOutQuint", delay:600})
        .duration(2500)
        .filter("ColorMatrix", { saturate: -1, brightness:0 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.5)
        .belowTokens() 

    .effect()
        .file("eskie.smoke.06.tan")
        .atLocation(token)
        .scaleToObject(1.25)
        .belowTokens()
        .playbackRate(1.5)
        .opacity(0.5)

    .motion()
        .on(token)
        .moveTo( {x:token.x,y:token.y-canvas.grid.size*0.5}, { duration: 400, ease: "easeOutQuint", easeOut: "easeOutSine" })

    .wait(500) 

    .effect()
        .file("jb2a.muzzle_flash.single.01.yellow")
        .attachTo(token, {offset:{y:-0}, gridUnits:true})
        .rotateTowards({x:token.center.x+offsetX,y:token.center.y+offsetY})
        .scaleToObject(4)
        .playbackRate(1.5)

    .motion()
        .on(token)
        .moveTo( {x:token.x,y:token.y-canvas.grid.size*1}, { duration: 250, ease: "easeOutCubic", returnDuration:750, easeOut: "easeOutSine" })
        .noise({ strength: { x: 10, y: 14 }, frequency: 500, duration: 1500, rotationStrength: 60, fadeOutDuration:1500 })
        .noise({ strength: 20, frequency: 100, duration: 500 })

    .motion()
        .on(token)
        .moveTo( {x: position.x-canvas.grid.size/2, y:position.y-canvas.grid.size/2}, { duration:2000, ease: "easeOutQuint", return: false })
        .persistUntilUpdate()

    .wait(1250)

    .animation()
        .on(token)
        .teleportTo(position,{relativeToCenter: true})
        .opacity(1)

.play()