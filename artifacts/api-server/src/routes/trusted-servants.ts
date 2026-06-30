import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, trustedServantsTable, peopleTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/trusted-servants", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: trustedServantsTable.id,
      title: trustedServantsTable.title,
      description: trustedServantsTable.description,
      memberId: trustedServantsTable.memberId,
      termLength: trustedServantsTable.termLength,
      startDate: trustedServantsTable.startDate,
      createdAt: trustedServantsTable.createdAt,
      memberName: peopleTable.name,
    })
    .from(trustedServantsTable)
    .leftJoin(peopleTable, eq(trustedServantsTable.memberId, peopleTable.id))
    .orderBy(trustedServantsTable.title);

  res.json(rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/trusted-servants", async (req, res): Promise<void> => {
  const { title, description, memberId, termLength, startDate } = req.body;
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const [row] = await db
    .insert(trustedServantsTable)
    .values({ title, description: description || null, memberId: memberId || null, termLength: termLength || null, startDate: startDate || null })
    .returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/trusted-servants/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db
    .select({
      id: trustedServantsTable.id,
      title: trustedServantsTable.title,
      description: trustedServantsTable.description,
      memberId: trustedServantsTable.memberId,
      termLength: trustedServantsTable.termLength,
      startDate: trustedServantsTable.startDate,
      createdAt: trustedServantsTable.createdAt,
      memberName: peopleTable.name,
    })
    .from(trustedServantsTable)
    .leftJoin(peopleTable, eq(trustedServantsTable.memberId, peopleTable.id))
    .where(eq(trustedServantsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/trusted-servants/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { title, description, memberId, termLength, startDate } = req.body;
  const update: Record<string, unknown> = {};
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description || null;
  if (memberId !== undefined) update.memberId = memberId || null;
  if (termLength !== undefined) update.termLength = termLength || null;
  if (startDate !== undefined) update.startDate = startDate || null;
  const [row] = await db.update(trustedServantsTable).set(update).where(eq(trustedServantsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/trusted-servants/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.delete(trustedServantsTable).where(eq(trustedServantsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
