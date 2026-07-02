import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const wardsTable = pgTable("wards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  totalBeds: integer("total_beds").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bedsTable = pgTable("beds", {
  id: serial("id").primaryKey(),
  wardId: integer("ward_id").notNull(),
  bedNumber: text("bed_number").notNull(),
  status: text("status").notNull().default("available"),
  patientId: integer("patient_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWardSchema = createInsertSchema(wardsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBedSchema = createInsertSchema(bedsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWard = z.infer<typeof insertWardSchema>;
export type InsertBed = z.infer<typeof insertBedSchema>;
export type Ward = typeof wardsTable.$inferSelect;
export type Bed = typeof bedsTable.$inferSelect;
