"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Calendar, BarChart3 } from "lucide-react";
import { useListAuditLog } from "@longox/api-client-react";

export function AuditExport() {
  const { data: entries } = useListAuditLog();
  const [format, setFormat] = useState("json");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ format });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/compliance/audit/export?${params.toString()}`, {
        headers: { Accept: format === "csv" ? "text/csv" : "application/json" },
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Audit log exported successfully" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Export</h1>
            <p className="text-sm text-muted-foreground">
              Export audit log entries for compliance and auditing purposes
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Export Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleExport} disabled={exporting}>
            <Download className="mr-1 h-4 w-4" />
            {exporting ? "Exporting..." : `Export as ${format.toUpperCase()}`}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{entries?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Retention Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">90 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Format Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="secondary">JSON</Badge>
              <Badge variant="secondary">CSV</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
