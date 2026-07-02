import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const labOrdersTable = pgTable("lab_orders", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  testName: text("test_name").notNull(),
  testCategory: text("test_category"),
  status: text("status").notNull().default("ordered"),
  result: text("result"),
  referenceRange: text("reference_range"),
  notes: text("notes"),
  orderedAt: text("ordered_at").notNull(),
  completedAt: text("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLabOrderSchema = createInsertSchema(labOrdersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLabOrder = z.infer<typeof insertLabOrderSchema>;
export type LabOrder = typeof labOrdersTable.$inferSelect;
