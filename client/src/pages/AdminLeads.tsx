import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Inbox, Mail, Building2, Calendar, Tag } from "lucide-react";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const QUERY_COLORS: Record<string, string> = {
  client: "badge-info",
  advisor: "badge-success",
  other: "badge-neutral",
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminLeads() {
  const leadsQuery = trpc.leads.list.useQuery();
  const leads = leadsQuery.data ?? [];

  return (
    <AdminLayout>
      <PageBreadcrumb items={[{ label: "Leads" }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">
            {leads.length} submission{leads.length !== 1 ? "s" : ""} via alternatives.nativeworld.com/connect
          </p>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        {leadsQuery.isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
        ) : leads.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Inbox size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">No leads yet</p>
            <p className="text-xs text-muted-foreground">
              Leads submitted via <span className="font-mono text-primary">/connect</span> will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="sf-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Organization</th>
                    <th>Query Type</th>
                    <th>Details</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="muted text-xs font-mono">{lead.id}</td>
                      <td className="font-semibold text-foreground">{lead.name}</td>
                      <td>
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-primary hover:underline flex items-center gap-1 text-sm"
                        >
                          <Mail size={12} />
                          {lead.email}
                        </a>
                      </td>
                      <td className="muted">{lead.organization || "—"}</td>
                      <td>
                        <span className={QUERY_COLORS[lead.queryType] ?? "badge-neutral"}>
                          {lead.queryTypeLabel}
                        </span>
                      </td>
                      <td className="max-w-xs">
                        {lead.queryType === "other" && lead.otherQuery ? (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={lead.otherQuery}>
                            {lead.otherQuery}
                          </p>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="muted text-xs whitespace-nowrap">{formatDate(lead.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {leads.map((lead) => (
                <div key={lead.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{lead.name}</p>
                      {lead.organization && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 size={11} /> {lead.organization}
                        </p>
                      )}
                    </div>
                    <span className={QUERY_COLORS[lead.queryType] ?? "badge-neutral"}>
                      {lead.queryTypeLabel}
                    </span>
                  </div>
                  <a href={`mailto:${lead.email}`} className="text-primary text-sm flex items-center gap-1.5 hover:underline">
                    <Mail size={13} /> {lead.email}
                  </a>
                  {lead.queryType === "other" && lead.otherQuery && (
                    <p className="text-xs text-muted-foreground bg-secondary rounded-lg p-3">{lead.otherQuery}</p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar size={11} /> {formatDate(lead.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
