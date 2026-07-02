import { Router } from "express";
import { db, patientsTable, activitiesTable } from "@workspace/db";
import { eq, ilike, count, sql, and, desc } from "drizzle-orm";
import { CreatePatientBody, UpdatePatientBody, GetPatientParams, UpdatePatientParams, DeletePatientParams, ListPatientsQueryParams } from "@workspace/api-zod";

const router = Router();

function formatPatient(p: typeof patientsTable.$inferSelect) {
  return { ...p, createdAt: p.createdAt.toISOString() };
}

router.get("/patients", async (req, res) => {
  try {
    const params = ListPatientsQueryParams.parse(req.query);
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    const conditions = [];
    if (params.search) conditions.push(ilike(patientsTable.name, `%${params.search}%`));
    if (params.status) conditions.push(eq(patientsTable.status, params.status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const patients = await db.select().from(patientsTable).where(whereClause).orderBy(desc(patientsTable.createdAt)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: count() }).from(patientsTable).where(whereClause);
    res.json({ patients: patients.map(formatPatient), total });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/patients", async (req, res) => {
  try {
    const body = CreatePatientBody.parse(req.body);
    const [countResult] = await db.select({ cnt: count() }).from(patientsTable);
    const patientId = `HMS-${String(countResult.cnt + 1).padStart(4, "0")}`;

    const [patient] = await db.insert(patientsTable).values({
      patientId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      bloodGroup: body.bloodGroup,
      address: body.address,
      allergies: body.allergies,
      emergencyContactName: body.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone,
      insuranceProvider: body.insuranceProvider,
      insuranceNumber: body.insuranceNumber,
      status: body.status ?? "active",
    }).returning();

    await db.insert(activitiesTable).values({
      type: "patient_registered",
      description: `New patient registered: ${patient.name}`,
      patientName: patient.name,
      referenceId: patient.id,
      referenceType: "patient",
    });

    res.status(201).json(formatPatient(patient));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.get("/patients/:id", async (req, res) => {
  try {
    const { id } = GetPatientParams.parse({ id: parseInt(req.params.id) });
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
    if (!patient) return res.status(404).json({ error: "Not found" });
    res.json(formatPatient(patient));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/patients/:id", async (req, res) => {
  try {
    const { id } = UpdatePatientParams.parse({ id: parseInt(req.params.id) });
    const body = UpdatePatientBody.parse(req.body);
    const [patient] = await db.update(patientsTable).set({
      name: body.name,
      email: body.email,
      phone: body.phone,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      bloodGroup: body.bloodGroup,
      address: body.address,
      allergies: body.allergies,
      emergencyContactName: body.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone,
      insuranceProvider: body.insuranceProvider,
      insuranceNumber: body.insuranceNumber,
      status: body.status,
      updatedAt: new Date(),
    }).where(eq(patientsTable.id, id)).returning();
    if (!patient) return res.status(404).json({ error: "Not found" });
    res.json(formatPatient(patient));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/patients/:id", async (req, res) => {
  try {
    const { id } = DeletePatientParams.parse({ id: parseInt(req.params.id) });
    await db.delete(patientsTable).where(eq(patientsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/patients/:id/timeline", async (req, res) => {
  try {
    const { id } = GetPatientParams.parse({ id: parseInt(req.params.id) });
    const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, id));
    if (!patient) return res.status(404).json({ error: "Not found" });
    const activities = await db.select().from(activitiesTable)
      .where(and(eq(activitiesTable.referenceId, id), eq(activitiesTable.referenceType, "patient")))
      .orderBy(desc(activitiesTable.createdAt))
      .limit(50);
    res.json(activities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
