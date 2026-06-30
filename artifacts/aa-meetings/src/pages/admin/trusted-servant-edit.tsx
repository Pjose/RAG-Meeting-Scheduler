import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetTrustedServant,
  useCreateTrustedServant,
  useUpdateTrustedServant,
  useListPeople,
  getListTrustedServantsQueryKey,
  getGetTrustedServantQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const TERM_LENGTHS = ["3 months", "6 months", "1 year", "2 years", "Ongoing", "Other"];

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  memberId: z.string().optional(),
  termLength: z.string().optional(),
  startDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminTrustedServantEdit() {
  const [matchEdit, paramsEdit] = useRoute("/admin/trusted-servants/:id");
  const [matchNew] = useRoute("/admin/trusted-servants/new");
  const isNew = matchNew || (matchEdit && paramsEdit.id === "new");
  const id = matchEdit && paramsEdit.id !== "new" ? parseInt(paramsEdit.id, 10) : 0;

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: servant, isLoading } = useGetTrustedServant(id, {
    query: { enabled: !!id && !isNew, queryKey: getGetTrustedServantQueryKey(id) },
  });
  const { data: allPeople } = useListPeople({});

  const createMutation = useCreateTrustedServant();
  const updateMutation = useUpdateTrustedServant();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", description: "", memberId: "", termLength: "", startDate: "" },
  });

  useEffect(() => {
    if (servant && !isNew) {
      form.reset({
        title: servant.title,
        description: servant.description ?? "",
        memberId: servant.memberId != null ? String(servant.memberId) : "",
        termLength: servant.termLength ?? "",
        startDate: servant.startDate ?? "",
      });
    }
  }, [servant, isNew]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      title: values.title,
      description: values.description || undefined,
      memberId: values.memberId && values.memberId !== "__none__" ? parseInt(values.memberId, 10) : undefined,
      termLength: values.termLength && values.termLength !== "__none__" ? values.termLength : undefined,
      startDate: values.startDate || undefined,
    } as any;

    if (isNew) {
      await createMutation.mutateAsync({ data: payload });
      queryClient.invalidateQueries({ queryKey: getListTrustedServantsQueryKey() });
      toast({ title: "Position created" });
      setLocation("/admin/trusted-servants");
    } else {
      await updateMutation.mutateAsync({ id, data: payload });
      queryClient.invalidateQueries({ queryKey: getGetTrustedServantQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: getListTrustedServantsQueryKey() });
      toast({ title: "Position saved" });
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

  return (
    <AdminLayout>
      <div className="max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation("/admin/trusted-servants")}>
            <ArrowLeft size={15} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold font-serif text-foreground">
              {isNew ? "Add Trusted Servant Position" : "Edit Position"}
            </h1>
            {!isNew && servant && <p className="text-sm text-muted-foreground">{servant.title}</p>}
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Position Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. GSR, Treasurer, H&I Chair" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Brief description of responsibilities…" rows={2} />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="memberId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Member <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <Select
                    value={field.value || "__none__"}
                    onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="__none__">Vacant</SelectItem>
                      {(allPeople ?? []).map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} — {p.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="termLength" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term Length <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Not set</SelectItem>
                        {TERM_LENGTHS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : isNew ? "Create Position" : "Save Changes"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
}
