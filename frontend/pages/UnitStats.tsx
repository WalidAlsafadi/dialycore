import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { DialysisSession, Patient } from "../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Users,
} from "lucide-react";
import { toast } from "../components/ui/toast";

export default function UnitStats({
  onNavigate,
}: {
  onNavigate: (page: string, id?: number) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<DialysisSession[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [allSessions, allPatients] = await Promise.all([
        api.getAllSessions(),
        api.getPatients(undefined, 500),  // fetch all patients for demographics
      ]);
      setSessions(allSessions);
      setPatients(allPatients);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load unit statistics");
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPIs
  const totalSessions = sessions.length;

  const avgDuration =
    totalSessions > 0
      ? (
        sessions.reduce((acc, s) => acc + (s.duration_hours || 0), 0) /
        totalSessions
      ).toFixed(1)
      : 0;

  const avgWeightLoss =
    totalSessions > 0
      ? (
        sessions.reduce(
          (acc, s) =>
            acc + ((s.weight_before_kg || 0) - (s.weight_after_kg || 0)),
          0,
        ) / totalSessions
      ).toFixed(2)
      : 0;

  // Intervention utilization across all records. Structured fields are more
  // reliable and useful than inferring complications from free-text notes.
  const interventionData = [
    {
      name: "Anticoagulation",
      count: sessions.filter((session) => session.anticoagulation_used).length,
    },
    {
      name: "Erythropoietin",
      count: sessions.filter((session) => session.erythropoietin).length,
    },
    {
      name: "IV iron",
      count: sessions.filter((session) => session.venofer).length,
    },
    {
      name: "Transfusion",
      count: sessions.filter((session) => session.blood_transfusion).length,
    },
  ].map((intervention) => ({
    ...intervention,
    rate: totalSessions > 0
      ? Number(((intervention.count / totalSessions) * 100).toFixed(1))
      : 0,
  }));

  const medicationSupportCount = sessions.filter(
    (session) => session.erythropoietin || session.venofer,
  ).length;
  const medicationSupportRate = totalSessions > 0
    ? Math.round((medicationSupportCount / totalSessions) * 100)
    : 0;
  const documentedBpCount = sessions.filter(
    (session) =>
      session.bp_before_sys != null &&
      session.bp_before_dia != null &&
      session.bp_after_sys != null &&
      session.bp_after_dia != null,
  ).length;
  const documentedBpRate = totalSessions > 0
    ? (documentedBpCount / totalSessions) * 100
    : 0;

  // BP Control Analysis
  const bpControlData = sessions
    .filter((s) => s.bp_before_sys && s.bp_after_sys)
    .map((s) => ({
      date: s.session_date?.substring(5) || "N/A",
      preSys: s.bp_before_sys,
      postSys: s.bp_after_sys,
    }))
    .slice(-7);

  // Monthly session distribution from real data
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const sessionsByMonth = monthNames.map((month, i) => ({
    month,
    sessions: sessions.filter((s) => {
      if (!s.session_date) return false;
      const d = new Date(s.session_date);
      return d.getMonth() === i;
    }).length,
  }));

  // ---- Gender Distribution ----
  const genderCounts = patients.reduce(
    (acc, p) => {
      if (p.gender === "M") acc.male++;
      else if (p.gender === "F") acc.female++;
      else acc.other++;
      return acc;
    },
    { male: 0, female: 0, other: 0 },
  );
  const genderData = [
    { name: "Male", value: genderCounts.male, fill: "#4F8FEA" },
    { name: "Female", value: genderCounts.female, fill: "#E86B8A" },
    ...(genderCounts.other > 0 ? [{ name: "Unknown", value: genderCounts.other, fill: "#A0AEC0" }] : []),
  ];
  const GENDER_COLORS = ["#4F8FEA", "#E86B8A", "#A0AEC0"];

  // ---- Age Distribution ----
  const calcAge = (dob?: string) => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const AGE_GROUPS = [
    { label: "0–15", min: 0, max: 15 },
    { label: "16–30", min: 16, max: 30 },
    { label: "31–45", min: 31, max: 45 },
    { label: "46–60", min: 46, max: 60 },
    { label: "61–75", min: 61, max: 75 },
    { label: "75+", min: 76, max: 200 },
  ];
  const ageData = AGE_GROUPS.map((group) => ({
    name: group.label,
    count: patients.filter((p) => {
      const age = calcAge(p.date_of_birth);
      return age !== null && age >= group.min && age <= group.max;
    }).length,
  }));
  const AGE_BAR_COLORS = ["#7C3AED", "#4F8FEA", "#10B981", "#F59E0B", "#EF4444", "#6366F1"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
            Unit Analytics & Statistics
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            Quality metrics and operational performance indicators
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm">Loading statistics...</div>
      ) : (
        <>
          {/* KPI Cards Row 1 — matching Dashboard style */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-primary bg-gradient-to-br from-card to-primary/5 hover:from-card hover:to-primary/10">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex flex-col">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Total Sessions
                  </CardTitle>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {totalSessions}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  All-time records
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-blue-50 hover:from-card hover:to-blue-100">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex flex-col">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Avg. Session Duration
                  </CardTitle>
                </div>
                <div className="rounded-lg bg-blue-100 p-3">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {avgDuration}h
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Target: 4.5 hours
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-card to-green-50 hover:from-card hover:to-green-100">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex flex-col">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Avg. Weight Loss
                  </CardTitle>
                </div>
                <div className="rounded-lg bg-green-100 p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {avgWeightLoss} kg
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Per session average
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-card to-orange-50 hover:from-card hover:to-orange-100">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex flex-col">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Medication Support
                  </CardTitle>
                </div>
                <div className="rounded-lg bg-orange-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {medicationSupportRate}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Sessions with EPO or IV iron
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 - BP Trend & Monthly Sessions Side by Side */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* BP Control Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Blood Pressure Control Trend
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Systolic trends (Pre vs Post dialysis)
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                  {bpControlData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bpControlData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="date"
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
                          domain={[80, 160]}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="preSys"
                          stroke="#5B65DC"
                          strokeWidth={2}
                          name="Pre-Dialysis"
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="postSys"
                          stroke="#65DC5B"
                          strokeWidth={2}
                          name="Post-Dialysis"
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      No BP data available yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Session Volume */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Monthly Session Volume
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Sessions performed per month
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sessionsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="month"
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
                      />
                      <Tooltip
                        cursor={{ fill: "#f3f4f6" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="sessions"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 - Structured treatment interventions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Treatment Intervention Utilization
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Percentage of all sessions using each recorded intervention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {totalSessions > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={interventionData}
                      layout="vertical"
                      margin={{ left: 16, right: 32 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#f0fdfa" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(value: number, _name: string, props: any) => [
                          `${value}% (${props.payload.count} sessions)`,
                          "Utilization",
                        ]}
                      />
                      <Bar
                        dataKey="rate"
                        fill="hsl(var(--primary))"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No intervention data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Charts Row 3 - Gender Distribution & Age Distribution */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Gender Distribution (Donut Chart) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Users className="h-5 w-5" /> Gender Distribution
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Breakdown of patients by gender
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full">
                  {genderData.length > 0 && patients.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, value, percent }) =>
                            `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                          }
                          labelLine={true}
                        >
                          {genderData.map((_, index) => (
                            <Cell
                              key={`gender-${index}`}
                              fill={GENDER_COLORS[index % GENDER_COLORS.length]}
                              stroke="none"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        {/* Center label */}
                        <text
                          x="50%"
                          y="47%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-foreground"
                          style={{ fontSize: "28px", fontWeight: "bold" }}
                        >
                          {patients.length}
                        </text>
                        <text
                          x="50%"
                          y="56%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-muted-foreground"
                          style={{ fontSize: "12px" }}
                        >
                          Total Patients
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      No patient data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Age Distribution (Bar Chart) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Age Distribution
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Number of patients per age group
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[320px] w-full">
                  {patients.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageData}>
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
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ fill: "#f3f4f6" }}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          formatter={(value: number) => [`${value} patients`, "Count"]}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {ageData.map((_, index) => (
                            <Cell
                              key={`age-${index}`}
                              fill={AGE_BAR_COLORS[index % AGE_BAR_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      No patient data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quality Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Quality Performance Summary
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                 Operational indicators derived from recorded demo sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Metric
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Current
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Target
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">Avg. Session Duration</td>
                      <td className="py-3 px-4 font-medium">{avgDuration}h</td>
                      <td className="py-3 px-4">4.5h</td>
                      <td className="py-3 px-4">
                        {Number(avgDuration) >= 4.0 ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" /> Met
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-orange-600">
                            <AlertTriangle className="h-4 w-4" /> Below
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">Avg. Weight Loss</td>
                      <td className="py-3 px-4 font-medium">
                        {avgWeightLoss}kg
                      </td>
                      <td className="py-3 px-4">2-3kg</td>
                      <td className="py-3 px-4">
                        {Number(avgWeightLoss) >= 2 &&
                          Number(avgWeightLoss) <= 3 ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" /> Met
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-orange-600">
                            <AlertTriangle className="h-4 w-4" /> Adjust
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/50">
                      <td className="py-3 px-4">
                        Complete Pre/Post BP Documentation
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {documentedBpRate.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">≥95%</td>
                      <td className="py-3 px-4">
                        {documentedBpRate >= 95 ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" /> Met
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-4 w-4" /> Critical
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
