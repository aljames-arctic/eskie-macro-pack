// Standalone Macro: Chain Lightning
// Original Author: .eskie
// Adjacency Matrix Refactoring: Antigravity

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Chain Lightning' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Primary / Secondary Target Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please select at least one primary target (and up to 3 secondary targets)!");
}

// Enforce primary target + up to 3 secondary targets (max 4 targets)
const primaryTarget = targets[0];
const secondaryTargets = targets.slice(1, 4);
const targetTokens = [primaryTarget, ...secondaryTargets];

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to the default path if running as a standalone copy-paste macro.
 */
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

const DEFAULT_CONFIG = {
    id: "chainLightning",
    releaseDelay: 200,
    propagationDelay: 50,
    fudgeFactor: 0,
    sound: {
        enabled: true,
        littleBoltVolume: 0.5,
        bigBoltVolume: 0.2
    }
};

const label = DEFAULT_CONFIG.id ?? "chainLightning";
const castingLabel = `Chain Lightning - ${token.id}`;

// 3. Toggle / Re-entrant Persistent Effect Handling
const isPlaying = Sequencer.EffectManager.getEffects({ name: label }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: castingLabel }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label });
    Sequencer.EffectManager.endEffects({ name: castingLabel });
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    return;
}

/**
 * Calculates the 3D distance between two tokens in scene units (e.g., feet), rounded up.
 */
function getDistance(t1, t2) {
    const p1 = t1.center ?? { x: t1.x, y: t1.y };
    const p2 = t2.center ?? { x: t2.x, y: t2.y };
    const dist2DPx = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    
    const gridSize = canvas.grid?.size ?? 100;
    const gridDistance = canvas.scene?.grid?.distance ?? canvas.dimensions?.distance ?? 5;
    const dist2DUnits = (dist2DPx / gridSize) * gridDistance;
    
    const el1 = t1.document?.elevation ?? 0;
    const el2 = t2.document?.elevation ?? 0;
    const elDiff = el1 - el2;
    
    return Math.ceil(Math.hypot(dist2DUnits, elDiff));
}

/**
 * Constructs a Minimum Spanning Tree (MST) using Prim's algorithm with an optional fudge factor.
 * Returns an adjacency matrix where A[u][v] === 0 represents an edge from node u to node v.
 */
function primMST(nodes, getDist, fudgeFactor = 0) {
    const N = nodes.length;
    const A = Array.from({ length: N }, () => Array(N).fill(Infinity));
    if (N <= 1) return A;
    
    const D = Array.from({ length: N }, () => Array(N).fill(Infinity));
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (i !== j) {
                D[i][j] = getDist(nodes[i], nodes[j]);
            }
        }
    }

    const visited = new Set([0]);

    while (visited.size < N) {
        let minDist = Infinity;
        let bestU = -1;
        let bestV = -1;

        for (const u of visited) {
            for (let v = 0; v < N; v++) {
                if (!visited.has(v)) {
                    if (D[u][v] < minDist) {
                        minDist = D[u][v];
                        bestU = u;
                        bestV = v;
                    }
                }
            }
        }

        if (minDist === Infinity) break;

        if (fudgeFactor === 0) {
            A[bestU][bestV] = 0;
            visited.add(bestV);
        } else {
            A[bestU][bestV] = 0;
            visited.add(bestV);
            
            for (let w = 0; w < N; w++) {
                if (!visited.has(w) && w !== bestV) {
                    if (D[bestU][w] <= minDist + fudgeFactor) {
                        A[bestU][w] = 0;
                        visited.add(w);
                    }
                }
            }
        }
    }

    return A;
}

const config = DEFAULT_CONFIG;
const sound = config.sound ?? { enabled: true, littleBoltVolume: 0.5, bigBoltVolume: 0.2 };
const N = targetTokens.length;
const A = primMST(targetTokens, getDistance, config.fudgeFactor ?? 0);

// 1. Build propagationLevels of levels using BFS on the MST tree structure
// Level 0: from caster (token) to primary target (targetTokens[0])
const propagationLevels = [];
propagationLevels.push([
    { parent: token, children: [targetTokens[0]] }
]);

let currentLevelNodes = [0];
const visited = new Set([0]);

while (true) {
    const nextLevelGroups = [];
    const nextLevelNodes = [];

    for (const u of currentLevelNodes) {
        const children = [];
        for (let v = 0; v < N; v++) {
            if (A[u][v] === 0 && !visited.has(v)) {
                visited.add(v);
                children.push(targetTokens[v]);
                nextLevelNodes.push(v);
            }
        }
        if (children.length > 0) {
            nextLevelGroups.push({
                parent: targetTokens[u],
                children: children
            });
        }
    }

    if (nextLevelGroups.length === 0) {
        break;
    }

    propagationLevels.push(nextLevelGroups);
    currentLevelNodes = nextLevelNodes;
}

// 2. Construct the Little Bolts sequence
const littleSeq = new Sequence();
for (let i = 0; i < propagationLevels.length; i++) {
    const levelGroups = propagationLevels[i];
    for (const group of levelGroups) {
        const parentToken = group.parent;
        for (const childToken of group.children) {
            littleSeq.effect()
                .name(label)
                .file(closest("jb2a.electric_arc.blue02"))
                .atLocation(parentToken)
                .stretchTo(childToken, { onlyX: true })
                .duration(1000)
                .fadeIn(250)
                .fadeOut(750)
                .belowTokens()
                .animateProperty('sprite', 'height', { from: -2, to: -1, duration: 200, gridUnits: true })
                .opacity(0.75);
        }
    }

    if (sound.enabled ?? true) {
        littleSeq.sound()
            .file(closest("psfx.weapon-swooshes.lightning"))
            .volume(sound.littleBoltVolume ?? 0.5);
    }

    if (i < propagationLevels.length - 1) {
        littleSeq.wait(config.propagationDelay ?? 50);
    }
}

// 3. Construct the Big Bolts sequence
const bigSeq = new Sequence();
bigSeq.wait(config.releaseDelay ?? 200);
for (let i = 0; i < propagationLevels.length; i++) {
    const levelGroups = propagationLevels[i];
    const isPrimary = (i === 0);

    for (const group of levelGroups) {
        const parentToken = group.parent;
        for (const childToken of group.children) {
            const file = isPrimary
                ? closest("jb2a.chain_lightning.primary.blue")
                : closest("jb2a.chain_lightning.secondary.blue");

            const offset = isPrimary
                ? { offset: { x: (token.document?.width ?? 1) * 0.25 }, gridUnits: true, local: true }
                : { offset: { x: -0.1 }, gridUnits: true, local: true };

            // Big lightning bolt
            bigSeq.effect()
                .name(label)
                .file(file)
                .atLocation(parentToken, offset)
                .stretchTo(childToken)
                .zIndex(2);

            // Shocking static electricity on target
            bigSeq.effect()
                .name(label)
                .file(closest('jb2a.static_electricity.03.blue'))
                .attachTo(childToken)
                .scaleToObject(1.25, { considerTokenScale: true })
                .opacity(1)
                .playbackRate(1)
                .fadeOut(1000)
                .randomRotation()
                .repeats(3, 300, 300);

            // Shaking copy sprite representing electrocution
            bigSeq.effect()
                .name(label)
                .copySprite(childToken)
                .spriteRotation(-(childToken.document?.rotation ?? childToken.rotation ?? 0))
                .attachTo(childToken)
                .scaleToObject(1, { considerTokenScale: true })
                .fadeIn(250)
                .fadeOut(1500)
                .loopProperty('spriteContainer', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
                .duration(4000)
                .opacity(0.25);

            // Thunder damage effect under the token
            bigSeq.effect()
                .name(label)
                .file(closest("eskie.damage.thunder.01.lightpurple"))
                .attachTo(childToken)
                .scaleToObject(1.25, { considerTokenScale: true })
                .belowTokens();
        }
    }

    if (sound.enabled ?? true) {
        bigSeq.sound()
            .file(closest("psfx.cantrips.thunderclap.v1"))
            .volume(sound.bigBoltVolume ?? 0.2);
    }

    if (i < propagationLevels.length - 1) {
        const waitTime = isPrimary ? 800 : (config.propagationDelay ?? 50);
        bigSeq.wait(waitTime);
    }
}

// Combine both sequences to play in parallel
const masterSequence = new Sequence();
masterSequence.addSequence(littleSeq);
masterSequence.addSequence(bigSeq);

await masterSequence.play();
