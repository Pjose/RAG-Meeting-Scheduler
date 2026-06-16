import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, hiMeetingsTable, peopleTable, hiAssignmentsTable } from "@workspace/db";

const router: IRouter = Router();

const DAYS_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

router.get("/hi-schedule", async (_req, res): Promise<void> => {
  const meetings = await db
    .select()
    .from(hiMeetingsTable)
    .orderBy(hiMeetingsTable.startTime);

  const meetingIds = meetings.map((m) => m.id);

  const allAssignments =
    meetingIds.length > 0
      ? await db
          .select({
            meetingId: hiAssignmentsTable.meetingId,
            id: peopleTable.id,
            name: peopleTable.name,
            role: peopleTable.role,
            phone: peopleTable.phone,
            email: peopleTable.email,
            assignedRole: hiAssignmentsTable.assignedRole,
          })
          .from(hiAssignmentsTable)
          .innerJoin(peopleTable, eq(hiAssignmentsTable.personId, peopleTable.id))
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

export default router;
