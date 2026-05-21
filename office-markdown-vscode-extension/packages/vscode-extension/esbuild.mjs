import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: "dist/extension.cjs",
  external: ["vscode"],
  sourcemap: true,
  sourcesContent: false,
  target: "node20"
});
