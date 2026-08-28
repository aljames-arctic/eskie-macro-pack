/* **
   Original Author: Gornetron (nefin)
   Update Author: bakanabaka
** */

const DEFAULT_CONFIG = {
    repeat: 0,
    delay: 1000,
    sendToCenter: false,
    destinationPoints: undefined,
};

function create(targets, config = {}) {
    const targetList = [targets].flat().filter(Boolean);
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    mConfig.destinationPoints = targetList.map(t => ({ x: t.x, y: t.y }));
    const { sendToCenter, destinationPoints } = mConfig;

    if (targetList.length !== destinationPoints.length)
        throw new Error(`User provided ${targetList.length} targets but ${destinationPoints.length} destination points. Can not shuffle.`);

    const shuffle = destinationPoints.sort(() => Math.random() - 0.5);
    const shuffleSeq = new Sequence();

    if (targetList.length === 0) return shuffleSeq;

    if (sendToCenter) {
        let centerPoint = destinationPoints.reduce((acc, { x, y }) => ({ x: acc.x + x, y: acc.y + y }), { x: 0, y: 0 });
        centerPoint.x /= destinationPoints.length;
        centerPoint.y /= destinationPoints.length;
        for (const t of targetList) {
            shuffleSeq.animation()
                .on(t)
                .moveTowards(centerPoint)
                .duration(1000);
        }
    }

    for (let i = 0; i < targetList.length; i++) {
        shuffleSeq.animation()
            .on(targetList[i])
            .moveTowards(shuffle[i])
            .delay(200)
            .duration(1000);
    }
    return shuffleSeq;
}

async function play(targets, config = {}) {
    const targetList = [targets].flat().filter(Boolean);
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    mConfig.destinationPoints = targetList.map(t => ({ x: t.x, y: t.y }));
    const { repeat, delay, sendToCenter, destinationPoints } = mConfig;

    for (let i = 0; i <= repeat; i++) {
        let seq = create(targetList, { sendToCenter, destinationPoints });
        if (delay > 0) seq = seq.wait(delay);
        if (seq) { await seq.play(); }
    }
}

export const shuffle = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};