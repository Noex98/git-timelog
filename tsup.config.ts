import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["cjs"],
    clean: true,
    outDir: "dist",
    publicDir: "public",
    shims: true,
});
