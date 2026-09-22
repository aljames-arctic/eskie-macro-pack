//Last Updated: 9/19/2026
//Author: .eskie

//Enable cast on token?
let castToken = true;
//Enable cast on tile?
let castTile = true;
//Enable light add/change?
let addLight = true;

const position = await Sequencer.Crosshair.show({
  t: "circle",
  distance: 2.5,
  icon: { texture: this.img },
  snap: { position: 0 },
});

// Try to collect token first
let target = Sequencer.Crosshair.collect(position)[0];

// If no token, collect tile by checking if crosshair is inside tile dimensions
if (!target) {
  target = canvas.tiles.placeables.find(tile => {
    const x = position.x;
    const y = position.y;

    const left = tile.document.x;
    const right = tile.document.x + tile.document.width;
    const top = tile.document.y;
    const bottom = tile.document.y + tile.document.height;

    return x >= left && x <= right && y >= top && y <= bottom;
  });
}

if (!target) {
  return ui.notifications.warn("No token or tile found in the area.");
}

const TokenClass = foundry.canvas.placeables.Token;
const TileClass = foundry.canvas.placeables.Tile;

const targetObject = target.object ?? target;
const targetDocument = target.document ?? target;

const isToken = targetObject instanceof TokenClass;
const isTile = targetObject instanceof TileClass;
const isSelf = targetObject === token;

if (isToken && !castToken) {
  return ui.notifications.warn("Token targeting is disabled.");
}

if (isTile && !castTile) {
  return ui.notifications.warn("Tile targeting is disabled.");
}

const glowDistance = (((targetDocument.width + targetDocument.height) / 2) / 10) + 5;

let originalLight = null;
let createdLightDoc = null;

async function spawnLight() {

  if (!addLight) return;

  if (isToken) {

    originalLight = foundry.utils.deepClone(
      targetObject.document.toObject().light ?? {}
    );

    await targetObject.document.update({
      "light.bright": 20,
      "light.dim": 40,
      "light.attenuation": 0.75,
      "light.animation.type": "pulse",
      "light.animation.speed": 2,
      "light.animation.intensity": 2
    });

  }

  if (isTile) {

    const center = targetObject.center;

    [createdLightDoc] = await canvas.scene.createEmbeddedDocuments(
      "AmbientLight",
      [{
        x: center.x,
        y: center.y,
        config: {
          bright: 20,
          dim: 40,
          attenuation: 0.75,
          animation: {
            type: "pulse",
            speed: 2,
            intensity: 2
          }
        }
      }]
    );

  }
}

new Sequence()

  .effect()
    .file(`eskie.casting.divine.01.center.one_shot.white`)
    .attachTo(token)
    .scaleToObject(1)
    .playIf(isSelf)
    .waitUntilFinished(-1000)

  .effect()
    .file(`eskie.casting.divine.01.side.one_shot.white`)
    .attachTo(token)
    .scaleToObject(1)
    .rotateTowards(target)
    .animateProperty("sprite", "position.x", {
      from: -0.5,
      to: 0.05,
      duration: 750,
      gridUnits: true,
      ease: "easeOutSine"
    })
    .playIf(!isSelf)
    .waitUntilFinished(-750)


  .thenDo(async () => {
    await spawnLight();
  })

  .effect()
    .name(`${token.document.name} Light`)
    .shape("circle", {
      lineSize: 4,
      lineColor: "#FFFFFF",
      fillColor: "#FFFFFF",
      fillAlpha: 0.7,
      radius: 4,
      gridUnits: true,
      name: "test"
    })
    .attachTo(target)
    .size(1, { gridUnits: true })
    .fadeIn(2000)
    .fadeOut(1000)
    .opacity(2)
    .persist()
    .tint("#ffffff")
    .spriteRotation(target.rotation)
    .belowTokens()
    .mask(target)
    .playIf(isTile && castTile)

  .effect()
    .name(`${token.document.name} Light`)
    .copySprite(target)
    .attachTo(target)
    .scaleToObject(1)
    .scaleIn(0, 1000, { ease: "easeOutCubic" })
    .fadeIn(1000)
    .fadeOut(1000)
    .persist()
    .spriteRotation(target.rotation)
    .filter("Glow", {
      color: "#ffffff",
      distance: glowDistance,
      outerStrength: 2,
      innerStrength: 2,
      knockout: true
    })
    .belowTiles()
    .playIf(isTile && castTile)

  .effect()
    .name(`${token.document.name} Light`)
    .file("eskie.crosshair.reticle.generic_01.white")
    .attachTo(target, { bindRotation: false })
    .size(1, { gridUnits: true })
    .scaleIn(0, 1000, { ease: "easeOutCubic" })
    .fadeIn(1000)
    .fadeOut(1000)
    .persist()
    .playIf(isToken && castToken)


  .effect()
    .name(`${token.document.name} Light`)
    .file("eskie.environment.lighting.shine.01.rainbow")
    .attachTo(target, { bindRotation: false })
    .scaleToObject(0.8)
    .fadeIn(1500)
    .fadeOut(1000)
    .persist()
    .playIf(isToken && castToken)
    .waitUntilFinished()

  .effect()
    .name(`${token.document.name} Light`)
    .file("eskie.environment.lighting.shine.01.rainbow")
    .attachTo(target, { bindRotation: false })
    .scaleToObject(2.25)
    .fadeIn(1500)
    .fadeOut(1000)
    .persist()
    .playIf(isTile && castTile)
    .waitUntilFinished()

  .thenDo(async () => {

    Sequencer.EffectManager.endEffects({
      name: `${token.document.name} Light`,
      object: target
    });

    if (isToken && addLight) {

      await targetObject.document.update({
        "light.bright": originalLight?.bright ?? 0,
        "light.dim": originalLight?.dim ?? 0,
        "light.color": originalLight?.color ?? null,
        "light.alpha": originalLight?.alpha ?? 0.5,
        "light.angle": originalLight?.angle ?? 360,
        "light.attenuation": originalLight?.attenuation ?? 0.5,
        "light.animation.type": originalLight?.animation?.type ?? null,
        "light.animation.speed": originalLight?.animation?.speed ?? 5,
        "light.animation.intensity": originalLight?.animation?.intensity ?? 5
      });

    }

    if (isTile && addLight && createdLightDoc) {

      await canvas.scene.deleteEmbeddedDocuments(
        "AmbientLight",
        [createdLightDoc.id]
      );

    }

  })

.play();