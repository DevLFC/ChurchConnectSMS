import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { BirthdayLog, SMSProvider, Member } from "@shared/schema";
import { Search, Filter, CheckCircle, XCircle, Clock, ShieldAlert, X, Cake } from "lucide-react";
import { motion } from "framer-motion";
import { format, isToday, parseISO, startOfDay, endOfDay, differenceInDays, addYears } from "date-fns";

export default function BirthdayLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: user } = useQuery<{ id: string; username: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: birthdayLogs = [], isLoading } = useQuery<BirthdayLog[]>({
    queryKey: ["/api/birthday-logs"],
    enabled: user?.role === "Admin" || user?.role === "Pastor",
  });

  const { data: providers = [] } = useQuery<SMSProvider[]>({
    queryKey: ["/api/sms-providers"],
    enabled: user?.role === "Admin" || user?.role === "Pastor",
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
    enabled: user?.role === "Admin" || user?.role === "Pastor",
  });

  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const filteredLogs = useMemo(() => {
    return birthdayLogs.filter((log) => {
      const matchesSearch =
        log.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.memberPhone.includes(searchQuery);
      const matchesStatus = statusFilter === "all" || log.status === statusFilter;

      let matchesDateRange = true;
      if (fromDate || toDate) {
        let fromDateTime: Date | null = null;
        let toDateTime: Date | null = null;

        if (fromDate) {
          fromDateTime = startOfDay(parseLocalDate(fromDate));
        }

        if (toDate) {
          toDateTime = endOfDay(parseLocalDate(toDate));
        }

        // Swap if inverted
        if (fromDateTime && toDateTime && fromDateTime > toDateTime) {
          [fromDateTime, toDateTime] = [toDateTime, fromDateTime];
        }

        // Filter logic
        const logDateTime = new Date(log.sentAt);
        if (fromDateTime && logDateTime < fromDateTime) {
          matchesDateRange = false;
        }
        if (toDateTime && logDateTime > toDateTime) {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [birthdayLogs, searchQuery, statusFilter, fromDate, toDate]);

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
    });
  }, [filteredLogs]);

  const stats = useMemo(() => {
    const total = birthdayLogs.length;
    const today = birthdayLogs.filter((log) => isToday(new Date(log.sentAt))).length;
    const successful = birthdayLogs.filter((log) => log.status === "success").length;

    return { total, today, successful };
  }, [birthdayLogs]);

  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const activeMembers = members.filter((m) => m.status === "Active" && m.birthday);

    const birthdaysWithDates = activeMembers
      .map((member) => {
        try {
          const birthdayParts = member.birthday!.split('-');
          let month: number, day: number;

          if (birthdayParts.length === 3) {
            month = parseInt(birthdayParts[1], 10);
            day = parseInt(birthdayParts[2], 10);
          } else {
            month = parseInt(birthdayParts[0], 10);
            day = parseInt(birthdayParts[1], 10);
          }

          if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
            return null;
          }

          let nextBirthday = new Date(today.getFullYear(), month - 1, day);
          
          if (isNaN(nextBirthday.getTime())) {
            return null;
          }

          if (nextBirthday < today) {
            nextBirthday = addYears(nextBirthday, 1);
          }

          const daysUntil = differenceInDays(nextBirthday, today);

          return {
            member,
            nextBirthday,
            daysUntil,
            birthdayDisplay: format(nextBirthday, "MMM dd"),
          };
        } catch (error) {
          console.error(`Invalid birthday data for member ${member.name}:`, member.birthday);
          return null;
        }
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);

    return birthdaysWithDates
      .filter((b) => b.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [members]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-chart-3" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-chart-2" />;
    }
  };

  const getProviderName = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    return provider?.name || "Unknown";
  };

  if (!user || (user.role !== "Admin" && user.role !== "Pastor")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-destructive" />
              <CardTitle className="text-2xl font-bold">
                Access Denied
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You do not have permission to view this page. Only Admins and Pastors can access birthday logs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-4xl font-bold text-foreground">
            Birthday Logs
          </h1>
          <p className="text-muted-foreground mt-2">
            Track birthday messages sent to members
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Messages Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground" data-testid="text-total-messages">
                  {stats.total}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Messages Sent Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-3" data-testid="text-messages-today">
                  {stats.today}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Successful
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-3" data-testid="text-successful-messages">
                  {stats.successful}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Cake className="h-5 w-5 text-chart-1" />
              <CardTitle className="text-xl font-semibold">
                Upcoming Birthdays (Next 30 Days)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-upcoming-birthdays">
                No birthdays in the next 30 days
              </div>
            ) : (
              <div className="rounded-md border">
                <Table data-testid="table-upcoming-birthdays">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member Name</TableHead>
                      <TableHead>Birthday Date</TableHead>
                      <TableHead>Days Until</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingBirthdays.map((birthday) => (
                      <TableRow key={birthday.member.id} data-testid={`row-upcoming-birthday-${birthday.member.id}`}>
                        <TableCell className="font-medium" data-testid="text-upcoming-member-name">
                          {birthday.member.name}
                        </TableCell>
                        <TableCell data-testid="text-upcoming-birthday-date">
                          {birthday.birthdayDisplay}
                        </TableCell>
                        <TableCell data-testid="text-upcoming-days-until">
                          <Badge variant={birthday.daysUntil === 0 ? "default" : "outline"}>
                            {birthday.daysUntil === 0 ? "Today" : `${birthday.daysUntil} day${birthday.daysUntil === 1 ? "" : "s"}`}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card shadow-soft">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-xl font-semibold">
                  Birthday Logs ({sortedLogs.length})
                </CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 md:flex-none md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by member name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-logs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-40"
                    data-testid="input-date-from"
                    placeholder="From date"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-40"
                    data-testid="input-date-to"
                    placeholder="To date"
                  />
                  {(fromDate || toDate) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFromDate("");
                        setToDate("");
                      }}
                      data-testid="button-clear-date-filter"
                      title="Clear date filter"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40" data-testid="select-status-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table data-testid="table-birthday-logs">
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading birthday logs...
                      </TableCell>
                    </TableRow>
                  ) : sortedLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground" data-testid="text-no-logs">
                        {searchQuery || statusFilter !== "all" || fromDate || toDate
                          ? "No birthday logs found matching your filters"
                          : "No birthday messages have been sent yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedLogs.map((log) => (
                      <TableRow key={log.id} data-testid={`row-birthday-log-${log.id}`}>
                        <TableCell className="font-medium" data-testid="text-log-member-name">
                          {log.memberName}
                        </TableCell>
                        <TableCell>{log.memberPhone}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="max-w-md truncate text-sm text-muted-foreground cursor-help">
                                  {log.message}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <p className="whitespace-pre-wrap">{log.message}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.sentAt ? format(new Date(log.sentAt), "MMM dd, yyyy h:mm a") : "N/A"}
                        </TableCell>
                        <TableCell data-testid="text-log-status">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <Badge variant={log.status === "success" ? "default" : "destructive"}>
                              {log.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {getProviderName(log.providerId)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}
