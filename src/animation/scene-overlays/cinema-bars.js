import { closest } from "../../lib/filemanager.js";
import { adapter } from "../../adapters/index.js";

const DEFAULT_CONFIG = {
    id: 'cinema-bars',
    dim: true,
};

function create(config = {}) {
    const { id, dim } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    let sequence = new Sequence();
    sequence.effect()
        .name(id)
        .screenSpace()
        .screenSpaceScale({ fitX: true, fitY: true })
        .file(closest("eskie.screen_overlay.cinema_bars.02"))
        .persist();

    const bg = adapter.getSceneBackground(canvas?.scene);
    if (dim && bg?.src) {
        sequence.effect()
            .file(bg.src)
            .name(id)
            .filter("ColorMatrix", { brightness: 0.3 })
            .atLocation({ x: (canvas?.dimensions?.width ?? 0) / 2, y: (canvas?.dimensions?.height ?? 0) / 2 })
            .size({ width: (canvas?.scene?.width ?? 100) / (canvas?.grid?.size ?? 100), height: (canvas?.scene?.height ?? 100) / (canvas?.grid?.size ?? 100) }, { gridUnits: true })
            .duration(3000)
            .fadeIn(500)
            .fadeOut(500)
            .belowTokens();
    }

    return sequence;
}

async function play(config = {}) {
    let seq = create(config);
    await seq.play();
}

async function stop(config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    return Sequencer.EffectManager.endEffects({ name: id });
}

export const cinemaBars = {
    create,
    play,
    stop,
};
