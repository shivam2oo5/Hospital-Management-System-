import { useListLabOrders, useUpdateLabOrderStatus } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FlaskConical, Beaker, CheckCircle, RefreshCcw } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getListLabOrdersQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function LabOrders() {
  const { data, isLoading } = useListLabOrders();
  const updateStatus = useUpdateLabOrderStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleUpdate = (id: number, status: string) => {
    updateStatus.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLabOrdersQueryKey() });
        toast({ title: "Status Updated", description: `Lab order is now ${status}.` });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lab Orders</h1>
          <p className="text-muted-foreground">Track test requests and record results.</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tests or patients..." className="pl-9 bg-muted/50" />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Test Details</TableHead>
                <TableHead>Patient / Doctor</TableHead>
                <TableHead>Ordered At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : data?.labOrders && data.labOrders.length > 0 ? (
                data.labOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-semibold flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-primary" />
                        {order.testName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{order.testCategory || 'General'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{order.patientName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Ord: Dr. {order.doctorName}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(order.orderedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        order.status === 'completed' ? 'success' : 
                        order.status === 'processing' ? 'warning' : 'outline'
                      } className="capitalize">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status === 'ordered' && (
                        <Button size="sm" variant="outline" onClick={() => handleUpdate(order.id, 'collected')}>
                          <Beaker className="w-3.5 h-3.5 mr-1.5" /> Collect
                        </Button>
                      )}
                      {order.status === 'collected' && (
                        <Button size="sm" variant="outline" onClick={() => handleUpdate(order.id, 'processing')}>
                          <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> Process
                        </Button>
                      )}
                      {order.status === 'processing' && (
                        <Button size="sm" onClick={() => handleUpdate(order.id, 'completed')}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Results
                        </Button>
                      )}
                      {order.status === 'completed' && (
                        <span className="text-xs text-muted-foreground">Done</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No lab orders found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
