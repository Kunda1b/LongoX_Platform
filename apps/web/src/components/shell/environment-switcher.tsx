"use client";

import { useListEnvironments } from "@longox/api-client-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function EnvironmentSwitcher() {
  const { data: environments } = useListEnvironments();
  const [activeEnv, setActiveEnv] = useState<string | null>(null);

  const currentEnv = environments?.find((e) => e.name === activeEnv);
  const getEnvColor = (type: string) => {
    switch (type) {
      case "prod":
        return "bg-red-500";
      case "staging":
        return "bg-yellow-500";
      case "dev":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-9 items-center gap-2 px-2">
          <div
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              getEnvColor(currentEnv?.type ?? "dev"),
            )}
          />
          <span className="max-w-[100px] truncate text-sm font-medium">
            {currentEnv?.name ?? "Environment"}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>Switch environment</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {environments?.map((e) => (
          <DropdownMenuItem
            key={e.id}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveEnv(e.name)}
          >
            <div className={cn("h-2 w-2 rounded-full", getEnvColor(e.type))} />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm">{e.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {e.type}
              </span>
            </div>
            {e.name === activeEnv && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
