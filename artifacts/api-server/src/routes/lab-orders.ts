import { Router } from "express";
import { db, labOrdersTable, patientsTable, doctorsTable, activitiesTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { CreateLabOrderBody, GetLabOrderParams, UpdateLabOrderStatusParams, UpdateLabOrderStatusBody, ListLabOrdersQueryParams } from "@workspace/api-zod";

const router = Router();

async function enrichLabOrder(l: typeof labOrdersTable.$inferSelect) {
  const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, l.patientId));
  const [doctor] = await db.select({ name: doctorsTable.name }).from(doctorsTable).where(eq(doctorsTable.id, l.doctorId));
  return { ...l, patientName: patient?.name ?? null, doctorName: doctor?.name ?? null, createdAt: l.createdAt.toISOString() };
}

router.get("/lab-orders", async (req, res) => {
  try {
    const params = ListLabOrdersQueryParams.parse(req.query);
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    const conditions = [];
    if (params.status) conditions.push(eq(labOrdersTable.status, params.status));
    if (params.patientId) conditions.push(eq(labOrdersTable.patientId, params.patientId));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const orders = await db.select().from(labOrdersTable).where(whereClause).orderBy(desc(labOrdersTable.createdAt)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: count() }).from(labOrdersTable).where(whereClause);
    const enriched = await Promise.all(orders.map(enrichLabOrder));
    res.json({ labOrders: enriched, total });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/lab-orders", async (req, res) => {
  try {
    const body = CreateLabOrderBody.parse(req.body);
    const [order] = await db.insert(labOrdersTable).values({
      patientId: body.patientId,
      doctorId: body.doctorId,
      testName: body.testName,
      testCategory: body.testCategory,
      notes: body.notes,
      orderedAt: body.orderedAt ?? new Date().toISOString(),
      status: "ordered",
    }).returning();

    const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, body.patientId));
    const [doctor] = await db.select({ name: doctorsTable.name }).from(doctorsTable).where(eq(doctorsTable.id, body.doctorId));
    await db.insert(activitiesTable).values({
      type: "lab_order_created",
      description: `Lab order created: ${body.testName} for ${patient?.name ?? "patient"}`,
      patientName: patient?.name ?? null,
      doctorName: doctor?.name ?? null,
      referenceId: order.id,
      referenceType: "lab_order",
    });

    res.status(201).json(await enrichLabOrder(order));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.get("/lab-orders/:id", async (req, res) => {
  try {
    const { id } = GetLabOrderParams.parse({ id: parseInt(req.params.id) });
    const [order] = await db.select().from(labOrdersTable).where(eq(labOrdersTable.id, id));
    if (!order) return res.status(404).json({ error: "Not found" });
    res.json(await enrichLabOrder(order));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/lab-orders/:id/status", async (req, res) => {
  try {
    const { id } = UpdateLabOrderStatusParams.parse({ id: parseInt(req.params.id) });
    const body = UpdateLabOrderStatusBody.parse(req.body);
    const [order] = await db.update(labOrdersTable).set({
      status: body.status,
      result: body.result,
      referenceRange: body.referenceRange,
      notes: body.notes,
      completedAt: body.completedAt,
      updatedAt: new Date(),
    }).where(eq(labOrdersTable.id, id)).returning();
    if (!order) return res.status(404).json({ error: "Not found" });
    res.json(await enrichLabOrder(order));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

export default router;
