import { useListMedicalRecords } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function MedicalRecords() {
  const { data, isLoading } = useListMedicalRecords();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medical Records</h1>
          <p className="text-muted-foreground">Browse all clinical notes, diagnoses, and treatments.</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search records..." className="pl-9 bg-muted/50" />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : data?.records && data.records.length > 0 ? (
                data.records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{formatDate(record.visitDate)}</TableCell>
                    <TableCell>
                      <Link href={`/patients/${record.patientId}`} className="text-foreground hover:underline font-semibold">
                        {record.patientName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">Dr. {record.doctorName}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-sm">
                      {record.diagnosis || record.chiefComplaint || 'Consultation Note'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/patients/${record.patientId}`} className="inline-flex items-center text-primary text-xs hover:underline">
                        <FileText className="w-3 h-3 mr-1"/> View Full
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No records found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
