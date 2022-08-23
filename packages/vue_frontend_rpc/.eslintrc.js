module.exports = {
  parserOptions: {
    sourceType: "module",
  },
  globals: {
    acquireVsCodeApi: true,
  },
  rules: {
    "vue/multi-word-component-names": [
      "error",
      {
        ignores: ["Editor", "Selector"],
      },
    ],
  },
};
