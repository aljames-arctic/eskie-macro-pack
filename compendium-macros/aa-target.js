const [state, info, config] = args;
const actionSource = token;
config.hitTargets = info.hitTargetsId;
config.info = info; // Generic access to AAHandler

let actionTargets = info.allTargets;
if (actionTargets.length === 0) return;
if (actionTargets.length === 1) {
  actionTargets = actionTargets[0];
  const distance = canvas.grid.measurePath([actionSource, actionTargets]).euclidean ?? 0;
  // Switch to a ranged attack animation if we are at range and there is one available
  if (distance > 5 && config.animation.ranged) config.animation = config.animation.ranged;
  // Switch to a melee attack animation if we are in melee and there is one available
  if (distance <= 5 && config.animation.melee) config.animation = config.animation.melee;
}

return config.animation.play(actionSource, actionTargets, config, {type: "target"});