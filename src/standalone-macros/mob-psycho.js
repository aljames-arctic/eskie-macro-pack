// Standalone Macro: Showcase - Mob Psycho 100 Counter
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Mob Psycho Counter' macro requires the 'Sequencer' module to be installed and active!");
}

function getColorGradient(startColor, endColor, step, totalSteps) {
    const startHex = startColor.startsWith("#") ? startColor.substring(1) : startColor;
    const endHex = endColor.startsWith("#") ? endColor.substring(1) : endColor;

    const startR = parseInt(startHex.substring(0, 2), 16);
    const startG = parseInt(startHex.substring(2, 4), 16);
    const startB = parseInt(startHex.substring(4, 6), 16);

    const endR = parseInt(endHex.substring(0, 2), 16);
    const endG = parseInt(endHex.substring(2, 4), 16);
    const endB = parseInt(endHex.substring(4, 6), 16);

    const t = step / totalSteps;
    const r = Math.round(startR + (endR - startR) * t);
    const g = Math.round(startG + (endG - startG) * t);
    const b = Math.round(startB + (endB - startB) * t);

    const toHex = (c) => ("0" + c.toString(16)).slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getColor(number) {
    const colors = ["#FFFFFF", "#09ffef", "#1efe25", "#a8f500", "#ffb500", "#e90101"];
    const idx = Math.min(Math.floor(number / 20), 4);
    const startColor = colors[idx];
    const endColor = colors[idx + 1];
    return getColorGradient(startColor, endColor, number % 20, 20);
}

const startNumber = 80;
const endNumber = 100;
const baseDuration = 80;
const finalDuration = 250;
const gridSize = canvas.grid.size ?? 100;
const totalSteps = Math.abs(endNumber - startNumber) || 1;

for (let n = startNumber, i = 0; n <= endNumber; n++, i++) {
    const style = {
        fill: getColor(n),
        fontFamily: "Impact, Charcoal, sans-serif",
        fontSize: gridSize * 2,
    };

    const t = i / totalSteps;
    const isFinal = t === 1;
    const duration = isFinal ? finalDuration * 4 : Math.round(baseDuration + (finalDuration - baseDuration) * t);

    const seq = new Sequence()
        .effect()
        .file("icons/svg/d6-grey.svg")
        .screenSpace()
        .screenSpaceScale({ fitX: true, fitY: true, x: 2, y: 2 })
        .duration(isFinal ? finalDuration * 4 : duration + baseDuration)
        .filter("ColorMatrix", { brightness: 0 })

        .effect()
        .text(`${n}%`, style)
        .screenSpace()
        .screenSpaceScale({ x: 2, y: 2 })
        .duration(duration)
        .zIndex(1)
        .waitUntilFinished(-baseDuration / 2);

    await seq.play();
}
