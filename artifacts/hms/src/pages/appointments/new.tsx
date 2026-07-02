import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useCreateAppointment, useListDoctors, useListPatients } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListAppointmentsQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ChevronLeft, Calendar } from "lucide-react";
import { Link } from "wouter";

const appointmentSchema = z.object({
  patientId: z.coerce.number().min(1, "Patient is required"),
  doctorId: z.coerce.number().min(1, "Doctor is required"),
  appointmentDate: z.string().min(1, "Date is required"),
  appointmentTime: z.string().min(1, "Time is required"),
  type: z.string().min(1, "Appointment type is required"),
  reason: z.string().optional(),
});

type ApptFormValues = z.infer<typeof appointmentSchema>;

export default function NewAppointment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createAppointment = useCreateAppointment();
  
  // In a real app, these might use an autocomplete search rather than loading all
  const { data: doctorsData } = useListDoctors();
  const { data: patientsData } = useListPatients();

  const form = useForm<ApptFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: 0,
      doctorId: 0,
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: "09:00",
      type: "consultation",
      reason: "",
    },
  });

  const onSubmit = (data: ApptFormValues) => {
    createAppointment.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          toast({
            title: "Appointment Booked",
            description: `Appointment successfully scheduled.`,
          });
          setLocation(`/appointments`);
        },
        onError: () => {
          toast({
            title: "Booking Failed",
            description: "Could not schedule appointment. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/appointments" className="p-2 border rounded-md hover:bg-muted text-muted-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Book Appointment</h1>
          <p className="text-muted-foreground">Schedule a new consultation or follow-up.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4 border-b bg-muted/10">
              <CardTitle className="text-lg">Appointment Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Patient *</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(parseInt(val, 10))} 
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patientsData?.patients?.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name} ({p.patientId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Doctor *</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(parseInt(val, 10))} 
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctorsData?.map(d => (
                          <SelectItem key={d.id} value={d.id.toString()}>
                            Dr. {d.name} - {d.specialization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appointmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appointmentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Visit Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="routine-checkup">Routine Checkup</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Reason for Visit</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of symptoms or reason for visit" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/appointments")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAppointment.isPending} className="px-8">
              {createAppointment.isPending ? "Booking..." : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Confirm Booking
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
