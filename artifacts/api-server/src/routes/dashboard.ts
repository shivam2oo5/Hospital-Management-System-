import { Router } from "express";
import { db } from "@workspace/db";
import { patientsTable, doctorsTable, appointmentsTable, admissionsTable, invoicesTable, bedsTable, labOrdersTable, medicinesTable, activitiesTable } from "@workspace/db";
import { sql, count, sum, eq, lt } from "drizzle-orm";

const router = Router();

router.get("/dashboard/stats", async (req, res) => {
  try {
    const [totalPatients] = await db.select({ count: count() }).from(patientsTable);
    const [totalDoctors] = await db.select({ count: count() }).from(doctorsTable).where(eq(doctorsTable.status, "active"));
    const [totalAppointments] = await db.select({ count: count() }).from(appointmentsTable);
    const [activeAdmissions] = await db.select({ count: count() }).from(admissionsTable).where(eq(admissionsTable.status, "active"));
    const [totalAdmissions] = await db.select({ count: count() }).from(admissionsTable);
    const [availableBeds] = await db.select({ count: count() }).from(bedsTable).where(eq(bedsTable.status, "available"));
    const [totalBeds] = await db.select({ count: count() }).from(bedsTable);
    const [labOrders] = await db.select({ count: count() }).from(labOrdersTable);
    const [pendingLabOrders] = await db.select({ count: count() }).from(labOrdersTable).where(eq(labOrdersTable.status, "ordered"));
    const [lowStockMedicines] = await db.select({ count: count() }).from(medicinesTable).where(sql`${medicinesTable.stockQuantity} <= ${medicinesTable.reorderLevel}`);
    const [pendingBills] = await db.select({ count: count() }).from(invoicesTable).where(eq(invoicesTable.status, "pending"));

    const today = new Date().toISOString().split("T")[0];
    const [todayAppointments] = await db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.appointmentDate, today));

    const revenueResult = await db.select({ total: sum(invoicesTable.paidAmount) }).from(invoicesTable);
    const monthlyRevenueResult = await db.select({ total: sum(invoicesTable.paidAmount) }).from(invoicesTable);

    res.json({
      totalPatients: totalPatients.count,
      totalDoctors: totalDoctors.count,
      totalAppointments: totalAppointments.count,
      todayAppointments: todayAppointments.count,
      totalAdmissions: totalAdmissions.count,
      activeAdmissions: activeAdmissions.count,
      revenue: parseFloat(revenueResult[0]?.total ?? "0"),
      monthlyRevenue: parseFloat(monthlyRevenueResult[0]?.total ?? "0"),
      pendingBills: pendingBills.count,
      availableBeds: availableBeds.count,
      totalBeds: totalBeds.count,
      labOrders: labOrders.count,
      pendingLabOrders: pendingLabOrders.count,
      lowStockMedicines: lowStockMedicines.count,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/revenue-chart", async (req, res) => {
  try {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = months.map((month, i) => ({
      month,
      revenue: Math.round(50000 + Math.random() * 100000),
      expenses: Math.round(30000 + Math.random() * 60000),
    }));
    res.json(data);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/recent-activities", async (req, res) => {
  try {
    const activities = await db
      .select()
      .from(activitiesTable)
      .orderBy(sql`${activitiesTable.createdAt} desc`)
      .limit(20);
    res.json(activities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/appointment-stats", async (req, res) => {
  try {
    const statuses = ["scheduled", "completed", "cancelled", "no-show"] as const;
    const counts: Record<string, number> = {};
    for (const s of statuses) {
      const [r] = await db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.status, s));
      counts[s] = r.count;
    }
    res.json({
      scheduled: counts["scheduled"] ?? 0,
      completed: counts["completed"] ?? 0,
      cancelled: counts["cancelled"] ?? 0,
      noShow: counts["no-show"] ?? 0,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
