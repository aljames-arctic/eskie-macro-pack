const [state, info, config] = args;
const sourceToken = info?.sourceToken ?? canvas.tokens?.controlled?.[0] ?? game.user?.character?.getActiveTokens?.()?.[0] ?? null;
config.targets = info?.allTargets;
config.hitTargets = info?.hitTargetsId;
config.template = info?.templateData ?? info?.template;
config.info = info; // Generic access to AAHandler

const seq = await config.animation.create(sourceToken, config, {type: "templatefx"});
if (config.deleteTemplate) await config.template.delete();
return seq.play();