import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, Users, Briefcase, FileText, Home, Settings } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setLocation("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  // Verify admin access
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You don't have permission to access this area.</p>
          <Button onClick={() => setLocation("/")} variant="default">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { label: "Dashboard", icon: Home, href: "/admin" },
    { label: "Clients", icon: Users, href: "/admin/clients" },
    { label: "Experts", icon: Users, href: "/admin/experts" },
    { label: "Projects", icon: Briefcase, href: "/admin/projects" },
    { label: "Settings", icon: Settings, href: "/admin/settings" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {sidebarOpen && (
            <img 
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663387762142/GGrdr6YE4DiKCgcDQKRagu/Alternative_Logo_White_Background-removebg-preview_9d4821e4.png" 
              alt="AlterNatives" 
              className="h-10 w-auto object-contain"
            />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => setLocation(item.href)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted text-foreground hover:text-accent"
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-border p-4 space-y-3">
          {sidebarOpen && (
            <div className="px-2 py-2">
              <p className="text-xs text-muted-foreground">Logged in as</p>
              <p className="text-sm font-medium text-foreground truncate">{user?.name || user?.email}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            disabled={logoutMutation.isPending}
          >
            <LogOut size={16} />
            {sidebarOpen && "Logout"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="h-16 border-b border-border flex items-center px-8 bg-card">
          <h2 className="text-xl font-bold text-foreground">Admin Dashboard</h2>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
