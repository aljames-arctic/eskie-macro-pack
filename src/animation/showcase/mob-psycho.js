import { adapter } from "../../adapters/index.js";


const DEFAULT_CONFIG = {
    baseDuration: 100,
    finalDuration: 250,
}

//SET TEXT STYLE
function getColor(number) {
    const zero = "#FFFFFF";
    const twenty = "#09ffef";
    const fourty = "#1efe25";
    const sixty = "#a8f500";
    const eighty = "#ffb500";
    const hundred = "#e90101";

    const startColor = (number < 20) ? zero : (number < 40) ? twenty : (number < 60) ? fourty : (number < 80) ? sixty : (number < 100) ? eighty : hundred;
    const endColor = (number <= 20) ? twenty : (number <= 40) ? fourty : (number <= 60) ? sixty : (number <= 80) ? eighty : (number <= 100) ? hundred : hundred;
    const step = number % 20;
    const totalSteps = 20;

    return getColorGradient(startColor, endColor, step, totalSteps);
}

function getColorGradient(startColor, endColor, step, totalSteps) {
    // Remove the '#'
    const startHex = startColor.startsWith("#") ? startColor.substring(1) : startColor;
    const endHex = endColor.startsWith("#") ? endColor.substring(1) : endColor;

    // Determine if there's an alpha channel
    const hasAlpha = startHex.length === 8 && endHex.length === 8;

    // Parse RGBA components
    const startR = parseInt(startHex.substring(0, 2), 16);
    const startG = parseInt(startHex.substring(2, 4), 16);
    const startB = parseInt(startHex.substring(4, 6), 16);
    const startA = hasAlpha ? parseInt(startHex.substring(6, 8), 16) : 255;

    const endR = parseInt(endHex.substring(0, 2), 16);
    const endG = parseInt(endHex.substring(2, 4), 16);
    const endB = parseInt(endHex.substring(4, 6), 16);
    const endA = hasAlpha ? parseInt(endHex.substring(6, 8), 16) : 255;

    // Calculate the interpolated RGBA values
    const t = step / totalSteps;
    const r = Math.round(startR + (endR - startR) * t);
    const g = Math.round(startG + (endG - startG) * t);
    const b = Math.round(startB + (endB - startB) * t);
    const a = hasAlpha ? Math.round(startA + (endA - startA) * t) : 255;

    // Helper to format to 2-digit hex
    const toHex = (c) => ("0" + c.toString(16)).slice(-2);

    // Construct the new hex color string
    let newHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    if (hasAlpha) {
        newHex += toHex(a);
    }

    return newHex;
}

async function play(startNumber, endNumber, config = {}){
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { baseDuration, finalDuration } = mConfig;

    const step = startNumber <= endNumber ? 1 : -1;
    const totalSteps = Math.abs(endNumber - startNumber) || 1;

    for (let n = startNumber, i = 0; step > 0 ? n <= endNumber : n >= endNumber; n += step, i++) {
        const style = {
            fill: getColor(n),
            fontFamily: "Impact, Charcoal, sans-serif",
            fontSize: canvas.grid.size*2,
        };

        const t = i / totalSteps;
        const duration = Math.round(baseDuration + (finalDuration - baseDuration) * t);

        //COUNTDOWN SEQUENCE
        await new Sequence()
            .effect()
                .file("icons/svg/d6-grey.svg")
                .screenSpace()
                .screenSpaceScale({fitX:true, fitY:true, x:2,y:2})
                .duration(duration+baseDuration)
                .filter("ColorMatrix", { brightness:0 })
                .playIf(t !== 1)
                
            .effect()
                .text(`${n}`, style)
                .screenSpace()
                .screenSpaceScale({x:2,y:2})
                .duration(duration)
                .zIndex(1)
                .playIf(t !== 1)
                .waitUntilFinished(-baseDuration/2)
            
            //FINAL NUMBER EFFECT (Just longer duration)
            .effect()
                .file("icons/svg/d6-grey.svg")
                .screenSpace()
                .screenSpaceScale({fitX:true, fitY:true, x:2,y:2})
                .duration(finalDuration*4)
                .filter("ColorMatrix", { brightness:0 })
                .playIf(t == 1)
            
            .effect()
                .text(`${n}`, style)
                .screenSpace()
                .screenSpaceScale({x:2,y:2})
                .duration(finalDuration*4)
                .zIndex(1)
                .playIf(t == 1)
                .waitUntilFinished(-baseDuration)
                
            .play();
    }
}

export const mobPsycho = {
    play,
}