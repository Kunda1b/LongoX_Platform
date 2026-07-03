"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Flag, Shield, ScrollText, Users, CreditCard } from "lucide-react";
import Link from "next/link";

const OVERVIEW_CARDS = [
  { title: "Tenants", icon: Building2, href: "/admin/tenants", count: "—", desc: "Multi-tenant management" },
  { title: "Feature Flags", icon: Flag, href: "/admin/feature-flags", count: "—", desc: "Feature rollouts" },
  { title: "RBAC", icon: Shield, href: "/admin/rbac", count: "—", desc: "Roles & permissions" },
  { title: "Audit Log", icon: ScrollText, href: "/admin/audit-log", count: "—", desc: "System events" },
  { title: "Users", icon: Users, href: "/admin/rbac", count: "—", desc: "User management" },
  { title: "Billing", icon: CreditCard, href: "/admin/billing", count: "—", desc: "Subscriptions" },
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Administer your workspace settings and configurations</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OVERVIEW_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="transition-colors hover:border-primary/50 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.count}</div>
                  <p className="text-xs text-muted-foreground">{card.desc}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
