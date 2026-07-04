"use client";

import { useState } from "react";
import { useListTenants } from "@longox/api-client-react";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function TenantSwitcher() {
  const { user } = useAuth();
  const { data: tenants } = useListTenants();
  const [activeTenantId, setActiveTenantId] = useState<string | null>(
    user?.tenantId ?? null,
  );

  const activeTenant = tenants?.find((t) => String(t.id) === activeTenantId);
  const initials = activeTenant?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-9 w-9 shrink-0 items-center justify-center gap-2 px-0 sm:h-9 sm:w-auto sm:justify-start sm:px-2"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
            {initials ?? "?"}
          </div>
          <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
            {activeTenant?.name ?? "Select tenant"}
          </span>
          <ChevronDown className="ml-auto hidden h-3 w-3 shrink-0 text-muted-foreground sm:inline" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch tenant</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants?.map((t) => (
          <DropdownMenuItem
            key={t.id}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTenantId(String(t.id))}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
              {t.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{t.plan}</p>
            </div>
            {String(t.id) === activeTenantId && (
              <Check className="h-4 w-4 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-muted-foreground">
          <Plus className="h-4 w-4" />
          <span>Create tenant</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
