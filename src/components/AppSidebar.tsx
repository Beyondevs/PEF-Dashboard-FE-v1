import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardCheck,
  Trophy,
  FileText,
  School,
  FolderOpen,
  Settings,
  HelpCircle,
  UserCog,
  GraduationCap,
  MapPin,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const trainerItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Sessions', url: '/sessions', icon: Calendar },
  { title: 'Attendance', url: '/attendance', icon: Users },
  { title: 'Assessments', url: '/assessments', icon: ClipboardCheck },
  { title: 'Leaderboard', url: '/leaderboard', icon: Trophy },
  { title: 'Reports', url: '/reports', icon: FileText },
  { title: 'Schools', url: '/schools', icon: School },
  // { title: 'Repository', url: '/repository', icon: FolderOpen }, // Hidden for now
];

const teacherItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Sessions', url: '/sessions', icon: Calendar },
  { title: 'Assessments', url: '/assessments', icon: ClipboardCheck },
  { title: 'Leaderboard', url: '/leaderboard', icon: Trophy },
  { title: 'Reports', url: '/reports', icon: FileText },
];

const adminClientItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Sessions', url: '/sessions', icon: Calendar },
  { title: 'Attendance', url: '/attendance', icon: Users },
  { title: 'Assessments', url: '/assessments', icon: ClipboardCheck },
  { title: 'Leaderboard', url: '/leaderboard', icon: Trophy },
  { title: 'Reports', url: '/reports', icon: FileText },
  // { title: 'Repository', url: '/repository', icon: FolderOpen }, // Hidden for now
];

const userManagementItems = [
  { title: 'Trainers', url: '/admin/trainers', icon: UserCog },
  { title: 'Teachers', url: '/admin/teachers', icon: GraduationCap },
  { title: 'Students', url: '/admin/students', icon: Users },
];

const systemManagementItems = [
  { title: 'Schools', url: '/admin/schools', icon: School },
  { title: 'Geography', url: '/admin/geography', icon: MapPin },
];

const hybridMonitoringItems = [
  { title: 'Weekly Summaries', url: '/hybrid/weekly-summaries', icon: Settings },
];

export function AppSidebar() {
  const { role } = useAuth();
  
  const menuItems = 
    role === 'admin' || role === 'client' ? adminClientItems :
    role === 'trainer' ? trainerItems : 
    teacherItems;
  
  const showUserManagement = role === 'admin' || role === 'client';
  const showSystemManagement = role === 'admin' || role === 'client';
  const showHybridMonitoring = false; // Hidden for now

  return (
    <Sidebar className="border-r border-sidebar-border/20 backdrop-blur-sm">
      <SidebarContent className="gap-0 py-4">
        {/* Logo/Brand Area */}
        <div className="px-6 py-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-sidebar-foreground">Training Hub</h2>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{role}</p>
            </div>
          </div>
        </div>

        <SidebarGroup className="px-4 py-3">
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50 px-2 mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="group">
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden",
                          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:to-secondary/10 before:opacity-0 before:transition-opacity before:duration-300",
                          "hover:before:opacity-100 hover:translate-x-1",
                          isActive 
                            ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/80 text-sidebar-accent-foreground font-semibold shadow-md shadow-sidebar-accent/20" 
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                        )
                      }
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg transition-all duration-300",
                        "group-hover:scale-110 group-hover:rotate-3"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showUserManagement && (
          <SidebarGroup className="px-4 py-3 mt-2">
            <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border/50 to-transparent mb-4" />
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50 px-2 mb-2">
              User Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {userManagementItems
                  .filter((item) => role !== 'client' || item.url !== '/admin/trainers')
                  .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="group">
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden",
                            "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:to-secondary/10 before:opacity-0 before:transition-opacity before:duration-300",
                            "hover:before:opacity-100 hover:translate-x-1",
                            isActive 
                              ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/80 text-sidebar-accent-foreground font-semibold shadow-md shadow-sidebar-accent/20" 
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                          )
                        }
                      >
                        <div className={cn(
                          "p-1.5 rounded-lg transition-all duration-300",
                          "group-hover:scale-110 group-hover:rotate-3"
                        )}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showSystemManagement && (
          <SidebarGroup className="px-4 py-3 mt-2">
            <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border/50 to-transparent mb-4" />
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50 px-2 mb-2">
              System Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {systemManagementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="group">
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden",
                            "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:to-secondary/10 before:opacity-0 before:transition-opacity before:duration-300",
                            "hover:before:opacity-100 hover:translate-x-1",
                            isActive 
                              ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/80 text-sidebar-accent-foreground font-semibold shadow-md shadow-sidebar-accent/20" 
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                          )
                        }
                      >
                        <div className={cn(
                          "p-1.5 rounded-lg transition-all duration-300",
                          "group-hover:scale-110 group-hover:rotate-3"
                        )}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showHybridMonitoring && (
          <SidebarGroup className="px-4 py-3 mt-2">
            <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border/50 to-transparent mb-4" />
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50 px-2 mb-2">
              Hybrid Monitoring
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {hybridMonitoringItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="group">
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden",
                            "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:to-secondary/10 before:opacity-0 before:transition-opacity before:duration-300",
                            "hover:before:opacity-100 hover:translate-x-1",
                            isActive 
                              ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/80 text-sidebar-accent-foreground font-semibold shadow-md shadow-sidebar-accent/20" 
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                          )
                        }
                      >
                        <div className={cn(
                          "p-1.5 rounded-lg transition-all duration-300",
                          "group-hover:scale-110 group-hover:rotate-3"
                        )}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto px-4 py-3">
          <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border/50 to-transparent mb-4" />
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="group">
                  <NavLink 
                    to="/help"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden",
                        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-accent/10 before:to-accent/5 before:opacity-0 before:transition-opacity before:duration-300",
                        "hover:before:opacity-100 hover:translate-x-1",
                        isActive 
                          ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/80 text-sidebar-accent-foreground font-semibold shadow-md shadow-sidebar-accent/20" 
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                      )
                    }
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-all duration-300",
                      "group-hover:scale-110 group-hover:rotate-3"
                    )}>
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Help & Support</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
