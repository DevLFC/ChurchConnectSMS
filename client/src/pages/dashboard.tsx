import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Member, Attendance, SMSLog } from "@shared/schema";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: attendanceRecords = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  const { data: smsLogs = [] } = useQuery<SMSLog[]>({
    queryKey: ["/api/sms-logs"],
  });

  const currentMonth = format(new Date(), "yyyy-MM");
  const thisMonthAttendance = attendanceRecords.filter(
    (record) => record.serviceDate.startsWith(currentMonth)
  );

  const presentCount = thisMonthAttendance.filter(
    (record) => record.status === "Present"
  ).length;

  const absentCount = thisMonthAttendance.filter(
    (record) => record.status === "Absent"
  ).length;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return format(date, "yyyy-MM-dd");
  });

  const chartData = last7Days.map((date) => {
    const dayAttendance = attendanceRecords.filter(
      (record) => record.serviceDate === date
    );
    const present = dayAttendance.filter((r) => r.status === "Present").length;
    const absent = dayAttendance.filter((r) => r.status === "Absent").length;

    return {
      date: format(new Date(date), "MMM dd"),
      present,
      absent,
    };
  });

  const stats = [
    {
      title: "Total Members",
      value: members.length,
      icon: Users,
      color: "bg-chart-1",
      testId: "stat-total-members",
    },
    {
      title: "Present This Month",
      value: presentCount,
      icon: UserCheck,
      color: "bg-chart-3",
      testId: "stat-present-month",
    },
    {
      title: "Absent This Month",
      value: absentCount,
      icon: UserX,
      color: "bg-chart-4",
      testId: "stat-absent-month",
    },
    {
      title: "SMS Sent",
      value: smsLogs.length,
      icon: MessageSquare,
      color: "bg-chart-2",
      testId: "stat-sms-sent",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="text-4xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's an overview of your church community.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat) => (
            <motion.div key={stat.title} variants={itemVariants}>
              <Card className="glass-card shadow-soft hover:shadow-soft-lg transition-smooth">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.color} rounded-full p-2`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="text-3xl font-bold text-foreground"
                    data-testid={stat.testId}
                  >
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-card shadow-soft">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Attendance Trends (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="present"
                      stroke="hsl(var(--chart-3))"
                      fillOpacity={1}
                      fill="url(#colorPresent)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="absent"
                      stroke="hsl(var(--chart-4))"
                      fillOpacity={1}
                      fill="url(#colorAbsent)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full glass-card shadow-soft">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Recent SMS Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {smsLogs.slice(0, 5).map((log, idx) => (
                    <div key={log.id} className="flex items-start gap-3" data-testid={`sms-activity-${log.id}`}>
                      <div className="h-2 w-2 rounded-full bg-chart-2 mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate" data-testid={`sms-recipient-${log.id}`}>
                          {log.recipientName}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`sms-phone-${log.id}`}>
                          {log.recipientPhone}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1" data-testid={`sms-time-${log.id}`}>
                          {log.sentAt ? format(new Date(log.sentAt), "MMM dd, HH:mm") : "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {smsLogs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-sms">
                      No SMS sent yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
