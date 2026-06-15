import { Router, type IRouter } from "express";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import { db, meetingsTable, peopleTable, assignmentsTable } from "@workspace/db";
import {
  ListMeetingsQueryParams,
  CreateMeetingBody,
  GetMeetingParams,
  UpdateMeetingParams,
  UpdateMeetingBody,
  DeleteMeetingParams,
  GetMeetingPeopleParams,
  AssignPersonToMeetingParams,
  AssignPersonToMeetingBody,
  RemovePersonFromMeetingParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/meetings", async (req, res): Promise<void> => {
  const parsed = ListMeetingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { day, type, format, interaction, language, search } = parsed.data;
  const conditions: SQL[] = [];

  if (day) conditions.push(eq(meetingsTable.day, day));
  if (type) conditions.push(eq(meetingsTable.type, type));
  if (format) conditions.push(eq(meetingsTable.format, format));
  if (interaction) conditions.push(eq(meetingsTable.interaction, interaction));
  if (language) conditions.push(eq(meetingsTable.language, language));
  if (search) conditions.push(ilike(meetingsTable.name, `%${search}%`));

  const meetings = await db
    .select()
    .from(meetingsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(meetingsTable.day, meetingsTable.startTime);

  res.json(meetings.map(formatMeeting));
});

router.post("/meetings", async (req, res): Promise<void> => {
  const parsed = CreateMeetingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [meeting] = await db.insert(meetingsTable).values(parsed.data).returning();
  res.status(201).json(formatMeeting(meeting));
});

router.get("/meetings/:id", async (req, res): Promise<void> => {
  const params = GetMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [meeting] = await db
    .select()
    .from(meetingsTable)
    .where(eq(meetingsTable.id, params.data.id));

  if (!meeting) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  const assignedPeople = await db
    .select({
      id: peopleTable.id,
      name: peopleTable.name,
      role: peopleTable.role,
      phone: peopleTable.phone,
      email: peopleTable.email,
      assignedRole: assignmentsTable.assignedRole,
    })
    .from(assignmentsTable)
    .innerJoin(peopleTable, eq(assignmentsTable.personId, peopleTable.id))
    .where(eq(assignmentsTable.meetingId, meeting.id));

  res.json({ ...formatMeeting(meeting), people: assignedPeople });
});

router.patch("/meetings/:id", async (req, res): Promise<void> => {
  const params = UpdateMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMeetingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [meeting] = await db
    .update(meetingsTable)
    .set(parsed.data)
    .where(eq(meetingsTable.id, params.data.id))
    .returning();

  if (!meeting) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  res.json(formatMeeting(meeting));
});

router.delete("/meetings/:id", async (req, res): Promise<void> => {
  const params = DeleteMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [meeting] = await db
    .delete(meetingsTable)
    .where(eq(meetingsTable.id, params.data.id))
    .returning();

  if (!meeting) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/meetings/:id/people", async (req, res): Promise<void> => {
  const params = GetMeetingPeopleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const people = await db
    .select({
      id: peopleTable.id,
      name: peopleTable.name,
      role: peopleTable.role,
      phone: peopleTable.phone,
      email: peopleTable.email,
      assignedRole: assignmentsTable.assignedRole,
    })
    .from(assignmentsTable)
    .innerJoin(peopleTable, eq(assignmentsTable.personId, peopleTable.id))
    .where(eq(assignmentsTable.meetingId, params.data.id));

  res.json(people);
});

router.post("/meetings/:id/people", async (req, res): Promise<void> => {
  const params = AssignPersonToMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AssignPersonToMeetingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [person] = await db
    .select()
    .from(peopleTable)
    .where(eq(peopleTable.id, parsed.data.personId));

  if (!person) {
    res.status(404).json({ error: "Person not found" });
    return;
  }

  await db.insert(assignmentsTable).values({
    meetingId: params.data.id,
    personId: parsed.data.personId,
    assignedRole: parsed.data.assignedRole,
  });

  res.status(201).json({
    id: person.id,
    name: person.name,
    role: person.role,
    phone: person.phone,
    email: person.email,
    assignedRole: parsed.data.assignedRole ?? null,
  });
});

router.delete("/meetings/:id/people/:personId", async (req, res): Promise<void> => {
  const params = RemovePersonFromMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(assignmentsTable)
    .where(
      and(
        eq(assignmentsTable.meetingId, params.data.id),
        eq(assignmentsTable.personId, params.data.personId),
      ),
    );

  res.sendStatus(204);
});

function formatMeeting(m: typeof meetingsTable.$inferSelect) {
  return {
    id: m.id,
    name: m.name,
    day: m.day,
    startTime: m.startTime,
    endTime: m.endTime,
    location: m.location,
    link: m.link,
    type: m.type,
    format: m.format,
    literature: m.literature,
    interaction: m.interaction,
    language: m.language,
    notes: m.notes,
    createdAt: m.createdAt.toISOString(),
  };
}

export default router;
