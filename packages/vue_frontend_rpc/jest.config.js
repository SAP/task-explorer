module.exports = {
  verbose: true,
  testRegex: "(/test/(.*).(test|spec)).[jt]sx?$",
  collectCoverage: true,
  coverageProvider: "v8",
  collectCoverageFrom: [
    "src/**/*.{js,vue}",
    "!**/node_modules/**",
    "!<rootDir>/src/main.js",
    "!<rootDir>/src/plugins/**",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  moduleFileExtensions: ["js", "vue", "json"],
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!(.+)/)"],
  modulePaths: ["<rootDir>/src", "<rootDir>/node_modules"],
  transform: {
    "^.+\\.vue$": "@vue/vue3-jest",
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.js$": "babel-jest",
    "^.+\\.jsx?$": "babel-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  testEnvironment: "jsdom",
  coverageThreshold: {
    global: {
      branches: 83,
      functions: 68,
      lines: 85,
      statements: 85,
    },
  },
};
