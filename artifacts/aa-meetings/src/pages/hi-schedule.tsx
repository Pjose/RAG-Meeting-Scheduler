import { useState } from "react";
import { Link } from "wouter";
import { Search, Filter, MapPin, Globe, Users, Clock, ChevronDown, X, List, LayoutGrid, ChevronRight } from "lucide-react";
import { useGetHiSchedule, useListHiMeetings, getGetHiScheduleQueryKey, getListHiMeetingsQueryKey } from "@workspace/api-client-react";
import { formatTime } from "@/lib/constants";
import { PublicLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TYPES = ["Open", "Closed", "Beginner", "Other"];
const FORMATS = ["Book Study", "Call-Up", "Discussion", "Step Speaker", "Step Study", "Story Speaker", "Other"];
const INTERACTIONS = ["In-Person", "Online", "Hybrid"];
const LANGUAGES = ["English", "Spanish", "French", "Portuguese", "Other"];

function interactionIcon(interaction: string) {
  if (interaction === "Online") return <Globe size={12} />;
  if (interaction === "Hybrid") return <Users size={12} />;
  return <MapPin size={12} />;
}

function interactionColor(interaction: string) {
  if (interaction === "Online") return "bg-accent/20 text-accent-foreground border border-accent/30";
  if (interaction === "Hybrid") return "bg-secondary text-secondary-foreground border border-secondary-foreground/10";
  return "bg-muted text-muted-foreground border border-border/50";
}

function typeColor(type: string) {
  if (type === "Open") return "border-primary/40 text-primary bg-primary/8";
  if (type === "Closed") return "border-muted-foreground/30 text-muted-foreground";
  if (type === "Beginner") return "border-chart-3/40 text-chart-3 bg-chart-3/5";
  return "border-border text-muted-foreground";
}

export default function HiSchedule() {
  const [search, setSearch] = useState("");
  const [day, setDay] = useState("");
  const [type, setType] = useState("");
  const [format, setFormat] = useState("");
  const [interaction, setInteraction] = useState("");
  const [language, setLanguage] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const hasFilters = search || day || type || format || interaction || language;

  const scheduleQuery = useGetHiSchedule({ query: { enabled: !hasFilters, queryKey: getGetHiScheduleQueryKey() } });
  const filteredQuery = useListHiMeetings(
    { search: search || undefined, day: day || undefined, type: type || undefined, format: format || undefined, interaction: interaction || undefined, language: language || undefined },
    { query: { enabled: !!hasFilters, queryKey: getListHiMeetingsQueryKey({ search: search || undefined, day: day || undefined, type: type || undefined, format: format || undefined, interaction: interaction || undefined, language: language || undefined }) } }
  );

  const clearFilters = () => {
    setSearch(""); setDay(""); setType(""); setFormat(""); setInteraction(""); setLanguage("");
  };

  const isLoading = hasFilters ? filteredQuery.isLoading : scheduleQuery.isLoading;

  return (
    <PublicLayout>
      <div className="bg-sidebar border-b border-sidebar-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-sidebar-foreground mb-2">
            Hospitals &amp; Institutions
          </h1>
          <p className="text-sidebar-foreground/70 text-base max-w-lg">
            AA H&amp;I meetings schedule — bringing the message to those who cannot attend regular meetings.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex gap-3 items-start flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search H&I meetings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="default"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter size={14} />
              Filters
              {hasFilters && (
                <span className="ml-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {[day, type, format, interaction, language].filter(Boolean).length}
                </span>
              )}
              <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </Button>
            {hasFilters && (
              <Button variant="ghost" size="default" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
                <X size={14} />
                Clear
              </Button>
            )}
            {!hasFilters && (
              <div className="flex border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  title="List view"
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors border-l border-border ${
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  title="Weekly grid view"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            <Select value={day || "all"} onValueChange={(v) => setDay(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All days</SelectItem>
                {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={type || "all"} onValueChange={(v) => setType(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={format || "all"} onValueChange={(v) => setFormat(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Format" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All formats</SelectItem>
                {FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={interaction || "all"} onValueChange={(v) => setInteraction(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modes</SelectItem>
                {INTERACTIONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={language || "all"} onValueChange={(v) => setLanguage(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        {isLoading ? (
          <HiLoadingSkeleton grid={viewMode === "grid" && !hasFilters} />
        ) : hasFilters ? (
          <HiFilteredResults meetings={filteredQuery.data ?? []} />
        ) : viewMode === "grid" ? (
          <HiWeeklyGrid days={scheduleQuery.data?.days ?? []} />
        ) : (
          <HiWeeklyList days={scheduleQuery.data?.days ?? []} />
        )}
      </div>
    </PublicLayout>
  );
}

function HiLoadingSkeleton({ grid }: { grid: boolean }) {
  if (grid) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((d) => (
          <div key={d}>
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <Skeleton className="h-6 w-32 mb-3" />
          <div className="space-y-2">
            {[1, 2].map((j) => <Skeleton key={j} className="h-20 w-full rounded-lg" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function HiWeeklyList({ days }: { days: Array<{ day: string; meetings: any[] }> }) {
  if (days.length === 0) return <HiEmptyState />;
  return (
    <div className="space-y-8">
      {days.map(({ day, meetings }) => (
        <section key={day}>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-semibold text-base text-foreground">{day}</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {meetings.length} meeting{meetings.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-2">
            {meetings.map((m) => <HiMeetingCard key={m.id} meeting={m} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function HiWeeklyGrid({ days }: { days: Array<{ day: string; meetings: any[] }> }) {
  if (days.length === 0) return <HiEmptyState />;
  const byDay: Record<string, any[]> = {};
  for (const { day, meetings } of days) byDay[day] = meetings;

  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
      <div className="grid min-w-[640px]" style={{ gridTemplateColumns: `repeat(${DAYS.length}, minmax(0, 1fr))`, gap: "6px" }}>
        {DAYS.map((d) => {
          const count = (byDay[d] ?? []).length;
          return (
            <div key={d} className="text-center pb-1.5 border-b border-primary/20 mb-1">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">{d.slice(0, 3)}</p>
              {count > 0 && <span className="text-[10px] text-muted-foreground">{count}</span>}
            </div>
          );
        })}
        {DAYS.map((d) => {
          const meetings = byDay[d] ?? [];
          return (
            <div key={d} className="space-y-1.5 min-h-[80px]">
              {meetings.length === 0 ? (
                <div className="h-full min-h-[60px] rounded-md border border-dashed border-border/50 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground/50">—</span>
                </div>
              ) : (
                meetings.map((m) => <HiGridCard key={m.id} meeting={m} />)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HiGridCard({ meeting }: { meeting: any }) {
  return (
    <Link
      href={`/hi/${meeting.id}`}
      className="block bg-card border border-card-border rounded-md p-1.5 text-left hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2 mb-1">{meeting.name}</p>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock size={9} className="shrink-0" />
        <span className="truncate">{formatTime(meeting.startTime)}</span>
      </div>
      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
        <span className={`inline-flex items-center gap-0.5 text-[10px] px-1 py-px rounded ${typeColor(meeting.type)}`}>
          {meeting.type}
        </span>
      </div>
      {meeting.interaction && (
        <div className="flex items-center gap-0.5 mt-0.5 text-[10px] text-muted-foreground">
          {interactionIcon(meeting.interaction)}
          <span className="truncate">{meeting.interaction}</span>
        </div>
      )}
    </Link>
  );
}

function HiFilteredResults({ meetings }: { meetings: any[] }) {
  if (meetings.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="font-medium text-foreground">No H&I meetings match your filters</p>
        <p className="text-sm mt-1">Try adjusting your search criteria</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">{meetings.length} meeting{meetings.length !== 1 ? "s" : ""} found</p>
      <div className="space-y-2">
        {meetings.map((m) => <HiMeetingCard key={m.id} meeting={m} />)}
      </div>
    </div>
  );
}

function HiMeetingCard({ meeting }: { meeting: any }) {
  return (
    <Link
      href={`/hi/${meeting.id}`}
      className="block bg-card border border-card-border rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">{meeting.name}</h3>
            <Badge variant="outline" className={`text-xs shrink-0 ${typeColor(meeting.type)}`}>{meeting.type}</Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1 truncate max-w-48">
                <MapPin size={11} />
                {meeting.location}
              </span>
            )}
            <span className="text-muted-foreground/70">{meeting.format}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${interactionColor(meeting.interaction)}`}>
            {interactionIcon(meeting.interaction)}
            {meeting.interaction}
          </span>
          <ChevronRight size={14} className="text-muted-foreground/50 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}

function HiEmptyState() {
  return (
    <div className="text-center py-20 text-muted-foreground">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <p className="font-medium text-foreground">No H&I meetings scheduled yet</p>
      <p className="text-sm mt-1">Check back later or contact your H&I committee</p>
    </div>
  );
}
