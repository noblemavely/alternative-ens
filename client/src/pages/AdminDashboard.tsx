import React from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Users, Briefcase, UserCircle2, ArrowRight, TrendingUp, Building2, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  href,
  navigate,
  sublabel,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: { bg: string; color: string; ring: string };
  href: string;
  navigate: (path: string) => void;
  sublabel?: string;
}) {
  return (
    <div
      className="stat-card cursor-pointer group relative overflow-hidden"
      onClick={() => navigate(href)}
    >
      {/* Accent stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg opacity-80"
        style={{ background: accent.color }}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="stat-card-label">{label}</p>
          <p className="stat-card-value">{value}</p>
          {sublabel && (
            <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
          )}
        </div>
        <div
          className="stat-card-icon flex-shrink-0 ml-3"
          style={{ background: accent.bg }}
        >
          <Icon size={18} style={{ color: accent.color }} />
        </div>
      </div>

      <div
        className="mt-4 flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ color: accent.color }}
      >
        <span>View all</span>
        <ArrowRight size={11} />
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, action, onAction, children }: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-[13.5px] font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action && onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {action}
            <ArrowRight size={11} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const clientsQuery  = trpc.clients.list.useQuery();
  const expertsQuery  = trpc.experts.list.useQuery();
  const projectsQuery = trpc.projects.list.useQuery();

  const totalClients  = clientsQuery.data?.length  ?? 0;
  const totalExperts  = expertsQuery.data?.length  ?? 0;
  const totalProjects = projectsQuery.data?.length ?? 0;
  const verified      = expertsQuery.data?.filter((e) => e.isVerified).length ?? 0;

  const recentClients = clientsQuery.data?.slice(-6).reverse() ?? [];
  const recentExperts = expertsQuery.data?.slice(-6).reverse() ?? [];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-7">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your expert network</p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        <StatCard
          label="Total Clients"
          value={totalClients}
          icon={Building2}
          accent={{ bg: "#EFF6FF", color: "#2563EB", ring: "#BFDBFE" }}
          href="/admin/clients"
          navigate={navigate}
          sublabel="Active accounts"
        />
        <StatCard
          label="Total Experts"
          value={totalExperts}
          icon={UserCircle2}
          accent={{ bg: "#ECFDF5", color: "#059669", ring: "#A7F3D0" }}
          href="/admin/experts"
          navigate={navigate}
          sublabel="In your network"
        />
        <StatCard
          label="Active Projects"
          value={totalProjects}
          icon={Briefcase}
          accent={{ bg: "#FFFBEB", color: "#D97706", ring: "#FDE68A" }}
          href="/admin/projects"
          navigate={navigate}
          sublabel="Ongoing engagements"
        />
        <StatCard
          label="Verified Experts"
          value={verified}
          icon={CheckCircle2}
          accent={{ bg: "#F5F3FF", color: "#7C3AED", ring: "#DDD6FE" }}
          href="/admin/experts"
          navigate={navigate}
          sublabel={`${totalExperts > 0 ? Math.round((verified / totalExperts) * 100) : 0}% of total`}
        />
      </div>

      {/* Two-column panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Clients */}
        <SectionCard
          title="Recent Clients"
          subtitle="Latest additions to your network"
          action="View all"
          onAction={() => navigate("/admin/clients")}
        >
          <div>
            {clientsQuery.isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
            ) : recentClients.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No clients yet</div>
            ) : (
              recentClients.map((client, i) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/60 cursor-pointer transition-colors group"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
                  onClick={() => navigate(`/admin/clients/${client.id}`)}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Building2 size={14} className="text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {client.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {client.sector || client.companyName || "No sector"}
                    </p>
                  </div>
                  <ArrowRight size={13} className="text-muted-foreground/40 group-hover:text-primary/60 transition-colors flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Recent Experts */}
        <SectionCard
          title="Recent Experts"
          subtitle="Latest expert registrations"
          action="View all"
          onAction={() => navigate("/admin/experts")}
        >
          <div>
            {expertsQuery.isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
            ) : recentExperts.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No experts yet</div>
            ) : (
              recentExperts.map((expert, i) => {
                const name = `${expert.firstName || ""} ${expert.lastName || ""}`.trim() || expert.email;
                const initials = ((expert.firstName?.[0] ?? "") + (expert.lastName?.[0] ?? "")) || "E";
                return (
                  <div
                    key={expert.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/60 cursor-pointer transition-colors group"
                    style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
                    onClick={() => navigate(`/admin/experts/${expert.id}`)}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-emerald-700">
                      {initials.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {expert.sector || "No sector"}
                      </p>
                    </div>
                    <span className={expert.isVerified ? "badge-success" : "badge-warning"}>
                      {expert.isVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      </div>
    </AdminLayout>
  );
}
