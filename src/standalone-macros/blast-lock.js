// Standalone Macro: Blast Lock
// Original Author: EskieMoh#2969, GordoZilla
// Modularized by: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Blast Lock' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select your caster token!");

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

const crosshairConfig = {
    size: 2,
    icon: "icons/svg/padlock.svg",
    label: "Blast Lock: Select Door",
    drawIcon: true,
    drawOutline: true,
    interval: 0,
    rememberControlled: true
};

let position = await Sequencer.Crosshair.show(crosshairConfig);
if (!position || position.cancelled) return;

const radius = 3;
const radiusPx = (radius / (canvas.scene?.grid?.distance ?? 5)) * (canvas.grid.size ?? 100);

const lockedDoor = canvas.walls.placeables.find((wall) => {
    const isDoor = (wall.document?.door ?? 0) > 0;
    const isLocked = (wall.document?.ds ?? 0) > 0;
    if (!isDoor || !isLocked) return false;
    const dist = Math.hypot(wall.center.x - position.x, wall.center.y - position.y);
    return dist <= radiusPx;
});

if (lockedDoor) {
    position = { x: lockedDoor.center.x, y: lockedDoor.center.y };
}

const safeElevation = (token.document?.elevation ?? 0) + 10;
const width = lockedDoor?.hitArea ? lockedDoor.hitArea.width : (canvas.grid.size ?? 100);
const effectSize = width / (canvas.grid.size ?? 100);
const tokenWidth = token.document?.width ?? 1;

const seq = new Sequence();

// Padlock icon
seq.effect()
    .file(closest("icons/svg/padlock.svg"))
    .atLocation(position)
    .size(effectSize, { gridUnits: true })
    .opacity(1)
    .filter("Glow", { color: 0xd7a10f, innerStrength: 1, knockout: true })
    .fadeIn(500)
    .xray()
    .duration(500)
    .elevation(safeElevation)
    .zIndex(10);

// Spectral magic chains wrapping padlock
seq.effect()
    .file(closest("jb2a.markers.chain.spectral_standard.complete.02.purple"))
    .atLocation(position)
    .size(effectSize + 0.8, { gridUnits: true })
    .spriteRotation(-90)
    .xray()
    .scaleIn(0, 250, { ease: "easeOutCubic" })
    .startTime(7500)
    .filter("ColorMatrix", { hue: 100 })
    .randomRotation()
    .elevation(safeElevation)
    .zIndex(11);

// Sound effect
seq.sound()
    .file(closest("psfx.cantrips.thunderclap.v1"))
    .volume(0.5);

// Caster muzzle flash
seq.effect()
    .delay(225)
    .file(closest("jb2a.muzzle_flash.single.01.yellow"))
    .atLocation(token)
    .rotateTowards(position)
    .scaleToObject(2.25 * tokenWidth)
    .elevation(safeElevation)
    .zIndex(12);

seq.wait(500);

// Padlock blast explosion
seq.effect()
    .file(closest("jb2a.explosion_side.01.orange"))
    .atLocation(position, { offset: { x: 0, y: 0 }, gridUnits: true })
    .size(1.05, { gridUnits: true })
    .rotateTowards(position)
    .spriteOffset({ x: -0.55 }, { gridUnits: true })
    .playbackRate(1)
    .aboveLighting()
    .opacity(1)
    .elevation(safeElevation)
    .zIndex(13);

// Padlock shrapnel fracture
seq.effect()
    .delay(100)
    .file(closest("jb2a.explosion.side_fracture.flask.02.0"))
    .atLocation(position, { offset: { x: 0, y: 0 }, gridUnits: true })
    .scale(0.25)
    .rotateTowards(token)
    .spriteOffset({ x: -0.25 }, { gridUnits: true })
    .playbackRate(1)
    .opacity(1)
    .elevation(safeElevation)
    .zIndex(12);

seq.canvasPan()
    .shake({ duration: 500, strength: 2, rotation: false, fadeOut: 500 });

// Unlock door via EMP module socketlib API if available, else direct update if GM
seq.thenDo(async function () {
    if (!lockedDoor) return;
    const socketDoor = game.modules.get("eskie-macros")?.api?.socket?.door;
    if (socketDoor?.unlock) {
        await socketDoor.unlock(lockedDoor.id);
    } else if (game.user.isGM) {
        await lockedDoor.document.update({ ds: CONST.WALL_DOOR_STATES.CLOSED });
    } else {
        ui.notifications.warn("Blast Lock hit the door! (Install eskie-macros module for player socket door unlocking).");
    }
});

await seq.play();
