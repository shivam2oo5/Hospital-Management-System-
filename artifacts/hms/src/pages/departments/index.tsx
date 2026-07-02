import { useListDepartments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus, Users } from "lucide-react";

export default function Departments() {
  const { data, isLoading } = useListDepartments();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">Manage hospital clinical departments.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Add Department
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.map((dept) => (
            <Card key={dept.id} className="shadow-sm border-border/50 hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-md text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Building2 className="w-4 h-4" /></div>
                  {dept.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">{dept.description || 'No description provided.'}</p>
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground bg-muted/50 w-max px-2.5 py-1 rounded-full">
                  <Users className="w-3.5 h-3.5 text-primary" /> {dept.doctorCount || 0} Doctors
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
