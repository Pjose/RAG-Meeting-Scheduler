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
import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../artifacts/api-server/dist-handler/app.mjs";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res);
}


