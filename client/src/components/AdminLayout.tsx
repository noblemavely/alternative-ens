import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Users,
  Briefcase,
  Home,
  Settings,
  Bell,
  Search,
  UserCircle2,
  Network,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin", exact: true },
  { label: "Clients",   icon: Users,           href: "/admin/clients" },
  { label: "Experts",   icon: UserCircle2,     href: "/admin/experts" },
  { label: "Projects",  icon: Briefcase,       href: "/admin/projects" },
  { label: "Leads",     icon: Inbox,           href: "/admin/leads" },
];

function getPageTitle(pathname: string): string {
  if (pathname === "/admin" || pathname === "/admin/") return "Dashboard";
  if (pathname.startsWith("/admin/clients"))  return "Clients";
  if (pathname.startsWith("/admin/experts"))  return "Experts";
  if (pathname.startsWith("/admin/projects")) return "Projects";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  if (pathname.startsWith("/admin/leads"))    return "Leads";
  return "Admin";
}

function Avatar({ name, email, size = "md" }: { name?: string; email?: string; size?: "sm" | "md" }) {
  const display = name || email || "A";
  const parts = display.split(" ");
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : display.slice(0, 2).toUpperCase();
  const dim = size === "sm" ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-xs";
  return (
    <div className={`${dim} rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0 ring-2 ring-white/10`}>
      {initials}
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const utils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      utils.auth.me.setData(undefined, null);
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      toast.success("Logged out successfully");
      setLocation("/");
    } catch {
      toast.error("Failed to logout");
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center bg-card rounded-xl border border-border p-10 shadow-md max-w-sm w-full mx-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <UserCircle2 size={26} className="text-red-500" />
          </div>
          <h1 className="text-lg font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-sm mb-6">
            You don't have permission to access this area.
          </p>
          <Button onClick={() => setLocation("/")} size="sm">Go Home</Button>
        </div>
      </div>
    );
  }

  const pathname = location.split("?")[0];
  const pageTitle = getPageTitle(pathname);

  const isActive = (item: typeof NAV_ITEMS[0]) =>
    item.exact
      ? pathname === item.href || pathname === item.href + "/"
      : pathname.startsWith(item.href);

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ─────────── Sidebar ─────────── */}
      <aside
        className={`${collapsed ? "w-[60px]" : "w-[240px]"} flex flex-col flex-shrink-0 transition-all duration-200 ease-in-out overflow-hidden`}
        style={{ background: "#0F172A" }}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center flex-shrink-0 border-b border-white/[0.06] ${collapsed ? "justify-center px-0" : "px-5"}`}>
          {collapsed ? (
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Network size={16} className="text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Network size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none tracking-tight">AlterNatives</p>
                <p className="text-white/40 text-[10px] mt-0.5 font-medium tracking-wide">EXPERT NETWORK</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {!collapsed && (
            <p className="nav-section-label mt-1 mb-2">Navigation</p>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button
                key={item.href}
                onClick={() => setLocation(item.href)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-100
                  ${collapsed ? "justify-center p-2.5" : "px-3 py-2"}
                  ${active
                    ? "bg-white/[0.10] text-white"
                    : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
                  }`}
              >
                <Icon
                  size={16}
                  className={`flex-shrink-0 transition-colors ${active ? "text-blue-400" : ""}`}
                />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 pb-3 space-y-0.5">
          <hr className="sidebar-divider" />

          <button
            onClick={() => setLocation("/admin/settings")}
            title={collapsed ? "Settings" : undefined}
            className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-100 text-white/50 hover:bg-white/[0.05] hover:text-white/80
              ${collapsed ? "justify-center p-2.5" : "px-3 py-2"}`}
          >
            <Settings size={16} className="flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </button>

          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            disabled={logoutMutation.isPending}
            className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-100 text-white/50 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40
              ${collapsed ? "justify-center p-2.5" : "px-3 py-2"}`}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>

          <hr className="sidebar-divider" />

          {/* User */}
          {collapsed ? (
            <div className="flex justify-center py-1">
              <Avatar name={user?.name} email={user?.email} />
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.04]">
              <Avatar name={user?.name} email={user?.email} />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-white truncate leading-none">
                  {user?.name || "Admin"}
                </p>
                <p className="text-[11px] text-white/40 truncate mt-0.5">{user?.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ─────────── Right panel ─────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top bar */}
        <header
          className="h-16 bg-card border-b border-border flex items-center px-5 gap-4 flex-shrink-0"
          style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}
        >
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[13px] min-w-0">
            <span className="text-muted-foreground/60 hidden sm:inline font-medium">AlterNatives</span>
            <span className="text-muted-foreground/40 hidden sm:inline">/</span>
            <span className="font-semibold text-foreground">{pageTitle}</span>
          </div>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search…"
                className="h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-secondary/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 w-40 focus:w-52 transition-all duration-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) setLocation(`/admin/experts?search=${encodeURIComponent(val)}`);
                  }
                }}
              />
            </div>

            {/* Bell */}
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors relative">
              <Bell size={15} />
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-1" />

            {/* User */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                {((user?.name || user?.email || "A").split(" ").length >= 2
                  ? (user!.name!.split(" ")[0][0] + user!.name!.split(" ")[1][0])
                  : (user?.name || user?.email || "A").slice(0, 2)
                ).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-[12.5px] font-semibold text-foreground leading-none">
                  {user?.name?.split(" ")[0] || "Admin"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
