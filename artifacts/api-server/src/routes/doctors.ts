import { Router } from "express";
import { db, doctorsTable, departmentsTable, appointmentsTable } from "@workspace/db";
import { eq, ilike, count, sum, and } from "drizzle-orm";
import { CreateDoctorBody, UpdateDoctorBody, GetDoctorParams, UpdateDoctorParams, DeleteDoctorParams, ListDoctorsQueryParams } from "@workspace/api-zod";

const router = Router();

async function enrichDoctor(d: typeof doctorsTable.$inferSelect) {
  const [dept] = await db.select({ name: departmentsTable.name }).from(departmentsTable).where(eq(departmentsTable.id, d.departmentId));
  return {
    ...d,
    consultationFee: parseFloat(d.consultationFee ?? "0"),
    departmentName: dept?.name ?? null,
    createdAt: d.createdAt.toISOString(),
  };
}

router.get("/doctors/top-performers", async (req, res) => {
  try {
    const doctors = await db.select().from(doctorsTable).where(eq(doctorsTable.status, "active")).limit(5);
    const result = await Promise.all(doctors.map(async (d) => {
      const [dept] = await db.select({ name: departmentsTable.name }).from(departmentsTable).where(eq(departmentsTable.id, d.departmentId));
      const [apptCount] = await db.select({ cnt: count() }).from(appointmentsTable).where(eq(appointmentsTable.doctorId, d.id));
      return {
        id: d.id,
        name: d.name,
        specialization: d.specialization,
        departmentName: dept?.name ?? null,
        appointmentCount: apptCount.cnt,
        revenue: apptCount.cnt * parseFloat(d.consultationFee ?? "0"),
      };
    }));
    result.sort((a, b) => b.appointmentCount - a.appointmentCount);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/doctors", async (req, res) => {
  try {
    const params = ListDoctorsQueryParams.parse(req.query);
    let query = db.select().from(doctorsTable).$dynamic();
    const conditions = [];
    if (params.departmentId) conditions.push(eq(doctorsTable.departmentId, params.departmentId));
    if (params.search) conditions.push(ilike(doctorsTable.name, `%${params.search}%`));
    if (conditions.length > 0) query = query.where(and(...conditions));
    const doctors = await query.orderBy(doctorsTable.name);
    const result = await Promise.all(doctors.map(enrichDoctor));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/doctors", async (req, res) => {
  try {
    const body = CreateDoctorBody.parse(req.body);
    const [doctor] = await db.insert(doctorsTable).values({
      name: body.name,
      email: body.email,
      phone: body.phone,
      specialization: body.specialization,
      qualification: body.qualification,
      departmentId: body.departmentId,
      consultationFee: body.consultationFee?.toString() ?? "0",
      status: body.status ?? "active",
      schedule: body.schedule,
    }).returning();
    res.status(201).json(await enrichDoctor(doctor));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.get("/doctors/:id", async (req, res) => {
  try {
    const { id } = GetDoctorParams.parse({ id: parseInt(req.params.id) });
    const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, id));
    if (!doctor) return res.status(404).json({ error: "Not found" });
    res.json(await enrichDoctor(doctor));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/doctors/:id", async (req, res) => {
  try {
    const { id } = UpdateDoctorParams.parse({ id: parseInt(req.params.id) });
    const body = UpdateDoctorBody.parse(req.body);
    const [doctor] = await db.update(doctorsTable).set({
      name: body.name,
      email: body.email,
      phone: body.phone,
      specialization: body.specialization,
      qualification: body.qualification,
      departmentId: body.departmentId,
      consultationFee: body.consultationFee?.toString(),
      status: body.status,
      schedule: body.schedule,
      updatedAt: new Date(),
    }).where(eq(doctorsTable.id, id)).returning();
    if (!doctor) return res.status(404).json({ error: "Not found" });
    res.json(await enrichDoctor(doctor));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/doctors/:id", async (req, res) => {
  try {
    const { id } = DeleteDoctorParams.parse({ id: parseInt(req.params.id) });
    await db.delete(doctorsTable).where(eq(doctorsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
