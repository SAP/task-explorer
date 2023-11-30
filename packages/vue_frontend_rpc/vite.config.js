import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "./",
  resolve: {
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
  },
  test: {
    define: {
      global: {},
    },
    exclude: ["../src/assets/*", "../src/plugins/*", "../src/icons/*", "../src/main.js"],
    // enable jest-like global test APIs
    globals: true,
    // simulate DOM with happy-dom
    // (requires installing happy-dom as a peer dependency)
    environment: "happy-dom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      lines: 79,
      functions: 55,
      branches: 76,
      statements: 79,
    },
  },
});
