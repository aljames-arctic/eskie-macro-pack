//Last Updated: 9/21/2026
//Author: .eskie

var target = Array.from(game.user.targets)[0];

const distance = canvas.grid.size*0.75; 

const dx = token.center.x - target.center.x;
const dy = token.center.y - target.center.y;

const length = Math.hypot(dx, dy);

const moveX = token.document.x + (dx / length) * distance;
const moveY = token.document.y + (dy / length) * distance;

new Sequence()

    .effect()
        .file(canvas.scene.background.src)
        .atLocation({x:(canvas.dimensions.width)/2,y:(canvas.dimensions.height)/2})
        .size({width:canvas.scene.width/canvas.grid.size, height:canvas.scene.height/canvas.grid.size}, {gridUnits: true})
        .duration(3000)
        .fadeIn(2250)
        .fadeOut(500)
        .filter("ColorMatrix", { brightness:1,saturate: -0 })
        .tint("#ac8239")
        .belowTiles()
        .spriteOffset({x:-canvas.scene.background.offsetX,y:-canvas.scene.background.offsetY})
        .playIf(canvas.scene.background)

    .effect()
        .delay(250)
        .file("jb2a.energy_strands.in.blue.01")
        .atLocation(token)
        .rotateTowards(target)
        .size(token.document.width*2, {gridUnits:true})
        .spriteScale({x:0.75})
        .spriteOffset({x:-0.25}, {gridUnits:true})
        .filter("ColorMatrix", {brightness:0 })

    .effect()
        .file("jb2a.cast_generic.ice.01.blue")
        .atLocation(token)
        .rotateTowards(target)
        .size(token.document.width*1.5, {gridUnits:true})
        .playbackRate(1.5)
        .spriteScale({x:0.75})
        .spriteOffset({x:-0.1}, {gridUnits:true})
        .filter("ColorMatrix", {saturate:2, hue: 200 })
        .zIndex(1)
        .waitUntilFinished(-200)

    .effect()
        .startTime(250)
        .file(`eskie.casting.physical.03.side.one_shot.red`)
        .attachTo(token)
        .rotateTowards(target)
        .scaleToObject(1.5)
        .spriteOffset({x:-0.25},{gridUnits:true})
        .zIndex(2)

    .effect()
        .file("jb2a.template_line_piercing.generic.01.orange")
        .atLocation(token)
        .rotateTowards(target)
        .size({width:token.document.width, height:token.document.width/2}, {gridUnits:true})
        .spriteOffset({x:-1, y:0.5}, {gridUnits:true})
        .filter("ColorMatrix", {saturate:0.5, hue: -20})
        .rotate(90)

    .effect()
        .file("jb2a.template_line_piercing.generic.01.orange")
        .atLocation(token)
        .rotateTowards(target)
        .size({width:token.document.width, height:token.document.width/2}, {gridUnits:true})
        .spriteOffset({x:-1, y:-0.5}, {gridUnits:true})
        .filter("ColorMatrix", {saturate:0.5, hue: -20})
        .rotate(-90)

    .effect()
        .file("jb2a.template_line_piercing.generic.01.orange")
        .atLocation(token)
        .rotateTowards(target)
        .size({width:token.document.width, height:token.document.width/2}, {gridUnits:true})
        .spriteOffset({x:-3.25, y:0}, {gridUnits:true})
        .spriteScale({x:3})
        .filter("ColorMatrix", {saturate:0.5, hue: -20})
        .rotate(-180)

    .wait(750)

    .motion()
        .on(token)
        .moveTo({ x: moveX, y:moveY }, { duration: 250, returnDuration: 750, ease: "easeOutCubic", easeOut: "easeInSine" })
        .noise({ strength: { x: -20, y: 24 }, frequency: 500, duration: 2500, rotationStrength: 70, fadeOutDuration:1500 })

    .effect()
        .file("eskie.velocity.01.white")
        .atLocation(token)
        .rotateTowards(target)
        .scaleToObject(5)
        .spriteOffset({x:-3*token.document.width, y:0}, {gridUnits:true})
        .filter("ColorMatrix", {brightness:0})
        .opacity(0.25)


    .canvasPan()
        .shake({duration: 500, strength: 4, rotation: false, fadeOut: 500 })

    .effect()
        .file("jb2a.bullet.Snipe.orange")
        .atLocation(token)
        .stretchTo(target)
        .randomizeMirrorY()
        .scale(2.5)
        .zIndex(1)

    .effect()
        .file("jb2a.bullet.Snipe.orange")
        .atLocation(token)
        .stretchTo(target)
        .randomizeMirrorY()
        .scale(2.5)
        .spriteOffset({x:0.2,y:-0.115}, {gridUnits:true})
        .zIndex(0.9)

    .effect()
        .file("jb2a.bullet.Snipe.orange")
        .atLocation(token)
        .stretchTo(target)
        .randomizeMirrorY()
        .scale(2.5)
        .spriteOffset({x:0.2,y:0.115}, {gridUnits:true})
        .zIndex(0.9)

    .effect()
        .file("jb2a.ranged.01.projectile.01.dark_purple")
        .atLocation(token)
        .stretchTo(target)
        .scale(1.75)
        .playbackRate(1.5)
        .filter("ColorMatrix", {saturate:2, hue: 100 })

    .motion()
        .delay(250)
        .on(target)
        .noise({strength: 12,frequency: 20,duration: 400})

    .effect()
        .file("eskie.damage.critical.01.red")
        .atLocation(target)
        .scaleToObject(4)
        .randomRotation()

.play()