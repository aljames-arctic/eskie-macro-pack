import { closest } from "../../lib/filemanager.js";
import { adapter } from "../../adapters/index.js";

const DEFAULT_CONFIG = {
    id: 'cinema-bars',
    dim: true,
};

function create(config = {}) {
    const { id, dim } = adapter.mergeObject(DEFAULT_CONFIG, config);

    let sequence = new Sequence();
    sequence.effect()
        .name(id)
        .screenSpace()
        .screenSpaceScale({ fitX: true, fitY: true })
        .file(closest("eskie.screen_overlay.cinema_bars.02"))
        .persist();

    const bg = adapter.getSceneBackground(canvas?.scene);
    if (dim && bg?.src) {
        const sceneCenter = adapter.getSceneCenter(canvas?.scene);
        const sceneDims = adapter.getSceneDimensions(canvas?.scene);
        sequence.effect()
            .file(bg.src)
            .name(id)
            .filter("ColorMatrix", { brightness: 0.3 })
            .atLocation(sceneCenter)
            .size({ width: sceneDims.sceneRect.width / sceneDims.size, height: sceneDims.sceneRect.height / sceneDims.size }, { gridUnits: true })
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
    const { id } = adapter.mergeObject(DEFAULT_CONFIG, config);
    return Sequencer.EffectManager.endEffects({ name: id });
}

export const cinemaBars = {
    create,
    play,
    stop,
};
