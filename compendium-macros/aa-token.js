const [state, info, config] = args;
config.hitTargets = info.hitTargetsId;
config.info = info; // Generic access to AAHandler

let actionTargets = info.allTargets;
if (actionTargets.length !== 1) return;
actionTargets = actionTargets[0];

return config.animation.play(token, config, {type: "source-token"});