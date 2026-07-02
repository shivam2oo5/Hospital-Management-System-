import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useCreateDoctor, useListDepartments } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListDoctorsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ChevronLeft, Save } from "lucide-react";
import { Link } from "wouter";

const doctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  specialization: z.string().min(2, "Specialization is required"),
  qualification: z.string().optional(),
  departmentId: z.coerce.number().min(1, "Department is required"),
  consultationFee: z.coerce.number().min(0, "Fee must be positive"),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

export default function NewDoctor() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createDoctor = useCreateDoctor();
  const { data: departments } = useListDepartments();

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      specialization: "",
      qualification: "",
      departmentId: 0,
      consultationFee: 150,
    },
  });

  const onSubmit = (data: DoctorFormValues) => {
    createDoctor.mutate(
      { data },
      {
        onSuccess: (newDoctor) => {
          queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
          toast({
            title: "Doctor Added",
            description: `Dr. ${newDoctor.name} has been successfully added to the directory.`,
          });
          setLocation(`/doctors`);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to add doctor. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/doctors" className="p-2 border rounded-md hover:bg-muted text-muted-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Doctor</h1>
          <p className="text-muted-foreground">Add a new medical professional to the system.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4 border-b bg-muted/10">
              <CardTitle className="text-lg">Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane.doe@hospital.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualifications</FormLabel>
                    <FormControl>
                      <Input placeholder="M.D., FACC, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialization *</FormLabel>
                    <FormControl>
                      <Input placeholder="Cardiology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(parseInt(val, 10))} 
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments?.map(dept => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="consultationFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consultation Fee ($) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/doctors")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDoctor.isPending} className="px-8">
              {createDoctor.isPending ? "Adding..." : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Add Doctor
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
