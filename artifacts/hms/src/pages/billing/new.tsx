import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useCreateInvoice, useListPatients } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListInvoicesQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronLeft, Plus, Trash2, FileText } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";

const itemSchema = z.object({
  description: z.string().min(1, "Required"),
  quantity: z.coerce.number().min(1, "Min 1"),
  unitPrice: z.coerce.number().min(0, "Invalid price"),
  itemType: z.string().min(1, "Required"),
});

const invoiceSchema = z.object({
  patientId: z.coerce.number().min(1, "Patient is required"),
  items: z.array(itemSchema).min(1, "At least one item is required"),
  tax: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  dueDate: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function NewInvoice() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createInvoice = useCreateInvoice();
  const { data: patientsData } = useListPatients();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      patientId: 0,
      items: [{ description: "", quantity: 1, unitPrice: 0, itemType: "consultation" }],
      tax: 0,
      discount: 0,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 days
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const watchItems = form.watch("items");
  const watchTax = form.watch("tax") || 0;
  const watchDiscount = form.watch("discount") || 0;

  const subtotal = watchItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const total = subtotal + watchTax - watchDiscount;

  const onSubmit = (data: InvoiceFormValues) => {
    createInvoice.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        toast({ title: "Invoice Created", description: "Successfully generated patient invoice." });
        setLocation(`/billing`);
      },
      onError: () => toast({ title: "Error", description: "Could not create invoice.", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/billing" className="p-2 border rounded-md hover:bg-muted text-muted-foreground transition-colors"><ChevronLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Invoice</h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4 border-b bg-muted/10"><CardTitle className="text-lg">Bill To</CardTitle></CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control} name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient *</FormLabel>
                    <Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value ? field.value.toString() : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {patientsData?.patients?.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.patientId})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control} name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-4 border-b bg-muted/10 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Line Items</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <FormField control={form.control} name={`items.${index}.itemType`} render={({ field }) => (
                    <FormItem className="w-full sm:w-[150px]"><FormLabel className={index !== 0 ? "sr-only sm:not-sr-only" : ""}>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="consultation">Consultation</SelectItem>
                          <SelectItem value="lab">Lab Test</SelectItem>
                          <SelectItem value="medicine">Medicine</SelectItem>
                          <SelectItem value="room">Room Charge</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                    <FormItem className="w-full sm:flex-1"><FormLabel className={index !== 0 ? "sr-only sm:not-sr-only" : ""}>Description</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                    <FormItem className="w-full sm:w-[100px]"><FormLabel className={index !== 0 ? "sr-only sm:not-sr-only" : ""}>Qty</FormLabel>
                      <FormControl><Input type="number" min="1" {...field} /></FormControl>
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                    <FormItem className="w-full sm:w-[120px]"><FormLabel className={index !== 0 ? "sr-only sm:not-sr-only" : ""}>Unit Price ($)</FormLabel>
                      <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl>
                    </FormItem>
                  )}/>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="mb-0.5 text-destructive" onClick={() => remove(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ description: "", quantity: 1, unitPrice: 0, itemType: "consultation" })}>
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </CardContent>
            <div className="border-t p-6 bg-muted/5">
              <div className="flex flex-col gap-4 max-w-xs ml-auto">
                <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                <FormField control={form.control} name="tax" render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0"><FormLabel className="text-sm font-normal text-muted-foreground w-1/2">Tax ($)</FormLabel>
                    <FormControl><Input type="number" step="0.01" className="h-8 w-[120px] text-right" {...field} /></FormControl>
                  </FormItem>
                )}/>
                <FormField control={form.control} name="discount" render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0"><FormLabel className="text-sm font-normal text-muted-foreground w-1/2">Discount ($)</FormLabel>
                    <FormControl><Input type="number" step="0.01" className="h-8 w-[120px] text-right" {...field} /></FormControl>
                  </FormItem>
                )}/>
                <div className="flex justify-between items-center pt-4 border-t"><span className="font-semibold">Total</span><span className="font-bold text-lg">{formatCurrency(total)}</span></div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/billing")}>Cancel</Button>
            <Button type="submit" disabled={createInvoice.isPending} className="px-8">
              {createInvoice.isPending ? "Generating..." : <><FileText className="w-4 h-4 mr-2" /> Generate Invoice</>}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
