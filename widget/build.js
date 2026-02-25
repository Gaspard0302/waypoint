const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const isWatch = process.argv.includes("--watch");
const isProd = process.env.NODE_ENV === "production";

const config = {
  entryPoints: ["src/index.ts"],
  outfile: "dist/waypoint.min.js",
  bundle: true,
  format: "iife",
  globalName: "Waypoint",
  minify: isProd,
  sourcemap: !isProd,
  target: ["es2020"],
};

if (isWatch) {
  esbuild.context(config).then((ctx) => {
    ctx.watch();
    console.log("[Waypoint] Watching for changes...");
  });
} else {
  const DIST_OUT = "dist/waypoint.min.js";
  esbuild.build(config).then(() => {
    console.log(`[Waypoint] Build complete → ${DIST_OUT}`);
    fs.copyFileSync(DIST_OUT, path.resolve(__dirname, "../dashboard/public/widget.js"));
    console.log("[Waypoint] Copied → dashboard/public/widget.js");
  });
}
