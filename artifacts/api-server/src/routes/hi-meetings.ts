import { Router, type IRouter } from "express";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import { db, hiMeetingsTable, peopleTable, hiAssignmentsTable } from "@workspace/db";
import {
  ListHiMeetingsQueryParams,
  CreateHiMeetingBody,
  GetHiMeetingParams,
  UpdateHiMeetingParams,
  UpdateHiMeetingBody,
  DeleteHiMeetingParams,
  GetHiMeetingPeopleParams,
  AssignPersonToHiMeetingParams,
  AssignPersonToHiMeetingBody,
  RemovePersonFromHiMeetingParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/hi-meetings", async (req, res): Promise<void> => {
  const parsed = ListHiMeetingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { day, type, format, interaction, language, search } = parsed.data;
  const conditions: SQL[] = [];

  if (day) conditions.push(eq(hiMeetingsTable.day, day));
  if (type) conditions.push(eq(hiMeetingsTable.type, type));
  if (format) conditions.push(eq(hiMeetingsTable.format, format));
  if (interaction) conditions.push(eq(hiMeetingsTable.interaction, interaction));
  if (language) conditions.push(eq(hiMeetingsTable.language, language));
  if (search) conditions.push(ilike(hiMeetingsTable.name, `%${search}%`));

  const meetings = await db
    .select()
    .from(hiMeetingsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(hiMeetingsTable.day, hiMeetingsTable.startTime);

  res.json(meetings.map(formatHiMeeting));
});

router.post("/hi-meetings", async (req, res): Promise<void> => {
  const parsed = CreateHiMeetingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [meeting] = await db.insert(hiMeetingsTable).values(parsed.data).returning();
  res.status(201).json(formatHiMeeting(meeting));
});

router.get("/hi-meetings/:id", async (req, res): Promise<void> => {
  const params = GetHiMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [meeting] = await db
    .select()
    .from(hiMeetingsTable)
    .where(eq(hiMeetingsTable.id, params.data.id));

  if (!meeting) {
    res.status(404).json({ error: "H&I meeting not found" });
    return;
  }

  const assignedPeople = await db
    .select({
      id: peopleTable.id,
      name: peopleTable.name,
      role: peopleTable.role,
      phone: peopleTable.phone,
      email: peopleTable.email,
      assignedRole: hiAssignmentsTable.assignedRole,
    })
    .from(hiAssignmentsTable)
    .innerJoin(peopleTable, eq(hiAssignmentsTable.personId, peopleTable.id))
    .where(eq(hiAssignmentsTable.meetingId, meeting.id));

  res.json({ ...formatHiMeeting(meeting), people: assignedPeople });
});

router.patch("/hi-meetings/:id", async (req, res): Promise<void> => {
  const params = UpdateHiMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateHiMeetingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [meeting] = await db
    .update(hiMeetingsTable)
    .set(parsed.data)
    .where(eq(hiMeetingsTable.id, params.data.id))
    .returning();

  if (!meeting) {
    res.status(404).json({ error: "H&I meeting not found" });
    return;
  }

  res.json(formatHiMeeting(meeting));
});

router.delete("/hi-meetings/:id", async (req, res): Promise<void> => {
  const params = DeleteHiMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [meeting] = await db
    .delete(hiMeetingsTable)
    .where(eq(hiMeetingsTable.id, params.data.id))
    .returning();

  if (!meeting) {
    res.status(404).json({ error: "H&I meeting not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/hi-meetings/:id/people", async (req, res): Promise<void> => {
  const params = GetHiMeetingPeopleParams.safeParse(req.params);
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
      assignedRole: hiAssignmentsTable.assignedRole,
    })
    .from(hiAssignmentsTable)
    .innerJoin(peopleTable, eq(hiAssignmentsTable.personId, peopleTable.id))
    .where(eq(hiAssignmentsTable.meetingId, params.data.id));

  res.json(people);
});

router.post("/hi-meetings/:id/people", async (req, res): Promise<void> => {
  const params = AssignPersonToHiMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AssignPersonToHiMeetingBody.safeParse(req.body);
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

  await db.insert(hiAssignmentsTable).values({
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

router.delete("/hi-meetings/:id/people/:personId", async (req, res): Promise<void> => {
  const params = RemovePersonFromHiMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(hiAssignmentsTable)
    .where(
      and(
        eq(hiAssignmentsTable.meetingId, params.data.id),
        eq(hiAssignmentsTable.personId, params.data.personId),
      ),
    );

  res.sendStatus(204);
});

function formatHiMeeting(m: typeof hiMeetingsTable.$inferSelect) {
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
