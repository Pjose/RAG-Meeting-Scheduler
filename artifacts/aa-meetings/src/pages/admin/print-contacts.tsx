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
import { Checkbox } from "@/components/ui/checkbox";
import { PERSON_ROLES } from "@/lib/constants";

function yearsSober(soberDate: string | null | undefined): number | null {
  if (!soberDate) return null;
  const d = new Date(soberDate);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

function formatYears(years: number): string {
  if (years < 1) return `${Math.floor(years * 12)} mo`;
  return `${years.toFixed(1)} yr${years >= 2 ? "s" : ""}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

type SortKey = "name" | "soberDate" | "role";

type ColKey = "role" | "phone" | "email" | "soberDate" | "yearsSober" | "gender";

const ALL_COLUMNS: { key: ColKey; label: string }[] = [
  { key: "role", label: "Role" },
  { key: "gender", label: "Gender" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "soberDate", label: "Sober Date" },
  { key: "yearsSober", label: "Years Sober" },
];

const MIN_YEARS_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "1", label: "1+ years" },
  { value: "2", label: "2+ years" },
  { value: "3", label: "3+ years" },
  { value: "4", label: "4+ years" },
  { value: "5", label: "5+ years" },
  { value: "7", label: "7+ years" },
  { value: "10", label: "10+ years" },
  { value: "15", label: "15+ years" },
  { value: "20", label: "20+ years" },
];

export default function PrintContacts() {
  const [minYears, setMinYears] = useState("any");
  const [soberFrom, setSoberFrom] = useState("");
  const [soberTo, setSoberTo] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [selectedCols, setSelectedCols] = useState<Set<ColKey>>(
    new Set(["role", "phone", "email", "soberDate", "yearsSober"])
  );

  const peopleQuery = useListPeople({});

  const toggleCol = (col: ColKey) => {
    setSelectedCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const all = (peopleQuery.data ?? []) as any[];
    return all
      .filter((p) => {
        if (roleFilter !== "all" && p.role !== roleFilter) return false;
        if (genderFilter !== "all" && (p.gender ?? "") !== genderFilter) return false;

        const yrs = yearsSober(p.soberDate);

        if (minYears !== "any") {
          const min = parseFloat(minYears);
          if (yrs === null || yrs < min) return false;
        }
        if (soberFrom !== "") {
          if (!p.soberDate || p.soberDate < soberFrom) return false;
        }
        if (soberTo !== "") {
          if (!p.soberDate || p.soberDate > soberTo) return false;
        }
        return true;
      })
      .sort((a: any, b: any) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "soberDate") {
          if (!a.soberDate && !b.soberDate) return 0;
          if (!a.soberDate) return 1;
          if (!b.soberDate) return -1;
          return a.soberDate.localeCompare(b.soberDate);
        }
        if (sortBy === "role") return a.role.localeCompare(b.role);
        return 0;
      });
  }, [peopleQuery.data, roleFilter, genderFilter, minYears, soberFrom, soberTo, sortBy]);

  const menOnly = filtered.filter((p: any) => p.gender === "Male");
  const womenOnly = filtered.filter((p: any) => p.gender === "Female");

  const activeFiltersCount = [
    roleFilter !== "all",
    genderFilter !== "all",
    minYears !== "any",
    soberFrom !== "",
    soberTo !== "",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setMinYears("any"); setSoberFrom(""); setSoberTo("");
    setRoleFilter("all"); setGenderFilter("all");
  };

  const visibleCols = ALL_COLUMNS.filter((c) => selectedCols.has(c.key));

  function renderTable(rows: any[], title?: string) {
    return (
      <div className="overflow-x-auto mb-8">
        {title && <h2 className="text-lg font-bold mb-2 print:text-base">{title}</h2>}
        <table className="w-full border-collapse text-sm print:text-[10px]">
          <thead>
            <tr className="bg-sidebar text-sidebar-foreground print:bg-gray-800 print:text-white">
              <th className="border border-border print:border-gray-300 px-3 py-2 text-left font-semibold">Name</th>
              {visibleCols.map((c) => (
                <th key={c.key} className="border border-border print:border-gray-300 px-3 py-2 text-left font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const yrs = yearsSober(p.soberDate);
              return (
                <tr key={p.id} className={i % 2 === 0 ? "bg-card print:bg-white" : "bg-muted/40 print:bg-gray-50"}>
                  <td className="border border-border print:border-gray-300 px-3 py-2 font-medium text-foreground">{p.name}</td>
                  {visibleCols.map((c) => (
                    <td key={c.key} className="border border-border print:border-gray-300 px-3 py-2 text-muted-foreground">
                      {c.key === "role" && p.role}
                      {c.key === "gender" && (p.gender ?? "—")}
                      {c.key === "phone" && <span className="font-mono">{p.phone ?? "—"}</span>}
                      {c.key === "email" && (p.email ?? "—")}
                      {c.key === "soberDate" && formatDate(p.soberDate)}
                      {c.key === "yearsSober" && (yrs !== null ? <span className="font-medium text-foreground">{formatYears(yrs)}</span> : "—")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

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

      {/* Filter panel */}
      <div className="print:hidden bg-card border border-card-border rounded-lg p-4 mb-4">
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
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7">Clear all</Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All roles" /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">All roles</SelectItem>
                {PERSON_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Gender</Label>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Male">Men</SelectItem>
                <SelectItem value="Female">Women</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Min years sober</Label>
            <Select value={minYears} onValueChange={setMinYears}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {MIN_YEARS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Sober date — from</Label>
            <Input type="date" value={soberFrom} onChange={(e) => setSoberFrom(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Sober date — to</Label>
            <Input type="date" value={soberTo} onChange={(e) => setSoberTo(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>

        {/* Column selector */}
        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Print columns</p>
          <div className="flex flex-wrap gap-3">
            {ALL_COLUMNS.map((c) => (
              <label key={c.key} className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={selectedCols.has(c.key)}
                  onCheckedChange={() => toggleCol(c.key)}
                  className="h-3.5 w-3.5"
                />
                <span className="text-xs text-foreground">{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort by:</span>
          {(["name", "soberDate", "role"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                sortBy === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {key === "soberDate" ? "Sober date" : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <p className="print:hidden text-sm text-muted-foreground mb-4">
        {peopleQuery.isLoading ? "Loading…" : `${filtered.length} of ${peopleQuery.data?.length ?? 0} members`}
      </p>

      {/* Print header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold">AA Member Contact List</h1>
        <p className="text-sm text-gray-500">
          Printed {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          {roleFilter !== "all" && ` · Role: ${roleFilter}`}
          {genderFilter !== "all" && ` · ${genderFilter === "Male" ? "Men" : "Women"} only`}
          {minYears !== "any" && ` · ${minYears}+ years sober`}
          {soberFrom && ` · Sober from ${soberFrom}`}
          {soberTo && ` · to ${soberTo}`}
        </p>
        <p className="text-sm text-gray-500 font-medium mt-1">{filtered.length} member{filtered.length !== 1 ? "s" : ""}</p>
      </div>

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
        <>
          {/* Screen: single table */}
          <div className="print:hidden">
            {renderTable(filtered)}
          </div>

          {/* Print: men's list, then women's list if gender filter is "all", else just the filtered list */}
          <div className="hidden print:block">
            {genderFilter === "all" && menOnly.length > 0 && womenOnly.length > 0 ? (
              <>
                {renderTable(menOnly, "Men's List")}
                {renderTable(womenOnly, "Women's List")}
                {filtered.filter((p: any) => p.gender !== "Male" && p.gender !== "Female").length > 0 &&
                  renderTable(filtered.filter((p: any) => p.gender !== "Male" && p.gender !== "Female"), "Other Members")}
              </>
            ) : (
              renderTable(filtered)
            )}
          </div>
        </>
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
