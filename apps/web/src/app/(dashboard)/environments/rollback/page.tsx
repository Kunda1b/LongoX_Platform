"use client";

import { RollbackPanel } from "@/features/environments/rollback-panel";

export default function RollbackPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rollback</h1>
        <p className="text-sm text-muted-foreground">
          Roll back promoted workflows to previous environments
        </p>
      </div>
      <RollbackPanel />
    </div>
  );
}
