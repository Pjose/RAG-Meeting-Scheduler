import { useRef } from "react";
import { Link } from "wouter";
import { Printer, ArrowLeft } from "lucide-react";
import { useGetSchedule } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/lib/constants";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 23; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
}

function meetingFitsSlot(startTime: string, slot: string) {
  return startTime.slice(0, 2) === slot.slice(0, 2);
}

export default function PrintSchedule() {
  const scheduleQuery = useGetSchedule();
  const printRef = useRef<HTMLDivElement>(null);

  const byDay: Record<string, any[]> = {};
  for (const day of DAYS) byDay[day] = [];
  for (const { day, meetings } of scheduleQuery.data?.days ?? []) {
    byDay[day] = meetings;
  }

  const activeSlots = TIME_SLOTS.filter((slot) =>
    DAYS.some((d) => byDay[d].some((m) => meetingFitsSlot(m.startTime, slot)))
  );

  const handlePrint = () => window.print();

  return (
    <AdminLayout>
      <div className="print:hidden mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft size={14} />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Print: Weekly Schedule</h1>
            <p className="text-sm text-muted-foreground">Days across the top · time slots on the left</p>
          </div>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer size={15} />
          Print
        </Button>
      </div>

      {scheduleQuery.isLoading ? (
        <div className="space-y-3 print:hidden">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : (
        <div ref={printRef} className="overflow-x-auto">
          <div className="hidden print:block mb-4">
            <h1 className="text-2xl font-bold">AA Meeting Weekly Schedule</h1>
            <p className="text-sm text-gray-500">Printed {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>

          <table className="w-full border-collapse text-xs print:text-[9px]" style={{ minWidth: "700px" }}>
            <thead>
              <tr>
                <th className="border border-border bg-muted print:bg-gray-100 text-left px-2 py-2 font-semibold text-muted-foreground w-20 sticky left-0">
                  Time
                </th>
                {DAYS.map((d) => (
                  <th key={d} className="border border-border bg-sidebar text-sidebar-foreground print:bg-gray-800 print:text-white px-2 py-2 font-semibold text-center">
                    {d.slice(0, 3).toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(activeSlots.length > 0 ? activeSlots : TIME_SLOTS).map((slot) => {
                const hasAny = DAYS.some((d) => byDay[d].some((m) => meetingFitsSlot(m.startTime, slot)));
                return (
                  <tr key={slot} className={hasAny ? "bg-card" : "bg-background print:bg-white"}>
                    <td className="border border-border px-2 py-1.5 font-medium text-muted-foreground whitespace-nowrap sticky left-0 bg-inherit">
                      {formatTime(slot)}
                    </td>
                    {DAYS.map((day) => {
                      const meetings = byDay[day].filter((m) => meetingFitsSlot(m.startTime, slot));
                      return (
                        <td key={day} className="border border-border px-1.5 py-1 align-top">
                          {meetings.map((m) => {
                            const people = m.people ?? [];
                            return (
                              <div
                                key={m.id}
                                className="mb-1 last:mb-0 p-1 rounded bg-primary/8 print:bg-gray-50 border border-primary/20 print:border-gray-300"
                              >
                                <p className="font-semibold text-foreground leading-tight">{m.name}</p>
                                <p className="text-muted-foreground mt-0.5">
                                  {formatTime(m.startTime)}–{formatTime(m.endTime)}
                                </p>
                                <p className="text-muted-foreground">{m.type} · {m.format}</p>
                                {people.length > 0 && (
                                  <div className="mt-0.5 space-y-0.5">
                                    {people.map((p: any) => (
                                      <p key={p.id} className="text-foreground leading-tight">
                                        <span className="font-medium">{p.name}</span>
                                        {(p.assignedRole || p.role) && (
                                          <span className="text-muted-foreground"> · {p.assignedRole || p.role}</span>
                                        )}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {scheduleQuery.data?.days?.length === 0 && (
            <p className="text-center py-12 text-muted-foreground">No meetings scheduled.</p>
          )}
        </div>
      )}

      <style>{`
        @media print {
          @page { size: landscape; margin: 1cm; }
          body { font-size: 9px; }
        }
      `}</style>
    </AdminLayout>
  );
}
