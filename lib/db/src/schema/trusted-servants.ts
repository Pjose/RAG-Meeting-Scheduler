import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { peopleTable } from "./people";

export const trustedServantsTable = pgTable("trusted_servants", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  memberId: integer("member_id").references(() => peopleTable.id, { onDelete: "set null" }),
  termLength: text("term_length"),
  startDate: text("start_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTrustedServantSchema = createInsertSchema(trustedServantsTable).omit({ id: true, createdAt: true });
export type InsertTrustedServant = z.infer<typeof insertTrustedServantSchema>;
export type TrustedServant = typeof trustedServantsTable.$inferSelect;
