import { Router } from "express";
import { db, wardsTable, bedsTable, patientsTable } from "@workspace/db";
import { eq, count, and } from "drizzle-orm";
import { CreateWardBody, CreateBedBody, ListBedsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/wards", async (req, res) => {
  try {
    const wards = await db.select().from(wardsTable).orderBy(wardsTable.name);
    const result = await Promise.all(wards.map(async (w) => {
      const [{ available }] = await db.select({ available: count() }).from(bedsTable).where(and(eq(bedsTable.wardId, w.id), eq(bedsTable.status, "available")));
      return { ...w, availableBeds: available, createdAt: w.createdAt.toISOString() };
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/wards", async (req, res) => {
  try {
    const body = CreateWardBody.parse(req.body);
    const [ward] = await db.insert(wardsTable).values({ name: body.name, type: body.type, totalBeds: body.totalBeds }).returning();
    res.status(201).json({ ...ward, availableBeds: 0, createdAt: ward.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.get("/beds", async (req, res) => {
  try {
    const params = ListBedsQueryParams.parse(req.query);
    const conditions = [];
    if (params.wardId) conditions.push(eq(bedsTable.wardId, params.wardId));
    if (params.status) conditions.push(eq(bedsTable.status, params.status));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const beds = await db.select().from(bedsTable).where(whereClause).orderBy(bedsTable.bedNumber);
    const result = await Promise.all(beds.map(async (b) => {
      const [ward] = await db.select({ name: wardsTable.name }).from(wardsTable).where(eq(wardsTable.id, b.wardId));
      let patientName: string | null = null;
      if (b.patientId) {
        const [p] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, b.patientId));
        patientName = p?.name ?? null;
      }
      return { ...b, wardName: ward?.name ?? null, patientName, createdAt: b.createdAt.toISOString() };
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/beds", async (req, res) => {
  try {
    const body = CreateBedBody.parse(req.body);
    const [bed] = await db.insert(bedsTable).values({ wardId: body.wardId, bedNumber: body.bedNumber, status: body.status ?? "available" }).returning();
    res.status(201).json({ ...bed, wardName: null, patientName: null, createdAt: bed.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.get("/beds/available", async (req, res) => {
  try {
    const wards = await db.select().from(wardsTable);
    const result = await Promise.all(wards.map(async (w) => {
      const [{ total }] = await db.select({ total: count() }).from(bedsTable).where(eq(bedsTable.wardId, w.id));
      const [{ occupied }] = await db.select({ occupied: count() }).from(bedsTable).where(and(eq(bedsTable.wardId, w.id), eq(bedsTable.status, "occupied")));
      return {
        wardId: w.id,
        wardName: w.name,
        wardType: w.type,
        totalBeds: total,
        occupiedBeds: occupied,
        availableBeds: total - occupied,
      };
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
