import { Router } from "express";
import { db, medicalRecordsTable, patientsTable, doctorsTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { CreateMedicalRecordBody, UpdateMedicalRecordBody, GetMedicalRecordParams, UpdateMedicalRecordParams, ListMedicalRecordsQueryParams } from "@workspace/api-zod";

const router = Router();

async function enrichRecord(r: typeof medicalRecordsTable.$inferSelect) {
  const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, r.patientId));
  const [doctor] = await db.select({ name: doctorsTable.name }).from(doctorsTable).where(eq(doctorsTable.id, r.doctorId));
  return { ...r, patientName: patient?.name ?? null, doctorName: doctor?.name ?? null, createdAt: r.createdAt.toISOString() };
}

router.get("/medical-records", async (req, res) => {
  try {
    const params = ListMedicalRecordsQueryParams.parse(req.query);
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    const conditions = [];
    if (params.patientId) conditions.push(eq(medicalRecordsTable.patientId, params.patientId));
    if (params.doctorId) conditions.push(eq(medicalRecordsTable.doctorId, params.doctorId));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const records = await db.select().from(medicalRecordsTable).where(whereClause).orderBy(desc(medicalRecordsTable.createdAt)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: count() }).from(medicalRecordsTable).where(whereClause);
    const enriched = await Promise.all(records.map(enrichRecord));
    res.json({ records: enriched, total });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/medical-records", async (req, res) => {
  try {
    const body = CreateMedicalRecordBody.parse(req.body);
    const [record] = await db.insert(medicalRecordsTable).values({
      patientId: body.patientId,
      doctorId: body.doctorId,
      visitDate: body.visitDate,
      chiefComplaint: body.chiefComplaint,
      diagnosis: body.diagnosis,
      treatment: body.treatment,
      prescription: body.prescription,
      notes: body.notes,
      followUpDate: body.followUpDate,
    }).returning();
    res.status(201).json(await enrichRecord(record));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.get("/medical-records/:id", async (req, res) => {
  try {
    const { id } = GetMedicalRecordParams.parse({ id: parseInt(req.params.id) });
    const [record] = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.id, id));
    if (!record) return res.status(404).json({ error: "Not found" });
    res.json(await enrichRecord(record));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/medical-records/:id", async (req, res) => {
  try {
    const { id } = UpdateMedicalRecordParams.parse({ id: parseInt(req.params.id) });
    const body = UpdateMedicalRecordBody.parse(req.body);
    const [record] = await db.update(medicalRecordsTable).set({
      patientId: body.patientId,
      doctorId: body.doctorId,
      visitDate: body.visitDate,
      chiefComplaint: body.chiefComplaint,
      diagnosis: body.diagnosis,
      treatment: body.treatment,
      prescription: body.prescription,
      notes: body.notes,
      followUpDate: body.followUpDate,
      updatedAt: new Date(),
    }).where(eq(medicalRecordsTable.id, id)).returning();
    if (!record) return res.status(404).json({ error: "Not found" });
    res.json(await enrichRecord(record));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

export default router;
