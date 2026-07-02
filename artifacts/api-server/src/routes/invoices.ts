import { Router } from "express";
import { db, invoicesTable, patientsTable, activitiesTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { CreateInvoiceBody, UpdateInvoiceBody, GetInvoiceParams, UpdateInvoiceParams, ListInvoicesQueryParams, RecordPaymentParams, RecordPaymentBody } from "@workspace/api-zod";

const router = Router();

function formatInvoice(inv: typeof invoicesTable.$inferSelect, patientName?: string | null) {
  return {
    ...inv,
    patientName: patientName ?? null,
    items: inv.items as any[],
    subtotal: parseFloat(inv.subtotal),
    tax: parseFloat(inv.tax),
    discount: parseFloat(inv.discount),
    total: parseFloat(inv.total),
    paidAmount: parseFloat(inv.paidAmount),
    createdAt: inv.createdAt.toISOString(),
  };
}

router.get("/invoices", async (req, res) => {
  try {
    const params = ListInvoicesQueryParams.parse(req.query);
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    const conditions = [];
    if (params.status) conditions.push(eq(invoicesTable.status, params.status));
    if (params.patientId) conditions.push(eq(invoicesTable.patientId, params.patientId));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const invoices = await db.select().from(invoicesTable).where(whereClause).orderBy(desc(invoicesTable.createdAt)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: count() }).from(invoicesTable).where(whereClause);
    const enriched = await Promise.all(invoices.map(async (inv) => {
      const [p] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, inv.patientId));
      return formatInvoice(inv, p?.name);
    }));
    res.json({ invoices: enriched, total });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/invoices", async (req, res) => {
  try {
    const body = CreateInvoiceBody.parse(req.body);
    const [countResult] = await db.select({ cnt: count() }).from(invoicesTable);
    const invoiceNumber = `INV-${String(countResult.cnt + 1).padStart(5, "0")}`;

    const items = body.items as Array<{ description: string; quantity: number; unitPrice: number; itemType: string }>;
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = body.tax ?? 0;
    const discount = body.discount ?? 0;
    const total = subtotal + tax - discount;

    const itemsWithIds = items.map((item, i) => ({
      id: i + 1,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
      itemType: item.itemType,
    }));

    const [invoice] = await db.insert(invoicesTable).values({
      invoiceNumber,
      patientId: body.patientId,
      items: itemsWithIds,
      subtotal: subtotal.toString(),
      tax: tax.toString(),
      discount: discount.toString(),
      total: total.toString(),
      paidAmount: "0",
      status: "pending",
      notes: body.notes,
      dueDate: body.dueDate,
    }).returning();

    const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, body.patientId));
    await db.insert(activitiesTable).values({
      type: "invoice_created",
      description: `Invoice ${invoiceNumber} created for ${patient?.name ?? "patient"} - $${total.toFixed(2)}`,
      patientName: patient?.name ?? null,
      referenceId: invoice.id,
      referenceType: "invoice",
    });

    res.status(201).json(formatInvoice(invoice, patient?.name));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.get("/invoices/:id", async (req, res) => {
  try {
    const { id } = GetInvoiceParams.parse({ id: parseInt(req.params.id) });
    const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
    if (!invoice) return res.status(404).json({ error: "Not found" });
    const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, invoice.patientId));
    res.json(formatInvoice(invoice, patient?.name));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/invoices/:id", async (req, res) => {
  try {
    const { id } = UpdateInvoiceParams.parse({ id: parseInt(req.params.id) });
    const body = UpdateInvoiceBody.parse(req.body);
    const items = (body.items ?? []) as Array<{ description: string; quantity: number; unitPrice: number; itemType: string }>;
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = body.tax ?? 0;
    const discount = body.discount ?? 0;
    const total = subtotal + tax - discount;
    const itemsWithIds = items.map((item, i) => ({ id: i + 1, ...item, totalPrice: item.quantity * item.unitPrice }));

    const [invoice] = await db.update(invoicesTable).set({
      patientId: body.patientId,
      items: itemsWithIds,
      subtotal: subtotal.toString(),
      tax: tax.toString(),
      discount: discount.toString(),
      total: total.toString(),
      notes: body.notes,
      dueDate: body.dueDate,
      updatedAt: new Date(),
    }).where(eq(invoicesTable.id, id)).returning();
    if (!invoice) return res.status(404).json({ error: "Not found" });
    const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, invoice.patientId));
    res.json(formatInvoice(invoice, patient?.name));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.post("/invoices/:id/payment", async (req, res) => {
  try {
    const { id } = RecordPaymentParams.parse({ id: parseInt(req.params.id) });
    const body = RecordPaymentBody.parse(req.body);
    const [current] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
    if (!current) return res.status(404).json({ error: "Not found" });

    const newPaid = parseFloat(current.paidAmount) + body.amount;
    const total = parseFloat(current.total);
    const status = newPaid >= total ? "paid" : "partially-paid";

    const [invoice] = await db.update(invoicesTable).set({
      paidAmount: newPaid.toString(),
      status,
      paymentMethod: body.paymentMethod,
      updatedAt: new Date(),
    }).where(eq(invoicesTable.id, id)).returning();

    const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, invoice.patientId));
    await db.insert(activitiesTable).values({
      type: "payment_received",
      description: `Payment of $${body.amount.toFixed(2)} received for invoice ${current.invoiceNumber}`,
      patientName: patient?.name ?? null,
      referenceId: id,
      referenceType: "invoice",
    });

    res.json(formatInvoice(invoice, patient?.name));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

export default router;
