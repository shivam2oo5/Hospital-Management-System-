import { Router } from "express";
import { db, admissionsTable, patientsTable, doctorsTable, wardsTable, bedsTable, activitiesTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import {
  CreateAdmissionBody, UpdateAdmissionBody, GetAdmissionParams, UpdateAdmissionParams,
  ListAdmissionsQueryParams, DischargePatientParams, DischargePatientBody
} from "@workspace/api-zod";

const router = Router();

async function enrichAdmission(a: typeof admissionsTable.$inferSelect) {
  const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, a.patientId));
  const [doctor] = await db.select({ name: doctorsTable.name }).from(doctorsTable).where(eq(doctorsTable.id, a.doctorId));
  const [ward] = await db.select({ name: wardsTable.name }).from(wardsTable).where(eq(wardsTable.id, a.wardId));
  const [bed] = await db.select({ bedNumber: bedsTable.bedNumber }).from(bedsTable).where(eq(bedsTable.id, a.bedId));
  return {
    ...a,
    patientName: patient?.name ?? null,
    doctorName: doctor?.name ?? null,
    wardName: ward?.name ?? null,
    bedNumber: bed?.bedNumber ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/admissions", async (req, res) => {
  try {
    const params = ListAdmissionsQueryParams.parse(req.query);
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    const conditions = [];
    if (params.status) conditions.push(eq(admissionsTable.status, params.status));
    if (params.patientId) conditions.push(eq(admissionsTable.patientId, params.patientId));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const admissions = await db.select().from(admissionsTable).where(whereClause).orderBy(desc(admissionsTable.createdAt)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: count() }).from(admissionsTable).where(whereClause);
    const enriched = await Promise.all(admissions.map(enrichAdmission));
    res.json({ admissions: enriched, total });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admissions", async (req, res) => {
  try {
    const body = CreateAdmissionBody.parse(req.body);
    const [admission] = await db.insert(admissionsTable).values({
      patientId: body.patientId,
      doctorId: body.doctorId,
      wardId: body.wardId,
      bedId: body.bedId,
      status: "active",
      admittedAt: body.admittedAt ?? new Date().toISOString(),
      admissionNotes: body.admissionNotes,
    }).returning();

    // Mark bed as occupied
    await db.update(bedsTable).set({ status: "occupied", patientId: body.patientId, updatedAt: new Date() }).where(eq(bedsTable.id, body.bedId));

    const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, body.patientId));
    const [doctor] = await db.select({ name: doctorsTable.name }).from(doctorsTable).where(eq(doctorsTable.id, body.doctorId));
    await db.insert(activitiesTable).values({
      type: "patient_admitted",
      description: `Patient ${patient?.name ?? "unknown"} admitted under Dr. ${doctor?.name ?? "unknown"}`,
      patientName: patient?.name ?? null,
      doctorName: doctor?.name ?? null,
      referenceId: admission.id,
      referenceType: "admission",
    });

    res.status(201).json(await enrichAdmission(admission));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.get("/admissions/:id", async (req, res) => {
  try {
    const { id } = GetAdmissionParams.parse({ id: parseInt(req.params.id) });
    const [admission] = await db.select().from(admissionsTable).where(eq(admissionsTable.id, id));
    if (!admission) return res.status(404).json({ error: "Not found" });
    res.json(await enrichAdmission(admission));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admissions/:id", async (req, res) => {
  try {
    const { id } = UpdateAdmissionParams.parse({ id: parseInt(req.params.id) });
    const body = UpdateAdmissionBody.parse(req.body);
    const [admission] = await db.update(admissionsTable).set({
      patientId: body.patientId,
      doctorId: body.doctorId,
      wardId: body.wardId,
      bedId: body.bedId,
      admissionNotes: body.admissionNotes,
      updatedAt: new Date(),
    }).where(eq(admissionsTable.id, id)).returning();
    if (!admission) return res.status(404).json({ error: "Not found" });
    res.json(await enrichAdmission(admission));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.post("/admissions/:id/discharge", async (req, res) => {
  try {
    const { id } = DischargePatientParams.parse({ id: parseInt(req.params.id) });
    const body = DischargePatientBody.parse(req.body);
    const [current] = await db.select().from(admissionsTable).where(eq(admissionsTable.id, id));
    if (!current) return res.status(404).json({ error: "Not found" });

    const [admission] = await db.update(admissionsTable).set({
      status: "discharged",
      dischargedAt: body.dischargedAt ?? new Date().toISOString(),
      dischargeNotes: body.dischargeNotes,
      updatedAt: new Date(),
    }).where(eq(admissionsTable.id, id)).returning();

    // Free the bed
    await db.update(bedsTable).set({ status: "available", patientId: null, updatedAt: new Date() }).where(eq(bedsTable.id, current.bedId));

    const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, current.patientId));
    await db.insert(activitiesTable).values({
      type: "patient_discharged",
      description: `Patient ${patient?.name ?? "unknown"} discharged`,
      patientName: patient?.name ?? null,
      referenceId: current.patientId,
      referenceType: "patient",
    });

    res.json(await enrichAdmission(admission));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

export default router;
