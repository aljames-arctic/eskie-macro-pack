// Standalone Macro: Showcase - Visual Novel Dialogue
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Visual Novel Dialogue' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a speaker token!");

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const speakerText = await Dialog.prompt({
    title: "Visual Novel Cutscene",
    content: `
        <div class="form-group">
            <label>Dialogue text:</label>
            <input type="text" name="dialogue" value="Hold it right there! You cannot pass!" style="width: 100%;">
        </div>
    `,
    callback: (html) => html.find("input[name='dialogue']").val()
}) ?? "Hold it right there! You cannot pass!";

const duration = 7000;
const portrait = token.document?.texture?.src ?? token.actor?.img ?? "icons/svg/mystery-man.svg";
const emote = "eskie.emote.angry.02";

const actorAnchor = { x: 0.15, y: 0.75 };
const emoteAnchor = { x: 0.25, y: 0.65 };
const textAnchor = { x: 0.5, y: 0.82 };

const style = {
    fill: "white",
    fontFamily: "Arial Black, Impact, sans-serif",
    fontSize: (canvas.grid.size ?? 100) * 0.7,
    stroke: "#000000",
    strokeThickness: 8,
};

const sequence = new Sequence();

// Full screen actor portrait slide-in
sequence.effect()
    .file(closest(portrait))
    .screenSpace()
    .screenSpaceScale({ x: 1.0, y: 1.0 })
    .screenSpaceAnchor(actorAnchor)
    .animateProperty("spriteContainer", "position.x", {
        from: -200,
        to: 0,
        duration: 500,
        ease: "easeOutCubic"
    })
    .fadeIn(500)
    .duration(duration);

// Emote pop overlay over portrait
sequence.effect()
    .delay(500)
    .file(closest(emote))
    .screenSpace()
    .screenSpaceScale({ x: 0.75, y: 0.75 })
    .screenSpaceAnchor(emoteAnchor)
    .scaleIn(0, 500, { ease: "easeOutBack" })
    .duration(duration - 500)
    .rotate(-45);

// Dialogue text pop
sequence.effect()
    .delay(500)
    .text(speakerText, style)
    .screenSpace()
    .screenSpaceAnchor(textAnchor)
    .scaleIn(0, 300, { ease: "easeOutQuad" })
    .duration(duration - 500)
    .zIndex(10);

await sequence.play();
