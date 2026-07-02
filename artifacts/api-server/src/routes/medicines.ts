import { Router } from "express";
import { db, medicinesTable } from "@workspace/db";
import { eq, ilike, lte, and, count, sum, sql } from "drizzle-orm";
import { CreateMedicineBody, UpdateMedicineBody, GetMedicineParams, UpdateMedicineParams, DeleteMedicineParams, ListMedicinesQueryParams } from "@workspace/api-zod";

const router = Router();

function formatMedicine(m: typeof medicinesTable.$inferSelect) {
  return { ...m, price: parseFloat(m.price), createdAt: m.createdAt.toISOString() };
}

router.get("/medicines/stats", async (req, res) => {
  try {
    const [total] = await db.select({ count: count() }).from(medicinesTable);
    const [lowStock] = await db.select({ count: count() }).from(medicinesTable).where(sql`${medicinesTable.stockQuantity} <= ${medicinesTable.reorderLevel} AND ${medicinesTable.stockQuantity} > 0`);
    const [outOfStock] = await db.select({ count: count() }).from(medicinesTable).where(eq(medicinesTable.stockQuantity, 0));
    const today = new Date().toISOString().split("T")[0];
    const [expired] = await db.select({ count: count() }).from(medicinesTable).where(sql`${medicinesTable.expiryDate} IS NOT NULL AND ${medicinesTable.expiryDate} < ${today}`);
    const totalValueResult = await db.select({ val: sum(sql`${medicinesTable.stockQuantity} * ${medicinesTable.price}`) }).from(medicinesTable);
    res.json({
      totalMedicines: total.count,
      lowStockCount: lowStock.count,
      expiredCount: expired.count,
      outOfStockCount: outOfStock.count,
      totalValue: parseFloat(totalValueResult[0]?.val ?? "0"),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/medicines", async (req, res) => {
  try {
    const params = ListMedicinesQueryParams.parse(req.query);
    const conditions = [];
    if (params.search) conditions.push(ilike(medicinesTable.name, `%${params.search}%`));
    if (params.category) conditions.push(eq(medicinesTable.category, params.category));
    if (params.lowStock) conditions.push(sql`${medicinesTable.stockQuantity} <= ${medicinesTable.reorderLevel}`);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const medicines = await db.select().from(medicinesTable).where(whereClause).orderBy(medicinesTable.name);
    res.json(medicines.map(formatMedicine));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/medicines", async (req, res) => {
  try {
    const body = CreateMedicineBody.parse(req.body);
    const [medicine] = await db.insert(medicinesTable).values({
      name: body.name,
      genericName: body.genericName,
      category: body.category,
      unit: body.unit,
      stockQuantity: body.stockQuantity,
      reorderLevel: body.reorderLevel ?? 10,
      price: body.price.toString(),
      manufacturer: body.manufacturer,
      expiryDate: body.expiryDate,
      batchNumber: body.batchNumber,
      status: body.status ?? "active",
    }).returning();
    res.status(201).json(formatMedicine(medicine));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.get("/medicines/:id", async (req, res) => {
  try {
    const { id } = GetMedicineParams.parse({ id: parseInt(req.params.id) });
    const [medicine] = await db.select().from(medicinesTable).where(eq(medicinesTable.id, id));
    if (!medicine) return res.status(404).json({ error: "Not found" });
    res.json(formatMedicine(medicine));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/medicines/:id", async (req, res) => {
  try {
    const { id } = UpdateMedicineParams.parse({ id: parseInt(req.params.id) });
    const body = UpdateMedicineBody.parse(req.body);
    const [medicine] = await db.update(medicinesTable).set({
      name: body.name,
      genericName: body.genericName,
      category: body.category,
      unit: body.unit,
      stockQuantity: body.stockQuantity,
      reorderLevel: body.reorderLevel,
      price: body.price?.toString(),
      manufacturer: body.manufacturer,
      expiryDate: body.expiryDate,
      batchNumber: body.batchNumber,
      status: body.status,
      updatedAt: new Date(),
    }).where(eq(medicinesTable.id, id)).returning();
    if (!medicine) return res.status(404).json({ error: "Not found" });
    res.json(formatMedicine(medicine));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/medicines/:id", async (req, res) => {
  try {
    const { id } = DeleteMedicineParams.parse({ id: parseInt(req.params.id) });
    await db.delete(medicinesTable).where(eq(medicinesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
