const [state, info, config] = args;
const actionSource = token ?? info?.sourceToken;
config.hitTargets = info.hitTargetsId;
config.info = info; // Generic access to AAHandler

let actionTargets = info.allTargets;
if (!actionTargets || actionTargets.length === 0) return;
if (actionTargets.length === 1) {
  actionTargets = actionTargets[0];
  const adapter = game.modules.get('eskie-macros')?.api?.adapter;
  const isMelee = adapter?.isAdjacent
    ? adapter.isAdjacent(actionSource, actionTargets)
    : ((adapter?.getDistance(actionSource, actionTargets) ?? 999) <= (canvas?.scene?.grid?.distance ?? 5) * 1.5);
  // Switch to a ranged attack animation if we are at range and there is one available
  if (!isMelee && config.animation.ranged) config.animation = config.animation.ranged;
  // Switch to a melee attack animation if we are in melee and there is one available
  if (isMelee && config.animation.melee) config.animation = config.animation.melee;
}

return config.animation.play(actionSource, actionTargets, config, {type: "target"});