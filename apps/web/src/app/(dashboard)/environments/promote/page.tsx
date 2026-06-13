"use client";

import { PromoteDialog } from "@/features/environments/promote-dialog";
import { PromotionHistory } from "@/features/environments/promotion-history";

export default function PromotePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Promote</h1>
          <p className="text-sm text-muted-foreground">
            Promote workflows between environments
          </p>
        </div>
        <PromoteDialog />
      </div>
      <PromotionHistory />
    </div>
  );
}
