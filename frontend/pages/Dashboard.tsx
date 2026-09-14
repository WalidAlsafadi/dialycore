import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Schedule, Patient, User, DialysisSession } from "../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Spinner } from "../components/ui/spinner";
import {
  Users,
  ArrowRight,
  AlertTriangle,
  Clock,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { toast } from "../components/ui/toast";

export default function Dashboard({
  onNavigate,
  user,
}: {
  onNavigate: (page: string, id?: number) => void;
  user: User;
}) {
  const [todaySchedules, setTodaySchedules] = useState<
    { schedule: Schedule; patient: Patient }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [patientCount, setPatientCount] = useState(0);
  const [allSessions, setAllSessions] = useState<DialysisSession[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Get today's day name (Mon, Tue, etc)
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const todayDay = days[new Date().getDay()];

      const [schedData, countData, sessData] = await Promise.all([
        api.getSchedulesByDay(todayDay),
        api.getPatientCount(),
        api.getAllSessions(),
      ]);

      setTodaySchedules(schedData);
      setPatientCount(countData.count);
      setAllSessions(sessData);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Stable all-record profiles keep the demo informative regardless of date.
  const durationMixData = (() => {
    const buckets = [
      { name: "3.5 hours", sessions: 0 },
      { name: "4 hours", sessions: 0 },
      { name: "4.5 hours", sessions: 0 },
    ];

    allSessions.forEach((session) => {
      const duration = session.duration_hours;
      if (!duration) return;
      if (duration < 3.75) buckets[0].sessions++;
      else if (duration < 4.25) buckets[1].sessions++;
      else buckets[2].sessions++;
    });

    const total = buckets.reduce((sum, bucket) => sum + bucket.sessions, 0);
    return buckets.map((bucket) => ({
      ...bucket,
      rate: total > 0 ? Math.round((bucket.sessions / total) * 100) : 0,
    }));
  })();

  const anticoagulationData = (() => {
    const counts = allSessions.reduce((acc, session) => {
      const strategy = session.anticoagulation_used
        ? session.heparin_type || "Other"
        : "No anticoagulation";
      acc[strategy] = (acc[strategy] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (Object.entries(counts) as [string, number][])
      .map(([name, sessions]) => ({
        name,
        sessions,
        rate: allSessions.length > 0
          ? Math.round((sessions / allSessions.length) * 100)
          : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions);
  })();




  // Count sessions that happened today
  const todayStr = new Date().toISOString().split("T")[0];
  const sessionsToday = allSessions.filter(
    (s) => s.session_date === todayStr,
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
            {user.role === "doctor"
              ? `Good Morning, Dr. ${user.full_name}`
              : user.role === "nurse"
                ? `${user.full_name} - Shift Overview`
                : user.role === "guest"
                  ? "Explore the DialyCore Demo"
                : "Unit Dashboard"}
          </h1>
          <div className="text-sm sm:text-base text-muted-foreground font-medium">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary bg-gradient-to-br from-card to-primary/5 hover:from-card hover:to-primary/10">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="flex flex-col">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Active Patients
              </CardTitle>
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {patientCount}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Total Registered
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-card to-green-50 hover:from-card hover:to-green-100">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Sessions Today
              </CardTitle>
            </div>
            <div className="rounded-lg bg-green-100 p-3">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {sessionsToday}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Scheduled: {todaySchedules.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-blue-50 hover:from-card hover:to-blue-100">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Total Sessions
              </CardTitle>
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {allSessions.length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">All-time records</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-card to-orange-50 hover:from-card hover:to-orange-100">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Avg Duration
              </CardTitle>
            </div>
            <div className="rounded-lg bg-orange-100 p-3">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {allSessions.length > 0
                ? (
                  allSessions.reduce(
                    (a, s) => a + (s.duration_hours || 0),
                    0,
                  ) / allSessions.length
                ).toFixed(1)
                : "0"}
              h
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Per session average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {user.role !== "nurse" && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-1 md:col-span-2 lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Treatment Duration Mix
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Distribution across all recorded dialysis sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationMixData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      cursor={{ fill: "#f3f4f6" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value: number, _name: string, props: any) => [
                        `${value} sessions (${props.payload.rate}%)`,
                        "Session volume",
                      ]}
                    />
                    <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                      {durationMixData.map((_, index) => (
                        <Cell
                          key={`duration-${index}`}
                          fill={["#38bdf8", "#0f766e", "#14b8a6"][index]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Anticoagulation Strategy
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Treatment approach across all recorded sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[240px] w-full">
                {anticoagulationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={anticoagulationData} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: "#f0fdfa" }}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        formatter={(value: any, name: string, props: any) => [
                          `${value} sessions (${props.payload.rate}%)`,
                          "Session volume",
                        ]}
                      />
                      <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                        {anticoagulationData.map((_, index) => (
                          <Cell
                            key={`anticoagulation-${index}`}
                            fill={["#0f766e", "#14b8a6", "#5eead4", "#94a3b8"][index % 4]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground gap-1">
                    <Activity className="h-8 w-8 text-muted-foreground/40" />
                    No anticoagulation data recorded yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tables Section */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>
              {user.role === "nurse"
                ? "My Patient Queue"
                : "Today's Schedule"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-40" role="status">
                <Spinner size="lg" className="text-primary" />
                <span className="sr-only">Loading schedule</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>File No</TableHead>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaySchedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No sessions scheduled for today.
                      </TableCell>
                    </TableRow>
                  ) : (
                    todaySchedules.map(({ schedule, patient }) => (
                      <TableRow key={schedule.schedule_id}>
                        <TableCell className="font-medium">
                          {patient.first_name_ar} {patient.last_name_ar}
                        </TableCell>
                        <TableCell>{patient.file_number}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {patient.blood_group}
                          </Badge>
                        </TableCell>
                        <TableCell>{schedule.day_of_week}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onNavigate(
                                "patient_details",
                                patient.patient_id,
                              )
                            }
                          >
                            {user.role === "nurse"
                              ? "View Chart"
                              : "Open File"}{" "}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
