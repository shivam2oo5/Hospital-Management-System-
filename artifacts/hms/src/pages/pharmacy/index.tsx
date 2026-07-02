import { useListMedicines, useGetMedicineStats } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, Pill, Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Pharmacy() {
  const { data: stats, isLoading: statsLoading } = useGetMedicineStats();
  const { data: medicinesData, isLoading } = useListMedicines();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pharmacy & Inventory</h1>
          <p className="text-muted-foreground">Manage medicine stock and pricing.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Add Medicine
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Inventory Items</p>
              <Pill className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono">{statsLoading ? <Skeleton className="w-16 h-8"/> : stats?.totalMedicines}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-destructive/20 relative overflow-hidden">
          {stats?.lowStockCount ? <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" /> : null}
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Low Stock Alerts</p>
              <AlertTriangle className={`w-4 h-4 ${stats?.lowStockCount ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </div>
            <div className="text-2xl font-bold font-mono">{statsLoading ? <Skeleton className="w-16 h-8"/> : stats?.lowStockCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Value</p>
            </div>
            <div className="text-2xl font-bold font-mono">{statsLoading ? <Skeleton className="w-24 h-8"/> : formatCurrency(stats?.totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search medicine, generic name, or category..." className="pl-9 bg-muted/50" />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Medicine</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock / Unit</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : medicinesData && medicinesData.length > 0 ? (
                medicinesData.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell>
                      <div className="font-semibold">{med.name}</div>
                      <div className="text-xs text-muted-foreground">{med.genericName}</div>
                    </TableCell>
                    <TableCell className="text-sm">{med.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{med.stockQuantity}</span>
                        <span className="text-xs text-muted-foreground">{med.unit}</span>
                      </div>
                      {med.reorderLevel && med.stockQuantity <= med.reorderLevel && (
                        <Badge variant="warning" className="mt-1 text-[10px] px-1 py-0 h-4">Low Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{formatCurrency(med.price)}</TableCell>
                    <TableCell className="text-sm">
                      {med.expiryDate ? formatDate(med.expiryDate) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No medicines found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
