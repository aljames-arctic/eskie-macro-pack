// Standalone Macro: Scorching Ray
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Scorching Ray' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const targets = Array.from(game.user.targets);
if (targets.length === 0) return ui.notifications.warn("Please select at least one target!");

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

const midpoint = {
    x: targets.reduce((sum, t) => sum + (t.center?.x ?? t.x ?? 0), 0) / targets.length,
    y: targets.reduce((sum, t) => sum + (t.center?.y ?? t.y ?? 0), 0) / targets.length,
};

async function animateScorchingRays(rayCounts) {
    const mainSeq = new Sequence()
        .effect()
            .file(closest("eskie.casting.arcane.01.side.loop.orange"))
            .attachTo(token)
            .rotateTowards(midpoint)
            .scaleToObject(1.5, { considerTokenScale: true })
            .spriteOffset({ x: -0.2 }, { gridUnits: true })
            .fadeOut(250)
            .zIndex(1)

        .effect()
            .delay(500)
            .file(closest("eskie.particle.02.orange"))
            .attachTo(token)
            .rotateTowards(midpoint)
            .spriteOffset({ x: -0.9 }, { gridUnits: true })
            .size(1.5, { gridUnits: true })
            .fadeIn(250)
            .fadeOut(500)
            .duration(1750);

    let rayIndex = 0;
    for (const data of rayCounts) {
        for (let i = 0; i < data.rayCount; i++) {
            const delayOffset = 500 + (rayIndex * 150);
            const raySeq = new Sequence()
                .wait(delayOffset)
                .effect()
                    .file(closest("jb2a.scorching_ray.orange"))
                    .attachTo(token)
                    .stretchTo(data.target, { randomOffset: 0.5, gridUnits: true })
                    .randomizeMirrorY()
                    .scale(0.5)
                    .template({ gridSize: 200, startPoint: 10, endPoint: 200 })
                    .zIndex(2)

                .effect()
                    .delay(500)
                    .file(closest("eskie.damage.fire.01.orange"))
                    .attachTo(data.target, { randomOffset: 0.5, gridUnits: true })
                    .scaleToObject(0.8, { considerTokenScale: true });

            mainSeq.addSequence(raySeq);
            rayIndex++;
        }
    }

    await mainSeq.play();
}

if (targets.length === 1) {
    await animateScorchingRays([{ target: targets[0], rayCount: 3 }]);
} else {
    let content = `<p>Enter the number of rays for each target:</p><form>`;
    targets.forEach((target, index) => {
        content += `
        <div class="form-group" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <label for="ray-count-${index}"><strong>${target.name}</strong></label>
            <input id="ray-count-${index}" type="number" min="1" value="1" style="width: 50px;" />
        </div>`;
    });
    content += `</form>`;

    new Dialog({
        title: "🔥 Scorching Ray 🔥",
        content: content,
        buttons: {
            cast: {
                label: "Cast!",
                callback: async (html) => {
                    const rayCounts = [];
                    targets.forEach((target, index) => {
                        const count = parseInt(html.find(`#ray-count-${index}`).val(), 10);
                        rayCounts.push({
                            target,
                            rayCount: isNaN(count) ? 1 : count,
                        });
                    });

                    if (rayCounts.length === 0) {
                        return ui.notifications.warn("No rays were cast!");
                    }

                    await animateScorchingRays(rayCounts);
                },
            },
            cancel: {
                label: "Cancel",
                callback: () => ui.notifications.info("Scorching Ray casting canceled."),
            },
        },
        default: "cast",
    }).render(true);
}
