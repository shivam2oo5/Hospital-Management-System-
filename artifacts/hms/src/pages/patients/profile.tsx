import { useGetPatient, useGetPatientTimeline, useListAppointments, useListAdmissions, useListInvoices, useListMedicalRecords, getGetPatientQueryKey, getListAppointmentsQueryKey, getListAdmissionsQueryKey, getListMedicalRecordsQueryKey, getListInvoicesQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Phone, Mail, MapPin, Droplet, AlertTriangle, Calendar, 
  Clock, FileText, Activity, Pill, CreditCard, ChevronLeft, Bed
} from "lucide-react";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

export default function PatientProfile() {
  const params = useParams();
  const patientId = parseInt(params.id || "0", 10);

  const { data: patient, isLoading: patientLoading } = useGetPatient(patientId, { query: { enabled: !!patientId, queryKey: getGetPatientQueryKey(patientId) }});
  
  const { data: appointments, isLoading: apptsLoading } = useListAppointments({ patientId }, { query: { enabled: !!patientId, queryKey: getListAppointmentsQueryKey({ patientId }) }});
  const { data: admissions, isLoading: admsLoading } = useListAdmissions({ patientId }, { query: { enabled: !!patientId, queryKey: getListAdmissionsQueryKey({ patientId }) }});
  const { data: records, isLoading: recsLoading } = useListMedicalRecords({ patientId }, { query: { enabled: !!patientId, queryKey: getListMedicalRecordsQueryKey({ patientId }) }});
  const { data: invoices, isLoading: invsLoading } = useListInvoices({ patientId }, { query: { enabled: !!patientId, queryKey: getListInvoicesQueryKey({ patientId }) }});

  if (patientLoading) return <PatientProfileSkeleton />;

  if (!patient) return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
      <h2 className="text-2xl font-bold text-destructive">Patient Not Found</h2>
      <p className="text-muted-foreground mt-2 mb-4">The requested patient record could not be located.</p>
      <Link href="/patients" className="text-primary hover:underline flex items-center">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Registry
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/patients" className="p-2 border rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
              <Badge variant={patient.status === 'active' ? 'success' : 'secondary'}>{patient.status}</Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm">{patient.patientId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit Profile</Button>
          <Button>Book Appointment</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Demographics & Vitals */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Demographics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1 text-xs">Date of Birth</div>
                  <div className="font-medium">{formatDate(patient.dateOfBirth)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1 text-xs">Gender</div>
                  <div className="font-medium capitalize">{patient.gender}</div>
                </div>
              </div>
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-start gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{patient.phone || '-'}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="break-all">{patient.email || '-'}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{patient.address || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-destructive/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Critical Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <Droplet className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-muted-foreground text-xs">Blood Group</div>
                  <div className="font-bold text-red-600 dark:text-red-400 text-lg">{patient.bloodGroup || 'Unknown'}</div>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="text-muted-foreground text-xs mb-1.5">Allergies</div>
                {patient.allergies ? (
                  <div className="flex flex-wrap gap-1.5">
                    {patient.allergies.split(',').map(a => (
                      <Badge key={a} variant="destructive" className="bg-destructive/10 text-destructive border-transparent rounded-sm text-xs font-medium px-2 py-0.5">{a.trim()}</Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-foreground">No known allergies</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.emergencyContactName ? (
                <div className="space-y-2">
                  <div className="font-medium text-sm">{patient.emergencyContactName}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3 h-3" /> {patient.emergencyContactPhone || '-'}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">Not provided</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Clinical Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6 space-x-6">
              <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Overview</TabsTrigger>
              <TabsTrigger value="records" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Medical Records</TabsTrigger>
              <TabsTrigger value="appointments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Appointments</TabsTrigger>
              <TabsTrigger value="billing" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 outline-none">
              {/* Active Admission Banner */}
              {admsLoading ? <Skeleton className="h-20 w-full" /> : 
               admissions?.admissions?.find(a => a.status === 'active') && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-4">
                  <div className="bg-background rounded-full p-2 text-primary mt-1">
                    <Bed className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">Currently Admitted</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {admissions.admissions.find(a => a.status === 'active')?.wardName} - Bed {admissions.admissions.find(a => a.status === 'active')?.bedNumber}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Admitted: {formatDate(admissions.admissions.find(a => a.status === 'active')?.admittedAt)}
                    </p>
                  </div>
                </div>
              )}

              {/* Recent Encounters */}
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    Recent Encounters
                    <Button variant="link" size="sm" className="h-auto p-0" onClick={() => document.querySelector<HTMLButtonElement>('[value="records"]')?.click()}>View All</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recsLoading ? (
                    <div className="space-y-4"><Skeleton className="h-16 w-full"/><Skeleton className="h-16 w-full"/></div>
                  ) : records?.records && records.records.length > 0 ? (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                      {records.records.slice(0, 3).map((record) => (
                        <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border border-background bg-muted shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <FileText className="w-3 h-3 text-primary" />
                          </div>
                          <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-sm">Consultation</span>
                              <time className="text-xs font-mono text-muted-foreground">{formatDate(record.visitDate)}</time>
                            </div>
                            <div className="text-sm text-foreground line-clamp-1">{record.diagnosis || record.chiefComplaint}</div>
                            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <User className="w-3 h-3" /> Dr. {record.doctorName}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-md">No clinical records found.</div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Appointments */}
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {apptsLoading ? (
                    <div className="space-y-2"><Skeleton className="h-12 w-full"/></div>
                  ) : appointments?.appointments && appointments.appointments.filter(a => a.status === 'scheduled').length > 0 ? (
                    <div className="space-y-3">
                      {appointments.appointments.filter(a => a.status === 'scheduled').slice(0, 2).map((appt) => (
                        <div key={appt.id} className="flex items-center justify-between p-3 border rounded-md bg-card">
                          <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-2 rounded text-primary">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Dr. {appt.doctorName}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{appt.type}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{formatDate(appt.appointmentDate)}</div>
                            <div className="text-xs text-muted-foreground">{appt.appointmentTime}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-md">No upcoming appointments.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="records" className="space-y-4 outline-none">
               {recsLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : records?.records && records.records.length > 0 ? (
                  <div className="space-y-4">
                    {records.records.map((record) => (
                      <Card key={record.id} className="shadow-sm">
                        <CardHeader className="py-4 border-b bg-muted/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{formatDate(record.visitDate)}</span>
                            </div>
                            <Badge variant="outline">Dr. {record.doctorName}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-4 space-y-4 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold block mb-1">Chief Complaint</span>
                            <p>{record.chiefComplaint || '-'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold block mb-1">Diagnosis</span>
                            <p className="font-medium">{record.diagnosis || '-'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold block mb-1">Treatment / Prescription</span>
                            <p>{record.prescription || '-'}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed"><CardContent className="py-10 text-center text-muted-foreground">No medical records available for this patient.</CardContent></Card>
                )}
            </TabsContent>

            {/* Other tabs would follow similar patterns */}
            <TabsContent value="appointments" className="outline-none">
               <Card className="border-dashed"><CardContent className="py-10 text-center text-muted-foreground">Appointment history view</CardContent></Card>
            </TabsContent>
            
            <TabsContent value="billing" className="outline-none">
               <Card className="border-dashed"><CardContent className="py-10 text-center text-muted-foreground">Billing history and invoices</CardContent></Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}

function PatientProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-md" />
          <div>
            <Skeleton className="w-48 h-8 mb-2" />
            <Skeleton className="w-24 h-4" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-[600px] w-full md:col-span-2" />
      </div>
    </div>
  )
}
