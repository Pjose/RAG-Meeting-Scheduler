// Vercel serverless function entry point.
//
// This does NOT call app.listen() — on Replit the api-server ran as a
// long-lived process (see artifacts/api-server/src/index.ts). On Vercel,
// each request instead invokes this handler, which just hands the
// request/response pair to the same Express app used before. All existing
// routes, middleware, and session handling in artifacts/api-server/src/app.ts
// are unchanged and reused as-is.
import type { IncomingMessage, ServerResponse } from "node:http";
import expressApp from "../artifacts/api-server/src/app";

// Vercel's build type-checks this file in isolation, outside of
// artifacts/api-server's own tsconfig/project-reference setup, so it doesn't
// always resolve the Express `Application` type's call signature correctly.
// Express apps are callable request handlers at runtime regardless — this
// type is just describing that shape explicitly instead of relying on
// inference that behaves differently depending on which tsconfig picks it up.
type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;
const app = expressApp as unknown as RequestHandler;

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res);
}
