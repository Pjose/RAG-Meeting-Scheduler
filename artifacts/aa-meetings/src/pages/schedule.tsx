import { useState } from "react";
import { Link } from "wouter";
import { Search, Filter, MapPin, Globe, Users, Clock, ChevronDown, X } from "lucide-react";
import { useGetSchedule, useListMeetings, getGetScheduleQueryKey, getListMeetingsQueryKey } from "@workspace/api-client-react";
import { PublicLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TYPES = ["Open", "Closed", "Beginners", "Step Study", "Big Book Study", "Speaker"];
const FORMATS = ["Discussion", "Book Study", "Speaker", "Call-Up"];
const INTERACTIONS = ["In-Person", "Online", "Hybrid"];
const LANGUAGES = ["English", "Spanish", "French", "Portuguese", "Other"];

function interactionIcon(interaction: string) {
  if (interaction === "Online") return <Globe size={12} />;
  if (interaction === "Hybrid") return <Users size={12} />;
  return <MapPin size={12} />;
}

function interactionColor(interaction: string) {
  if (interaction === "Online") return "bg-accent text-accent-foreground";
  if (interaction === "Hybrid") return "bg-secondary text-secondary-foreground";
  return "bg-muted text-muted-foreground";
}

function typeColor(type: string) {
  if (type === "Open") return "border-primary/30 text-primary bg-primary/5";
  if (type === "Closed") return "border-muted-foreground/30 text-muted-foreground";
  if (type === "Beginners") return "border-chart-2/40 text-chart-2 bg-chart-2/5";
  return "border-border text-muted-foreground";
}

export default function Schedule() {
  const [search, setSearch] = useState("");
  const [day, setDay] = useState("");
  const [type, setType] = useState("");
  const [format, setFormat] = useState("");
  const [interaction, setInteraction] = useState("");
  const [language, setLanguage] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const hasFilters = search || day || type || format || interaction || language;

  const scheduleQuery = useGetSchedule({ query: { enabled: !hasFilters, queryKey: getGetScheduleQueryKey() } });
  const filteredQuery = useListMeetings(
    { search: search || undefined, day: day || undefined, type: type || undefined, format: format || undefined, interaction: interaction || undefined, language: language || undefined },
    { query: { enabled: !!hasFilters, queryKey: getListMeetingsQueryKey({ search: search || undefined, day: day || undefined, type: type || undefined, format: format || undefined, interaction: interaction || undefined, language: language || undefined }) } }
  );

  const clearFilters = () => {
    setSearch(""); setDay(""); setType(""); setFormat(""); setInteraction(""); setLanguage("");
  };

  const isLoading = hasFilters ? filteredQuery.isLoading : scheduleQuery.isLoading;

  return (
    <PublicLayout>
      {/* Hero */}
      <div className="bg-sidebar border-b border-sidebar-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-sidebar-foreground mb-2">
            Meeting Schedule
          </h1>
          <p className="text-sidebar-foreground/70 text-base max-w-lg">
            Find an AA meeting that fits your schedule. All meetings are open unless marked Closed.
          </p>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex gap-3 items-start flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search meetings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="search-input"
            />
          </div>
          <Button
            variant="outline"
            size="default"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 shrink-0"
            data-testid="filter-toggle"
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
            <Button variant="ghost" size="default" onClick={clearFilters} className="gap-1.5 text-muted-foreground shrink-0" data-testid="clear-filters">
              <X size={14} />
              Clear
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger data-testid="filter-day"><SelectValue placeholder="Day" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All days</SelectItem>
                {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger data-testid="filter-type"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger data-testid="filter-format"><SelectValue placeholder="Format" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All formats</SelectItem>
                {FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={interaction} onValueChange={setInteraction}>
              <SelectTrigger data-testid="filter-interaction"><SelectValue placeholder="Mode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All modes</SelectItem>
                {INTERACTIONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger data-testid="filter-language"><SelectValue placeholder="Language" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All languages</SelectItem>
                {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        {isLoading ? (
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
        ) : hasFilters ? (
          <FilteredResults meetings={filteredQuery.data ?? []} />
        ) : (
          <WeeklySchedule days={scheduleQuery.data?.days ?? []} />
        )}
      </div>
    </PublicLayout>
  );
}

function WeeklySchedule({ days }: { days: Array<{ day: string; meetings: any[] }> }) {
  if (days.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Calendar />
        <p className="mt-4 font-medium text-foreground">No meetings scheduled yet</p>
        <p className="text-sm mt-1">Check back later or contact your group</p>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {days.map(({ day, meetings }) => (
        <section key={day} data-testid={`day-section-${day}`}>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-semibold text-base text-foreground">{day}</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{meetings.length} meeting{meetings.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-2">
            {meetings.map((m) => <MeetingCard key={m.id} meeting={m} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function FilteredResults({ meetings }: { meetings: any[] }) {
  if (meetings.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="font-medium text-foreground">No meetings match your filters</p>
        <p className="text-sm mt-1">Try adjusting your search criteria</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">{meetings.length} meeting{meetings.length !== 1 ? "s" : ""} found</p>
      <div className="space-y-2">
        {meetings.map((m) => <MeetingCard key={m.id} meeting={m} />)}
      </div>
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: any }) {
  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="block bg-card border border-card-border rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
      data-testid={`meeting-card-${meeting.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate">{meeting.name}</h3>
            <Badge variant="outline" className={`text-xs shrink-0 ${typeColor(meeting.type)}`}>{meeting.type}</Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {meeting.startTime} – {meeting.endTime}
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
        </div>
      </div>
    </Link>
  );
}

function Calendar() {
  return (
    <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    </div>
  );
}
