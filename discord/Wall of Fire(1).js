//Last Updated: 11/12/2025
//Author: .eskie

//CROSSHAIR
let position1 = await Sequencer.Crosshair.show(
  {
    t: "circle",
    distance: 2.5,
    icon: { texture: this.img },
    gridHighlight: false,
    borderAlpha: 0,
  },
  {
    [Sequencer.Crosshair.CALLBACKS.SHOW]: (crosshair) => {
      new Sequence()
        .effect()
          .name(`${token.document.name} Wall Fire Crosshair`)
          .file(`eskie.crosshair.circle.fantasy_01.white.no_base.radius_10ft`)
          .attachTo(crosshair)
          .scaleToObject(1.2)
          .persist()
          .locally()
        .play();
    },
  },
  {
    [Sequencer.Crosshair.CALLBACKS.PLACED]: (crosshair) => {
      Sequencer.EffectManager.endEffects({
        name: `${token.document.name} Wall Fire Crosshair`,
      });
    },
  },
  {
    [Sequencer.Crosshair.CALLBACKS.CANCEL]: (crosshair) => {
      Sequencer.EffectManager.endEffects({
        name: `${token.document.name} Wall Fire Crosshair`,
      });
      return;
    },
  },
);

let position2 = await Sequencer.Crosshair.show(
  {
    t: "circle",
    distance: 2.5,
    icon: { texture: this.img },
    gridHighlight: false,
    borderAlpha: 0,
  },
  {
    [Sequencer.Crosshair.CALLBACKS.SHOW]: (crosshair) => {
      new Sequence()
        .wait(50)

        .effect()
          .name(`${token.document.name} Wall Fire Crosshair`)
          .file(`eskie.crosshair.circle.fantasy_01.white.no_base.radius_10ft`)
          .atLocation(position1)
          .scaleToObject(1.2)
          .locally()
          .persist()

        .effect()
          .name(`${token.document.name} Wall Fire Crosshair`)
          .file(`eskie.crosshair.circle.fantasy_01.white.no_base.radius_10ft`)
          .attachTo(crosshair)
          .scaleToObject(1.2)
          .locally()
          .persist()

        .effect()
          .name(`${token.document.name} Wall Fire Crosshair`)
          .file({
            "05ft": "modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_10ft_400x400.webm",
            "15ft": "modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_20ft_800x400.webm",
            "30ft": "modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_30ft_1200x400.webm",
            "60ft": "modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_60ft_2400x400.webm",
            "90ft": "modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_60ft_2400x400.webm",
          })
          .atLocation(position1, { offset: { x: -0 }, gridUnits: true, local: true })
          .stretchTo(crosshair, { offset: { x: 1 }, gridUnits: true, local: true, attachTo: true })
          .scale(1)
          .opacity(0.85)
          .filter("ColorMatrix", { saturate: -1 })
          .spriteOffset({ x: -0.5, y: 0 }, { gridUnits: true })
          .filter("Glow", { color: 0xffffff, distance: 10, knockout: true })
          .persist()
          .zIndex(1)
          .locally()
          .waitUntilFinished()

          .thenDo(function(){
                  Sequencer.EffectManager.endEffects({
        name: `${token.document.name} Wall Fire Crosshair`,
      });            
          })

        
        .play();
    },
  },
  {
    [Sequencer.Crosshair.CALLBACKS.PLACED]: (crosshair) => {
      Sequencer.EffectManager.endEffects({
        name: `${token.document.name} Wall Fire Crosshair`,
      });
    },
  },
  {
    [Sequencer.Crosshair.CALLBACKS.CANCEL]: (crosshair) => {
      Sequencer.EffectManager.endEffects({
        name: `${token.document.name} Wall Fire Crosshair`,
      });
      return;
    },
  },
);

// Calculate distance in pixels
let dx = position2.x - position1.x;
let dy = position2.y - position1.y;
let stepSize = canvas.grid.size / 2; // Half grid size
let distance = Math.sqrt(dx * dx + dy * dy);
let midpoint = {
    x: (position1.x + position2.x) / 2,
    y: (position1.y + position2.y) / 2
};

// Get unit step values
let steps = Math.floor(distance / stepSize);
let stepX = dx / steps;
let stepY = dy / steps;

// Array to store effect positions
let effectPoints = [];

// Generate effect positions
for (let i = 0; i <= steps; i++) {
    effectPoints.push({
        x: position1.x + stepX * i,
        y: position1.y + stepY * i
    });
}

let castingFlip;

// Determine base flip based on direction
if (Math.abs(position1.x - position2.x) > Math.abs(position1.y - position2.y)) {
    // Horizontal direction
    castingFlip = position1.x < position2.x;
} else {
    // Vertical direction
    castingFlip = position1.y > position2.y;
}

// Check against the token's position1 (assuming tokenPosition is defined)
if (midpoint.x < token.center.x || midpoint.y < token.center.y) {
    // Flip the flip if midpoint is less than token position1
    castingFlip = !castingFlip;
}

new Sequence()

  .thenDo(function(){
  
    for (let e = 0; e <= effectPoints.length-1; e+=2) {
    
      new Sequence()
        
        .effect()
          .atLocation(effectPoints[e], {offset:{y:0}, randomOffset:0.5, gridUnits:true})
          .file("eskie.star.03.orange")
          .size(Math.random() * (2.5 - 1) + 1, {gridUnits: true})
          .randomizeMirrorX()
          .filter("ColorMatrix", {saturate:1, hue:-5})  
          .randomRotation()  
          .zIndex(1) 
      
      .play() 
        
    }
  
  })
  
  .wait(750)
    
  .effect()
    .file("jb2a.cast_generic.fire.01.orange")
    .attachTo(token)
    .scaleToObject(2.25)
    .belowTokens()
    .scaleOut(0, 1500, {ease: "easeOutCubic"})
    .zIndex(2)
  
  .effect()
    .file("jb2a.melee_generic.slash.02.001.orange.2")
    .atLocation(token)
    .rotateTowards(midpoint)
    .scaleToObject(2)
    .playbackRate(0.8)
    .spriteOffset({x:-0.65}, {gridUnits:true})
    .spriteScale({y:1.75})
    .mirrorY(castingFlip)
   
  .effect()
    .delay(150)
    .file("blfx.spell.template.line.crack1.ground1.orange")
    .atLocation(position1, {offset:{x:-1}, gridUnits:true, local: true})
    .stretchTo(position2, {offset: {x:1}, gridUnits:true, onlyX:false, local: true})
    .belowTokens()
 
  .thenDo(function(){
  
    for (let e = 0; e <= effectPoints.length-1; e++) {
    
    new Sequence()
      .effect()
        .atLocation(effectPoints[e], {offset:{y:-1}, gridUnits:true})
        .file("jb2a.flames.02.orange")
        .size({width:2,height:1.5}, {gridUnits: true})
        .duration(1000)
        .fadeIn(200)
        .fadeOut(800)
        .animateProperty("sprite", "height", { from:1.5, to: Math.random() * (2.75 - 1.75) + 1.75, duration: 500, gridUnits:true, ease:"easeOutBack"})
        .randomizeMirrorX()
        .zIndex(1) 
      
      .effect()
        .name(`${token.document.name} Wall of Fire`)  
        .delay(50,750)
        .atLocation(effectPoints[e], {offset:{y:-0.35}, randomOffset:0.15, gridUnits:true})
        .file("eskie.particle.01.loop.orange")
        .size({width:2,height:1}, {gridUnits: true})
        .animateProperty("sprite", "height", { from:1.5, to: Math.random() * (2.75 - 1.75) + 1.75, duration: 500, gridUnits:true, ease:"easeOutBack"})
        .randomizeMirrorX()
        .persist()
        .zIndex(1)
        .playIf(() => e % 2 === 0)
    
    .play() 
        
    }
  
  })

  .effect()
    .name(`${token.document.name} Wall of Fire`)
    .file({
        "05ft": "modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_10ft_400x400.webm",
        "15ft": "modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_20ft_800x400.webm",
        "30ft": "modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_30ft_1200x400.webm",
        "60ft": "modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_60ft_2400x400.webm",
        "90ft": "modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_60ft_2400x400.webm",
      
    })
    .atLocation(position1, {offset:{x:-0.5}, gridUnits:true, local: true})
    .stretchTo(position2, {offset: {x:0.5}, gridUnits:true, local: true})
    .scale(1)
    .animateProperty("sprite", "height", { from: -1, to: 0, duration: 250, ease: "easeOutBack", gridUnits: true })
    .fadeIn(250)
    .persist()
    .waitUntilFinished()
  
   .thenDo(function(){
  
    Sequencer.EffectManager.endEffects({
            name: `${token.document.name} Wall of Fire`,
          });
     
   })  

.play()