import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSessionTimeout, getAdminResumeRoute, clearAdminResumeRoute } from "@/hooks/useSessionTimeout";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  BarChart3,
  ClipboardList,
  GraduationCap,
  CalendarDays,
  Trophy,
  UserCircle,
  LogOut,
  Menu,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { NotificationCenter } from "@/components/NotificationCenter";

const adminLinks = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Companies", url: "/admin/companies", icon: Building2 },
  { title: "Tests", url: "/admin/tests", icon: ClipboardList },
  { title: "Students", url: "/admin/students", icon: Users },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Reports", url: "/admin/reports", icon: FileText },
  { title: "Leaderboard", url: "/admin/leaderboard", icon: Trophy },
  { title: "Security", url: "/admin/settings", icon: Shield },
];

const studentLinks = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Companies", url: "/dashboard/companies", icon: Building2 },
  { title: "My Tests", url: "/dashboard/tests", icon: ClipboardList },
  { title: "Results", url: "/dashboard/results", icon: Trophy },
  { title: "Schedule", url: "/dashboard/schedule", icon: CalendarDays },
  { title: "Profile", url: "/dashboard/profile", icon: UserCircle },
];

function AppSidebar({ isAdmin }: { isAdmin: boolean }) {
  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">SmartPlace</span>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>{isAdmin ? "Admin" : "Student"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin" || item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { role, signOut, user } = useAuth();
  const isAdmin = role === "admin";
  const navigate = useNavigate();
  const location = useLocation();

  const [forceResetOpen, setForceResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Admin session timeout
  useAdminSessionTimeout();

  // Admin resume route after re-login (run only once on mount)
  useEffect(() => {
    if (isAdmin) {
      const resumeRoute = getAdminResumeRoute();
      clearAdminResumeRoute();
      if (resumeRoute && resumeRoute !== "/admin" && resumeRoute !== window.location.pathname) {
        navigate(resumeRoute, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const shouldForceReset = new URLSearchParams(location.search).get("force_password_reset") === "1";
    if (shouldForceReset) {
      setForceResetOpen(true);
    }
  }, [location.search]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  const handlePasswordUpdate = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingPassword(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const params = new URLSearchParams(location.search);
    params.delete("force_password_reset");

    toast.success("Password updated successfully");
    setForceResetOpen(false);
    setNewPassword("");
    setConfirmPassword("");

    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : "",
      },
      { replace: true }
    );
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar isAdmin={isAdmin} />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b px-4">
            <SidebarTrigger>
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <NotificationCenter />
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1 h-4 w-4" /> Sign out
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>

      <Dialog open={forceResetOpen} onOpenChange={(open) => open && setForceResetOpen(true)}>
        <DialogContent
          className="sm:max-w-md"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Set your new password</DialogTitle>
            <DialogDescription>
              For security, you must set a new password before continuing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-new-password">New password</Label>
              <Input
                id="recovery-new-password"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recovery-confirm-password">Confirm password</Label>
              <Input
                id="recovery-confirm-password"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button className="w-full" onClick={handlePasswordUpdate} disabled={isUpdatingPassword}>
              {isUpdatingPassword ? "Updating…" : "Update password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
