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
          .name(`${token.document.name} Hit the Dirt Crosshair`)
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
          .name(`${token.document.name} Hit the Dirt Crosshair`)
          .file(`eskie.crosshair.line.generic_01.white`)
          .attachTo(token)
          .stretchTo(crosshair, {attachTo:true})
          .opacity(0.8)
          .locally()
          .persist()
          .waitUntilFinished()
        
.thenDo(function(){

  
    Sequencer.EffectManager.endEffects({
        name: `${token.document.name} Hit the Dirt Crosshair`,
    });
})
        
        .play();
    },
  },
  {
    [Sequencer.Crosshair.CALLBACKS.PLACED]: (crosshair) => {

      Sequencer.EffectManager.endEffects({
        name: `${token.document.name} Hit the Dirt Crosshair`,
      });
    },
  },
  {
    [Sequencer.Crosshair.CALLBACKS.CANCEL]: (crosshair) => {

      Sequencer.EffectManager.endEffects({
        name: `${token.document.name} Hit the Dirt Crosshair`,
      });
      return;
    },
  },
)

var rotateValue = -90;

if (token.center.x < position.x){

rotateValue = 90
  
}      

new Sequence()

    .animation()
        .delay(100)
        .on(token)
        .opacity(0)
        .rotate(rotateValue)

    .effect()
        .copySprite(token)
        .attachTo(token, {bindAlpha:false, bindRotation:false})
        .scaleToObject(1)
        .animateProperty("sprite", "rotation", { from: 0, to: rotateValue, duration: 500, ease: "easeOutCubic", delay: 100})
        .duration(2000)

    .wait(100)

    .effect()
        .file("eskie.smoke.03.tan")
        .atLocation({x:token.center.x,y:token.center.y})
        .scaleToObject(1.25)
        .belowTokens()
        .opacity(0.5)

    .effect()
        .copySprite(token)
        .atLocation(token, {bindAlpha:false, bindRotation:false})
        .scaleToObject(0.9)
        .moveTowards(position, {ease: "easeOutQuint"})
        .duration(1500)
        .filter("ColorMatrix", { saturate: -1, brightness:0 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.5)
        .belowTokens()

    .motion()
        .on(token)
        .moveTo( {x: position.x-canvas.grid.size/2, y:position.y-canvas.grid.size/2}, { duration:1500, ease: "easeOutQuint", return: false })
        .moveTo( {x:token.x,y:token.y-canvas.grid.size*0.8}, { duration: 500, ease: "easeOutQuint", return:false })
        .moveTo( {x:token.x,y:token.y+canvas.grid.size*0.8}, { duration: 750, ease: "easeOutQuad", return:false })
        .persistUntilUpdate()

    .wait(750)

    .effect()
        .file("eskie.smoke.01.tan")
        .atLocation(position)
        .rotateTowards(token)
        .scaleToObject(1.5)
        .belowTokens()
        .spriteOffset({x:-1}, {gridUnits:true})
        .zIndex(0)  
        .spriteRotation(180)
        .opacity(0.5)

    .animation()
        .delay(100)
        .on(token)
        .teleportTo(position, {relativeToCenter: true})

    .animation()
        .delay(100)
        .on(token)
        .opacity(1)

.play()