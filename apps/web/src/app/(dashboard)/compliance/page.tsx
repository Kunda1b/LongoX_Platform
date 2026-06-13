"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Clock, ShieldCheck, ChevronRight } from "lucide-react";

const complianceItems = [
  {
    title: "Audit Export",
    description: "Export audit log entries as JSON or CSV for compliance",
    icon: Download,
    href: "/compliance/audit-export",
    status: "Active",
  },
  {
    title: "Data Retention",
    description: "Configure data retention policies and auto-cleanup",
    icon: Clock,
    href: "/compliance/retention",
    status: "Configured",
  },
  {
    title: "GDPR Tooling",
    description: "Manage GDPR data exports and right-to-erasure requests",
    icon: ShieldCheck,
    href: "/compliance/gdpr",
    status: "Active",
  },
];

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
        <p className="text-sm text-muted-foreground">
          Audit exports, data retention policies, and GDPR tooling
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {complianceItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition-colors hover:border-primary/50 cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Badge variant="secondary" className="text-xs">{item.status}</Badge>
                  </div>
                  <CardTitle className="text-sm mt-3">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary">
                    <span>Open</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
