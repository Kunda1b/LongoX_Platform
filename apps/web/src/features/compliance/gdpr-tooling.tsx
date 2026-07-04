"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  FileText,
  UserX,
  CheckCircle2,
} from "lucide-react";

export function GdprTooling() {
  const [exporting, setExporting] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/compliance/gdpr/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gdpr-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "GDPR data export completed" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteUserId.trim()) {
      toast({ title: "Please enter a user ID", variant: "destructive" });
      return;
    }
    if (!confirm("This will anonymize the user account per GDPR. This action cannot be undone. Continue?")) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/compliance/gdpr/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: String(deleteUserId), confirm: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Deletion failed");
      }
      toast({ title: "Account anonymized per GDPR request" });
      setDeleteUserId("");
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to anonymize account",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">GDPR Tooling</h1>
          <p className="text-sm text-muted-foreground">
            Manage GDPR compliance, data exports, and right-to-erasure requests
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              Export My Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Download all personal data associated with your account in JSON format.
              This includes your profile information and audit trail.
            </p>
            <div className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">What&apos;s included:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>User profile (name, email, role)</li>
                <li>Account activity and login history</li>
                <li>Audit log entries</li>
                <li>Workspace memberships</li>
              </ul>
            </div>
            <Button onClick={handleExportData} disabled={exporting} className="w-full">
              <Download className="mr-1 h-4 w-4" />
              {exporting ? "Exporting..." : "Export My Data"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <UserX className="h-4 w-4 text-muted-foreground" />
              Right to Erasure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Anonymize a user account in accordance with GDPR Article 17 (&quot;Right to erasure&quot;).
              The account will be permanently anonymized.
            </p>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
              <p className="flex items-center gap-1 font-medium mb-1">
                <AlertTriangle className="h-3 w-3" />
                Warning
              </p>
              <p>This action anonymizes the account irreversibly. The user will lose access permanently. Export their data first if needed.</p>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter User ID"
                value={deleteUserId}
                onChange={(e) => setDeleteUserId(e.target.value)}
              />
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {deleting ? "Processing..." : "Anonymize"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Data Processing Record
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              LongoX acts as a Data Processor on behalf of your organization (Data Controller).
              All data is processed in accordance with our DPA and GDPR compliance framework.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Data Processing Agreement</p>
                  <p className="text-xs text-muted-foreground">Standard contractual clauses</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Data Residency</p>
                  <p className="text-xs text-muted-foreground">Configured in tenant settings</p>
                </div>
                <Badge variant="secondary">EU / US</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Sub-processors</p>
                  <p className="text-xs text-muted-foreground">AWS, Stripe, SendGrid</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">GDPR</span>
                <Badge variant="success">Compliant</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SOC 2</span>
                <Badge variant="success">Compliant</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">HIPAA</span>
                <Badge variant="secondary">Not applicable</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Data Encryption at Rest</span>
                <Badge variant="success">AES-256</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Data Encryption in Transit</span>
                <Badge variant="success">TLS 1.3</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
