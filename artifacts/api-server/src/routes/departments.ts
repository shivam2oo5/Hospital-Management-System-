import { Router } from "express";
import { db, departmentsTable, doctorsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { CreateDepartmentBody, UpdateDepartmentBody, GetDepartmentParams, UpdateDepartmentParams, DeleteDepartmentParams } from "@workspace/api-zod";

const router = Router();

router.get("/departments", async (req, res) => {
  try {
    const departments = await db.select().from(departmentsTable).orderBy(departmentsTable.name);
    const result = await Promise.all(departments.map(async (d) => {
      const [{ cnt }] = await db.select({ cnt: count() }).from(doctorsTable).where(eq(doctorsTable.departmentId, d.id));
      return { ...d, doctorCount: cnt, createdAt: d.createdAt.toISOString() };
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/departments", async (req, res) => {
  try {
    const body = CreateDepartmentBody.parse(req.body);
    const [dept] = await db.insert(departmentsTable).values({
      name: body.name,
      description: body.description,
      headDoctorId: body.headDoctorId,
    }).returning();
    res.status(201).json({ ...dept, doctorCount: 0, createdAt: dept.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.get("/departments/:id", async (req, res) => {
  try {
    const { id } = GetDepartmentParams.parse({ id: parseInt(req.params.id) });
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, id));
    if (!dept) return res.status(404).json({ error: "Not found" });
    const [{ cnt }] = await db.select({ cnt: count() }).from(doctorsTable).where(eq(doctorsTable.departmentId, id));
    res.json({ ...dept, doctorCount: cnt, createdAt: dept.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/departments/:id", async (req, res) => {
  try {
    const { id } = UpdateDepartmentParams.parse({ id: parseInt(req.params.id) });
    const body = UpdateDepartmentBody.parse(req.body);
    const [dept] = await db.update(departmentsTable).set({ name: body.name, description: body.description, headDoctorId: body.headDoctorId, updatedAt: new Date() }).where(eq(departmentsTable.id, id)).returning();
    if (!dept) return res.status(404).json({ error: "Not found" });
    res.json({ ...dept, doctorCount: 0, createdAt: dept.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/departments/:id", async (req, res) => {
  try {
    const { id } = DeleteDepartmentParams.parse({ id: parseInt(req.params.id) });
    await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
