import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetMeeting,
  useCreateMeeting,
  useUpdateMeeting,
  useListPeople,
  useAssignPersonToMeeting,
  useRemovePersonFromMeeting,
  getGetMeetingQueryKey,
  getListMeetingsQueryKey,
  getListPeopleQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TYPES = ["Open", "Closed", "Beginners", "Step Study", "Big Book Study", "Speaker"];
const FORMATS = ["Discussion", "Book Study", "Speaker", "Call-Up"];
const INTERACTIONS = ["In-Person", "Online", "Hybrid"];
const LANGUAGES = ["English", "Spanish", "French", "Portuguese", "Other"];
const LITERATURE = ["Big Book", "12 & 12", "Grapevine", "Daily Reflections", "None"];
const ROLES = ["Chairperson", "Co-Chairperson", "Secretary", "Treasurer", "GSR", "Intergroup", "PI", "H&I", "Communication", "Unity", "Meeting Co-Chair", "Member", "Alternate GSR", "Alternate Treasurer", "Alternate Intergroup", "Assistant Communication"];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  day: z.string().min(1, "Day is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().optional(),
  link: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  format: z.string().min(1, "Format is required"),
  literature: z.string().optional(),
  interaction: z.string().min(1, "Interaction is required"),
  language: z.string().min(1, "Language is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminMeetingEdit() {
  const [matchEdit, paramsEdit] = useRoute("/admin/meetings/:id");
  const [matchNew] = useRoute("/admin/meetings/new");
  const isNew = matchNew || (matchEdit && paramsEdit.id === "new");
  const id = matchEdit && paramsEdit.id !== "new" ? parseInt(paramsEdit.id, 10) : 0;

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: meeting, isLoading } = useGetMeeting(id, {
    query: { enabled: !!id && !isNew, queryKey: getGetMeetingQueryKey(id) },
  });

  const { data: allPeople } = useListPeople(
    {},
    { query: { enabled: !!id && !isNew, queryKey: getListPeopleQueryKey({}) } }
  );

  const createMutation = useCreateMeeting();
  const updateMutation = useUpdateMeeting();
  const assignMutation = useAssignPersonToMeeting();
  const removeMutation = useRemovePersonFromMeeting();

  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedAssignedRole, setSelectedAssignedRole] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", day: "", startTime: "", endTime: "", location: "", link: "",
      type: "", format: "", literature: "", interaction: "", language: "English", notes: "",
    },
  });

  useEffect(() => {
    if (meeting && !isNew) {
      form.reset({
        name: meeting.name,
        day: meeting.day,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.location ?? "",
        link: meeting.link ?? "",
        type: meeting.type,
        format: meeting.format,
        literature: meeting.literature ?? "",
        interaction: meeting.interaction,
        language: meeting.language,
        notes: meeting.notes ?? "",
      });
    }
  }, [meeting, isNew]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      day: values.day,
      startTime: values.startTime,
      endTime: values.endTime,
      type: values.type,
      format: values.format,
      interaction: values.interaction,
      language: values.language,
      location: values.location || undefined,
      link: values.link || undefined,
      literature: values.literature || undefined,
      notes: values.notes || undefined,
    };

    if (isNew) {
      const created = await createMutation.mutateAsync({ data: payload });
      queryClient.invalidateQueries({ queryKey: getListMeetingsQueryKey() });
      toast({ title: "Meeting created" });
      setLocation(`/admin/meetings/${created.id}`);
    } else {
      await updateMutation.mutateAsync({ id, data: payload });
      queryClient.invalidateQueries({ queryKey: getGetMeetingQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: getListMeetingsQueryKey() });
      toast({ title: "Meeting saved" });
    }
  };

  const handleAssign = async () => {
    if (!selectedPersonId) return;
    await assignMutation.mutateAsync({
      id,
      data: { personId: parseInt(selectedPersonId, 10), assignedRole: selectedAssignedRole || undefined },
    });
    queryClient.invalidateQueries({ queryKey: getGetMeetingQueryKey(id) });
    setSelectedPersonId("");
    setSelectedAssignedRole("");
    toast({ title: "Person assigned" });
  };

  const handleRemove = async (personId: number) => {
    await removeMutation.mutateAsync({ id, personId });
    queryClient.invalidateQueries({ queryKey: getGetMeetingQueryKey(id) });
    toast({ title: "Person removed" });
  };

  const assignedIds = new Set((meeting?.people ?? []).map((p: any) => p.id));
  const availablePeople = (allPeople ?? []).filter((p) => !assignedIds.has(p.id));

  if (!isNew && isLoading) {
    return (
      <AdminLayout>
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation("/admin/meetings")} data-testid="back-btn">
            <ArrowLeft size={15} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold font-serif text-foreground">{isNew ? "New Meeting" : "Edit Meeting"}</h1>
            {!isNew && meeting && <p className="text-sm text-muted-foreground">{meeting.name}</p>}
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" data-testid="meeting-form">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Name</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Monday Night Big Book" data-testid="input-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="day" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-day"><SelectValue placeholder="Day" /></SelectTrigger></FormControl>
                      <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl><Input type="time" {...field} data-testid="input-start-time" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl><Input type="time" {...field} data-testid="input-end-time" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-type"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                      <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="format" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-format"><SelectValue placeholder="Select format" /></SelectTrigger></FormControl>
                      <SelectContent>{FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="interaction" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-interaction"><SelectValue placeholder="Select mode" /></SelectTrigger></FormControl>
                      <SelectContent>{INTERACTIONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="language" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-language"><SelectValue placeholder="Language" /></SelectTrigger></FormControl>
                      <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Location <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. 123 Main St, Room 4" data-testid="input-location" /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="link" render={({ field }) => (
                <FormItem>
                  <FormLabel>Online Link <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input {...field} placeholder="https://zoom.us/..." data-testid="input-link" /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="literature" render={({ field }) => (
                <FormItem>
                  <FormLabel>Literature <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-literature"><SelectValue placeholder="Select literature" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {LITERATURE.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Textarea {...field} placeholder="Special notes for members..." rows={3} data-testid="input-notes" /></FormControl>
                </FormItem>
              )} />

              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full"
                data-testid="submit-meeting"
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : isNew ? "Create Meeting" : "Save Changes"}
              </Button>
            </form>
          </Form>
        </div>

        {/* People assignment — only for existing meetings */}
        {!isNew && meeting && (
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="font-semibold text-sm text-foreground mb-4">Assigned People</h2>

            {/* Current assignments */}
            {meeting.people && meeting.people.length > 0 ? (
              <div className="space-y-2 mb-5">
                {meeting.people.map((person: any) => (
                  <div key={person.id} className="flex items-center gap-3 p-2.5 bg-muted/40 rounded-lg" data-testid={`assigned-person-${person.id}`}>
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{person.name}</p>
                      <p className="text-xs text-muted-foreground">{person.assignedRole || person.role}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleRemove(person.id)}
                      data-testid={`remove-person-${person.id}`}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic mb-4">No people assigned yet</p>
            )}

            <Separator className="mb-4" />

            {/* Assign form */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assign Person</p>
              <div className="flex gap-2 flex-col sm:flex-row">
                <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                  <SelectTrigger className="flex-1" data-testid="select-person">
                    <SelectValue placeholder="Select person..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePeople.length === 0 ? (
                      <SelectItem value="" disabled>No available people</SelectItem>
                    ) : (
                      availablePeople.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name} — {p.role}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Select value={selectedAssignedRole} onValueChange={setSelectedAssignedRole}>
                  <SelectTrigger className="flex-1 sm:w-44" data-testid="select-assigned-role">
                    <SelectValue placeholder="Override role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Keep default role</SelectItem>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAssign}
                disabled={!selectedPersonId || assignMutation.isPending}
                className="gap-2"
                data-testid="assign-person-btn"
              >
                <UserPlus size={14} />
                Assign to Meeting
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
