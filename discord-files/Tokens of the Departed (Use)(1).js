//Last Updated: 8/17/2026
//Author: .eskie

//Set Summoned Actor Here
let actor = "";
//Change Token light?
let changeLight = true;

let summon = game.actors.getName(actor);
let light;

if(changeLight){

  light = {dim: 0, bright: 1, alpha:0.25, luminosity: 0.55, color: "#58feb0", animation: {type: "torch", speed: 4, intensity: 5},attenuation: 0.85, contrast:0, shadows:0};
  
};

  const crosshairParameters = {
    t: "circle",
    distance: 2.5,
    gridHighlight: false,
    borderAlpha: 0,
  };

  const crosshairCallbacks = {
    [Sequencer.Crosshair.CALLBACKS.SHOW]: (crosshair) => {
      new Sequence()
        .effect()
          .name(`${summon.name} Tokens of the Departed`)
          .file("eskie.crosshair.circle.fantasy_01.white.no_base.radius_10ft")
          .attachTo(crosshair)
          .scaleToObject(1)
          .zIndex(1)
          .persist()
          .aboveLighting()
        .play();
    },

    [Sequencer.Crosshair.CALLBACKS.PLACED]: (crosshair) => {
      Sequencer.EffectManager.endEffects({
        name: `${summon.name} Tokens of the Departed`,
      });
    },

    [Sequencer.Crosshair.CALLBACKS.CANCEL]: (crosshair) => {
      Sequencer.EffectManager.endEffects({
        name: `${summon.name} Tokens of the Departed`,
      });
    },
  };

await Sequencer.Helpers.wait(2000);

const summonToken = await foundrySummons.pick({
    uuid: summon.uuid,
    crosshairParameters,
    crosshairCallbacks,
  tokenData: { alpha: 0, light: light },
    //tokenData: spellUpdates, // ← if your API expects `updateData`, rename this key
    drawPing: false,
  });

console.log(summonToken)

new Sequence()

  .effect()
  .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
  .atLocation(token, {offset:{y:-0},gridUnits:true, bindRotation:false})
  .scaleToObject(0.25)
  .filter("ColorMatrix", { hue: -50 })
  .zIndex(1)
  .duration(1500)
  .animateProperty("sprite", "position.y", { from: 0, to: -0.25, duration: 250, ease: "easeOutSine", gridUnits:true, delay:500})
  .animateProperty("sprite", "position.y", { from: 0, to: 0.25, duration: 750, ease: "easeOutSine", gridUnits:true, delay:750})
  .moveTowards(summonToken, {delay: 500, ease: "easeOutCubic", rotate:false})
  .scaleOut(0, 1000, {ease: "easeOutSine"})
  .tint("#58feb0")

  .effect()
  .file("eskie.star.03.blue")
  .atLocation(token, {offset:{y:-0},gridUnits:true, bindRotation:false})
  .scaleToObject(0.75)
  .filter("ColorMatrix", { hue: -50 })
  .zIndex(1)
  .duration(1500)
  .animateProperty("sprite", "position.y", { from: 0, to: -0.25, duration: 250, ease: "easeOutSine", gridUnits:true, delay:500})
  .animateProperty("sprite", "position.y", { from: 0, to: 0.25, duration: 750, ease: "easeOutSine", gridUnits:true, delay:750})
  .animateProperty("sprite", "rotation", { from: 0, to: 360*2, duration: 1500, delay: 500, ease: "easeOutCubic"})
  .moveTowards(summonToken, {delay: 500, ease: "easeOutCubic", rotate:false})
  .scaleOut(0, 1000, {ease: "easeOutSine"})
  .waitUntilFinished(-500)

  .effect()
  .file("eskie.poison.circle.01.teal")
  .atLocation(summonToken)
  .scaleToObject(1.5)
  .zIndex(2)

  .effect()
  .name(`${summonToken.name} Tokens of the Departed`)
  .file("jb2a.extras.tmfx.outflow.circle.01")
  .attachTo(summonToken, {bindAlpha:false})
  .scaleToObject(1.45, {considerTokenScale:true})
  .randomRotation()
  .belowTokens()
  .opacity(0.45)
  .tint("#58feb0")
  .fadeIn(2500, {ease: "easeInSine"})
  .persist()

  .effect()
  .name(`${summonToken.name} Tokens of the Departed`)
  .copySprite(summonToken)
  .attachTo(summonToken, {bindAlpha:false})
  .scaleToObject(1,{considerTokenScale:true})
  .opacity(0.65)
  .tint("#58feb0")
  .loopProperty("sprite", "position.x", { from: 0.025, to: -0.025, duration: 5000, gridUnits:true, pingPong: true, ease: "easeOutSine"})
  .loopProperty("sprite", "position.y", {  from:0 ,to:-0.03, duration: 2500, gridUnits:true, pingPong: true})
  .filter("ColorMatrix", { saturate:-0.2, brightness:1.2 })
  .filter("Blur", { blurX: 0, blurY: 0.8 })
  .fadeIn(2500, {ease: "easeInSine"})
  .persist()

.play()