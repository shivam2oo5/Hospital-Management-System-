import { useListInvoices } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, CreditCard } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function Billing() {
  const { data, isLoading } = useListInvoices();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Invoices</h1>
          <p className="text-muted-foreground">Manage patient accounts and payments.</p>
        </div>
        <Link href="/billing/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Link>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search invoice number or patient..." className="pl-9 bg-muted/50" />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Invoice / Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : data?.invoices && data.invoices.length > 0 ? (
                data.invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div className="font-mono font-medium text-sm">{inv.invoiceNumber}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{formatDate(inv.createdAt)}</div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/patients/${inv.patientId}`} className="font-semibold hover:underline">
                        {inv.patientName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{formatCurrency(inv.total)}</div>
                      {inv.paidAmount && inv.paidAmount > 0 ? (
                        <div className="text-xs text-green-600">Paid: {formatCurrency(inv.paidAmount)}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        inv.status === 'paid' ? 'success' : 
                        inv.status === 'overdue' ? 'destructive' : 'warning'
                      } className="capitalize">
                        {inv.status.replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.status !== 'paid' && (
                        <Button size="sm" variant="outline" className="mr-2">Record Payment</Button>
                      )}
                      <Button size="sm" variant="ghost">View</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No invoices found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
