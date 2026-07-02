import { useListDoctors } from "@workspace/api-client-react";
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
import { Search, Plus, SlidersHorizontal, Stethoscope, ChevronRight, MapPin, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Doctors() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { data: doctors, isLoading } = useListDoctors({ 
    search: debouncedSearch || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Doctor Directory</h1>
          <p className="text-muted-foreground">Manage hospital medical staff and specialists.</p>
        </div>
        <Link href="/doctors/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          <Plus className="w-4 h-4 mr-2" />
          Add Doctor
        </Link>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, specialization, or department..."
              className="pl-9 bg-muted/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="shrink-0 w-full sm:w-auto">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Doctor</TableHead>
                <TableHead>Specialization & Dept</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Consultation Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : doctors && doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <TableRow key={doctor.id} className="group cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => window.location.href = `/doctors/${doctor.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {doctor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-foreground">Dr. {doctor.name}</div>
                          <div className="text-xs text-muted-foreground">{doctor.qualification || 'M.D.'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{doctor.specialization}</div>
                      <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                        <MapPin className="w-3 h-3 mr-1" /> {doctor.departmentName || 'Unassigned'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm flex items-center gap-1.5"><Mail className="w-3 h-3 text-muted-foreground" /> {doctor.email}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1"><Phone className="w-3 h-3 text-muted-foreground" /> {doctor.phone || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(doctor.consultationFee)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={doctor.status === 'active' ? 'success' : doctor.status === 'on-leave' ? 'warning' : 'secondary'}>
                        {doctor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Stethoscope className="h-4 w-4" />
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
                    No doctors found matching your criteria.
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
