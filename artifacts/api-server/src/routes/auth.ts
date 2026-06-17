import { Router, type IRouter } from "express";

declare module "express-session" {
  interface SessionData {
    authenticated: boolean;
  }
}

const router: IRouter = Router();

router.post("/auth/login", (req, res): void => {
  const { username, password } = req.body as { username?: string; password?: string };
  const expectedUsername = process.env.ADMIN_USERNAME ?? "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    res.status(503).json({ error: "Server not configured — set the ADMIN_PASSWORD environment variable." });
    return;
  }

  if (username === expectedUsername && password === expectedPassword) {
    req.session.authenticated = true;
    req.session.save((err) => {
      if (err) {
        res.status(500).json({ error: "Session error" });
        return;
      }
      res.json({ ok: true });
    });
  } else {
    res.status(401).json({ error: "Invalid username or password." });
  }
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res): void => {
  res.json({ authenticated: req.session.authenticated === true });
});

export default router;
