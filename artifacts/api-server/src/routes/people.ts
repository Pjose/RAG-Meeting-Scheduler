import { Router, type IRouter } from "express";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import { db, peopleTable, meetingsTable, assignmentsTable } from "@workspace/db";
import {
  ListPeopleQueryParams,
  CreatePersonBody,
  GetPersonParams,
  UpdatePersonParams,
  UpdatePersonBody,
  DeletePersonParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/people", async (req, res): Promise<void> => {
  const parsed = ListPeopleQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { role, search } = parsed.data;
  const conditions: SQL[] = [];

  if (role) conditions.push(eq(peopleTable.role, role));
  if (search) conditions.push(ilike(peopleTable.name, `%${search}%`));

  const people = await db
    .select()
    .from(peopleTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(peopleTable.name);

  res.json(people.map(formatPerson));
});

router.post("/people", async (req, res): Promise<void> => {
  const parsed = CreatePersonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [person] = await db.insert(peopleTable).values(parsed.data).returning();
  res.status(201).json(formatPerson(person));
});

router.get("/people/:id", async (req, res): Promise<void> => {
  const params = GetPersonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [person] = await db
    .select()
    .from(peopleTable)
    .where(eq(peopleTable.id, params.data.id));

  if (!person) {
    res.status(404).json({ error: "Person not found" });
    return;
  }

  const meetings = await db
    .select({
      id: meetingsTable.id,
      name: meetingsTable.name,
      day: meetingsTable.day,
      startTime: meetingsTable.startTime,
      endTime: meetingsTable.endTime,
      location: meetingsTable.location,
      link: meetingsTable.link,
      type: meetingsTable.type,
      format: meetingsTable.format,
      literature: meetingsTable.literature,
      interaction: meetingsTable.interaction,
      language: meetingsTable.language,
      notes: meetingsTable.notes,
      createdAt: meetingsTable.createdAt,
    })
    .from(assignmentsTable)
    .innerJoin(meetingsTable, eq(assignmentsTable.meetingId, meetingsTable.id))
    .where(eq(assignmentsTable.personId, person.id));

  res.json({
    ...formatPerson(person),
    meetings: meetings.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

router.patch("/people/:id", async (req, res): Promise<void> => {
  const params = UpdatePersonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePersonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [person] = await db
    .update(peopleTable)
    .set(parsed.data)
    .where(eq(peopleTable.id, params.data.id))
    .returning();

  if (!person) {
    res.status(404).json({ error: "Person not found" });
    return;
  }

  res.json(formatPerson(person));
});

router.delete("/people/:id", async (req, res): Promise<void> => {
  const params = DeletePersonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [person] = await db
    .delete(peopleTable)
    .where(eq(peopleTable.id, params.data.id))
    .returning();

  if (!person) {
    res.status(404).json({ error: "Person not found" });
    return;
  }

  res.sendStatus(204);
});

function formatPerson(p: typeof peopleTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    role: p.role,
    phone: p.phone,
    email: p.email,
    cleanDate: p.cleanDate,
    createdAt: p.createdAt.toISOString(),
  };
}

export default router;
