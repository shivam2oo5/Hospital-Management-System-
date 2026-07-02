import { useListAppointments, useUpdateAppointmentStatus } from "@workspace/api-client-react";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, MoreVertical } from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { getListAppointmentsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Appointments() {
  const [status, setStatus] = useState<string>("");
  const { data, isLoading } = useListAppointments({ status: status || undefined });
  
  const updateStatus = useUpdateAppointmentStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusUpdate = (id: number, newStatus: string) => {
    updateStatus.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
          toast({ title: "Status Updated", description: `Appointment marked as ${newStatus}.` });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">Manage patient consultations and schedules.</p>
        </div>
        <Link href="/appointments/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          <Plus className="w-4 h-4 mr-2" />
          Book Appointment
        </Link>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search patient or doctor..." className="pl-9 bg-muted/50" />
          </div>
          <div className="flex gap-2">
            <select 
              className="flex h-9 w-full sm:w-[160px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.appointments && data.appointments.length > 0 ? (
                data.appointments.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell>
                      <div className="font-semibold text-foreground">{appt.patientName}</div>
                      <Link href={`/patients/${appt.patientId}`} className="text-xs text-primary hover:underline">View Profile</Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">Dr. {appt.doctorName}</div>
                      <div className="text-xs text-muted-foreground">{appt.departmentName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" /> {formatDate(appt.appointmentDate)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3.5 h-3.5" /> {appt.appointmentTime}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">{appt.type}</span>
                      {appt.tokenNumber && <div className="text-xs text-muted-foreground font-mono mt-0.5">Token: #{appt.tokenNumber}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        appt.status === 'scheduled' ? 'warning' : 
                        appt.status === 'completed' ? 'success' : 
                        appt.status === 'cancelled' ? 'destructive' : 'secondary'
                      } className="capitalize">
                        {appt.status.replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {appt.status === 'scheduled' ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusUpdate(appt.id, 'completed')}>
                              <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Mark Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(appt.id, 'cancelled')}>
                              <XCircle className="w-4 h-4 mr-2 text-red-500" /> Cancel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(appt.id, 'no-show')}>
                              <XCircle className="w-4 h-4 mr-2 text-amber-500" /> No Show
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>Processed</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No appointments found.
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
