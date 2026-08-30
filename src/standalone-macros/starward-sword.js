// Standalone Macro: Starward Sword
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Starward Sword' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const DEFAULT_CONFIG = {
    id: 'starwardSword',
    size: 6, // AoE size
    darkMap: true,
    cameraZoom: false,
    targets: [],
};

const label = "Starward Sword";

// Toggle check: if active persistent effect exists on token/canvas, terminate cleanly
const isPlaying = Sequencer.EffectManager.getEffects({ name: label }).length > 0;
if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label });
    return;
}

async function getPosition(templateDoc, config = {}) {
    if (templateDoc) {
        let primary, secondary;
        if (templateDoc.documentName === 'Region' || templateDoc.shapes) {
            const shape = templateDoc.shapes?.[0];
            primary = { x: shape?.x ?? 0, y: shape?.y ?? 0 };
            const distance = shape?.radius ?? shape?.distance ?? 0;
            if (shape?.rotation !== undefined && distance > 0) {
                const rad = Math.toRadians(shape.rotation);
                secondary = {
                    x: primary.x + Math.cos(rad) * distance,
                    y: primary.y + Math.sin(rad) * distance
                };
            } else {
                secondary = { x: primary.x, y: primary.y };
            }
        } else {
            const farpoint = templateDoc.object?.ray?.B;
            secondary = { x: farpoint?.x ?? templateDoc.x, y: farpoint?.y ?? templateDoc.y };
            primary = { x: templateDoc.x, y: templateDoc.y };
        }
        return [primary, secondary];
    } else {
        const gridSize = canvas.grid?.size ?? canvas.dimensions?.size ?? 100;
        const cfg = {
            radius: (config.size ?? 6) * gridSize,
            max: 150,
            icon: 'icons/svg/sword.svg',
            label: label
        };
        const pos = await Sequencer.Crosshair.show(cfg);
        if (!pos || pos.cancelled) { return []; }
        return [pos, undefined];
    }
}

const templateDoc = globalThis.scope?.template ?? globalThis.template;
const [position, _] = await getPosition(templateDoc, DEFAULT_CONFIG);
if (!position) { return; }

const size = DEFAULT_CONFIG.size ?? 6;
const darkMap = DEFAULT_CONFIG.darkMap ?? true;
const cameraZoom = DEFAULT_CONFIG.cameraZoom ?? false;
let targets = DEFAULT_CONFIG.targets ?? [];
if (!targets || targets.length === 0) {
    targets = Array.from(game.user.targets);
}

const gridSize = canvas.grid?.size ?? canvas.dimensions?.size ?? 100;
const tokenScaleX = token.document?.texture?.scaleX ?? token.document?.scale ?? 1;
const tokenRotation = token.document?.rotation ?? 0;

// Define the center of the circle
let centerX = position.x + (gridSize / 2);
let centerY = position.y + (gridSize / 2);

// Define the radius of the circle
let radius = (size / 2) * gridSize;

// Declare an array to hold the points
let initialPoints = [];
let points = [];

// Declare an array to keep track of used angles
let usedAngles = [];

// Define an array of angles in radians
let angles = [Math.PI / 6, Math.PI * (7 / 6), Math.PI * (11 / 6), Math.PI * (3 / 4), Math.PI * (6 / 4)];

// Loop over the angles
for (let o = 0; o < angles.length; o++) {
    let x = centerX + radius * Math.cos(angles[o]);
    let y = centerY + radius * Math.sin(angles[o]);
    initialPoints.push({ x, y });
}

// Loop 10 times
for (let i = 0; i < 10; i++) {
    let angle;

    if (i % 2 === 0) {
        do {
            angle = Math.random() * 2 * Math.PI;
        } while (usedAngles.some(a => Math.abs(a - angle) < (Math.PI / 6)));

        usedAngles.push(angle);
    } else {
        angle = (points[points.length - 1].angle + Math.PI);
    }

    let x = centerX + (radius + 10) * Math.cos(angle);
    let y = centerY + (radius + 10) * Math.sin(angle);
    points.push({ x, y, angle });
}

const mainSequence = new Sequence();

const bgSrc = canvas.scene?.background?.src;
const canvasWidth = canvas.dimensions?.width ?? canvas.scene?.width ?? 4000;
const canvasHeight = canvas.dimensions?.height ?? canvas.scene?.height ?? 3000;
const sceneWidth = canvas.scene?.width ?? canvasWidth;
const sceneHeight = canvas.scene?.height ?? canvasHeight;

mainSequence
    .effect()
    .file(bgSrc)
    .name(label)
    .filter("ColorMatrix", { brightness: 0.3 })
    .atLocation({ x: canvasWidth / 2, y: canvasHeight / 2 })
    .size({ width: sceneWidth / gridSize, height: sceneHeight / gridSize }, { gridUnits: true })
    .persist()
    .fadeIn(500)
    .fadeOut(1000)
    .belowTokens()
    .playIf(() => {
        return darkMap === true && !!bgSrc;
    })

    .thenDo(function () {
        if (cameraZoom === true) {
            canvas.animatePan({ duration: 250, x: token.center.x, y: token.center.y, scale: 1.620 });
        }
    })

    .effect()
    .file(closest("eskie.damage.electricity.01.purple"))
    .atLocation(token, { offset: { x: 0, y: 0 }, gridUnits: true })
    .attachTo(token)
    .scaleToObject(tokenScaleX * 1.4)
    .filter("ColorMatrix", { hue: 175 })
    .mirrorX()
    .waitUntilFinished(-300)

    .effect()
    .file(closest("eskie.smoke.07.white"))
    .atLocation(token)
    .attachTo(token)
    .scaleToObject(tokenScaleX * 1.5)
    .filter("ColorMatrix", { saturate: 1, hue: 100 })
    .belowTokens()
    .zIndex(0)

    .animation()
    .on(token)
    .opacity(0)

    .effect()
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .atLocation(token)
    .scaleToObject(1.1, { considerTokenScale: true })
    .filter("ColorMatrix", { saturate: -1, brightness: 10 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .filter("Glow", { color: 0xbb00ff, distance: 2, outerStrength: 2 })
    .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.75, duration: 300, ease: "easeOutCubic", gridUnits: true })
    .animateProperty('sprite', 'width', { from: 1, to: 0.025, duration: 300, ease: "easeOutCubic", gridUnits: true })
    .animateProperty('sprite', 'height', { from: 1, to: 1.5, duration: 300, ease: "easeOutCubic", gridUnits: true })
    .fadeOut(200)
    .duration(400)
    .attachTo(token, { bindAlpha: false })

    .effect()
    .file(closest("eskie.damage.electricity.01.purple"))
    .atLocation(token)
    .scaleToObject(1.1)
    .filter("ColorMatrix", { saturate: -1, brightness: 10 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .filter("Glow", { color: 0xbb00ff, distance: 2, outerStrength: 2 })
    .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.75, duration: 300, ease: "easeOutCubic", gridUnits: true })
    .animateProperty('sprite', 'width', { from: 1, to: 0.5, duration: 100, ease: "easeOutCubic", gridUnits: true })
    .animateProperty('sprite', 'height', { from: 1, to: 1.5, duration: 300, ease: "easeOutCubic", gridUnits: true })
    .fadeOut(200)
    .duration(400)
    .attachTo(token, { bindAlpha: false })
    .waitUntilFinished(-300)

    .thenDo(function () {
        if (cameraZoom === true) {
            canvas.animatePan({ duration: 50, x: token.center.x, y: token.center.y, scale: 0.420 });
        }
    });

// Slashes
for (let e = 0; e < 10; e++) {
    if (e === 0) {
        for (let u = 0; u < 5; u++) {
            if (u === 4) {
                mainSequence.addSequence(new Sequence()
                    .wait(200 * (u + 1) - 199)

                    .effect()
                    .file(closest("jb2a.impact.002.pinkpurple"))
                    .atLocation(initialPoints[u])
                    .spriteOffset({ x: -0.6 }, { gridUnits: true })
                    .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                    .filter("Glow", { color: 0xbb00ff, distance: 2, outerStrength: 2, innerStrength: -1 })
                    .name(label)
                    .rotateTowards(position)
                    .size({ width: 1, height: 2.5 }, { gridUnits: true })
                    .opacity(1)
                    .zIndex(2)

                    .effect()
                    .copySprite(token)
                    .spriteRotation(-tokenRotation)
                    .atLocation(initialPoints[u])
                    .scaleToObject(0.95, { considerTokenScale: true })
                    .tint("#e305ff")
                    .name(label)
                    .scaleIn(0, 250, { ease: "easeOutCubic" })
                    .fadeOut(250, { ease: "easeOutCubic" })
                    .duration(500)
                    .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                    .filter("Glow", { color: 0xbb00ff, distance: 2, outerStrength: 2, innerStrength: -1 })
                    .filter("Blur", { blurX: 5, blurY: 10 })
                    .rotateTowards(position)
                    .opacity(1)
                    .zIndex(4)

                    .effect()
                    .copySprite(token)
                    .spriteRotation(-tokenRotation)
                    .atLocation(initialPoints[u])
                    .scaleToObject(0.95, { considerTokenScale: true })
                    .tint("#e305ff")
                    .name(label)
                    .filter("ColorMatrix", { saturate: -0.25, brightness: 1.1, contrast: 0.6 })
                    .scaleIn(0, 250, { ease: "easeOutCubic" })
                    .fadeIn(250)
                    .persist()
                    .rotateTowards(position)
                    .opacity(0.35)
                    .zIndex(3)

                    .effect()
                    .file(closest("eskie.attack.ranged.arrow.01.physical.heavy.purpleblack"))
                    .atLocation(initialPoints[u])
                    .stretchTo(position)
                    .filter("ColorMatrix", { hue: 70 })

                    .thenDo(function () {
                        targets.forEach(target => {
                            const targetRot = target.document?.rotation ?? 0;
                            new Sequence()
                                .animation()
                                .on(target)
                                .opacity(1)

                                .effect()
                                .copySprite(target)
                                .spriteRotation(-targetRot)
                                .atLocation(target)
                                .scaleToObject(1, { considerTokenScale: true })
                                .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.1, duration: 60, gridUnits: true, fromEnd: false })
                                .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.1, duration: 60, gridUnits: true, fromEnd: false, delay: 90 })
                                .extraEndDuration(30)
                                .filter("Blur", { blurX: 0, blurY: 5 })
                                .opacity(0.35)

                                .effect()
                                .file(closest("jb2a.impact.009.orange"))
                                .atLocation(target, { randomOffset: 1, gridUnits: true })
                                .randomRotation()
                                .filter("ColorMatrix", { hue: 250, saturate: -0.4 })
                                .scaleToObject(1)
                                .zIndex(0)

                                .play();
                        });
                    })

                    .wait(150)

                    .effect()
                    .file(closest("eskie.smoke.07.white"))
                    .atLocation(token)
                    .attachTo(token)
                    .scaleToObject(tokenScaleX * 1.5)
                    .mirrorX()
                    .filter("ColorMatrix", { saturate: 1, hue: 100 })
                    .belowTokens()
                    .zIndex(0)

                    .animation()
                    .on(token)
                    .opacity(1)
                    .fadeIn(250)

                    .wait(50)
                );
            } else {
                mainSequence.addSequence(new Sequence()
                    .wait(200 * (u + 1) - 199)

                    .effect()
                    .file(closest("jb2a.impact.002.pinkpurple"))
                    .atLocation(initialPoints[u])
                    .spriteOffset({ x: -0.6 }, { gridUnits: true })
                    .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                    .filter("Glow", { color: 0xbb00ff, distance: 2, outerStrength: 2, innerStrength: -1 })
                    .name(label)
                    .rotateTowards(initialPoints[Math.max(1, (u - 1))])
                    .size({ width: 1, height: 2.5 }, { gridUnits: true })
                    .opacity(1)
                    .zIndex(2)

                    .effect()
                    .copySprite(token)
                    .spriteRotation(-tokenRotation)
                    .atLocation(initialPoints[u])
                    .scaleToObject(0.95, { considerTokenScale: true })
                    .tint("#e305ff")
                    .name(label)
                    .scaleIn(0, 250, { ease: "easeOutCubic" })
                    .fadeOut(250, { ease: "easeOutCubic" })
                    .duration(500)
                    .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                    .filter("Glow", { color: 0xbb00ff, distance: 2, outerStrength: 2, innerStrength: -1 })
                    .filter("Blur", { blurX: 5, blurY: 10 })
                    .rotateTowards(initialPoints[(u + 1)])
                    .opacity(1)
                    .zIndex(4)

                    .effect()
                    .copySprite(token)
                    .spriteRotation(-tokenRotation)
                    .atLocation(initialPoints[u])
                    .scaleToObject(0.95, { considerTokenScale: true })
                    .tint("#e305ff")
                    .name(label)
                    .filter("ColorMatrix", { saturate: -0.25, brightness: 1.1, contrast: 0.6 })
                    .scaleIn(0, 250, { ease: "easeOutCubic" })
                    .fadeIn(250)
                    .persist()
                    .rotateTowards(initialPoints[(u + 1)])
                    .opacity(0.35)
                    .zIndex(3)

                    .effect()
                    .file(closest("eskie.attack.ranged.arrow.01.physical.heavy.purpleblack"))
                    .atLocation(initialPoints[u])
                    .stretchTo(initialPoints[(u + 1)])
                    .filter("ColorMatrix", { hue: 70 })

                    .thenDo(function () {
                        targets.forEach(target => {
                            const targetRot = target.document?.rotation ?? 0;
                            new Sequence()
                                .effect()
                                .copySprite(target)
                                .spriteRotation(-targetRot)
                                .atLocation(target)
                                .scaleToObject(1, { considerTokenScale: true })
                                .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.1, duration: 60, gridUnits: true, fromEnd: false })
                                .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.1, duration: 60, gridUnits: true, fromEnd: false, delay: 90 })
                                .extraEndDuration(30)
                                .filter("Blur", { blurX: 0, blurY: 5 })
                                .opacity(0.35)

                                .effect()
                                .file(closest("jb2a.impact.009.orange"))
                                .atLocation(target, { randomOffset: 1, gridUnits: true })
                                .randomRotation()
                                .scaleToObject(1)
                                .filter("ColorMatrix", { hue: 250, saturate: -0.4 })
                                .zIndex(0)

                                .play();
                        });
                    })
                );
            }
        }
    } else if (e === 9) {
        mainSequence.addSequence(new Sequence()
            .effect()
            .name(`location`)
            .file(closest("eskie.attack.ranged.arrow.01.physical.heavy.purpleblack"))
            .atLocation(points[e])
            .stretchTo(points[0])
            .filter("ColorMatrix", { hue: 70 })
            .zIndex(4)

            .thenDo(function () {
                targets.forEach(target => {
                    const targetRot = target.document?.rotation ?? 0;
                    new Sequence()
                        .effect()
                        .copySprite(target)
                        .spriteRotation(-targetRot)
                        .atLocation(target)
                        .scaleToObject(1, { considerTokenScale: true })
                        .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.1, duration: 60, gridUnits: true, fromEnd: false })
                        .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.1, duration: 60, gridUnits: true, fromEnd: false, delay: 90 })
                        .extraEndDuration(30)
                        .filter("Blur", { blurX: 0, blurY: 5 })
                        .opacity(0.35)

                        .effect()
                        .file(closest("jb2a.impact.009.orange"))
                        .atLocation(target, { gridUnits: true })
                        .randomRotation()
                        .scaleToObject(2)
                        .filter("ColorMatrix", { hue: 250, saturate: -0.4 })
                        .zIndex(0)
                        .delay(700)
                        .waitUntilFinished(-500)

                        .animation()
                        .on(target)
                        .opacity(0)

                        .effect()
                        .copySprite(target)
                        .spriteRotation(-targetRot)
                        .atLocation(target, { local: true })
                        .scaleToObject(1, { considerTokenScale: true })
                        .filter("ColorMatrix", { brightness: -1 })
                        .filter("Blur", { blurX: 5, blurY: 10 })
                        .animateProperty('spriteContainer', "scale.x", { from: 1, to: 0.9, duration: 500, ease: "easeOutCubic" })
                        .animateProperty('spriteContainer', "scale.y", { from: 1, to: 0.9, duration: 500, ease: "easeOutCubic" })
                        .animateProperty('spriteContainer', "scale.x", { from: 1, to: 1.1, duration: 250, delay: 500, ease: "easeOutCubic" })
                        .animateProperty('spriteContainer', "scale.y", { from: 1, to: 1.1, duration: 250, delay: 500, ease: "easeOutCubic" })
                        .opacity(0.5)
                        .belowTokens()

                        .effect()
                        .copySprite(target)
                        .spriteRotation(-targetRot)
                        .atLocation(target, { local: true })
                        .scaleToObject(1, { considerTokenScale: true })
                        .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.25, duration: 500, gridUnits: true, ease: "easeOutCubic" })
                        .animateProperty('sprite', 'rotation', { from: 0, to: 90, duration: 500, ease: "easeInOutBack" })
                        .animateProperty('spriteContainer', 'position.y', { from: 0.25, to: 0, duration: 250, gridUnits: true, delay: 500, ease: "easeOutCubic" })
                        .extraEndDuration(100)
                        .waitUntilFinished(-100)

                        .effect()
                        .file(closest("eskie.smoke.06.white"))
                        .atLocation(target)
                        .scaleToObject(1.5)
                        .belowTokens()
                        .opacity(0.5)

                        .animation()
                        .on(target)
                        .rotate(90)
                        .opacity(1)

                        .wait(1500)

                        .animation()
                        .on(target)
                        .rotate(0)
                        .opacity(1)

                        .play();
                });
            })

            .wait(400)

            .effect()
            .file(closest("eskie.lightning.lightning_bolt.blue"))
            .atLocation(position, { offset: { x: size / 2, y: -0.5 }, gridUnits: true })
            .stretchTo(position, { offset: { x: (size / 2) * -1, y: 0.5 }, gridUnits: true })
            .filter("ColorMatrix", { hue: 60 })
            .filter("ColorMatrix", { saturate: 1.25 })
            .zIndex(4)
            .waitUntilFinished(-200)

            .thenDo(function () {
                Sequencer.EffectManager.endEffects({ name: label });
            })

            .animation()
            .on(token)
            .opacity(1)
        );
    } else {
        mainSequence.addSequence(new Sequence()
            .effect()
            .file(closest("eskie.attack.ranged.arrow.01.physical.heavy.purpleblack"))
            .atLocation(points[e])
            .stretchTo(points[e + 1])
            .fadeOut(1000)
            .filter("ColorMatrix", { hue: 70 })
            .zIndex(4)

            .effect()
            .file(closest("eskie.attack.ranged.arrow.01.physical.heavy.purpleblack"))
            .atLocation(points[9 - e])
            .stretchTo(points[9 - e - 1])
            .fadeOut(1000)
            .filter("ColorMatrix", { hue: 70 })
            .playIf(() => {
                return Math.random() < 0.5;
            })
            .zIndex(4)

            .thenDo(function () {
                targets.forEach(target => {
                    const targetRot = target.document?.rotation ?? 0;
                    new Sequence()
                        .effect()
                        .copySprite(target)
                        .spriteRotation(-targetRot)
                        .atLocation(target)
                        .scaleToObject(1, { considerTokenScale: true })
                        .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.1, duration: 60, gridUnits: true, fromEnd: false })
                        .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.1, duration: 60, gridUnits: true, fromEnd: false, delay: 90 })
                        .extraEndDuration(30)
                        .filter("Blur", { blurX: 0, blurY: 5 })
                        .opacity(0.35)

                        .effect()
                        .file(closest("jb2a.impact.009.orange"))
                        .atLocation(target, { randomOffset: 1, gridUnits: true })
                        .randomRotation()
                        .scaleToObject(1)
                        .filter("ColorMatrix", { hue: 250, saturate: -0.4 })
                        .playIf(() => {
                            return Math.random() < 0.5;
                        })
                        .zIndex(0)

                        .play();
                });
            })

            .wait(50)
        );
    }
}

await mainSequence.play();
