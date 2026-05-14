import React from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Users, Briefcase, UserCircle2, ArrowRight, TrendingUp, Building2 } from "lucide-react";
import { useLocation } from "wouter";

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  href,
  navigate,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  href: string;
  navigate: (path: string) => void;
}) {
  return (
    <div
      className="stat-card cursor-pointer group"
      onClick={() => navigate(href)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-card-label">{label}</p>
          <p className="stat-card-value">{value}</p>
        </div>
        <div className="stat-card-icon flex-shrink-0" style={{ background: iconBg }}>
          <Icon size={20} style={{ color: iconColor }} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[#0176D3] opacity-0 group-hover:opacity-100 transition-opacity">
        <span>View all</span>
        <ArrowRight size={12} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const clientsQuery = trpc.clients.list.useQuery();
  const expertsQuery = trpc.experts.list.useQuery();
  const projectsQuery = trpc.projects.list.useQuery();

  const totalClients  = clientsQuery.data?.length ?? 0;
  const totalExperts  = expertsQuery.data?.length ?? 0;
  const totalProjects = projectsQuery.data?.length ?? 0;
  const verified      = expertsQuery.data?.filter((e) => e.isVerified).length ?? 0;

  const recentClients = clientsQuery.data?.slice(-5).reverse() ?? [];
  const recentExperts = expertsQuery.data?.slice(-5).reverse() ?? [];

  return (
    <AdminLayout>
      {/* ── Page Header ── */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of your expert network
        </p>
      </div>

      {/* ── Stat Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Clients"
          value={totalClients}
          icon={Building2}
          iconBg="#E8F4FD"
          iconColor="#0176D3"
          href="/admin/clients"
          navigate={navigate}
        />
        <StatCard
          label="Total Experts"
          value={totalExperts}
          icon={UserCircle2}
          iconBg="#EFF7EE"
          iconColor="#2E844A"
          href="/admin/experts"
          navigate={navigate}
        />
        <StatCard
          label="Active Projects"
          value={totalProjects}
          icon={Briefcase}
          iconBg="#FEF6E6"
          iconColor="#DD7A01"
          href="/admin/projects"
          navigate={navigate}
        />
        <StatCard
          label="Verified Experts"
          value={verified}
          icon={TrendingUp}
          iconBg="#F3F2FF"
          iconColor="#5867E8"
          href="/admin/experts"
          navigate={navigate}
        />
      </div>

      {/* ── Two-column panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Clients */}
        <div className="bg-white rounded border border-border" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Clients</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Latest additions to your network</p>
            </div>
            <button
              onClick={() => navigate("/admin/clients")}
              className="text-xs font-medium text-[#0176D3] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-border">
            {clientsQuery.isLoading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
            ) : recentClients.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No clients yet</div>
            ) : (
              recentClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-[#F3F8FE] cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/clients/${client.id}`)}
                >
                  <div className="w-8 h-8 rounded bg-[#E8F4FD] flex items-center justify-center flex-shrink-0">
                    <Building2 size={14} className="text-[#0176D3]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {client.sector || client.companyName || "—"}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Experts */}
        <div className="bg-white rounded border border-border" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Experts</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Latest expert registrations</p>
            </div>
            <button
              onClick={() => navigate("/admin/experts")}
              className="text-xs font-medium text-[#0176D3] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-border">
            {expertsQuery.isLoading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
            ) : recentExperts.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No experts yet</div>
            ) : (
              recentExperts.map((expert) => {
                const name = `${expert.firstName || ""} ${expert.lastName || ""}`.trim() || expert.email;
                const initials = (expert.firstName?.[0] ?? "") + (expert.lastName?.[0] ?? "") || "E";
                return (
                  <div
                    key={expert.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-[#F3F8FE] cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/experts/${expert.id}`)}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#EFF7EE] flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#2E844A]">
                      {initials.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {expert.sector || "No sector"}
                      </p>
                    </div>
                    <span
                      className={expert.isVerified ? "badge-success" : "badge-warning"}
                    >
                      {expert.isVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
