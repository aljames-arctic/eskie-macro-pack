//Last Updated: 8/22/2026
//Author: .eskie

// Set Attack Color
let color = "blue";

// Source token
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Select a token first.");

// Targets (first two targeted tokens; if only one, it uses it twice)
const targets = Array.from(game.user.targets);
const target1 = targets[0];
const target2 = targets[1] ?? targets[0];
if (!target1) return ui.notifications.warn("Target at least 1 token.");

// Determine Attack Size
let effectSize = 2 + (0.25 * 2);
let effectOffset = -0.75 - (0.25 * 2);

// Nearest square center on a target to the source token
function getNearestSquareCenter(sourceToken, targetToken) {
  const gs = canvas.grid.size;
  const srcCenter = sourceToken.center;

  const w = targetToken.document.width;   // grid units
  const h = targetToken.document.height;  // grid units

  let bestPoint = null;
  let bestDist2 = Infinity;

  for (let gx = 0; gx < w; gx++) {
    for (let gy = 0; gy < h; gy++) {
      const cx = targetToken.document.x + (gx + 0.5) * gs;
      const cy = targetToken.document.y + (gy + 0.5) * gs;

      const dx = cx - srcCenter.x;
      const dy = cy - srcCenter.y;
      const d2 = dx * dx + dy * dy;

      if (d2 < bestDist2) {
        bestDist2 = d2;
        bestPoint = { x: cx, y: cy };
      }
    }
  }
  return bestPoint;
}

// Midpoint between the two closest squares (one per target)
const p1 = getNearestSquareCenter(token, target1);
const p2 = getNearestSquareCenter(token, target2);
const targetSquare = (p1 && p2)
  ? { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
  : (p1 ?? token.center);

new Sequence()

  .effect()
  .file(`eskie.attack.melee.generic.01.bludgeoning.heavy.${color}.fast.01`)
  .atLocation(token)
  .rotateTowards(targetSquare)
  .scaleToObject(effectSize)
  .spriteOffset({ x: effectOffset * token.document.width }, { gridUnits: true })
  .zIndex(1)
  .rotateIn(-270, 250, { ease: "easeInExpo" })
  .rotateOut(45, 750, { ease: "easeOutExpo" })

  .effect()
  .file("eskie.smoke.01.white")
  .atLocation(token)
  .rotateTowards(targetSquare)
  .scaleToObject(effectSize + 1)
  .spriteOffset({ x: effectOffset * (token.document.width * 0.5) }, { gridUnits: true })
  .belowTokens()
  .opacity(0.5)

  .effect()
  .delay(150)
  .file("eskie.damage.bludgeoning.01.yellow")
  .size(1.5 * token.document.width, { gridUnits: true })
  .atLocation(target1)
  .randomRotation()
  .zIndex(1)

  .effect()
  .delay(150)
  .file("eskie.damage.bludgeoning.01.yellow")
  .size(1.5 * token.document.width, { gridUnits: true })
  .atLocation(target2)
  .randomRotation()
  .zIndex(1)

  .play();