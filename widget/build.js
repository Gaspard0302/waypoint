const esbuild = require("esbuild");

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
  esbuild.build(config).then(() => {
    console.log(`[Waypoint] Build complete → dist/waypoint.min.js`);
  });
}
