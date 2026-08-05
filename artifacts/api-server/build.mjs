import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm, readdir } from "node:fs/promises";

// Plugins (e.g. 'esbuild-plugin-pino') may use `require` to resolve dependencies
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

// Supports two build targets from one script:
//   node build.mjs                => full long-running server (src/index.ts -> dist/index.mjs)
//   node build.mjs --handler-only => just the Express app, no app.listen()
//                                    (src/app.ts -> dist-handler/app.mjs), used by the
//                                    Vercel serverless function in /api/index.ts so that
//                                    Vercel's own TypeScript check never has to parse our
//                                    TS source directly under its stricter module
//                                    resolution rules — it only ever sees plain, already
//                                    -bundled JS plus the hand-written dist-handler/app.d.mts
//                                    declaration file.
const handlerOnly = process.argv.includes("--handler-only");
const entry = handlerOnly ? "src/app.ts" : "src/index.ts";
const outdir = handlerOnly ? "dist-handler" : "dist";

async function cleanOutDir(distDir) {
  if (!handlerOnly) {
    // Full-server build: dist/ is 100% generated, safe to wipe entirely.
    await rm(distDir, { recursive: true, force: true });
    return;
  }
  // Handler-only build: dist-handler/app.d.mts is checked into git on
  // purpose (see that file). Only clear out the generated bundle files
  // (.mjs/.map) so re-running this build never deletes it.
  const entries = await readdir(distDir, { withFileTypes: true }).catch(
    () => [],
  );
  await Promise.all(
    entries
      .filter(
        (e) =>
          e.isFile() && (e.name.endsWith(".mjs") || e.name.endsWith(".map")),
      )
      .map((e) => rm(path.join(distDir, e.name), { force: true })),
  );
}

async function buildAll() {
  const distDir = path.resolve(artifactDir, outdir);
  await cleanOutDir(distDir);

  await esbuild({
    entryPoints: [path.resolve(artifactDir, entry)],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    // Some packages may not be bundleable, so we externalize them, we can add more here as needed.
    // Some of the packages below may not be imported or installed, but we're adding them in case they are in the future.
    // Examples of unbundleable packages:
    // - uses native modules and loads them dynamically (e.g. sharp)
    // - use path traversal to read files (e.g. @google-cloud/secret-manager loads sibling .proto files)
    external: [
      "*.node",
      "sharp",
      "better-sqlite3",
      "sqlite3",
      "canvas",
      "bcrypt",
      "argon2",
      "fsevents",
      "re2",
      "farmhash",
      "xxhash-addon",
      "bufferutil",
      "utf-8-validate",
      "ssh2",
      "cpu-features",
      "dtrace-provider",
      "isolated-vm",
      "lightningcss",
      "pg-native",
      "oracledb",
      "mongodb-client-encryption",
      "nodemailer",
      "handlebars",
      "knex",
      "typeorm",
      "protobufjs",
      "onnxruntime-node",
      "@tensorflow/*",
      "@prisma/client",
      "@mikro-orm/*",
      "@grpc/*",
      "@swc/*",
      "@aws-sdk/*",
      "@azure/*",
      "@opentelemetry/*",
      "@google-cloud/*",
      "@google/*",
      "googleapis",
      "firebase-admin",
      "@parcel/watcher",
      "@sentry/profiling-node",
      "@tree-sitter/*",
      "aws-sdk",
      "classic-level",
      "dd-trace",
      "ffi-napi",
      "grpc",
      "hiredis",
      "kerberos",
      "leveldown",
      "miniflare",
      "mysql2",
      "newrelic",
      "odbc",
      "piscina",
      "realm",
      "ref-napi",
      "rocksdb",
      "sass-embedded",
      "sequelize",
      "serialport",
      "snappy",
      "tinypool",
      "usb",
      "workerd",
      "wrangler",
      "zeromq",
      "zeromq-prebuilt",
      "playwright",
      "puppeteer",
      "puppeteer-core",
      "electron",
    ],
    sourcemap: "linked",
    plugins: [
      // pino relies on workers to handle logging, instead of externalizing it we use a plugin to handle it
      esbuildPluginPino({ transports: ["pino-pretty"] })
    ],
    // Make sure packages that are cjs only (e.g. express) but are bundled continue to work in our esm output file
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
    },
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
