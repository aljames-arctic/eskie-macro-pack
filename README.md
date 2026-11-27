[![Foundry VTT Version](https://img.shields.io/badge/Foundry%20VTT-v13+-orange.svg)](https://foundryvtt.com/)
[![Latest Module Downloads](https://img.shields.io/github/downloads/aljames-arctic/eskie-macro-pack/latest/module.zip?style=flat-square&label=latest%20downloads&color=blue)](https://github.com/aljames-arctic/eskie-macro-pack/releases)
[![Total Module Downloads](https://img.shields.io/github/downloads-pre/aljames-arctic/eskie-macro-pack/module.zip?style=flat-square&label=total%20downloads&color=success)](https://github.com/aljames-arctic/eskie-macro-pack/releases)

# Eskie Macro Pack (EMP)

A community-built Foundry VTT animation module utilizing free and premium asset libraries to animate spells, abilities, summons, traps, token effects, and cinematic scenes.

* [Eskie Discord Channel](https://discord.gg/HgCQv2mK) — learn Sequencer and share your own creations!
* [Eskie YouTube Channel](https://www.youtube.com/channel/UCnES1fzHV-xSu58rEL7NcDg)

---

## Features

* **120+ Modular Animations** — Spells, class features, Battle Master maneuvers, Arcane Shots, auras, movement/teleports, emotes, and multi-token effects with customizable variants and per-effect sound support.
* **Auto-Recognition Integration** — Automatic syncing with **Automated Animations (AA)** or **Boss Loot FX (BLFX)** via an in-game configuration menu.
* **Automated Trap System** — 10 built-in interactive traps *plus* support for turning any EMP spell/effect into a trap using **Foundry V14+ native Regions** or **Monk's Active Tile Triggers (MATT)**.
* **Summoning & Token Mask Libraries** — 12 elemental/thematic summon animations (`eskie.summon`) and 5 token dissolution/death masks (`eskie.mask`).
* **World Scripts** — Live-toggleable automated animations such as d20 **Roll Animations** (no reload required).
* **Macro API & Built-In Compendiums** — Full `eskie.*` API plus ready-to-use **EMP Automation Bootstrap** and **EMP Standalone Macros** (150+ standalone macros) compendiums.

---

## Requirements & Optional Modules

### Required

| Module | Purpose |
|--------|---------|
| [Sequencer](https://foundryvtt.com/packages/sequencer) (`4.3.1+`) | Core animation & motion playback engine |
| [socketlib](https://foundryvtt.com/packages/socketlib) | Multi-client socket sync |

### Optional Modules

Open **Module Settings → Eskie Macro Pack → Recommended Modules** in-game to see live installation status for all companion modules:

| Category | Modules |
|----------|---------|
| **Automation** | [Automated Animations](https://foundryvtt.com/packages/autoanimations), [Boss Loot FX (BLFX)](https://www.patreon.com/c/BossLoot) |
| **Visual Assets** | [Eskie Effects](https://www.patreon.com/EskieEffects) (Patreon/Free), [JB2A](https://www.patreon.com/JB2A) (Patreon/Free), [Jinker's Animated Art Pack](https://foundryvtt.com/packages/jaamod), [Boss Loot Assets](https://www.patreon.com/c/BossLoot) (Patreon/Free) |
| **Audio** | [PeriSFX (PSFX)](https://www.patreon.com/c/PeriSFX) (Patreon/Free) |
| **Traps & Triggers** | **Foundry V14+ native Regions** (built-in) or [Monk's Active Tile Triggers (MATT)](https://foundryvtt.com/packages/monks-active-tiles) *(required for traps on V13)* |
| **Utilities** | [Foundry Summons](https://foundryvtt.com/packages/foundry-summons) (creature summoning), [Tagger](https://foundryvtt.com/packages/tagger) (tag-based lookups), [Token Attacher](https://foundryvtt.com/packages/token-attacher) or [Mass Edit](https://foundryvtt.com/packages/multi-token-edit) (tile/token attachment) |

---

## Module Settings & Compendiums

In **Game Settings → Module Settings → Eskie Macro Pack**:

* **Recommended Modules** — Live status checklist of optional asset, automation, and utility modules.
* **Configure Auto-Recognition** — Choose and sync EMP presets to Automated Animations or Boss Loot FX *(shown when AA or BLFX is active)*.
* **World Scripts** — Toggle automated features in real time (e.g., **Roll Animations** for d20 ability checks and saving throws).
* **Enable Sounds** — Global world toggle for animation sound effects (individual animations also accept a `sound` config object).
* **Log Verbosity** — Client-side console logging level (`error`, `warn`, `info`, `debug`).

Two Macro compendiums are bundled automatically:
* **EMP Automation Bootstrap** — Helper macros used by Auto-Recognition integrations.
* **EMP Standalone Macros** — 150+ standalone Sequencer macros ready to drop onto your hotbar.

---

## Macro API — `eskie.*`

All animation namespaces are exposed globally on `eskie` (accessible from any Foundry macro or DevTools console — run `console.log(eskie)` to browse everything):

| Namespace | Purpose |
|-----------|---------|
| `eskie.effect` | 120+ spell, ability, maneuver, aura, emote, and movement animations |
| `eskie.mask` | Token dissolution and death masks (`burn`, `shatter`, `tear`, `smoke`, `saoDeath`) |
| `eskie.summon` | 12 creature/spirit summoning animations |
| `eskie.traps` | Interactive trap setup wizard + 10 built-in traps + custom spell-as-trap |
| `eskie.overlay` | Canvas-wide scene overlays (`cinemaBars`, `blur`) |
| `eskie.showcase` | Long-form cinematic sequences (`attackAttack`, `mobPsycho`, `sunHaloDragon`, `vnDialog`) |

Most modules share a uniform contract: `create(...)` (returns a `Sequence`), `play(...)` (builds and plays), `stop(...)` (cleans up persistent effects), and `default_config` (inspect defaults).

### Effects — `eskie.effect`

Covers targeted attacks, templates/AoEs, persistent buffs & auras, Battle Master maneuvers (`eskie.effect.battlemaster.*`), Arcane Shots (`eskie.effect.arcaneShot.*`), teleports/movement (`stepOfTheWind.jump`/`move`, `mistyStep`, `fly`, `leap`), emotes (`eskie.effect.emote.*`), and multi-token utilities (`shuffle`, `cloudOfSand`, `petrifyingGaze`). Run `console.log(eskie.effect)` to list all 120+ keys.

```js
const token = _token;
const target = Array.from(game.user.targets)[0];

// Persistent aura (toggle on / off)
await eskie.effect.rage.play(token);
await eskie.effect.rage.stop(token);

// Targeted effect & custom configuration
await eskie.effect.divineSmite.play(token, target);
await eskie.effect.banishment.play(token, { color: 'purple' });

// Build a Sequence manually before playing
const seq = await eskie.effect.hex.create(token, target);
seq.play();
```

### Masks — `eskie.mask`

Token destruction and dissolve effects: `burn`, `shatter`, `tear`, `smoke`, and `saoDeath`.

```js
await eskie.mask.shatter.play(token, { color: 'white' });
await eskie.mask.shatter.stop(token);
```

### Summons — `eskie.summon`

12 summoning styles: `default`, `air`, `celestial`, `earth`, `fiend`, `fire`, `futuristic`, `nature`, `shadow`, `water`, `ritualSummonHell`, and `tokensOfTheDeparted`. Pass an `Actor` (summons via Foundry Summons) or an existing `Token` as the second argument:

```js
const actor = game.actors.getName('Fire Elemental');
await eskie.summon.fire.play(token, actor);          // Summons & animates from caster
await eskie.summon.fire.play(token, existingToken);  // Animates an already-placed token
await eskie.summon.fire.stop(token, existingToken);  // Cleans up persistent summon effects
```

### Traps — `eskie.traps`

Automated traps fire when a token enters a trigger **Region (Foundry V14+ native)** or **Tile (MATT)**. Run the interactive setup wizard — it guides you through selecting trigger, origin, and target regions/tiles automatically:

```js
await eskie.traps.setup();                    // Interactive wizard (choose any built-in trap or custom effect)
await eskie.traps.setup('fireball');          // Turn any EMP spell/effect into a trap
await eskie.traps.projectile.setup({ projectileType: 'dart' });

// Manual playback without Region/MATT triggers
await eskie.traps.fire.play(originPlaceable, [token], { size: 4 });
await eskie.traps.pitfall.stop(trapPlaceable);
```

| Trap | Description |
|------|-------------|
| `bullRushStatue` | Animated charging statue rush across a path |
| `electricDoor` | Electrified doorway barrier shock |
| `fallingRocks` | Collapsing ceiling boulder/debris shower |
| `fallingSky` | Aerial drop/impact ambush from above |
| `fire` | Directional fire cone from origin to target (`size`) |
| `floodingRoom` | Rising water hazard across a room |
| `pitfall` | Hidden pit reveal and falling-token animation (`reveal`, `smokeSize`, `fallenScale`) |
| `projectile` | Repeating `arrow`, `dart`, or `javelin` volley (`projectileType`, `repeats`, `repeatDelay`) |
| `rollingBoulder` | Rolling boulder trap crushing along a corridor |
| `spike` | Floor spikes erupting under tokens (`delay`) |
| *Custom Effect* | Use `eskie.traps.setup('<effectKey>')` or `eskie.traps.playEffectAsTrap(...)` for any EMP effect |

### Overlays — `eskie.overlay`

Canvas-wide visual overlays: `cinemaBars` (letterbox bars) and `blur` (per-user scene blur / `blur.drunk`).

```js
await eskie.overlay.cinemaBars.play();
await eskie.overlay.cinemaBars.stop();

const users = Array.from(game.users);
await eskie.overlay.blur.drunk.play(users);
await eskie.overlay.blur.drunk.stop(users);
```

### Showcases — `eskie.showcase`

Long-form cinematic sequences: `attackAttack` (3-act anime-style duel), `mobPsycho` (psychic percentage counter), `sunHaloDragon` (cinematic dragon reveal), and `vnDialog` (visual novel dialog box).

```js
await eskie.showcase.attackAttack.play(token, target);
await eskie.showcase.mobPsycho.play(0, 100);
await eskie.showcase.sunHaloDragon.play(token, Array.from(game.user.targets));
await eskie.showcase.vnDialog.play(token, { text: 'Hello, adventurer!' });
```

### Module Utility API

Additional helpers are exposed on `game.modules.get('eskie-macros').api` (`adapter`, `animation`, `standaloneMacros`, and `util`: `closest`, `tokens.getDistance`, `tokens.getNearestSquareCenter`, `tokens.isAdjacent`).

---

## Contributing & Credits

Contributions are welcome! You can share Sequencer macros on the [Eskie Discord](https://discord.gg/HgCQv2mK) and request integration, or open a PR following [`docs/developer-guide.md`](docs/developer-guide.md) (exports `create`/`play`/`stop`/`default_config`, respects token rotation, and passes typecheck/tests). Don't worry about memorizing every rule — an AI coding assistant/IDE (such as VS Code or Antigravity) can format your PR using the repo's built-in skills.

**Localization:** Native speaker PRs for additional languages in `lang/` are always welcome (currently English, Brazilian Portuguese, and Spanish).

### Animation Contributors
Eskiemoh / eskie (`@.eskie`) · Bakana (`@bakanabaka`) · DerKriegs (`@derkriegs`) · Gornetron (`@nefin`) · Doomrule (`@doomrule`) · Mia Del'Mori (`@.tranquilite`) · Akane (`@yamiakane`) · Papa Nurgle (`@papanurgle`)

### Language Contributors
* **Brazilian Portuguese:** Kharmans (`@kharmans`)
* **Spanish:** Cerbe (`@cerbe_`)
