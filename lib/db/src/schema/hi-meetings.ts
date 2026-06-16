import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hiMeetingsTable = pgTable("hi_meetings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  day: text("day").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location"),
  link: text("link"),
  type: text("type").notNull(),
  format: text("format").notNull(),
  literature: text("literature"),
  interaction: text("interaction").notNull(),
  language: text("language").notNull().default("English"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHiMeetingSchema = createInsertSchema(hiMeetingsTable).omit({ id: true, createdAt: true });
export type InsertHiMeeting = z.infer<typeof insertHiMeetingSchema>;
export type HiMeeting = typeof hiMeetingsTable.$inferSelect;
