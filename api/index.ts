// Vercel serverless function entry point.
//
// This does NOT call app.listen() — on Replit the api-server ran as a
// long-lived process (see artifacts/api-server/src/index.ts). On Vercel,
// each request instead invokes this handler, which just hands the
// request/response pair to the same Express app used before. All existing
// routes, middleware, and session handling in artifacts/api-server/src/app.ts
// are unchanged and reused as-is.
//
// We import the pre-bundled artifacts/api-server/dist-handler/app.mjs
// (built by `pnpm --filter @workspace/api-server run build:handler`, wired
// into vercel.json's buildCommand) rather than the TS source directly.
// Vercel type-checks this file in isolation, under a module resolution mode
// that doesn't match this monorepo's own tsconfig setup — importing already
// -bundled plain JS sidesteps that mismatch entirely. See the neighboring
// app.d.mts for the (hand-written, stable) type this resolves to.
//
// Deliberately NOT importing Node's real http types (IncomingMessage /
// ServerResponse) here: Vercel's isolated check for this file doesn't
// reliably resolve @types/node regardless of where it's declared in the
// monorepo (tried it at the repo root — still failed). We only ever pass
// req/res straight through without touching their properties, so a minimal
// structural type is all this file actually needs. At runtime, Vercel's own
// Node.js function runtime still invokes this with real Node request/
// response objects — nothing about the actual behavior changes.
//
// A static import here relies on the repo root's package.json declaring
// "type": "module" — without that, Vercel compiles this file to CommonJS,
// and require()-ing app.mjs (real ESM, built with esbuild's format: "esm")
// crashes with ERR_REQUIRE_ESM at runtime. (A dynamic import() doesn't
// sidestep this on its own either: TypeScript downlevels dynamic import()
// into a require()-wrapped promise when compiling to CommonJS, hitting the
// exact same wall — the module type has to be fixed at the source.)
import app from "../artifacts/api-server/dist-handler/app.mjs";

// Minimal structural type for `process` — same reasoning as avoiding
// IncomingMessage/ServerResponse above: Vercel's isolated check for this
// file doesn't reliably resolve @types/node, so we don't rely on the global
// `process` type it would normally provide.
declare const process: {
  on(event: string, listener: (...args: unknown[]) => void): void;
};

// Safety net: Express's own error-handling middleware (added to app.ts) only
// catches errors that flow through Express's normal request-handling chain
// — a thrown error in a route, or a rejected promise from an async route
// handler (Express 5 forwards those automatically). It does NOT catch
// callback-style errors that never call next(err) — e.g. from
// connect-pg-simple's session store, which talks to Postgres via node-pg's
// callback API internally — or errors from anything outside Express's
// request cycle entirely. Those become unhandled rejections/exceptions,
// which is why one of these two handlers, not Express's, is what actually
// surfaces the real cause when Express's own error log line goes
// unexpectedly missing.
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION in serverless function:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION in serverless function:", err);
});

export default function handler(req: unknown, res: unknown): void {
  (app as (req: unknown, res: unknown) => void)(req, res);
}

