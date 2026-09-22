//Last Updated: 9/21/2026
//Author: .eskie

// First, define the radius you want for the crosshair.
let radius = 15; 

let targets = Array.from(game.user.targets)

// Automatically pick the best matching effect size (10, 20, 30, 60 ft).
// It will always choose the largest size that is <= radius.
const AVAILABLE_SIZES = [10, 20, 30, 60];
const pickEffectSize = (r) => AVAILABLE_SIZES.reduce(
  (acc, size) => (size <= r ? size : acc),
  AVAILABLE_SIZES[0]
);
const effectSize = pickEffectSize(radius);

// Create the main Sequence
new Sequence()

    .crosshair("position")
    .type("circle")
    .distance(radius) //Set the distance to our radius
    .icon(this.img)
    .snapPosition(240)
    //When the crosshair is shown, run another Sequence for the crosshair effect
    .callback(Sequencer.Crosshair.CALLBACKS.SHOW, function(crosshair) {

        new Sequence()

        .wait(50) //Add wait time to ensure the crosshair spawns first      
        
        .effect()
            .name(`Shattering Shot Crosshair`) //Name the effect
            //Use the chosen effect size to determine our file
            .file(`eskie.crosshair.circle.fantasy_01.white.full.radius_${effectSize}ft`)
            .attachTo(crosshair) //Attach the effect to the crosshair
            .scaleToObject()
            .belowTokens()
            .locally() //Only show the effect to the macro user
            .persist() //Persist the effect

            .effect()
            .delay(50)
            .name(`Shattering Shot Crosshair`) //Name the effect
            .file(`eskie.crosshair.line.generic_01.white`)
            .attachTo(token)
            .stretchTo(crosshair, {attachTo:true})
            .opacity(0.8)
            .locally()
            .persist()
            .waitUntilFinished()
        
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
        .file("jb2a.throwable.throw.dynamite.01.orange")
        .atLocation(token)
        .stretchTo("position")
        .waitUntilFinished(-750)

    .effect()
        .file("eskie.casting.physical.02.center.one_shot.orange")
        .atLocation(token)
        .startTime(250)
        .rotateTowards("position")
        .scaleToObject(1.25)
        .spriteOffset({x:-0.25},{gridUnits:true})
        .zIndex(1)

    .wait(500)
    
    .effect()
        .file("jb2a.bullet.Snipe.orange")
        .atLocation(token)
        .stretchTo("position")

    .effect()
        .delay(100)
        .file("jb2a.explosion.01.orange")
        .atLocation("position")
        .scaleToObject()
        .zIndex(5)

    .effect()
        .delay(100)
        .file("jb2a.explosion.shrapnel.bomb.01.red")
        .atLocation("position")
        .scaleToObject(1)
        .zIndex(4)
        .filter("ColorMatrix", { saturate:0.5, hue: 15 })

    .effect()
        .delay(100)
        .file("jb2a.explosion.07.purplepink")
        .atLocation("position")
        .scaleToObject(1)
        .playbackRate(1.5)
        .zIndex(3)
        .filter("ColorMatrix", { saturate:0.5, hue: 110 })

    .thenDo(() => {

        targets.forEach(target => {  
        
            new Sequence()

            .wait(150)
            
            .motion()
                .on(target)
                .noise({ strength: 12, frequency: 20, duration: 400 })

            .effect()
                .file("eskie.damage.fire.01.orange")
                .atLocation(target)
                .scaleToObject(1.5)
                .zIndex(2)
            
            .play()

        })  
    
    })

.play();