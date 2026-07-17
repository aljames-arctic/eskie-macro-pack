const [state, info, config] = args;
const targetToken = info.sourceToken;
config.info = info; // Generic access to AAHandler

switch (state) {
  case "on":
    return config.animation.play(targetToken, config, {type: "aefx"});
  case "off": 
    return (config.animation.stop) ? config.animation.stop(targetToken, config, {type: "aefx"}) : undefined;
  default:
    throw `aa + eskie-macro-pack | Unknown state: ${state}`;
}