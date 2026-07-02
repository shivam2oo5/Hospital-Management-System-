import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useCreateAdmission, useListDoctors, useListPatients, useListWards, useListBeds, getListBedsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListAdmissionsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ChevronLeft, BedDouble } from "lucide-react";
import { Link } from "wouter";

const admissionSchema = z.object({
  patientId: z.coerce.number().min(1, "Patient is required"),
  doctorId: z.coerce.number().min(1, "Attending Doctor is required"),
  wardId: z.coerce.number().min(1, "Ward is required"),
  bedId: z.coerce.number().min(1, "Bed is required"),
  admissionNotes: z.string().optional(),
});

type AdmFormValues = z.infer<typeof admissionSchema>;

export default function NewAdmission() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createAdmission = useCreateAdmission();
  const { data: doctorsData } = useListDoctors();
  const { data: patientsData } = useListPatients();
  const { data: wardsData } = useListWards();
  
  const [selectedWardId, setSelectedWardId] = useState<number | undefined>();
  const { data: bedsData } = useListBeds(
    { wardId: selectedWardId, status: "available" }, 
    { query: { enabled: !!selectedWardId, queryKey: getListBedsQueryKey({ wardId: selectedWardId, status: "available" }) } }
  );

  const form = useForm<AdmFormValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      patientId: 0,
      doctorId: 0,
      wardId: 0,
      bedId: 0,
      admissionNotes: "",
    },
  });

  // Reset bed when ward changes
  useEffect(() => {
    form.setValue("bedId", 0);
  }, [selectedWardId, form]);

  const onSubmit = (data: AdmFormValues) => {
    createAdmission.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdmissionsQueryKey() });
          toast({ title: "Patient Admitted", description: "Admission recorded successfully." });
          setLocation(`/admissions`);
        },
        onError: () => {
          toast({ title: "Error", description: "Could not admit patient.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admissions" className="p-2 border rounded-md hover:bg-muted text-muted-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admit Patient</h1>
          <p className="text-muted-foreground">Assign patient to a ward and bed.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4 border-b bg-muted/10">
              <CardTitle className="text-lg">Admission Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Patient *</FormLabel>
                    <Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value ? field.value.toString() : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {patientsData?.patients?.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.patientId})</SelectItem>
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
                    <FormLabel>Attending Doctor *</FormLabel>
                    <Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value ? field.value.toString() : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {doctorsData?.map(d => (
                          <SelectItem key={d.id} value={d.id.toString()}>Dr. {d.name} - {d.specialization}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wardId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ward *</FormLabel>
                    <Select onValueChange={(val) => {
                      field.onChange(parseInt(val, 10));
                      setSelectedWardId(parseInt(val, 10));
                    }} value={field.value ? field.value.toString() : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select ward" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {wardsData?.map(w => (
                          <SelectItem key={w.id} value={w.id.toString()}>{w.name} ({w.type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bedId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bed *</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(parseInt(val, 10))} 
                      value={field.value ? field.value.toString() : ""}
                      disabled={!selectedWardId || (bedsData && bedsData.length === 0)}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder={!selectedWardId ? "Select ward first" : "Select bed"} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {bedsData?.map(b => (
                          <SelectItem key={b.id} value={b.id.toString()}>{b.bedNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="admissionNotes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Admission Notes / Instructions</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Dietary requirements, monitoring instructions..." className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/admissions")}>Cancel</Button>
            <Button type="submit" disabled={createAdmission.isPending} className="px-8">
              {createAdmission.isPending ? "Processing..." : <><BedDouble className="w-4 h-4 mr-2" /> Admit Patient</>}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
