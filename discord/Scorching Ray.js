//Last Updated: 8/25/2026
//Author: .eskie

let targets = Array.from(game.user.targets);

let content = `<p>Enter the number of rays for each target:</p><form>`;
targets.forEach((target, index) => {
  content += `
    <div class="form-group">
      <label for="ray-count-${index}"><strong>${target.name}</strong></label>
      <input id="ray-count-${index}" type="number" min="1" value="1" style="width: 50px;" />
    </div>`;
});
content += `</form>`;

// Get midpoint of all targets
let midpoint = {
  x: targets.reduce((sum, t) => sum + t.center.x, 0) / targets.length,
  y: targets.reduce((sum, t) => sum + t.center.y, 0) / targets.length
};

new Dialog({
  title: "🔥 Scorching Ray 🔥",
  content: content,
  buttons: {
    cast: {
      label: "Cast!",
      callback: async (html) => {
        let rayCounts = [];

        targets.forEach((target, index) => {
          let count = parseInt(html.find(`#ray-count-${index}`).val());
          rayCounts.push({
            target,
            rayCount: isNaN(count) ? 1 : count
          });
        });

        if (rayCounts.length === 0) {
          return ui.notifications.warn("No rays were cast!");
        }

        animateScorchingRays(rayCounts, midpoint);
      }
    },
    cancel: {
      label: "Cancel",
      callback: () => ui.notifications.info("Scorching Ray casting canceled.")
    }
  },
  default: "cast"
}).render(true);

async function animateScorchingRays(rayCounts, midpoint) {

  new Sequence()

    .effect()
    .file(`eskie.casting.arcane.01.side.loop.orange`)
    .attachTo(token)
    .rotateTowards(midpoint)
    .scaleToObject(1.5)
    .spriteOffset({ x: -0.2 }, { gridUnits: true })
    .fadeOut(250)
    .zIndex(1)

    .effect()
    .delay(500)
    .file("eskie.particle.02.orange")
    .attachTo(token)
    .rotateTowards(midpoint)
    .spriteOffset({x:-0.9}, {gridUnits:true})
    .size(1.5, {gridUnits:true})
    .fadeIn(250)
    .fadeOut(500)
    .duration(1750)

  .play();

  await Sequencer.Helpers.wait(500);

  for (let data of rayCounts) {
    for (let i = 0; i < data.rayCount; i++) {

      new Sequence()

        .effect()
        .file(`jb2a.scorching_ray.orange`)
        .attachTo(token)
        .stretchTo(data.target, {randomOffset:0.5,gridUnits:true})
        .randomizeMirrorY()
        .scale(0.5)
        .template({ gridSize: 200, startPoint: 10, endPoint: 200 })
        .zIndex(2)

        .effect()
        .delay(500,750)
        .file(`eskie.damage.fire.01.orange`)
        .attachTo(data.target, {randomOffset:0.5,gridUnits:true})
        .scaleToObject(0.8)

      .play();

    }
  }
}