import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";

const PgSession = connectPgSimple(session);

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required.");
}

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // "none" is required so the session cookie survives being set from a
      // Vercel serverless function response; sameSite defaults to "lax"
      // otherwise, which is fine too since frontend and API share an origin.
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api", router);

// Without this, an error thrown (or an async rejection, which Express 5
// forwards automatically) anywhere in a route falls through to Express's
// built-in default error handler, which sends a generic HTML "Internal
// Server Error" page and — critically for debugging on Vercel — never logs
// the actual error anywhere. pino-http's own request-completion log line
// only reports the response's final status code, not what caused it.
//
// This surfaces the real error in Vercel's Runtime Logs (message + stack)
// while still keeping the response body generic, since request
// bodies/headers can contain sensitive data we don't want echoed back to
// the client.
//
// Uses plain console.error, not the pino `logger` used elsewhere in this
// file — pino's actual write happens asynchronously on a background worker
// thread (visible in the bundled output as pino-worker.mjs/
// thread-stream-worker.mjs). In a serverless environment, Vercel can freeze
// the execution context immediately after the HTTP response is sent, before
// that background write completes, silently dropping the log. console.error
// writes synchronously and is captured directly, so it can't get lost that
// way.
app.use(
  (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    console.error(
      "Unhandled request error:",
      req.method,
      req.path,
      err instanceof Error ? err.stack : err,
    );
    if (res.headersSent) {
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  },
);

export default app;
