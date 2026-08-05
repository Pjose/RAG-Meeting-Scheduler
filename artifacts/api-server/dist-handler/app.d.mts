// This file is checked into git deliberately, even though its sibling
// `app.mjs` in this same directory is a generated build artifact (see
// artifacts/api-server/build.mjs --handler-only, run as part of
// `pnpm --filter @workspace/api-server run build:handler`).
//
// Why: Vercel's build type-checks /api/index.ts in isolation, under a
// module resolution mode that requires exact, extension-matched imports
// and doesn't have access to this monorepo's own tsconfig/project-reference
// setup. Rather than have it parse artifacts/api-server's TypeScript source
// directly (which breaks under those different resolution rules), we import
// the already-bundled, plain-JavaScript app.mjs at runtime, and give
// TypeScript this small, stable, hand-written declaration for it instead.
//
// TypeScript resolves this as the direct declaration file for the sibling
// app.mjs (same basename, same directory) — so this needs actual top-level
// export statements, not a `declare module "./app.mjs" { ... }` wrapper.
//
// build.mjs's cleanup step is specifically written to never delete this
// file when regenerating app.mjs — if that ever changes, this comment is
// your warning not to let it.
//
// If the Express app's shape changes in a way that breaks this contract
// (it shouldn't — it's just "a function that takes a request and a
// response"), update this file to match.
import type { IncomingMessage, ServerResponse } from "node:http";

declare const app: (req: IncomingMessage, res: ServerResponse) => void;
export default app;
