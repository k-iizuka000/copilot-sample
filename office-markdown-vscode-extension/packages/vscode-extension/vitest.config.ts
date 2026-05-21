import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "@office-markdown/core": new URL("../core/src/index.ts", import.meta.url).pathname
    }
  }
});
