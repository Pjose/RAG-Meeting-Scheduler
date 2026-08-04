// Vercel serverless function entry point.
//
// This does NOT call app.listen() — on Replit the api-server ran as a
// long-lived process (see artifacts/api-server/src/index.ts). On Vercel,
// each request instead invokes this handler, which just hands the
// request/response pair to the same Express app used before. All existing
// routes, middleware, and session handling in artifacts/api-server/src/app.ts
// are unchanged and reused as-is.
import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../artifacts/api-server/src/app";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res);
}
