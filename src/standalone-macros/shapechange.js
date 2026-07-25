// Standalone Macro: Shapechange
// Original Author: EskieMoh#2969
// Update Author: bakanabaka
// Modular Standalone Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Shapechange' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => {
    if (typeof eskie !== "undefined" && eskie.util?.file?.closest) {
        return eskie.util.file.closest(path);
    }
    const apiClosest = game.modules.get("eskie-macros")?.api?.util?.closest;
    if (typeof apiClosest === "function") {
        return apiClosest(path);
    }
    return path;
};

const DEFAULT_CONFIG = {
    id: "shapechange",
    hybridForm: "https://files.d20.io/images/390116904/V1XE3gOTz6-hHEg-_jQt3g/original.png",
    wolfForm: "https://files.d20.io/images/390116931/NRBle2scKhQmU-q0EHskPw/original.png",
};

const tokenId = token.id ?? token.document?.id ?? "";
const label = `shapechange - ${tokenId}`;
const persistentShimmerLabel = `shapechange-shimmer - ${tokenId}`;

// Toggle / re-entrant persistent effect handling:
// Check if Shapechange active effect is currently running on token
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
const activeShimmer = Sequencer.EffectManager.getEffects({ name: persistentShimmerLabel, object: token });

if ((activeEffects?.length ?? 0) > 0 || (activeShimmer?.length ?? 0) > 0) {
    // End active persistent effects and trigger revert
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: persistentShimmerLabel, object: token });
    await playRevert(token);
    return;
}

// Fetch or record human base form in flags
let shapechangeData = token.document?.getFlag("eskie-macros", "shapechange");
const currentTexture = token.document?.texture?.src ?? "";
if (!shapechangeData) {
    shapechangeData = { baseForm: currentTexture };
    await token.document?.setFlag("eskie-macros", "shapechange", shapechangeData);
} else if (!shapechangeData.baseForm) {
    shapechangeData.baseForm = currentTexture;
    await token.document?.setFlag("eskie-macros", "shapechange", shapechangeData);
}

// Dialog prompt for player choice of form
const choice = await Dialog.wait({
    title: "Change Shape",
    content: "<p style='text-align: center; margin-bottom: 10px;'>Select a wild shape form to shift into:</p>",
    buttons: {
        hybrid: {
            icon: '<i class="fas fa-paw" style="color: #d4a373;"></i>',
            label: "Hybrid Form",
            callback: () => "hybrid"
        },
        wolf: {
            icon: '<i class="fas fa-dog" style="color: #a3b18a;"></i>',
            label: "Wolf Form",
            callback: () => "wolf"
        }
    },
    default: "hybrid",
    close: () => null
});

if (!choice) return;

const targetForm = choice === "hybrid" ? DEFAULT_CONFIG.hybridForm : DEFAULT_CONFIG.wolfForm;
await playShapechange(token, targetForm, label, persistentShimmerLabel);

/**
 * Executes the forward Shapechange transformation sequence with primal energy cocoon,
 * token ghosts, wild shape morph flash, smoke puff, claw impacts, and persistent shimmer.
 */
async function playShapechange(token, targetForm, effectLabel, shimmerLabel) {
    const sequence = new Sequence();
    const tokenWidth = token.document?.width ?? 1;
    const scaleX = token.document?.texture?.scaleX ?? 1;
    const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;

    // 1. PRIMAL SHIFTING ENERGY COCOON AURA — Dark outflow vortex beneath token
    sequence
        .effect()
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .attachTo(token)
        .duration(5000)
        .fadeIn(500)
        .scaleIn(0, 750, { ease: "easeOutSine" })
        .fadeOut(500)
        .scaleToObject(1.5, { considerTokenScale: true })
        .randomRotation()
        .filter("ColorMatrix", { saturate: 0, brightness: 0 })
        .animateProperty("sprite", "width", {
            from: 0,
            to: 0.25 * scaleX,
            duration: 500,
            gridUnits: true,
            ease: "easeOutCubic",
            delay: 2600,
        })
        .animateProperty("sprite", "height", {
            from: 0,
            to: 0.25 * scaleX,
            duration: 500,
            gridUnits: true,
            ease: "easeOutCubic",
            delay: 2600,
        })
        .belowTokens();

    // 2. PRIMAL ENERGY SWIRL — Swirling dark vortex ring forming cocoon base
    sequence
        .effect()
        .delay(400)
        .file(closest("jb2a.template_circle.vortex.loop.dark_black"))
        .attachTo(token)
        .duration(4000)
        .fadeIn(500)
        .scaleIn(0, 2400, { ease: "easeOutSine" })
        .fadeOut(500)
        .scaleToObject(1.55, { considerTokenScale: true })
        .randomRotation()
        .filter("ColorMatrix", { saturate: 0, brightness: 0 })
        .belowTokens();

    // 3. PRIMAL ENERGY STRANDS COCOON — Green/wild natural strands wrapping surrounding aura
    sequence
        .effect()
        .delay(600)
        .file(closest("jb2a.energy_strands.in.green.01.0"))
        .attachTo(token)
        .duration(3200)
        .fadeIn(400)
        .fadeOut(600)
        .scaleToObject(1.65, { considerTokenScale: true })
        .opacity(0.85)
        .belowTokens();

    // 4. WARPING TOKEN GHOST — Current token sprite stretches and squashes
    sequence
        .effect()
        .copySprite(token)
        .spriteRotation(-tokenRotation)
        .attachTo(token)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("sprite", "width", {
            from: tokenWidth * 1.1 * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 500,
            gridUnits: true,
            ease: "easeInOutBack",
        })
        .animateProperty("sprite", "height", {
            from: tokenWidth * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 750,
            gridUnits: true,
            ease: "easeOutBack",
        })
        .loopProperty("spriteContainer", "position.x", {
            from: -0.005,
            to: 0.005,
            duration: 100,
            pingPong: true,
            gridUnits: true,
        })
        .opacity(0.65)
        .repeats(3, 800, 800);

    // 5. FIRST TARGET FORM GHOST — Very faint, brightened emergence
    sequence
        .effect()
        .file(closest(targetForm))
        .attachTo(token)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("sprite", "width", {
            from: tokenWidth * 1.1 * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 500,
            gridUnits: true,
            ease: "easeInOutBack",
        })
        .animateProperty("sprite", "height", {
            from: tokenWidth * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 750,
            gridUnits: true,
            ease: "easeOutBack",
        })
        .loopProperty("spriteContainer", "position.x", {
            from: -0.005,
            to: 0.005,
            duration: 100,
            pingPong: true,
            gridUnits: true,
        })
        .opacity(0.25)
        .filter("ColorMatrix", { brightness: 0.75 });

    // 6. SECOND TARGET FORM GHOST — Semiapparent intermediate shape
    sequence
        .effect()
        .file(closest(targetForm))
        .delay(800)
        .attachTo(token)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("sprite", "width", {
            from: tokenWidth * 1.1 * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 500,
            gridUnits: true,
            ease: "easeInOutBack",
        })
        .animateProperty("sprite", "height", {
            from: tokenWidth * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 750,
            gridUnits: true,
            ease: "easeOutBack",
        })
        .loopProperty("spriteContainer", "position.x", {
            from: -0.005,
            to: 0.005,
            duration: 100,
            pingPong: true,
            gridUnits: true,
        })
        .opacity(0.5)
        .filter("ColorMatrix", { brightness: 0.5 });

    // 7. THIRD TARGET FORM GHOST — Nearly solid wild manifest
    sequence
        .effect()
        .file(closest(targetForm))
        .delay(1600)
        .attachTo(token)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("sprite", "width", {
            from: tokenWidth * 1.1 * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 500,
            gridUnits: true,
            ease: "easeInOutBack",
        })
        .animateProperty("sprite", "height", {
            from: tokenWidth * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 750,
            gridUnits: true,
            ease: "easeOutBack",
        })
        .loopProperty("spriteContainer", "position.x", {
            from: -0.005,
            to: 0.005,
            duration: 100,
            pingPong: true,
            gridUnits: true,
        })
        .opacity(0.75)
        .filter("ColorMatrix", { brightness: 0.25 });

    // 8. GLOWING RED EYES FLASH — Peak primal instinct flash
    sequence
        .effect()
        .delay(3000)
        .file(closest("jb2a.eyes.01.dark_red.single"))
        .duration(1250)
        .attachTo(token)
        .scaleToObject(1.15, { considerTokenScale: true })
        .fadeOut(500)
        .zIndex(2);

    // 9. FINAL BLURRED GHOST OF TARGET FORM BEFORE SWAP
    sequence
        .effect()
        .file(closest(targetForm))
        .delay(2400)
        .attachTo(token)
        .duration(2000)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("sprite", "width", {
            from: tokenWidth * 1.1 * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 500,
            gridUnits: true,
            ease: "easeInOutBack",
        })
        .animateProperty("sprite", "height", {
            from: tokenWidth * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 750,
            gridUnits: true,
            ease: "easeOutBack",
        })
        .loopProperty("spriteContainer", "position.x", {
            from: -0.005,
            to: 0.005,
            duration: 100,
            pingPong: true,
            gridUnits: true,
        })
        .opacity(0.75)
        .filter("ColorMatrix", { brightness: 0.2 });

    // 10. CURRENT TOKEN CLIMAX BLUR & DARKEN
    sequence
        .effect()
        .copySprite(token)
        .spriteRotation(-tokenRotation)
        .delay(2400)
        .attachTo(token)
        .duration(2000)
        .fadeIn(750)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("sprite", "width", {
            from: tokenWidth * 1.1 * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 500,
            gridUnits: true,
            ease: "easeInOutBack",
        })
        .animateProperty("sprite", "height", {
            from: tokenWidth * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 750,
            gridUnits: true,
            ease: "easeOutBack",
        })
        .loopProperty("spriteContainer", "position.x", {
            from: -0.005,
            to: 0.005,
            duration: 100,
            pingPong: true,
            gridUnits: true,
        })
        .opacity(1)
        .filter("ColorMatrix", { brightness: 0 })
        .filter("Blur", { blurX: 5, blurY: 5 })
        .zIndex(0)
        .waitUntilFinished(-500);

    // 11. WILD SHAPE MORPH FLASH — Intense energy flash at instant of image transformation
    sequence
        .effect()
        .delay(3800)
        .file(closest("jb2a.impact.004.dark_red"))
        .atLocation(token)
        .scaleToObject(2.5, { considerTokenScale: true })
        .fadeIn(100)
        .fadeOut(400)
        .filter("ColorMatrix", { saturate: 1, brightness: 0.5 })
        .zIndex(4);

    // 12. SMOKE PUFF — Billowing shapechange smoke puff cloud masking the physical morph
    sequence
        .effect()
        .delay(3850)
        .file(closest("jb2a.smoke.puff.side.01.white"))
        .atLocation(token)
        .scaleToObject(2.2, { considerTokenScale: true })
        .fadeIn(150)
        .fadeOut(800)
        .randomRotation()
        .opacity(0.85)
        .filter("ColorMatrix", { saturate: -1, brightness: -0.2 })
        .zIndex(3);

    // 13. TOKEN IMAGE SWAP — Change token image to selected shape
    sequence.thenDo(function () {
        token.document?.update({ "texture.src": targetForm });
    });

    // 14. CLAW SLASH IMPACT — Underneath token post-swap
    sequence
        .effect()
        .file(closest("jb2a.claws.200px.dark_red"))
        .atLocation(token)
        .scaleToObject(2.15, { considerTokenScale: true })
        .fadeOut(500)
        .playbackRate(1.5)
        .belowTokens()
        .zIndex(1);

    // 15. DARK IMPACT BURST BENEATH TOKEN
    sequence
        .effect()
        .file(closest("jb2a.impact.004.dark_red"))
        .atLocation(token)
        .scaleToObject(2.75, { considerTokenScale: true })
        .belowTokens()
        .fadeOut(500)
        .filter("ColorMatrix", { brightness: 0 })
        .opacity(0.85);

    // 16. PERSISTENT POLYMORPH SHIMMER EFFECTS — Endless magic shimmer aura while in wild shape
    sequence
        .effect()
        .name(effectLabel)
        .file(closest("jb2a.shimmer.01.purple"))
        .attachTo(token)
        .scaleToObject(1.3, { considerTokenScale: true })
        .opacity(0.6)
        .fadeIn(1000)
        .fadeOut(1000)
        .filter("ColorMatrix", { hue: 120, saturate: 0.5 })
        .persist()
        .belowTokens(false);

    sequence
        .effect()
        .name(shimmerLabel)
        .file(closest("jb2a.particles.outward.white.01.03"))
        .attachTo(token)
        .scaleToObject(1.4, { considerTokenScale: true })
        .opacity(0.45)
        .fadeIn(800)
        .fadeOut(800)
        .filter("ColorMatrix", { saturate: -1, brightness: 0.5 })
        .persist()
        .belowTokens(true);

    await sequence.play();
}

/**
 * Executes the revert sequence restoring the token to its base human form,
 * complete with unravelling cocoon vortex, energy dissolution particle burst,
 * smoke puff, and flash.
 */
async function playRevert(token) {
    const shapechangeData = token.document?.getFlag("eskie-macros", "shapechange");
    const baseForm = shapechangeData?.baseForm ?? token.document?.texture?.src ?? "";
    const currentForm = token.document?.texture?.src ?? "";

    const sequence = new Sequence();

    // Wide outflow vortex signaling unwinding transformation
    sequence
        .effect()
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .attachTo(token)
        .duration(5000)
        .fadeIn(500)
        .scaleIn(0, 750, { ease: "easeOutSine" })
        .scaleOut(0, 3500, { ease: "easeOutSine" })
        .fadeOut(500)
        .scaleToObject(1.75, { considerTokenScale: true })
        .randomRotation()
        .filter("ColorMatrix", { saturate: 0, brightness: 0 })
        .belowTokens();

    // Animal shape image fading slowly as spirit unbinds
    sequence
        .effect()
        .file(closest(currentForm))
        .attachTo(token)
        .duration(4200)
        .fadeOut(3500, { ease: "easeInSine" })
        .scaleToObject(1, { considerTokenScale: true })
        .loopProperty("spriteContainer", "position.x", {
            from: -0.005,
            to: 0.005,
            duration: 500,
            pingPong: true,
            gridUnits: true,
            delay: 800,
        });

    sequence.wait(500);

    // White energy outward burst particles — animal form breaking apart
    sequence
        .effect()
        .delay(500)
        .file(closest("jb2a.particles.outward.white.01.03"))
        .attachTo(token, { offset: { y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject()
        .duration(1000)
        .fadeOut(800)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .animateProperty("sprite", "width", {
            from: 0,
            to: 0.25,
            duration: 500,
            gridUnits: true,
            ease: "easeOutBack",
        })
        .animateProperty("sprite", "height", {
            from: 0,
            to: 1.0,
            duration: 1000,
            gridUnits: true,
            ease: "easeOutBack",
        })
        .animateProperty("spriteContainer", "position.y", {
            from: 0,
            to: -0.6,
            duration: 1000,
            gridUnits: true,
        })
        .filter("ColorMatrix", { saturate: 0, brightness: 0 })
        .belowTokens()
        .randomizeMirrorX()
        .opacity(1)
        .repeats(14, 250, 250)
        .zIndex(0.3);

    // Smoke puff on reversion
    sequence
        .effect()
        .delay(1200)
        .file(closest("jb2a.smoke.puff.side.01.white"))
        .atLocation(token)
        .scaleToObject(2.0, { considerTokenScale: true })
        .fadeIn(150)
        .fadeOut(600)
        .randomRotation()
        .opacity(0.8)
        .zIndex(2);

    // Wild shape morph flash during revert
    sequence
        .effect()
        .delay(1200)
        .file(closest("jb2a.impact.004.dark_red"))
        .atLocation(token)
        .scaleToObject(2.2, { considerTokenScale: true })
        .fadeIn(100)
        .fadeOut(400)
        .filter("ColorMatrix", { saturate: 0, brightness: 0.6 })
        .zIndex(3);

    // Swap token texture back to human base form
    sequence.thenDo(function () {
        if (baseForm) {
            token.document?.update({ "texture.src": baseForm });
        }
    });

    await sequence.play();
}
