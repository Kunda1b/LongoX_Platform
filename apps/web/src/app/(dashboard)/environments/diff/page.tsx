"use client";

import { DiffViewer } from "@/features/environments/diff-viewer";

export default function DiffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Diff</h1>
        <p className="text-sm text-muted-foreground">
          Compare workflow versions across environments
        </p>
      </div>
      <DiffViewer />
    </div>
  );
}
