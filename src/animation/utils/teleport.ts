async function create(token: Token, position: { x: number; y: number }) {
    return new Sequence()
        .animation()
        .on(token)
        .teleportTo(position)
}

async function play(token: Token, position?: { x: number; y: number } | any) {
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