import { useGetDoctor, useListAppointments, getGetDoctorQueryKey, getListAppointmentsQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, Mail, MapPin, Calendar, Clock, ChevronLeft, Stethoscope, Star
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function DoctorProfile() {
  const params = useParams();
  const doctorId = parseInt(params.id || "0", 10);

  const { data: doctor, isLoading: doctorLoading } = useGetDoctor(doctorId, { query: { enabled: !!doctorId, queryKey: getGetDoctorQueryKey(doctorId) }});
  const { data: appointments, isLoading: apptsLoading } = useListAppointments({ doctorId }, { query: { enabled: !!doctorId, queryKey: getListAppointmentsQueryKey({ doctorId }) }});

  if (doctorLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  if (!doctor) return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
      <h2 className="text-2xl font-bold text-destructive">Doctor Not Found</h2>
      <Link href="/doctors" className="text-primary hover:underline flex items-center mt-4">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Directory
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/doctors" className="p-2 border rounded-md hover:bg-muted text-muted-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Doctor Profile</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card className="shadow-sm overflow-hidden border-border/50">
            <div className="h-24 bg-muted border-b relative">
              <div className="absolute -bottom-10 left-6">
                <Avatar className="w-20 h-20 border-4 border-card">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {doctor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <CardContent className="pt-14 pb-6 px-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">Dr. {doctor.name}</h2>
                  <p className="text-muted-foreground font-medium">{doctor.qualification || 'M.D.'}</p>
                </div>
                <Badge variant={doctor.status === 'active' ? 'success' : 'secondary'}>{doctor.status}</Badge>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Stethoscope className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <span className="text-muted-foreground text-xs block">Specialization</span>
                    <span className="font-medium">{doctor.specialization}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <span className="text-muted-foreground text-xs block">Department</span>
                    <span className="font-medium">{doctor.departmentName || 'General'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="break-all">{doctor.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{doctor.phone || '-'}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Consultation Fee</span>
                  <span className="font-semibold text-lg">{formatCurrency(doctor.consultationFee)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="appointments" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6 space-x-6">
              <TabsTrigger value="appointments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Schedule & Appointments</TabsTrigger>
            </TabsList>

            <TabsContent value="appointments" className="space-y-6 outline-none">
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    Upcoming Consultations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {apptsLoading ? (
                    <div className="space-y-2"><Skeleton className="h-12 w-full"/></div>
                  ) : appointments?.appointments && appointments.appointments.filter(a => a.status === 'scheduled').length > 0 ? (
                    <div className="space-y-3">
                      {appointments.appointments.filter(a => a.status === 'scheduled').map((appt) => (
                        <div key={appt.id} className="flex items-center justify-between p-3 border rounded-md bg-card">
                          <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-2 rounded text-primary">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                <Link href={`/patients/${appt.patientId}`} className="hover:underline">{appt.patientName}</Link>
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 capitalize">{appt.type}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{formatDate(appt.appointmentDate)}</div>
                            <div className="text-xs text-muted-foreground flex items-center justify-end gap-1"><Clock className="w-3 h-3"/>{appt.appointmentTime}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-md">No upcoming appointments scheduled.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
