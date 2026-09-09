/**
* Last Updated: 01/06/2026
* Author: .Doomrule
* Modular Update: Bakana
**/

import { closest } from "../../../lib/filemanager.js";
import { settingsOverride } from "../../../lib/settings.js";
import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
import { log } from "../../../lib/logger.js";

const DEFAULT_CONFIG = {
    id: 'benignTransportation',
    animations: {
        out: {
            file: 'jb2a.misty_step.01.blue',
            until: -2000,
        },
        in: {
            file: 'jb2a.misty_step.02.blue',
            until: -3500,
        }
    },
    sound: {
        ...DEFAULT_SOUND_CONFIG,
        enable: true,
        volume: 0.5,
        file: `psfx.2nd-level-spells.misty-step.v1.outro.fire`,
    },
    teleport: true
};

async function create(token: Token, targets: Token | Token[], config: any = {}) {
    config = settingsOverride(config);
    const { id, animations, sound, teleport } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const targetList = [targets].flat().filter(target => target && target.id !== token.id);
    if (targetList.length === 0) return;
    
    const A = targetList[0];
    const B = (targetList.length > 1) ? targetList[1] : token;
    // Snapshot primitive numbers instead of keeping live object references to token.center
    const ADest = adapter.getCenter(A);
    const BDest = adapter.getCenter(B);

    const seq = new Sequence();
    applySound(seq, sound);
    // 1. Play outro animations on both tokens
    seq.effect()
        .file(closest(animations.out.file))
        .atLocation(A)
        .scaleToObject(2)
    .effect()
        .file(closest(animations.out.file))
        .atLocation(B)
        .scaleToObject(2)
        .waitUntilFinished(animations.out.until)
    .animation()
        .on(A)
        .opacity(0)
    .animation()
        .on(B)
        .opacity(0);
    // 2. Teleport sequentially so target squares are clear before each token moves
    if (teleport) {
        seq.thenDo(async () => {
            const aDims = adapter.getTokenDimensions(A);
            const bDims = adapter.getTokenDimensions(B);
            await A.document.update({ x: BDest.x - (aDims.widthPx / 2), y: BDest.y - (aDims.heightPx / 2) }, { animate: false });
            await B.document.update({ x: ADest.x - (bDims.widthPx / 2), y: ADest.y - (bDims.heightPx / 2) }, { animate: false });
        });
    }
    // 3. Play intro animations at the new locations
    seq.effect()
        .file(closest(animations.in.file))
        .atLocation(A)
        .scaleToObject(2)
    .effect()
        .file(closest(animations.in.file))
        .atLocation(B)
        .scaleToObject(2)
        .waitUntilFinished(animations.in.until)
    // 4. Restore opacity
    .animation()
        .on(A)
        .opacity(1)
    .animation()
        .on(B)
        .opacity(1);

    return seq;
}

async function play(token: Token, targets: Token | Token[], config: any = {}) {
    let seq = await create(token, targets, config);
    if (seq) { await seq.play(); }
}

export const benignTransportation = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("benignTransportation", "ranged-target", "eskie.effect.benignTransportation", DEFAULT_CONFIG, "0.0.1", "Benign Transportation");