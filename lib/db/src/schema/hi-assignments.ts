import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hiMeetingsTable } from "./hi-meetings";
import { peopleTable } from "./people";

export const hiAssignmentsTable = pgTable("hi_assignments", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").notNull().references(() => hiMeetingsTable.id, { onDelete: "cascade" }),
  personId: integer("person_id").notNull().references(() => peopleTable.id, { onDelete: "cascade" }),
  assignedRole: text("assigned_role"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHiAssignmentSchema = createInsertSchema(hiAssignmentsTable).omit({ id: true, createdAt: true });
export type InsertHiAssignment = z.infer<typeof insertHiAssignmentSchema>;
export type HiAssignment = typeof hiAssignmentsTable.$inferSelect;
