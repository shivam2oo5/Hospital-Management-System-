import { useListStaff } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Staff() {
  const { data, isLoading } = useListStaff();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hospital Staff</h1>
          <p className="text-muted-foreground">Manage administrative and clinical support staff.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Add Staff Member
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search staff..." className="pl-9 bg-muted/50" />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : data && data.length > 0 ? (
                data.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-muted text-xs font-semibold">{staff.name.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="font-semibold">{staff.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-sm">{staff.role.replace('-', ' ')}</TableCell>
                    <TableCell className="text-sm">
                      <div>{staff.email}</div>
                      <div className="text-xs text-muted-foreground">{staff.phone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={staff.status === 'active' ? 'success' : 'secondary'}>{staff.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No staff found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
