import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Printer, ArrowLeft, Filter } from "lucide-react";
import { useListPeople } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const ROLES = ["Chairperson", "Co-Chairperson", "Secretary", "GSR", "Treasurer", "Member"];

function yearsClean(cleanDate: string | null): number | null {
  if (!cleanDate) return null;
  const clean = new Date(cleanDate);
  if (isNaN(clean.getTime())) return null;
  const now = new Date();
  const diff = (now.getTime() - clean.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return diff;
}

function formatYears(years: number): string {
  if (years < 1) return `${Math.floor(years * 12)} mo`;
  return `${years.toFixed(1)} yr${years >= 2 ? "s" : ""}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

type SortKey = "name" | "cleanDate" | "role";

export default function PrintContacts() {
  const [minYears, setMinYears] = useState("");
  const [maxYears, setMaxYears] = useState("");
  const [cleanFrom, setCleanFrom] = useState("");
  const [cleanTo, setCleanTo] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");

  const peopleQuery = useListPeople({});

  const filtered = useMemo(() => {
    const all = peopleQuery.data ?? [];
    return all
      .filter((p) => {
        if (roleFilter !== "all" && p.role !== roleFilter) return false;

        const yrs = yearsClean(p.cleanDate ?? null);

        if (minYears !== "") {
          const min = parseFloat(minYears);
          if (yrs === null || yrs < min) return false;
        }
        if (maxYears !== "") {
          const max = parseFloat(maxYears);
          if (yrs === null || yrs > max) return false;
        }
        if (cleanFrom !== "") {
          if (!p.cleanDate || p.cleanDate < cleanFrom) return false;
        }
        if (cleanTo !== "") {
          if (!p.cleanDate || p.cleanDate > cleanTo) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "cleanDate") {
          if (!a.cleanDate && !b.cleanDate) return 0;
          if (!a.cleanDate) return 1;
          if (!b.cleanDate) return -1;
          return a.cleanDate.localeCompare(b.cleanDate);
        }
        if (sortBy === "role") return a.role.localeCompare(b.role);
        return 0;
      });
  }, [peopleQuery.data, roleFilter, minYears, maxYears, cleanFrom, cleanTo, sortBy]);

  const activeFiltersCount = [
    roleFilter !== "all",
    minYears !== "",
    maxYears !== "",
    cleanFrom !== "",
    cleanTo !== "",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setMinYears(""); setMaxYears(""); setCleanFrom(""); setCleanTo(""); setRoleFilter("all");
  };

  return (
    <AdminLayout>
      {/* Screen-only controls */}
      <div className="print:hidden mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft size={14} />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Print: Contact List</h1>
            <p className="text-sm text-muted-foreground">Filter members then print</p>
          </div>
        </div>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer size={15} />
          Print
        </Button>
      </div>

      {/* Filter panel — screen only */}
      <div className="print:hidden bg-card border border-card-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                {activeFiltersCount}
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7">
              Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Role */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Min years clean */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Min years clean</Label>
            <Input
              type="number"
              min={0}
              step={0.5}
              placeholder="e.g. 5"
              value={minYears}
              onChange={(e) => setMinYears(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Max years clean */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Max years clean</Label>
            <Input
              type="number"
              min={0}
              step={0.5}
              placeholder="e.g. 10"
              value={maxYears}
              onChange={(e) => setMaxYears(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Clean date from */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Clean date — from</Label>
            <Input
              type="date"
              value={cleanFrom}
              onChange={(e) => setCleanFrom(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Clean date to */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Clean date — to</Label>
            <Input
              type="date"
              value={cleanTo}
              onChange={(e) => setCleanTo(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort by:</span>
          {(["name", "cleanDate", "role"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                sortBy === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {key === "cleanDate" ? "Clean date" : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Result count — screen only */}
      <p className="print:hidden text-sm text-muted-foreground mb-4">
        {peopleQuery.isLoading ? "Loading…" : `${filtered.length} of ${peopleQuery.data?.length ?? 0} members`}
      </p>

      {/* Print header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold">AA Member Contact List</h1>
        <p className="text-sm text-gray-500">
          Printed {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          {activeFiltersCount > 0 && " · Filtered"}
          {roleFilter !== "all" && ` · Role: ${roleFilter}`}
          {minYears && ` · Min ${minYears} yrs clean`}
          {maxYears && ` · Max ${maxYears} yrs clean`}
          {cleanFrom && ` · Clean from ${formatDate(cleanFrom)}`}
          {cleanTo && ` · Clean to ${formatDate(cleanTo)}`}
        </p>
        <p className="text-sm text-gray-500 font-medium mt-1">{filtered.length} member{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Table */}
      {peopleQuery.isLoading ? (
        <div className="space-y-2 print:hidden">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground print:hidden">
          <p className="font-medium text-foreground">No members match these filters</p>
          <p className="text-sm mt-1">Try adjusting the criteria above</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm print:text-[10px]">
            <thead>
              <tr className="bg-sidebar text-sidebar-foreground print:bg-gray-800 print:text-white">
                <th className="border border-border print:border-gray-300 px-3 py-2 text-left font-semibold">Name</th>
                <th className="border border-border print:border-gray-300 px-3 py-2 text-left font-semibold">Role</th>
                <th className="border border-border print:border-gray-300 px-3 py-2 text-left font-semibold">Phone</th>
                <th className="border border-border print:border-gray-300 px-3 py-2 text-left font-semibold">Email</th>
                <th className="border border-border print:border-gray-300 px-3 py-2 text-left font-semibold">Clean Date</th>
                <th className="border border-border print:border-gray-300 px-3 py-2 text-left font-semibold">Years Clean</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const yrs = yearsClean(p.cleanDate ?? null);
                return (
                  <tr
                    key={p.id}
                    className={i % 2 === 0 ? "bg-card print:bg-white" : "bg-muted/40 print:bg-gray-50"}
                  >
                    <td className="border border-border print:border-gray-300 px-3 py-2 font-medium text-foreground">{p.name}</td>
                    <td className="border border-border print:border-gray-300 px-3 py-2 text-muted-foreground">{p.role}</td>
                    <td className="border border-border print:border-gray-300 px-3 py-2 text-muted-foreground font-mono">
                      {p.phone ?? "—"}
                    </td>
                    <td className="border border-border print:border-gray-300 px-3 py-2 text-muted-foreground">
                      {p.email ?? "—"}
                    </td>
                    <td className="border border-border print:border-gray-300 px-3 py-2 text-muted-foreground">
                      {formatDate(p.cleanDate ?? null)}
                    </td>
                    <td className="border border-border print:border-gray-300 px-3 py-2 text-muted-foreground">
                      {yrs !== null ? (
                        <span className="font-medium text-foreground">{formatYears(yrs)}</span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @media print {
          @page { size: portrait; margin: 1cm; }
          body { font-size: 10px; }
        }
      `}</style>
    </AdminLayout>
  );
}
