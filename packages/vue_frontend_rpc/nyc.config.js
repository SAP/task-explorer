const baseNycConfig = require("../../nyc.config");

module.exports = Object.assign(baseNycConfig, {
  branches: 100,
  lines: 100,
  functions: 100,
  statements: 100,
  exclude: ["test/**", "local-dev/**"],
  // https://github.com/vuejs/vue-cli/issues/1363#issuecomment-609913867
  extension: [".js", ".vue"],
  instrument: false,
  sourceMap: false,
});
