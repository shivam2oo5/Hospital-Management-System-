import { Router } from "express";
import { db, appointmentsTable, patientsTable, doctorsTable, departmentsTable, activitiesTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import {
  CreateAppointmentBody, UpdateAppointmentBody, GetAppointmentParams, UpdateAppointmentParams,
  DeleteAppointmentParams, ListAppointmentsQueryParams, UpdateAppointmentStatusParams, UpdateAppointmentStatusBody
} from "@workspace/api-zod";

const router = Router();

async function enrichAppointment(a: typeof appointmentsTable.$inferSelect) {
  const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, a.patientId));
  const [doctor] = await db.select({ name: doctorsTable.name, departmentId: doctorsTable.departmentId }).from(doctorsTable).where(eq(doctorsTable.id, a.doctorId));
  let departmentName: string | null = null;
  if (doctor?.departmentId) {
    const [dept] = await db.select({ name: departmentsTable.name }).from(departmentsTable).where(eq(departmentsTable.id, doctor.departmentId));
    departmentName = dept?.name ?? null;
  }
  return { ...a, patientName: patient?.name ?? null, doctorName: doctor?.name ?? null, departmentName, createdAt: a.createdAt.toISOString() };
}

router.get("/appointments", async (req, res) => {
  try {
    const params = ListAppointmentsQueryParams.parse(req.query);
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    const conditions = [];
    if (params.status) conditions.push(eq(appointmentsTable.status, params.status));
    if (params.doctorId) conditions.push(eq(appointmentsTable.doctorId, params.doctorId));
    if (params.patientId) conditions.push(eq(appointmentsTable.patientId, params.patientId));
    if (params.date) conditions.push(eq(appointmentsTable.appointmentDate, params.date));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const appointments = await db.select().from(appointmentsTable).where(whereClause).orderBy(desc(appointmentsTable.createdAt)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: count() }).from(appointmentsTable).where(whereClause);
    const enriched = await Promise.all(appointments.map(enrichAppointment));
    res.json({ appointments: enriched, total });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/appointments", async (req, res) => {
  try {
    const body = CreateAppointmentBody.parse(req.body);
    const [countResult] = await db.select({ cnt: count() }).from(appointmentsTable).where(eq(appointmentsTable.appointmentDate, body.appointmentDate));
    const [appointment] = await db.insert(appointmentsTable).values({
      patientId: body.patientId,
      doctorId: body.doctorId,
      appointmentDate: body.appointmentDate,
      appointmentTime: body.appointmentTime,
      status: body.status ?? "scheduled",
      type: body.type,
      reason: body.reason,
      notes: body.notes,
      tokenNumber: countResult.cnt + 1,
    }).returning();

    const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, body.patientId));
    const [doctor] = await db.select({ name: doctorsTable.name }).from(doctorsTable).where(eq(doctorsTable.id, body.doctorId));
    await db.insert(activitiesTable).values({
      type: "appointment_booked",
      description: `Appointment booked for ${patient?.name ?? "patient"} with Dr. ${doctor?.name ?? "doctor"}`,
      patientName: patient?.name ?? null,
      doctorName: doctor?.name ?? null,
      referenceId: appointment.id,
      referenceType: "appointment",
    });

    res.status(201).json(await enrichAppointment(appointment));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.get("/appointments/:id", async (req, res) => {
  try {
    const { id } = GetAppointmentParams.parse({ id: parseInt(req.params.id) });
    const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
    if (!appt) return res.status(404).json({ error: "Not found" });
    res.json(await enrichAppointment(appt));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/appointments/:id", async (req, res) => {
  try {
    const { id } = UpdateAppointmentParams.parse({ id: parseInt(req.params.id) });
    const body = UpdateAppointmentBody.parse(req.body);
    const [appt] = await db.update(appointmentsTable).set({
      patientId: body.patientId,
      doctorId: body.doctorId,
      appointmentDate: body.appointmentDate,
      appointmentTime: body.appointmentTime,
      status: body.status,
      type: body.type,
      reason: body.reason,
      notes: body.notes,
      updatedAt: new Date(),
    }).where(eq(appointmentsTable.id, id)).returning();
    if (!appt) return res.status(404).json({ error: "Not found" });
    res.json(await enrichAppointment(appt));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/appointments/:id", async (req, res) => {
  try {
    const { id } = DeleteAppointmentParams.parse({ id: parseInt(req.params.id) });
    await db.delete(appointmentsTable).where(eq(appointmentsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/appointments/:id/status", async (req, res) => {
  try {
    const { id } = UpdateAppointmentStatusParams.parse({ id: parseInt(req.params.id) });
    const body = UpdateAppointmentStatusBody.parse(req.body);
    const [appt] = await db.update(appointmentsTable).set({ status: body.status, notes: body.notes, updatedAt: new Date() }).where(eq(appointmentsTable.id, id)).returning();
    if (!appt) return res.status(404).json({ error: "Not found" });
    res.json(await enrichAppointment(appt));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

export default router;
