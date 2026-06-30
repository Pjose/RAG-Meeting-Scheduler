import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetPerson,
  useCreatePerson,
  useUpdatePerson,
  getGetPersonQueryKey,
  getListPeopleQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PERSON_ROLES, GENDERS, formatTime } from "@/lib/constants";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  gender: z.string().optional(),
  soberDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminPersonEdit() {
  const [matchEdit, paramsEdit] = useRoute("/admin/people/:id");
  const [matchNew] = useRoute("/admin/people/new");
  const isNew = matchNew || (matchEdit && paramsEdit.id === "new");
  const id = matchEdit && paramsEdit.id !== "new" ? parseInt(paramsEdit.id, 10) : 0;

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: person, isLoading } = useGetPerson(id, {
    query: { enabled: !!id && !isNew, queryKey: getGetPersonQueryKey(id) },
  });

  const createMutation = useCreatePerson();
  const updateMutation = useUpdatePerson();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", role: "", phone: "", email: "", gender: "", soberDate: "" },
  });

  useEffect(() => {
    if (person && !isNew) {
      form.reset({
        name: person.name,
        role: person.role,
        phone: person.phone ?? "",
        email: person.email ?? "",
        gender: (person as any).gender ?? "",
        soberDate: (person as any).soberDate ?? "",
      });
    }
  }, [person, isNew]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      role: values.role,
      phone: values.phone || undefined,
      email: values.email || undefined,
      gender: values.gender || undefined,
      soberDate: values.soberDate || undefined,
    } as any;

    if (isNew) {
      await createMutation.mutateAsync({ data: payload });
      queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
      toast({ title: "Person added" });
      setLocation("/admin/people");
    } else {
      await updateMutation.mutateAsync({ id, data: payload });
      queryClient.invalidateQueries({ queryKey: getGetPersonQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
      toast({ title: "Person saved" });
    }
  };

  if (!isNew && isLoading) {
    return (
      <AdminLayout>
        <div className="max-w-lg space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </AdminLayout>
    );
  }

  const meetings = (person as any)?.meetings ?? [];
  const hiMeetings = (person as any)?.hiMeetings ?? [];
  const trustedServants = (person as any)?.trustedServants ?? [];

  return (
    <AdminLayout>
      <div className="max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation("/admin/people")} data-testid="back-btn">
            <ArrowLeft size={15} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold font-serif text-foreground">{isNew ? "Add Person" : "Edit Person"}</h1>
            {!isNew && person && <p className="text-sm text-muted-foreground">{person.name}</p>}
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" data-testid="person-form">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Full name or anonymous identifier" data-testid="input-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {PERSON_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Not specified</SelectItem>
                        {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" placeholder="(555) 000-0000" data-testid="input-phone" />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="name@example.com" data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="soberDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sober Date <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input {...field} type="date" data-testid="input-sober-date" />
                  </FormControl>
                </FormItem>
              )} />

              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full"
                data-testid="submit-person"
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : isNew ? "Add Person" : "Save Changes"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Assigned Meetings */}
        {!isNew && meetings.length > 0 && (
          <div className="mt-6 bg-card border border-card-border rounded-xl p-5">
            <h2 className="font-semibold text-sm text-foreground mb-3">Assigned Meetings</h2>
            <div className="space-y-2">
              {meetings.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-foreground">{m.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {m.day} {formatTime(m.startTime)}
                      {m.assignedRole && <> · <span className="italic">{m.assignedRole}</span></>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assigned H&I Meetings */}
        {!isNew && hiMeetings.length > 0 && (
          <div className="mt-4 bg-card border border-card-border rounded-xl p-5">
            <h2 className="font-semibold text-sm text-foreground mb-3">H&amp;I Commitments</h2>
            <div className="space-y-2">
              {hiMeetings.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-foreground">{m.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {m.day} {formatTime(m.startTime)}
                      {m.assignedRole && <> · <span className="italic">{m.assignedRole}</span></>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trusted Servant Positions */}
        {!isNew && trustedServants.length > 0 && (
          <div className="mt-4 bg-card border border-card-border rounded-xl p-5">
            <h2 className="font-semibold text-sm text-foreground mb-3">Trusted Servant Positions</h2>
            <div className="space-y-2">
              {trustedServants.map((ts: any) => (
                <div key={ts.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 mt-1.5" style={{ background: "#c49a3c" }} />
                  <div>
                    <span className="text-sm font-medium text-foreground">{ts.title}</span>
                    {ts.termLength && <span className="text-xs text-muted-foreground ml-2">· {ts.termLength}</span>}
                    {ts.startDate && <span className="text-xs text-muted-foreground ml-2">· started {ts.startDate}</span>}
                    {ts.description && <p className="text-xs text-muted-foreground mt-0.5">{ts.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
