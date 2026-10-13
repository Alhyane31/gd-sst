import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  esbuild: { jsx: "automatic" },
  test: {
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    environment: "node",
    // rendus de formulaires complets (jsdom) : plus lents quand toute la suite tourne en parallèle
    testTimeout: 20000,
    // composants React : // @vitest-environment jsdom en tête de fichier
  },
});
