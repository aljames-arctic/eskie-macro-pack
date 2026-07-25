# Standalone Macros Guidelines & Engineering Rules

The macros contained in this directory are "standalone" scripts that can be copied and pasted directly into the Foundry VTT macro editor and executed without requiring the `eskie-macros` module (EMP) to be installed.

---

## 🛠️ Mandatory Engineering Rules for Creating Standalone Macros

When adding or updating scripts in `src/standalone-macros/`, adhere strictly to the following rules:

### 1. Top-Level Run-1 Start / Run-2 Stop Toggle Rule
* **Immediate Toggle Check at Entry**: Any macro creating persistent looping effects (`.persist()`, persistent stage rings, glowing aura loops, hidden sprite overlays, or recurring visual threads) **must** check whether that macro's persistent sequence is already active on the token or canvas **at top-of-file**, immediately after controlled token validation.
* **Order of Execution**: Check active effects **BEFORE** target token validation (`if (!target) return warn(...)`), crosshair aimers, or interactive selection dialogs. Running the macro a second time with only your controlled token selected must stop active effects without demanding target re-selection or showing confirmation popups.
* **Wildcard Matching & Cleanup**:
  ```javascript
  const id = "MySpell";
  const tokenId = token.id ?? token.document?.id ?? "";
  const label = `${id} - ${tokenId}`;

  // Top-level Run-1 Start / Run-2 Stop Toggle Check
  const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }).concat(
      Sequencer.EffectManager.getEffects({ name: `*${id}*` })
  );
  if (activeEffects.length > 0) {
      Sequencer.EffectManager.endEffects({ name: label, object: token });
      Sequencer.EffectManager.endEffects({ name: `*${id}*` });
      await new Sequence().animation().on(token).opacity(1).show(true).play();
      return ui.notifications.info(`Ended ${id}.`);
  }
  ```

### 2. Dual-Mode Socketlib & GM Elevation Fallback Contract
* Standalone macros must be self-sufficient, but when `eskie-macros` is installed, they should call into the module's exposed socket API for player GM elevation (such as unlocking doors or managing canvas objects):
  ```javascript
  const socketDoor = game.modules.get("eskie-macros")?.api?.socket?.door;
  if (socketDoor?.unlock) {
      await socketDoor.unlock(lockedDoor.id);
  } else if (game.user.isGM) {
      await lockedDoor.document.update({ ds: CONST.WALL_DOOR_STATES.CLOSED });
  } else {
      ui.notifications.warn("Door unlocked locally (install eskie-macros for multi-client socket syncing).");
  }
  ```
* Guard helper modules (`Tagger`, `FXMASTER`, `WARPGATE`) with guard clauses (`typeof Tagger !== "undefined"`).

### 3. Asset Path Resolution (`closest`)
* Every asset string (`"eskie.sound.roar.01"`, `"jb2a.bless.200px.loop.yellow"`, etc.) must pass through a localized asset resolver:
  ```javascript
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
  ```

### 4. Compendium Manifest Registry (`KNOWN_STANDALONE_MACROS`)
* Whenever a new `.js` macro file is added to `src/standalone-macros/`, register its filename in alphabetical order inside `KNOWN_STANDALONE_MACROS` in `src/lib/standalone-macros.js` so it gets indexed during macro compendium updates.

### 5. Universal Code Guardrails
* **Strict Nullish Coalescing (`??`)**: Always use `??` for value and property fallbacks (`const count = config.count ?? 0`). Never use logical OR (`||`) for value fallbacks, as `||` overrides valid falsy values (`0`, `""`, `false`).
* **Explicit Schemas & Concrete Inputs**: Internal utility helpers must declare concrete single data types rather than polymorphic unions.