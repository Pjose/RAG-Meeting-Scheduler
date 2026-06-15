import { useState } from "react";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, Search, Phone, Mail } from "lucide-react";
import { useListPeople, useDeletePerson, getListPeopleQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminPeople() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: people, isLoading } = useListPeople(
    { search: search || undefined },
    { query: { queryKey: getListPeopleQueryKey({ search: search || undefined }) } }
  );
  const deleteMutation = useDeletePerson();

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync({ id: deleteId });
    queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
    toast({ title: "Person removed" });
    setDeleteId(null);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold font-serif text-foreground">People</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Contacts, chairpersons, and service members</p>
          </div>
          <Link href="/admin/people/new">
            <Button size="sm" className="gap-2" data-testid="add-person-btn">
              <Plus size={15} />
              Add Person
            </Button>
          </Link>
        </div>

        <div className="relative mb-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="people-search"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-18 rounded-lg" />)}
          </div>
        ) : !people || people.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="font-medium text-foreground">No people found</p>
            <Link href="/admin/people/new">
              <Button variant="outline" size="sm" className="mt-4 gap-2">
                <Plus size={14} />
                Add your first person
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {people.map((p) => (
              <div key={p.id} className="flex items-center gap-4 bg-card border border-card-border rounded-lg p-4 hover:border-primary/30 transition-colors" data-testid={`person-row-${p.id}`}>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 className="font-medium text-sm text-foreground">{p.name}</h3>
                    <Badge variant="outline" className="text-xs shrink-0">{p.role}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {p.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={11} />
                        {p.phone}
                      </span>
                    )}
                    {p.email && (
                      <span className="flex items-center gap-1 truncate max-w-48">
                        <Mail size={11} />
                        {p.email}
                      </span>
                    )}
                    {p.cleanDate && (
                      <span className="text-muted-foreground/60">Clean: {p.cleanDate}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/admin/people/${p.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`edit-person-${p.id}`}>
                      <Pencil size={14} />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(p.id)}
                    data-testid={`delete-person-${p.id}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove person?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the person and all their meeting assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" data-testid="confirm-delete">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
