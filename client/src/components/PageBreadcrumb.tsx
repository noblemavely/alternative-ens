import React from "react";
import { useLocation } from "wouter";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Salesforce-style breadcrumb navigation.
 * Usage:
 *   <PageBreadcrumb items={[
 *     { label: "Clients", href: "/admin/clients" },
 *     { label: "Acme Corp" }
 *   ]} />
 */
export default function PageBreadcrumb({ items }: PageBreadcrumbProps) {
  const [, navigate] = useLocation();

  return (
    <nav className="flex items-center gap-1 text-sm mb-4" aria-label="Breadcrumb">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <ChevronRight size={13} className="text-muted-foreground flex-shrink-0" />
            )}
            {item.href && !isLast ? (
              <button
                onClick={() => navigate(item.href!)}
                className="text-[#0176D3] hover:underline font-medium truncate max-w-[160px]"
              >
                {item.label}
              </button>
            ) : (
              <span
                className={`truncate max-w-[200px] ${
                  isLast ? "text-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
