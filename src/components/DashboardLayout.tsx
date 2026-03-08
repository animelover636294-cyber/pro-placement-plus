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
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutDashboard, Building2, FileText, Users, BarChart3, ClipboardList,
  GraduationCap, CalendarDays, Trophy, UserCircle, LogOut, Menu, Shield,
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
    <Sidebar className="border-r border-white/[0.04] bg-[hsl(222,47%,5%)]">
      <SidebarContent>
        <div className="flex items-center gap-3 px-5 py-6">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, hsl(220 80% 55%), hsl(260 70% 55%))",
              boxShadow: "0 8px 20px -5px hsl(220 80% 50% / 0.3)",
            }}
          >
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white">SmartPlace</span>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="px-5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">
            {isAdmin ? "Admin" : "Student"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-3 mt-2">
            <SidebarMenu>
              {links.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin" || item.url === "/dashboard"}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/35 transition-all duration-200 hover:bg-white/[0.04] hover:text-white/70"
                      activeClassName="bg-gradient-to-r from-[hsl(220,80%,55%)] to-[hsl(260,70%,55%)] text-white shadow-lg shadow-[hsl(220,80%,50%)/0.2] font-semibold"
                    >
                      <item.icon className="h-4 w-4" />
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

  useAdminSessionTimeout();

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
    if (new URLSearchParams(location.search).get("force_password_reset") === "1") setForceResetOpen(true);
  }, [location.search]);

  const handleSignOut = async () => { await signOut(); toast.success("Signed out"); };

  const handlePasswordUpdate = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingPassword(false);
    if (error) { toast.error(error.message); return; }
    const params = new URLSearchParams(location.search);
    params.delete("force_password_reset");
    toast.success("Password updated successfully");
    setForceResetOpen(false);
    setNewPassword(""); setConfirmPassword("");
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : "" }, { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[hsl(222,47%,6%)]">
        <AppSidebar isAdmin={isAdmin} />
        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-white/[0.04] bg-[hsl(222,40%,8%)] px-6 backdrop-blur-xl">
            <SidebarTrigger><Menu className="h-5 w-5 text-white/40" /></SidebarTrigger>
            <div className="flex items-center gap-4">
              <span className="hidden text-sm font-medium text-white/30 sm:block">{user?.email}</span>
              <NotificationCenter />
              <ThemeToggle />
              <Button variant="ghost" size="sm" className="text-white/30 hover:text-white/60 hover:bg-white/[0.04]" onClick={handleSignOut}>
                <LogOut className="mr-1.5 h-4 w-4" /> Sign out
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>

      <Dialog open={forceResetOpen} onOpenChange={(open) => open && setForceResetOpen(true)}>
        <DialogContent
          className="rounded-2xl border border-white/[0.06] bg-[hsl(222,40%,9%)] shadow-3d sm:max-w-md"
          onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-white">Set your new password</DialogTitle>
            <DialogDescription className="text-white/40">For security, you must set a new password before continuing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-new-password" className="text-white/60 text-xs uppercase tracking-wider">New password</Label>
              <Input id="recovery-new-password" type="password" placeholder="At least 6 characters"
                className="border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/20 focus:border-ring"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recovery-confirm-password" className="text-white/60 text-xs uppercase tracking-wider">Confirm password</Label>
              <Input id="recovery-confirm-password" type="password" placeholder="Repeat your password"
                className="border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/20 focus:border-ring"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-gradient-to-r from-primary to-primary/80 border-0 font-bold shadow-lg shadow-primary/20" onClick={handlePasswordUpdate} disabled={isUpdatingPassword}>
              {isUpdatingPassword ? "Updating…" : "Update password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
