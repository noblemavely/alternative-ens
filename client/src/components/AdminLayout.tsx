import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Menu,
  Users,
  Briefcase,
  FileText,
  Home,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  UserCircle2,
  Network,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: "Dashboard",  icon: Home,      href: "/admin",          exact: true },
  { label: "Clients",    icon: Users,     href: "/admin/clients" },
  { label: "Experts",    icon: UserCircle2, href: "/admin/experts" },
  { label: "Projects",   icon: Briefcase, href: "/admin/projects" },
];

function getPageTitle(pathname: string): string {
  if (pathname === "/admin" || pathname === "/admin/") return "Dashboard";
  if (pathname.startsWith("/admin/clients")) return "Clients";
  if (pathname.startsWith("/admin/experts")) return "Experts";
  if (pathname.startsWith("/admin/projects")) return "Projects";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  if (pathname.startsWith("/admin/users")) return "Users";
  return "Admin";
}

function UserInitials({ name, email }: { name?: string; email?: string }) {
  const display = name || email || "A";
  const parts = display.split(" ");
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : display.slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-[#0176D3] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
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
      <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3]">
        <div className="text-center bg-white rounded border border-border p-10 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <UserCircle2 size={28} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold mb-2 text-foreground">Access Denied</h1>
          <p className="text-muted-foreground text-sm mb-6">
            You don't have permission to access this area.
          </p>
          <Button onClick={() => setLocation("/")} size="sm">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const pathname = location.split("?")[0];
  const pageTitle = getPageTitle(pathname);

  const isActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.exact) return pathname === item.href || pathname === item.href + "/";
    return pathname.startsWith(item.href);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F3F3]">
      {/* ── Sidebar ── */}
      <aside
        className={`${
          collapsed ? "w-[56px]" : "w-[220px]"
        } bg-[#032D60] flex flex-col flex-shrink-0 transition-all duration-200 overflow-hidden`}
        style={{ boxShadow: "2px 0 8px rgba(0,0,0,0.18)" }}
      >
        {/* Logo row */}
        <div
          className={`h-14 flex items-center flex-shrink-0 border-b border-white/10 ${
            collapsed ? "justify-center px-0" : "px-4 gap-3"
          }`}
        >
          {!collapsed && (
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663387762142/GGrdr6YE4DiKCgcDQKRagu/Alternative_Logo_White_Background-removebg-preview_9d4821e4.png"
              alt="AlterNatives"
              className="h-7 w-auto object-contain brightness-0 invert"
            />
          )}
          {collapsed && (
            <Network size={22} className="text-white opacity-80" />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button
                key={item.href}
                onClick={() => setLocation(item.href)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 rounded text-sm font-medium transition-colors
                  ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}
                  ${
                    active
                      ? "bg-white/[0.15] text-white"
                      : "text-[#B0C4DE] hover:bg-white/[0.08] hover:text-white"
                  }`}
                style={
                  active
                    ? { borderLeft: "3px solid #0176D3", paddingLeft: collapsed ? undefined : "calc(0.75rem - 3px)" }
                    : { borderLeft: "3px solid transparent", paddingLeft: collapsed ? undefined : "calc(0.75rem - 3px)" }
                }
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/10 p-2 space-y-0.5">
          {/* Settings */}
          <button
            onClick={() => setLocation("/admin/settings")}
            title={collapsed ? "Settings" : undefined}
            className={`w-full flex items-center gap-3 rounded text-sm font-medium transition-colors text-[#B0C4DE] hover:bg-white/[0.08] hover:text-white
              ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}`}
            style={{ borderLeft: "3px solid transparent", paddingLeft: collapsed ? undefined : "calc(0.75rem - 3px)" }}
          >
            <Settings size={18} className="flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            disabled={logoutMutation.isPending}
            className={`w-full flex items-center gap-3 rounded text-sm font-medium transition-colors text-[#B0C4DE] hover:bg-white/[0.08] hover:text-white disabled:opacity-50
              ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}`}
            style={{ borderLeft: "3px solid transparent", paddingLeft: collapsed ? undefined : "calc(0.75rem - 3px)" }}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>

          {/* User identity */}
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-2.5 mt-1 rounded bg-white/[0.06]">
              <UserInitials name={user?.name} email={user?.email} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || "Admin"}
                </p>
                <p className="text-[11px] text-[#9FB6CD] truncate">{user?.email}</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center py-1">
              <UserInitials name={user?.name} email={user?.email} />
            </div>
          )}
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-border flex items-center px-5 gap-4 flex-shrink-0"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Page title / breadcrumb */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-muted-foreground hidden sm:inline">AlterNatives</span>
            <span className="text-muted-foreground hidden sm:inline">/</span>
            <span className="font-semibold text-foreground">{pageTitle}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Quick search…"
                className="h-8 pl-8 pr-3 text-xs rounded border border-border bg-secondary focus:outline-none focus:ring-1 focus:ring-primary w-44 focus:w-56 transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) setLocation(`/admin/experts?search=${encodeURIComponent(val)}`);
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <UserInitials name={user?.name} email={user?.email} />
              <span className="text-sm font-medium text-foreground hidden sm:inline">
                {user?.name?.split(" ")[0] || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
