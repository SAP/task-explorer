const baseNycConfig = require("../../nyc.config");

module.exports = Object.assign(baseNycConfig, {
  branches: 98,
  lines: 98,
  functions: 98,
  statements: 98,
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
