const [state, info, config] = args;
const sourceToken = info.sourceToken;
config.targets = info.allTargets;
config.hitTargets = info.hitTargetsId;
config.template = info.template ?? info.templateData;
config.info = info; // Generic access to AAHandler

const seq = await config.animation.create(sourceToken, config, {type: "templatefx"});
if (config.deleteTemplate) await (config.template?.delete?.() ?? config.template);
return seq.play();