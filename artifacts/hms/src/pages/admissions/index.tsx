import { useListAdmissions, useDischargePatient } from "@workspace/api-client-react";
import { Link } from "wouter";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Bed, LogOut, FileText } from "lucide-react";
import { useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getListAdmissionsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Admissions() {
  const [status, setStatus] = useState<string>("active");
  const { data, isLoading } = useListAdmissions({ status: status || undefined });
  const dischargePatient = useDischargePatient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDischarge = (id: number) => {
    if (confirm("Are you sure you want to discharge this patient?")) {
      dischargePatient.mutate(
        { id, data: { dischargedAt: new Date().toISOString() } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAdmissionsQueryKey() });
            toast({ title: "Patient Discharged" });
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admissions & Wards</h1>
          <p className="text-muted-foreground">Manage inpatient admissions and bed assignments.</p>
        </div>
        <Link href="/admissions/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          <Plus className="w-4 h-4 mr-2" />
          Admit Patient
        </Link>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search patient name..." className="pl-9 bg-muted/50" />
          </div>
          <div className="flex gap-2">
            <select 
              className="flex h-9 w-full sm:w-[160px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="discharged">Discharged</option>
            </select>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Patient</TableHead>
                <TableHead>Ward & Bed</TableHead>
                <TableHead>Attending Doctor</TableHead>
                <TableHead>Admission Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : data?.admissions && data.admissions.length > 0 ? (
                data.admissions.map((adm) => (
                  <TableRow key={adm.id}>
                    <TableCell>
                      <div className="font-semibold text-foreground">{adm.patientName}</div>
                      <Link href={`/patients/${adm.patientId}`} className="text-xs text-primary hover:underline">View Profile</Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-muted p-1.5 rounded"><Bed className="w-3.5 h-3.5 text-muted-foreground" /></div>
                        <div>
                          <div className="font-medium text-sm">{adm.wardName}</div>
                          <div className="text-xs text-muted-foreground">Bed: {adm.bedNumber}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">Dr. {adm.doctorName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDateTime(adm.admittedAt)}</div>
                      {adm.dischargedAt && <div className="text-xs text-muted-foreground mt-0.5">Disch: {formatDateTime(adm.dischargedAt)}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={adm.status === 'active' ? 'success' : 'secondary'}>
                        {adm.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {adm.status === 'active' ? (
                        <Button variant="outline" size="sm" onClick={() => handleDischarge(adm.id)}>
                          <LogOut className="w-3.5 h-3.5 mr-1.5" /> Discharge
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>
                          <FileText className="w-3.5 h-3.5 mr-1.5" /> Summary
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No admissions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
