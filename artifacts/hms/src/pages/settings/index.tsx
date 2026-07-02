import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Manage hospital profile and application preferences.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hospital Profile</CardTitle>
            <CardDescription>This information appears on invoices and reports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hospital Name</Label>
                <Input defaultValue="MedCore Medical Center" />
              </div>
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input defaultValue="REG-2024-9842" />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input defaultValue="admin@medcore.hospital" />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input defaultValue="+1 (800) 555-1234" />
              </div>
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security & Access</CardTitle>
            <CardDescription>Manage your account security.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-sm">
              <Label>Current Password</Label>
              <Input type="password" />
            </div>
            <div className="space-y-2 max-w-sm">
              <Label>New Password</Label>
              <Input type="password" />
            </div>
            <Button variant="outline">Update Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
