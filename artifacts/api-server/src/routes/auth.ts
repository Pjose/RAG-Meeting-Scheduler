import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, peopleTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    authenticated: boolean;
    role: string | null;
    personId: number | null;
  }
}

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  const [person] = await db
    .select()
    .from(peopleTable)
    .where(eq(peopleTable.username, username));

  if (person && person.passwordHash) {
    const match = await bcrypt.compare(password, person.passwordHash);
    if (!match) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }
    req.session.authenticated = true;
    req.session.role = person.role;
    req.session.personId = person.id;
    req.session.save((err) => {
      if (err) { res.status(500).json({ error: "Session error" }); return; }
      res.json({ ok: true, role: person.role });
    });
    return;
  }

  const expectedUsername = process.env.ADMIN_USERNAME ?? "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    res.status(503).json({ error: "Server not configured — set the ADMIN_PASSWORD environment variable." });
    return;
  }

  if (username === expectedUsername && password === expectedPassword) {
    req.session.authenticated = true;
    req.session.role = "Admin";
    req.session.personId = null;
    req.session.save((err) => {
      if (err) { res.status(500).json({ error: "Session error" }); return; }
      res.json({ ok: true, role: "Admin" });
    });
  } else {
    res.status(401).json({ error: "Invalid username or password." });
  }
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) { res.status(500).json({ error: "Logout failed" }); return; }
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res): void => {
  if (req.session?.authenticated === true) {
    res.json({ authenticated: true, role: req.session.role ?? "Admin" });
  } else {
    res.json({ authenticated: false, role: null });
  }
});

export default router;
