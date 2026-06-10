"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard, Download, ArrowUpRight } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and invoices
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Pro</div>
            <p className="text-xs text-muted-foreground">
              $29/month · 5,000 executions
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              <ArrowUpRight className="mr-1 h-4 w-4" /> Upgrade
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,341</div>
            <p className="text-xs text-muted-foreground">
              of 5,000 executions used
            </p>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div className="h-2 w-[47%] rounded-full bg-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Next Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$29.00</div>
            <p className="text-xs text-muted-foreground">Due Jul 1, 2026</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Invoices</CardTitle>
            <CardDescription>Recent billing history</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <CreditCard className="mr-1 h-4 w-4" /> Payment Methods
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { date: "Jun 1, 2026", amount: "$29.00", status: "paid" },
              { date: "May 1, 2026", amount: "$29.00", status: "paid" },
              { date: "Apr 1, 2026", amount: "$29.00", status: "paid" },
            ].map((inv) => (
              <div
                key={inv.date}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <span className="text-sm font-medium">{inv.date}</span>
                  <span className="ml-4 text-sm text-muted-foreground">
                    {inv.amount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">{inv.status}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
