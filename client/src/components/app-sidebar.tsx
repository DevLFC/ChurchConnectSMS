import { BarChart3, Calendar, FileText, Home, MessageSquare, Settings, Users, Send, Gift, List } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    roles: ["Admin", "Pastor", "Secretary", "Department Leader"],
  },
  {
    title: "Members",
    url: "/members",
    icon: Users,
    roles: ["Admin", "Pastor", "Secretary", "Department Leader"],
  },
  {
    title: "Attendance",
    url: "/attendance",
    icon: Calendar,
    roles: ["Admin", "Pastor", "Secretary", "Department Leader"],
  },
  {
    title: "SMS Templates",
    url: "/templates",
    icon: FileText,
    roles: ["Admin", "Pastor", "Secretary"],
  },
  {
    title: "Send SMS",
    url: "/send-sms",
    icon: Send,
    roles: ["Admin", "Pastor", "Secretary"],
  },
  {
    title: "Birthday Messages",
    url: "/birthday-messages",
    icon: Gift,
    roles: ["Admin", "Pastor", "Secretary", "Department Leader"],
  },
  {
    title: "Birthday Logs",
    url: "/birthday-logs",
    icon: List,
    roles: ["Admin", "Pastor"],
  },
  {
    title: "SMS History",
    url: "/history",
    icon: MessageSquare,
    roles: ["Admin", "Pastor", "Secretary"],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["Admin"],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  
  const { data: user, isLoading, error } = useQuery<{ id: string; username: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  const visibleMenuItems = menuItems.filter((item) => 
    user && item.roles.includes(user.role)
  );

  if (isLoading) {
    return (
      <Sidebar className="bg-gradient-to-b from-blue-600 to-purple-600">
        <SidebarHeader className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">Church SMS</h2>
              <p className="text-xs text-sidebar-foreground/70">Connect & Engage</p>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium">Loading...</SidebarGroupLabel>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
            <p className="text-xs text-foreground font-semibold mb-1">SMS Integration</p>
            <p className="text-xs text-muted-foreground">Configure in Settings</p>
          </div>
        </SidebarFooter>
      </Sidebar>
    );
  }

  if (error) {
    const isAuthError = error && typeof error === 'object' && 'status' in error && error.status === 401;
    
    if (isAuthError) {
      return (
        <Sidebar className="bg-gradient-to-b from-blue-600 to-purple-600">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
                <BarChart3 className="h-6 w-6 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-sidebar-foreground">Church SMS</h2>
                <p className="text-xs text-sidebar-foreground/70">Connect & Engage</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium">Not Authenticated</SidebarGroupLabel>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <div className="rounded-lg bg-sidebar-accent p-4">
              <p className="text-xs text-sidebar-accent-foreground font-medium mb-1">SMS Integration</p>
              <p className="text-xs text-sidebar-accent-foreground/70">Configure providers in Settings</p>
            </div>
          </SidebarFooter>
        </Sidebar>
      );
    }
    
    return (
      <Sidebar className="bg-gradient-to-b from-blue-600 to-purple-600">
        <SidebarHeader className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">Church SMS</h2>
              <p className="text-xs text-sidebar-foreground/70">Connect & Engage</p>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium">Loading...</SidebarGroupLabel>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
            <p className="text-xs text-foreground font-semibold mb-1">SMS Integration</p>
            <p className="text-xs text-muted-foreground">Configure in Settings</p>
          </div>
        </SidebarFooter>
      </Sidebar>
    );
  }

  if (!user) {
    return (
      <Sidebar className="bg-gradient-to-b from-blue-600 to-purple-600">
        <SidebarHeader className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">Church SMS</h2>
              <p className="text-xs text-sidebar-foreground/70">Connect & Engage</p>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium">Loading...</SidebarGroupLabel>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
            <p className="text-xs text-foreground font-semibold mb-1">SMS Integration</p>
            <p className="text-xs text-muted-foreground">Configure in Settings</p>
          </div>
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="bg-gradient-to-b from-blue-600 to-purple-600">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <BarChart3 className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground">Church SMS</h2>
            <p className="text-xs text-sidebar-foreground/70">Connect & Engage</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive} 
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`} 
                      className={isActive ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600" : ""}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="rounded-lg bg-sidebar-accent p-4">
          <p className="text-xs text-sidebar-accent-foreground font-medium mb-1">SMS Integration</p>
          <p className="text-xs text-sidebar-accent-foreground/70">Configure providers in Settings</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
