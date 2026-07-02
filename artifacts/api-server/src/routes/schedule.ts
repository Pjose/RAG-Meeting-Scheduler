import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, meetingsTable, peopleTable, assignmentsTable, hiMeetingsTable } from "@workspace/db";

const router: IRouter = Router();

const DAYS_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

router.get("/schedule", async (_req, res): Promise<void> => {
  const meetings = await db
    .select()
    .from(meetingsTable)
    .orderBy(meetingsTable.startTime);

  const meetingIds = meetings.map((m) => m.id);

  const allAssignments =
    meetingIds.length > 0
      ? await db
          .select({
            meetingId: assignmentsTable.meetingId,
            id: peopleTable.id,
            name: peopleTable.name,
            role: peopleTable.role,
            phone: peopleTable.phone,
            email: peopleTable.email,
            assignedRole: assignmentsTable.assignedRole,
          })
          .from(assignmentsTable)
          .innerJoin(peopleTable, eq(assignmentsTable.personId, peopleTable.id))
      : [];

  const byDay = new Map<string, typeof meetings>();
  for (const m of meetings) {
    if (!byDay.has(m.day)) byDay.set(m.day, []);
    byDay.get(m.day)!.push(m);
  }

  const days = DAYS_ORDER.filter((d) => byDay.has(d)).map((day) => ({
    day,
    meetings: (byDay.get(day) ?? []).map((m) => ({
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
      people: allAssignments
        .filter((a) => a.meetingId === m.id)
        .map((a) => ({
          id: a.id,
          name: a.name,
          role: a.role,
          phone: a.phone,
          email: a.email,
          assignedRole: a.assignedRole,
        })),
    })),
  }));

  res.json({ days });
});

router.get("/stats", async (_req, res): Promise<void> => {
  const [{ count: totalMeetings }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(meetingsTable);

  const [{ count: totalPeople }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(peopleTable);

  const [{ count: totalHiMeetings }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(hiMeetingsTable);

  const meetingsByDay = await db
    .select({
      label: meetingsTable.day,
      count: sql<number>`count(*)::int`,
    })
    .from(meetingsTable)
    .groupBy(meetingsTable.day)
    .orderBy(meetingsTable.day);

  const meetingsByType = await db
    .select({
      label: meetingsTable.type,
      count: sql<number>`count(*)::int`,
    })
    .from(meetingsTable)
    .groupBy(meetingsTable.type)
    .orderBy(meetingsTable.type);

  const meetingsByInteraction = await db
    .select({
      label: meetingsTable.interaction,
      count: sql<number>`count(*)::int`,
    })
    .from(meetingsTable)
    .groupBy(meetingsTable.interaction)
    .orderBy(meetingsTable.interaction);

  const meetingsByFormat = await db
    .select({
      label: meetingsTable.format,
      count: sql<number>`count(*)::int`,
    })
    .from(meetingsTable)
    .groupBy(meetingsTable.format)
    .orderBy(meetingsTable.format);

  res.json({
    totalMeetings,
    totalPeople,
    totalHiMeetings,
    meetingsByDay,
    meetingsByType,
    meetingsByInteraction,
    meetingsByFormat,
  });
});

export default router;
