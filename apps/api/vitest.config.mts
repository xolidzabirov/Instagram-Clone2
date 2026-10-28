import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// SWC keeps decorator metadata, which NestJS dependency injection relies on
export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    globals: false,
    environment: "node",
    projects: [
      {
        extends: true,
        test: { name: "unit", include: ["src/**/*.spec.ts"] },
      },
      {
        extends: true,
        test: {
          name: "e2e",
          include: ["test/**/*.e2e-spec.ts"],
          setupFiles: ["test/setup-env.ts"],
          // e2e tests share one database, so they run one file at a time
          fileParallelism: false,
          hookTimeout: 30_000,
          testTimeout: 30_000,
        },
      },
    ],
  },
});
