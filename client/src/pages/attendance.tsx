import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Member, Attendance, InsertAttendance } from "@shared/schema";
import { CalendarIcon, UserCheck, UserX, Users, ArrowUpDown, Search, Filter, LayoutGrid, List, MessageSquare, User } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceMap, setAttendanceMap] = useState<Map<string, "Present" | "Absent">>(new Map());
  const [sortBy, setSortBy] = useState<"name" | "department" | "gender" | "status">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const dateString = format(selectedDate, "yyyy-MM-dd");

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: attendanceRecords = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", dateString],
    queryFn: async () => {
      const response = await fetch(`/api/attendance?date=${dateString}`);
      if (!response.ok) throw new Error("Failed to fetch attendance");
      return response.json();
    },
  });

  const activeMembers = members.filter((m) => m.status === "Active");

  const existingAttendance = attendanceRecords.filter(
    (record) => record.serviceDate === dateString
  );

  const markAttendanceMutation = useMutation({
    mutationFn: async (data: InsertAttendance[]) => {
      return await apiRequest("POST", "/api/attendance/bulk", { records: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setAttendanceMap(new Map());
      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });
    },
  });

  const toggleAttendance = (memberId: string) => {
    const newMap = new Map(attendanceMap);
    const current = newMap.get(memberId);
    
    if (!current) {
      newMap.set(memberId, "Present");
    } else if (current === "Present") {
      newMap.set(memberId, "Absent");
    } else {
      newMap.delete(memberId);
    }
    
    setAttendanceMap(newMap);
  };

  const getAttendanceStatus = (memberId: string): "Present" | "Absent" | null => {
    if (attendanceMap.has(memberId)) {
      return attendanceMap.get(memberId)!;
    }
    
    const existing = existingAttendance.find((a) => a.memberId === memberId);
    return existing ? (existing.status as "Present" | "Absent") : null;
  };

  const departments = useMemo(() => 
    Array.from(new Set(activeMembers.map((m) => m.department).filter(d => d && d.trim()))),
    [activeMembers]
  );

  const filteredAndSortedMembers = useMemo(() => {
    let filtered = [...activeMembers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(query)) ||
          (m.phone && m.phone.includes(query)) ||
          (m.department && m.department.toLowerCase().includes(query))
      );
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((m) => m.department === departmentFilter);
    }

    if (genderFilter !== "all") {
      filtered = filtered.filter((m) => m.gender === genderFilter);
    }

    return filtered.sort((a, b) => {
      if (sortBy === "name") {
        const aValue = a.name || "";
        const bValue = b.name || "";
        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      } else if (sortBy === "department") {
        const aValue = a.department || "";
        const bValue = b.department || "";
        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      } else if (sortBy === "gender") {
        const aValue = a.gender || "";
        const bValue = b.gender || "";
        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      } else if (sortBy === "status") {
        const aStatus = getAttendanceStatus(a.id);
        const bStatus = getAttendanceStatus(b.id);
        
        const getStatusOrder = (status: "Present" | "Absent" | null) => {
          if (status === "Present") return 0;
          if (status === "Absent") return 1;
          return 2;
        };
        
        const aOrder = getStatusOrder(aStatus);
        const bOrder = getStatusOrder(bStatus);
        
        if (aOrder < bOrder) return sortOrder === "asc" ? -1 : 1;
        if (aOrder > bOrder) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }
      return 0;
    });
  }, [activeMembers, searchQuery, departmentFilter, genderFilter, sortBy, sortOrder, attendanceMap]);

  const handleSubmit = () => {
    const records: InsertAttendance[] = Array.from(attendanceMap.entries()).map(
      ([memberId, status]) => ({
        memberId,
        serviceDate: dateString,
        status,
      })
    );

    if (records.length === 0) {
      toast({
        title: "No changes",
        description: "Please mark attendance for at least one member",
        variant: "destructive",
      });
      return;
    }

    markAttendanceMutation.mutate(records);
  };

  const sendSMSToPresent = () => {
    const presentMembers = filteredAndSortedMembers.filter(
      (m) => getAttendanceStatus(m.id) === "Present"
    );
    if (presentMembers.length === 0) {
      toast({
        title: "No Present Members",
        description: "No members marked as present to send SMS to",
        variant: "destructive",
      });
      return;
    }
    const memberIds = presentMembers.map((m) => m.id).join(",");
    setLocation(`/send-sms?recipients=${memberIds}&type=present`);
  };

  const sendSMSToAbsent = () => {
    const absentMembers = filteredAndSortedMembers.filter(
      (m) => getAttendanceStatus(m.id) === "Absent"
    );
    if (absentMembers.length === 0) {
      toast({
        title: "No Absent Members",
        description: "No members marked as absent to send SMS to",
        variant: "destructive",
      });
      return;
    }
    const memberIds = absentMembers.map((m) => m.id).join(",");
    setLocation(`/send-sms?recipients=${memberIds}&type=absent`);
  };

  const presentCount = activeMembers.filter((m) => {
    const status = getAttendanceStatus(m.id);
    return status === "Present";
  }).length;

  const absentCount = activeMembers.filter((m) => {
    const status = getAttendanceStatus(m.id);
    return status === "Absent";
  }).length;

  const unmarkedCount = activeMembers.length - presentCount - absentCount;

  const stats = [
    {
      title: "Total Members",
      value: activeMembers.length,
      icon: Users,
      color: "bg-chart-1",
    },
    {
      title: "Present",
      value: presentCount,
      icon: UserCheck,
      color: "bg-chart-3",
    },
    {
      title: "Absent",
      value: absentCount,
      icon: UserX,
      color: "bg-chart-4",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-4xl font-bold text-foreground font-['Poppins']">
            Attendance Tracking
          </h1>
          <p className="text-muted-foreground mt-2">
            Mark member attendance for church services
          </p>
        </motion.div>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  data-testid="button-select-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={handleSubmit}
                disabled={markAttendanceMutation.isPending || attendanceMap.size === 0}
                data-testid="button-save-attendance"
              >
                {markAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
              </Button>
              
              <Button
                variant="outline"
                onClick={sendSMSToPresent}
                disabled={presentCount === 0}
                data-testid="button-sms-present"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                SMS Present ({presentCount})
              </Button>
              
              <Button
                variant="outline"
                onClick={sendSMSToAbsent}
                disabled={absentCount === 0}
                data-testid="button-sms-absent"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                SMS Absent ({absentCount})
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center flex-wrap">
            <div className="relative flex-1 md:flex-none md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-attendance"
              />
            </div>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="select-department-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-full md:w-32" data-testid="select-gender-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-full md:w-40" data-testid="select-sort-by">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="gender">Gender</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              data-testid="button-sort-order"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                data-testid="button-grid-view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                data-testid="button-list-view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.color} rounded-full p-2`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground font-['Poppins']">
                    {stat.value}
                  </div>
                  {stat.title === "Total Members" && unmarkedCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {unmarkedCount} unmarked
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold font-['Poppins']">
              Mark Attendance - {format(selectedDate, "MMMM dd, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedMembers.map((member: Member) => {
                  const status = getAttendanceStatus(member.id);
                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className={cn(
                          "cursor-pointer transition-all hover-elevate",
                          status === "Present" && "border-chart-3",
                          status === "Absent" && "border-chart-4"
                        )}
                        onClick={() => toggleAttendance(member.id)}
                        data-testid={`card-member-${member.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {member.name}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {member.department || 'No Department'}
                              </p>
                            </div>
                            {status && (
                              <Badge
                                variant={status === "Present" ? "default" : "secondary"}
                                className={
                                  status === "Present"
                                    ? "bg-chart-3 text-white"
                                    : "bg-chart-4 text-white"
                                }
                              >
                                {status}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedMembers.map((member: Member) => {
                      const status = getAttendanceStatus(member.id);
                      return (
                        <TableRow
                          key={member.id}
                          className="cursor-pointer hover-elevate"
                          onClick={() => toggleAttendance(member.id)}
                          data-testid={`row-member-${member.id}`}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10">
                                  <User className="h-4 w-4 text-primary" />
                                </AvatarFallback>
                              </Avatar>
                              <span>{member.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{member.phone}</TableCell>
                          <TableCell>{member.department}</TableCell>
                          <TableCell>{member.gender}</TableCell>
                          <TableCell>
                            {status ? (
                              <Badge
                                variant={status === "Present" ? "default" : "secondary"}
                                className={
                                  status === "Present"
                                    ? "bg-chart-3 text-white"
                                    : "bg-chart-4 text-white"
                                }
                              >
                                {status}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Unmarked</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAttendance(member.id);
                              }}
                              data-testid={`button-toggle-${member.id}`}
                            >
                              Toggle
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            {filteredAndSortedMembers.length === 0 && (
              <p className="text-center text-muted-foreground py-8" data-testid="text-no-active-members">
                No active members found
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
