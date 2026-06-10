import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Globe, Server, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

type Environment = {
  id: string;
  name: string;
  type: "dev" | "staging" | "prod";
  isDefault?: boolean;
};

const ENV_CONFIG: Record<string, { label: string; color: string; icon: typeof Globe }> = {
  dev: { label: "Development", color: "text-blue-500", icon: Code2 },
  staging: { label: "Staging", color: "text-amber-500", icon: Server },
  prod: { label: "Production", color: "text-emerald-500", icon: Globe },
};

export function EnvironmentSwitcher() {
  const [open, setOpen] = useState(false);
  const { currentEnvironment, setEnvironment } = useAppStore();

  const { data: environments = [] } = useQuery<Environment[]>({
    queryKey: ["environments"],
    queryFn: () => fetch("/api/environments").then((r) => r.json()),
  });

  const activeCfg = currentEnvironment
    ? ENV_CONFIG[currentEnvironment.type] ?? ENV_CONFIG.dev
    : null;
  const ActiveIcon = activeCfg?.icon ?? Globe;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between gap-2 h-8 text-xs font-medium",
            activeCfg?.color
          )}
        >
          <ActiveIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-24">
            {currentEnvironment?.name ?? "Environment"}
          </span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <Command>
          <CommandInput placeholder="Search environments..." />
          <CommandList>
            <CommandEmpty>No environments found.</CommandEmpty>
            <CommandGroup heading="Environments">
              {environments.map((env) => {
                const cfg = ENV_CONFIG[env.type] ?? ENV_CONFIG.dev;
                const Icon = cfg.icon;
                return (
                  <CommandItem
                    key={env.id}
                    value={env.name}
                    onSelect={() => {
                      setEnvironment({
                        id: env.id,
                        name: env.name,
                        type: env.type,
                      });
                      setOpen(false);
                    }}
                  >
                    <Icon className={cn("mr-2 h-4 w-4", cfg.color)} />
                    <span className="flex-1">{env.name}</span>
                    <span className="text-[10px] text-muted-foreground mr-2">
                      {cfg.label}
                    </span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        currentEnvironment?.id === env.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
