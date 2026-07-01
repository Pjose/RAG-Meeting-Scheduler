import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Printer, ArrowLeft } from "lucide-react";
import { useListTrustedServants } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

type SortKey = "title" | "member";

type ColKey = "member" | "description" | "termLength" | "startDate";

const ALL_COLUMNS: { key: ColKey; label: string }[] = [
  { key: "member", label: "Assigned To" },
  { key: "description", label: "Description" },
  { key: "termLength", label: "Term" },
  { key: "startDate", label: "Since" },
];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function PrintTrustedServants() {
  const [search, setSearch] = useState("");
  const [vacantOnly, setVacantOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("title");
  const [selectedCols, setSelectedCols] = useState<Set<ColKey>>(
    new Set(["member", "description", "termLength", "startDate"])
  );

  const { data, isLoading } = useListTrustedServants();

  const toggleCol = (col: ColKey) => {
    setSelectedCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col); else next.add(col);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const all = (data ?? []) as any[];
    return all
      .filter((ts) => {
        if (search && !ts.title.toLowerCase().includes(search.toLowerCase()) &&
            !(ts.memberName ?? "").toLowerCase().includes(search.toLowerCase())) return false;
        if (vacantOnly && ts.memberId) return false;
        return true;
      })
      .sort((a: any, b: any) => {
        if (sortBy === "title") return a.title.localeCompare(b.title);
        if (sortBy === "member") {
          const an = a.memberName ?? "";
          const bn = b.memberName ?? "";
          if (!an && !bn) return 0;
          if (!an) return 1;
          if (!bn) return -1;
          return an.localeCompare(bn);
        }
        return 0;
      });
  }, [data, search, vacantOnly, sortBy]);

  const visibleCols = ALL_COLUMNS.filter((c) => selectedCols.has(c.key));

  function renderTable(rows: any[]) {
    return (
      <div className="overflow-x-auto mb-8">
        <table className="w-full border-collapse text-sm print:text-[10px]">
          <thead>
            <tr className="bg-sidebar text-sidebar-foreground print:bg-gray-800 print:text-white">
              <th className="border border-border print:border-gray-300 px-3 py-2 text-left font-semibold">Position</th>
              {visibleCols.map((c) => (
                <th key={c.key} className="border border-border print:border-gray-300 px-3 py-2 text-left font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((ts, i) => (
              <tr key={ts.id} className={i % 2 === 0 ? "bg-card print:bg-white" : "bg-muted/40 print:bg-gray-50"}>
                <td className="border border-border print:border-gray-300 px-3 py-2 font-medium text-foreground">{ts.title}</td>
                {visibleCols.map((c) => (
                  <td key={c.key} className="border border-border print:border-gray-300 px-3 py-2 text-muted-foreground">
                    {c.key === "member" && (ts.memberName ? <span className="font-medium text-foreground">{ts.memberName}</span> : <span className="italic">Vacant</span>)}
                    {c.key === "description" && (ts.description ?? "—")}
                    {c.key === "termLength" && (ts.termLength ?? "—")}
                    {c.key === "startDate" && formatDate(ts.startDate)}
                  </td>
                ))}
              </tr>
            ))}
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
          <Link href="/admin/trusted-servants">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft size={14} />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Print: Trusted Servants</h1>
            <p className="text-sm text-muted-foreground">Filter positions then print</p>
          </div>
        </div>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer size={15} />
          Print
        </Button>
      </div>

      {/* Filter panel */}
      <div className="print:hidden bg-card border border-card-border rounded-lg p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div className="space-y-1.5 flex-1 min-w-40">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <Input
              placeholder="Position title or member name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={vacantOnly}
                onCheckedChange={(v) => setVacantOnly(!!v)}
                className="h-4 w-4"
              />
              <span className="text-xs text-foreground">Vacant positions only</span>
            </label>
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
          {(["title", "member"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                sortBy === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {key === "member" ? "Assigned To" : "Position Title"}
            </button>
          ))}
        </div>
      </div>

      <p className="print:hidden text-sm text-muted-foreground mb-4">
        {isLoading ? "Loading…" : `${filtered.length} of ${data?.length ?? 0} positions`}
      </p>

      {/* Print header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold">Trusted Servants</h1>
        <p className="text-sm text-gray-500">
          Printed {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          {vacantOnly && " · Vacant positions only"}
          {search && ` · Search: "${search}"`}
        </p>
        <p className="text-sm text-gray-500 font-medium mt-1">{filtered.length} position{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {isLoading ? (
        <div className="space-y-2 print:hidden">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground print:hidden">
          <p className="font-medium text-foreground">No positions match</p>
          <p className="text-sm mt-1">Try adjusting the filters above</p>
        </div>
      ) : (
        <>
          <div className="print:hidden">{renderTable(filtered)}</div>
          <div className="hidden print:block">{renderTable(filtered)}</div>
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
