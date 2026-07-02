import { Router } from "express";
import { db, staffTable, departmentsTable } from "@workspace/db";
import { eq, ilike, and, count } from "drizzle-orm";
import { CreateStaffBody, UpdateStaffBody, GetStaffMemberParams, UpdateStaffParams, DeleteStaffParams, ListStaffQueryParams } from "@workspace/api-zod";

const router = Router();

async function enrichStaff(s: typeof staffTable.$inferSelect) {
  let departmentName: string | null = null;
  if (s.departmentId) {
    const [dept] = await db.select({ name: departmentsTable.name }).from(departmentsTable).where(eq(departmentsTable.id, s.departmentId));
    departmentName = dept?.name ?? null;
  }
  return { ...s, salary: s.salary ? parseFloat(s.salary) : null, departmentName, createdAt: s.createdAt.toISOString() };
}

router.get("/staff", async (req, res) => {
  try {
    const params = ListStaffQueryParams.parse(req.query);
    const conditions = [];
    if (params.role) conditions.push(eq(staffTable.role, params.role));
    if (params.departmentId) conditions.push(eq(staffTable.departmentId, params.departmentId));
    if (params.search) conditions.push(ilike(staffTable.name, `%${params.search}%`));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const staff = await db.select().from(staffTable).where(whereClause).orderBy(staffTable.name);
    const enriched = await Promise.all(staff.map(enrichStaff));
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/staff", async (req, res) => {
  try {
    const body = CreateStaffBody.parse(req.body);
    const [member] = await db.insert(staffTable).values({
      name: body.name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      departmentId: body.departmentId,
      qualification: body.qualification,
      joinDate: body.joinDate,
      salary: body.salary?.toString(),
      status: body.status ?? "active",
    }).returning();
    res.status(201).json(await enrichStaff(member));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.get("/staff/:id", async (req, res) => {
  try {
    const { id } = GetStaffMemberParams.parse({ id: parseInt(req.params.id) });
    const [member] = await db.select().from(staffTable).where(eq(staffTable.id, id));
    if (!member) return res.status(404).json({ error: "Not found" });
    res.json(await enrichStaff(member));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/staff/:id", async (req, res) => {
  try {
    const { id } = UpdateStaffParams.parse({ id: parseInt(req.params.id) });
    const body = UpdateStaffBody.parse(req.body);
    const [member] = await db.update(staffTable).set({
      name: body.name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      departmentId: body.departmentId,
      qualification: body.qualification,
      joinDate: body.joinDate,
      salary: body.salary?.toString(),
      status: body.status,
      updatedAt: new Date(),
    }).where(eq(staffTable.id, id)).returning();
    if (!member) return res.status(404).json({ error: "Not found" });
    res.json(await enrichStaff(member));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/staff/:id", async (req, res) => {
  try {
    const { id } = DeleteStaffParams.parse({ id: parseInt(req.params.id) });
    await db.delete(staffTable).where(eq(staffTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
