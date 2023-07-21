const baseNycConfig = require("../../nyc.config");

module.exports = Object.assign(baseNycConfig, {
  exclude: [
    "src/logger/**",
    "test/**",
    "*.js",
    "scripts/**",
    "coverage/lcov-report/**",
    "dummy/main.js",
    "src/dummy.js",
    "dist/test/**",
    "src/webSocketServer/**",
  ],
});
