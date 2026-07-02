import { useListPatients } from "@workspace/api-client-react";
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
import { Search, Plus, SlidersHorizontal, FileText, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDate } from "@/lib/utils";

export default function Patients() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useListPatients({ 
    search: debouncedSearch || undefined, 
    status: status || undefined 
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Registry</h1>
          <p className="text-muted-foreground">Manage and view all registered patients.</p>
        </div>
        <Link href="/patients/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          <Plus className="w-4 h-4 mr-2" />
          New Patient
        </Link>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, phone..."
              className="pl-9 bg-muted/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
              <option value="inactive">Inactive</option>
            </select>
            <Button variant="outline" size="icon" className="shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[120px]">Patient ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Demographics</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.patients && data.patients.length > 0 ? (
                data.patients.map((patient) => (
                  <TableRow key={patient.id} className="group cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => window.location.href = `/patients/${patient.id}`}>
                    <TableCell className="font-mono text-xs font-medium text-muted-foreground">
                      {patient.patientId}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{patient.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Reg: {formatDate(patient.createdAt)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{patient.gender}, {calculateAge(patient.dateOfBirth)} yrs</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Blood: {patient.bloodGroup || 'Unknown'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{patient.phone || '-'}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">{patient.email || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.status === 'active' ? 'success' : patient.status === 'discharged' ? 'secondary' : 'outline'}>
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No patients found matching your search.
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

function calculateAge(dateOfBirth: string | null | undefined): string {
  if (!dateOfBirth) return "-";
  const dob = new Date(dateOfBirth);
  const diffMs = Date.now() - dob.getTime();
  const ageDt = new Date(diffMs); 
  return Math.abs(ageDt.getUTCFullYear() - 1970).toString();
}
