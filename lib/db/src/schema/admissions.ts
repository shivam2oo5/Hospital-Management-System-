import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const admissionsTable = pgTable("admissions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  wardId: integer("ward_id").notNull(),
  bedId: integer("bed_id").notNull(),
  status: text("status").notNull().default("active"),
  admittedAt: text("admitted_at").notNull(),
  dischargedAt: text("discharged_at"),
  admissionNotes: text("admission_notes"),
  dischargeNotes: text("discharge_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAdmissionSchema = createInsertSchema(admissionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAdmission = z.infer<typeof insertAdmissionSchema>;
export type Admission = typeof admissionsTable.$inferSelect;
