import { Link } from "wouter";
import { Calendar, Users, ArrowRight, TrendingUp, Building2 } from "lucide-react";
import { useGetStats } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, isAdmin } from "@/lib/auth";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetStats();
  const { data: auth } = useAuth();
  const adminRole = isAdmin(auth?.role);

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="mb-7 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#c49a3c" }}>
            <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
              <circle cx="16" cy="16" r="13" fill="none" stroke="#3b6d11" strokeWidth="2" />
              <polygon points="16,7 25,23 7,23" fill="none" stroke="#3b6d11" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground font-serif">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Overview of your AA meeting directory</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Meetings"
            value={stats?.totalMeetings}
            icon={<Calendar size={18} />}
            href="/admin/meetings"
            loading={isLoading}
          />
          <StatCard
            label="H&amp;I Commitments"
            value={stats?.totalHiMeetings}
            icon={<Building2 size={18} />}
            href="/admin/hi-meetings"
            loading={isLoading}
          />
          {adminRole && (
            <StatCard
              label="People &amp; Contacts"
              value={stats?.totalPeople}
              icon={<Users size={18} />}
              href="/admin/people"
              loading={isLoading}
            />
          )}
        </div>

        {/* Breakdowns */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <BreakdownCard title="By Day" data={stats?.meetingsByDay ?? []} />
            <BreakdownCard title="By Type" data={stats?.meetingsByType ?? []} />
            <BreakdownCard title="By Mode" data={stats?.meetingsByInteraction ?? []} />
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction href="/admin/meetings/new" label="Add a Meeting" sub="Schedule a new AA meeting" icon={<Calendar size={18} />} />
          <QuickAction href="/admin/hi-meetings/new" label="Add H&amp;I Commitment" sub="Add a new H&amp;I meeting" icon={<Building2 size={18} />} />
          {adminRole && <QuickAction href="/admin/people/new" label="Add a Person" sub="Add a contact or chairperson" icon={<Users size={18} />} />}
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value, icon, href, loading }: { label: string; value?: number; icon: React.ReactNode; href: string; loading: boolean }) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <span className="p-2 bg-primary/10 text-primary rounded-lg">{icon}</span>
            <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16 mb-1" />
          ) : (
            <p className="text-3xl font-bold text-foreground">{value ?? 0}</p>
          )}
          <p className="text-sm text-muted-foreground mt-0.5" dangerouslySetInnerHTML={{ __html: label }} />
        </CardContent>
      </Card>
    </Link>
  );
}

function BreakdownCard({ title, data }: { title: string; data: { label: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <Card data-testid={`breakdown-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <TrendingUp size={13} className="text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No data yet</p>
        ) : (
          <div className="space-y-2">
            {data.map(({ label, count }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground truncate">{label}</span>
                    <span className="text-muted-foreground ml-2">{count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickAction({ href, label, sub, icon }: { href: string; label: string; sub: string; icon: React.ReactNode }) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-4 p-4 bg-card border border-card-border rounded-xl hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group" data-testid={`quick-action-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        <span className="p-2.5 bg-primary/10 text-primary rounded-lg">{icon}</span>
        <div>
          <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{label}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
        <ArrowRight size={14} className="ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}
