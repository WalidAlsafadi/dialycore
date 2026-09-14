import React, { useEffect, useState, useMemo } from "react";
import { api } from "../services/api";
import { Schedule as ScheduleType, Patient } from "../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Spinner } from "../components/ui/spinner";
import {
  ArrowLeft,
  Users,
  Clock,
  DoorOpen,
  Eye,
} from "lucide-react";

interface ScheduleWithPatient {
  schedule: ScheduleType;
  patient: Patient;
}

const DAY_BUTTONS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu"] as const;

const DAY_LABELS: Record<string, string> = {
  Sat: "Saturday",
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
};

/** Map JS getDay() (0=Sun) to our schedule day abbreviation */
function getTodayAbbr(): string {
  const jsDay = new Date().getDay(); // 0=Sun,1=Mon,...6=Sat
  const map: Record<number, string> = {
    0: "Sun",
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
  };
  const abbr = map[jsDay];
  // If today is Friday (no dialysis), default to Saturday
  return abbr === "Fri" ? "Sat" : abbr;
}

const PERIOD_COLORS: Record<number, string> = {
  1: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
  2: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
  3: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
};

const PERIOD_HEADER_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  2: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  3: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
};

export default function Schedule({
  onNavigate,
}: {
  onNavigate: (page: string, id?: number) => void;
}) {
  const [allSchedules, setAllSchedules] = useState<ScheduleWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(getTodayAbbr());
  const [error, setError] = useState("");

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError("");
      const results = await Promise.all(
        DAY_BUTTONS.map((day) => api.getSchedulesByDay(day)),
      );
      setAllSchedules(results.flat());
    } catch (err) {
      setError("Failed to load schedules");
      console.error(err);
      setAllSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // ----- Derived Data -----
  const daySchedules = useMemo(
    () => allSchedules.filter((s) => s.schedule.day_of_week === selectedDay),
    [allSchedules, selectedDay],
  );

  const rooms = useMemo((): string[] => {
    const set = new Set<string>(
      daySchedules.map((s) => s.schedule.room || "N/A"),
    );
    return Array.from(set).sort((a: string, b: string) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, [daySchedules]);

  const periods = useMemo((): number[] => {
    const set = new Set<number>(
      daySchedules
        .map((s) => s.schedule.period ?? 0)
        .filter((p): p is number => p > 0),
    );
    return Array.from(set).sort((a: number, b: number) => a - b);
  }, [daySchedules]);

  const grouped = useMemo(() => {
    const map: Record<string, Record<number, ScheduleWithPatient[]>> = {};
    for (const item of daySchedules) {
      const room = item.schedule.room || "N/A";
      const period = item.schedule.period ?? 0;
      if (!map[room]) map[room] = {};
      if (!map[room][period]) map[room][period] = [];
      map[room][period].push(item);
    }
    return map;
  }, [daySchedules]);

  const roomStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const item of daySchedules) {
      const room = item.schedule.room || "N/A";
      stats[room] = (stats[room] || 0) + 1;
    }
    return stats;
  }, [daySchedules]);

  const periodStats = useMemo(() => {
    const stats: Record<number, number> = {};
    for (const item of daySchedules) {
      const period = item.schedule.period ?? 0;
      stats[period] = (stats[period] || 0) + 1;
    }
    return stats;
  }, [daySchedules]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-1">
            Weekly Schedule
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            Dialysis sessions grouped by room &amp; period
          </p>
        </div>
        <Button onClick={() => onNavigate("dashboard")} variant="outline">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Dashboard
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Day Selector */}
      <div>
        <label className="text-sm font-semibold text-foreground block mb-3">
          Select Day
        </label>
        <div className="flex gap-2 flex-wrap">
          {DAY_BUTTONS.map((day) => {
            const isToday = day === getTodayAbbr();
            return (
              <Button
                key={day}
                variant={selectedDay === day ? "default" : "outline"}
                onClick={() => setSelectedDay(day)}
                className="font-medium relative"
              >
                {day}
                {isToday && (
                  <span className="ml-1.5 inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Day Stats — compact single bar */}
      {!loading && daySchedules.length > 0 && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-border">
              {/* Total */}
              <div className="flex items-center gap-3 pt-3 sm:pt-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary leading-none">
                    {daySchedules.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Total {DAY_LABELS[selectedDay]}
                  </p>
                </div>
              </div>

              {/* By Period */}
              <div className="flex items-center gap-4 pl-0 sm:pl-6 pt-3 sm:pt-0">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex gap-4">
                  {periods.map((period) => (
                    <div key={`ps-${period}`} className="text-center">
                      <p className="text-lg font-bold text-foreground leading-none">
                        {periodStats[period] || 0}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Period {period}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Room */}
              <div className="flex items-center gap-4 pl-0 sm:pl-6 pt-3 sm:pt-0">
                <DoorOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex gap-2 flex-wrap">
                  {rooms.map((room) => (
                    <div
                      key={`rs-${room}`}
                      className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2.5 py-1"
                    >
                      <span className="text-xs text-muted-foreground font-medium">
                        R{room}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {roomStats[room] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Grid — Grouped by Room, then Period */}
      {loading ? (
        <div className="flex justify-center py-12" role="status">
          <Spinner size="lg" className="text-primary" />
          <span className="sr-only">Loading schedules</span>
        </div>
      ) : daySchedules.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <p className="text-muted-foreground text-sm">
              No sessions scheduled for{" "}
              {DAY_LABELS[selectedDay] || selectedDay}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {rooms.map((room) => {
            const roomPeriods = grouped[room] || {};
            const roomPeriodsKeys = Object.keys(roomPeriods)
              .map(Number)
              .sort((a, b) => a - b);

            return (
              <Card key={room} className="overflow-hidden">
                {/* Room Header */}
                <CardHeader className="bg-muted/50 border-b py-3 px-4 sm:px-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <DoorOpen className="h-5 w-5 text-primary" />
                    Room {room}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {roomStats[room]} patients
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {roomPeriodsKeys.map((period) => {
                    const patients = roomPeriods[period] || [];
                    if (patients.length === 0) return null;

                    return (
                      <div key={period} className="border-b last:border-b-0">
                        {/* Period Header */}
                        <div
                          className={`px-4 sm:px-6 py-2 text-sm font-semibold flex items-center gap-2 ${PERIOD_HEADER_COLORS[period] ||
                            "bg-muted text-muted-foreground"
                            }`}
                        >
                          <Clock className="h-4 w-4" />
                          Period {period}
                          <span className="text-xs font-normal opacity-75 ml-1">
                            ({patients.length} patients)
                          </span>
                        </div>

                        {/* Patient Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/30">
                                <th className="text-left px-4 sm:px-6 py-2 text-xs font-semibold text-muted-foreground uppercase w-8">
                                  #
                                </th>
                                <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground uppercase">
                                  Patient Name
                                </th>
                                <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">
                                  File No.
                                </th>
                                <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">
                                  ID Number
                                </th>
                                <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">
                                  Gender
                                </th>
                                <th className="text-right px-4 sm:px-6 py-2 text-xs font-semibold text-muted-foreground uppercase">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {patients.map((item, idx) => (
                                <tr
                                  key={item.schedule.schedule_id || idx}
                                  className={`border-b last:border-b-0 hover:bg-muted/40 transition-colors ${PERIOD_COLORS[period] || ""
                                    }`}
                                >
                                  <td className="px-4 sm:px-6 py-3 text-xs text-muted-foreground font-medium">
                                    {idx + 1}
                                  </td>
                                  <td className="px-2 py-3">
                                    <p className="font-semibold text-foreground">
                                      {item.patient.first_name_ar}{" "}
                                      {item.patient.last_name_ar}
                                    </p>
                                  </td>
                                  <td className="px-2 py-3 text-muted-foreground hidden sm:table-cell">
                                    {item.patient.file_number}
                                  </td>
                                  <td className="px-2 py-3 text-muted-foreground hidden md:table-cell">
                                    {item.patient.id_number}
                                  </td>
                                  <td className="px-2 py-3 hidden lg:table-cell">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${item.patient.gender === "M"
                                          ? "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/30"
                                          : "border-pink-300 text-pink-700 bg-pink-50 dark:bg-pink-950/30"
                                        }`}
                                    >
                                      {item.patient.gender === "M"
                                        ? "Male"
                                        : "Female"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 sm:px-6 py-3 text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                      onClick={() =>
                                        onNavigate(
                                          "patient_details",
                                          item.patient.patient_id,
                                        )
                                      }
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
