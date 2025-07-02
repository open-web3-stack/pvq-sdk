import { build } from "esbuild";

await build({
  entryPoints: [
    "src/pvq.ts",
    "src/program-registry.ts",
    "src/types.ts",
    "src/typesdef.ts"
  ],
  outdir: "dist/esm",
  bundle: false,
  format: "esm",
  platform: "node",
  target: ["node18"],
  sourcemap: true,
});

await build({
  entryPoints: [
    "src/pvq.ts",
    "src/program-registry.ts",
    "src/types.ts",
    "src/typesdef.ts"
  ],
  outdir: "dist/cjs",
  bundle: false,
  format: "cjs",
  platform: "node",
  target: ["node18"],
  sourcemap: true,
});