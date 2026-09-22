//Last Updated: 9/21/2026
//Author: .eskie

//Set bounce number
let bounces = 1;
//Set projectile file
let projectile = "jb2a.bullet.01.orange";
//Set bounce delay adjustment
let delay = -200;
//Set effect start time adjustment
let startTime = 0;

const finalTarget = Array.from(game.user.targets)[0];

if (!finalTarget) {
  return ui.notifications.warn("No target selected.");
}

const positions = [];

for (let i = 0; i < bounces; i++) {
  const previousPosition = i === 0 ? token.center : positions[i - 1];

  const position = await Sequencer.Crosshair.show(
    {
      t: "circle",
      distance: token.document.width * 2.5,
      snap: { position: 0 },
      gridHighlight: false,
      borderAlpha: 0,
    },
    {
      [Sequencer.Crosshair.CALLBACKS.SHOW]: (crosshair) => {
        new Sequence()

          .wait(50)

          .effect()
            .name(`${token.document.name} Ricochet Shot Crosshair`)
            .file("eskie.crosshair.reticle.generic_02.white")
            .attachTo(crosshair)
            .scaleToObject(1)
            .opacity(0.5)
            .filter("ColorMatrix", { saturate: -1 })
            .locally()
            .persist()

          .thenDo(() => {

            let pathSequence = new Sequence();

            for (let p = 0; p < positions.length; p++) {
              const fromPosition = p === 0 ? token.center : positions[p - 1];
              const toPosition = positions[p];

              pathSequence
                .effect()
                  .delay(50)
                  .name(`${token.document.name} Ricochet Shot Crosshair`)
                  .file("eskie.crosshair.line.generic_01.white")
                  .attachTo({ x: fromPosition.x, y: fromPosition.y })
                  .stretchTo({ x: toPosition.x, y: toPosition.y })
                  .opacity(0.8)
                  .locally()
                  .persist();
            }

            pathSequence

              .effect()
                .delay(50)
                .name(`${token.document.name} Ricochet Shot Crosshair`)
                .file("eskie.crosshair.line.generic_01.white")
                .attachTo({ x: previousPosition.x, y: previousPosition.y })
                .stretchTo(crosshair, { attachTo: true })
                .opacity(0.8)
                .locally()
                .persist()

              .play();
          })

          .effect()
            .delay(50)
            .name(`${token.document.name} Ricochet Shot Crosshair`)
            .file("eskie.crosshair.line.generic_01.white")
            .attachTo(crosshair)
            .stretchTo(finalTarget, { attachTo: true })
            .opacity(0.8)
            .locally()
            .persist()
            .waitUntilFinished()

          .thenDo(() => {
            Sequencer.EffectManager.endEffects({
              name: `${token.document.name} Ricochet Shot Crosshair`,
            });
          })

          .play();
      },

      [Sequencer.Crosshair.CALLBACKS.PLACED]: () => {
        Sequencer.EffectManager.endEffects({
          name: `${token.document.name} Ricochet Shot Crosshair`,
        });
      },

      [Sequencer.Crosshair.CALLBACKS.CANCEL]: () => {
        Sequencer.EffectManager.endEffects({
          name: `${token.document.name} Ricochet Shot Crosshair`,
        });
      },
    }
  );

  if (!position) break;

  positions.push(position);
}

for (let e = 0; e < positions.length + 1; e++) {
  const initialPosition = e === 0 ? token : positions[e - 1];
  const target = e === positions.length ? finalTarget : positions[e];

  await new Sequence()

    .effect()
      .file(projectile)
      .atLocation(initialPosition)
      .stretchTo(target)
      .startTime(startTime)
      .waitUntilFinished(delay)

    .play();
}