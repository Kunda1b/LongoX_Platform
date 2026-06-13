"use client";

import { PromotionHistory } from "@/features/environments/promotion-history";

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Promotions</h1>
        <p className="text-sm text-muted-foreground">
          History of all workflow promotions across environments
        </p>
      </div>
      <PromotionHistory />
    </div>
  );
}
