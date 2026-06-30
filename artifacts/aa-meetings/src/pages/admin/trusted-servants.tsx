import { useState } from "react";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import {
  useListTrustedServants,
  useDeleteTrustedServant,
  getListTrustedServantsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function AdminTrustedServants() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListTrustedServants();
  const deleteMutation = useDeleteTrustedServant();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filtered = (data ?? []).filter((ts) =>
    !search || ts.title.toLowerCase().includes(search.toLowerCase()) ||
    (ts.memberName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Remove "${title}"?`)) return;
    await deleteMutation.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListTrustedServantsQueryKey() });
    toast({ title: "Position removed" });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold font-serif text-foreground">Trusted Servants</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Positions of service and who holds them</p>
        </div>
        <Link href="/admin/trusted-servants/new">
          <Button className="gap-2">
            <Plus size={15} />
            Add Position
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search positions or members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium text-foreground">No positions found</p>
          <p className="text-sm mt-1">
            {search ? "Try a different search" : "Add your first trusted servant position"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ts) => (
            <div
              key={ts.id}
              className="flex items-center gap-4 bg-card border border-card-border rounded-lg px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{ts.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mt-0.5">
                  {ts.memberName ? (
                    <span className="font-medium text-primary">{ts.memberName}</span>
                  ) : (
                    <span className="italic">Vacant</span>
                  )}
                  {ts.termLength && <span>· Term: {ts.termLength}</span>}
                  {ts.startDate && <span>· Since {ts.startDate}</span>}
                  {ts.description && <span className="truncate max-w-48">· {ts.description}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link href={`/admin/trusted-servants/${ts.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil size={14} />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(ts.id, ts.title)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
