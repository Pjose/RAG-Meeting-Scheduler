import { useState } from "react";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, Search, MapPin, Globe, Clock } from "lucide-react";
import { useListMeetings, useDeleteMeeting, getListMeetingsQueryKey } from "@workspace/api-client-react";
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

export default function AdminMeetings() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: meetings, isLoading } = useListMeetings(
    { search: search || undefined },
    { query: { queryKey: getListMeetingsQueryKey({ search: search || undefined }) } }
  );
  const deleteMutation = useDeleteMeeting();

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync({ id: deleteId });
    queryClient.invalidateQueries({ queryKey: getListMeetingsQueryKey() });
    toast({ title: "Meeting deleted" });
    setDeleteId(null);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground font-serif">Meetings</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage scheduled AA meetings</p>
          </div>
          <Link href="/admin/meetings/new">
            <Button size="sm" className="gap-2" data-testid="add-meeting-btn">
              <Plus size={15} />
              Add Meeting
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="meetings-search"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : !meetings || meetings.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="font-medium text-foreground">No meetings found</p>
            <Link href="/admin/meetings/new">
              <Button variant="outline" size="sm" className="mt-4 gap-2">
                <Plus size={14} />
                Add your first meeting
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {meetings.map((m) => (
              <div key={m.id} className="flex items-center gap-4 bg-card border border-card-border rounded-lg p-4 hover:border-primary/30 transition-colors group" data-testid={`meeting-row-${m.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-medium text-sm text-foreground truncate">{m.name}</h3>
                    <Badge variant="outline" className="text-xs shrink-0">{m.type}</Badge>
                    <Badge variant="outline" className="text-xs shrink-0">{m.interaction}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {m.day} {m.startTime}–{m.endTime}
                    </span>
                    {m.location && (
                      <span className="flex items-center gap-1 truncate max-w-48">
                        <MapPin size={11} />
                        {m.location}
                      </span>
                    )}
                    <span className="text-muted-foreground/70">{m.format}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/admin/meetings/${m.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`edit-meeting-${m.id}`}>
                      <Pencil size={14} />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(m.id)}
                    data-testid={`delete-meeting-${m.id}`}
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
            <AlertDialogTitle>Delete meeting?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the meeting and remove all chairperson assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" data-testid="confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
