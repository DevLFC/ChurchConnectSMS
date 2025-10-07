import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import Dashboard from "@/pages/dashboard";
import Members from "@/pages/members";
import AttendancePage from "@/pages/attendance";
import Templates from "@/pages/templates";
import SendSMS from "@/pages/send-sms";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import BirthdayMessages from "@/pages/birthday-messages";
import BirthdayLogs from "@/pages/birthday-logs";
import Login from "@/pages/login";
import Register from "@/pages/register";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { apiRequest } from "./lib/queryClient";

function ProtectedRouter() {
  const [location, navigate] = useLocation();
  const { data: user, isLoading } = useQuery<{ id: string; username: string; role: string }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !user && location !== "/login" && location !== "/register") {
      navigate("/login");
    }
  }, [user, isLoading, location, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user && (location === "/login" || location === "/register")) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
      </Switch>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    navigate("/login");
  };

  return (
    <SidebarProvider style={{ "--sidebar-width": "20rem", "--sidebar-width-icon": "4rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="text-sm text-muted-foreground">
                Welcome, <span className="font-semibold text-foreground">{user.username}</span> <span className="text-xs">({user.role})</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/members" component={Members} />
              <Route path="/attendance" component={AttendancePage} />
              <Route path="/templates" component={Templates} />
              <Route path="/send-sms" component={SendSMS} />
              <Route path="/birthday-messages" component={BirthdayMessages} />
              <Route path="/birthday-logs" component={BirthdayLogs} />
              <Route path="/history" component={History} />
              <Route path="/settings" component={Settings} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ProtectedRouter />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

