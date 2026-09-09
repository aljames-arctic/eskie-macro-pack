async function create(token: any, position: any) {
    return new Sequence()
        .animation()
        .on(token)
        .teleportTo(position)
}

async function play(token: any, position: any) {
    if (!token) return;
    if (!position) {
        position = await Sequencer.Crosshair.show();
        if (position.cancelled) return;
    }

    let seq = await create(token, position);
    if (seq) { return seq.play(); }
}

export const teleport = {
    create,
    play,
};