import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronsUpDown,
  Building2,
  Plus,
} from "lucide-react";
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
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

type Tenant = {
  id: string;
  name: string;
  slug: string;
};

export function TenantSwitcher() {
  const [open, setOpen] = useState(false);
  const { tenant, setTenant } = useAppStore();

  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: () => fetch("/api/v1/tenants/me").then((r) => r.json()),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-48 justify-between gap-2 h-8 text-xs"
        >
          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{tenant?.name ?? "Select tenant..."}</span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0">
        <Command>
          <CommandInput placeholder="Search tenants..." />
          <CommandList>
            <CommandEmpty>No tenants found.</CommandEmpty>
            <CommandGroup heading="Tenants">
              {tenants.map((t) => (
                <CommandItem
                  key={t.id}
                  value={t.name}
                  onSelect={() => {
                    setTenant(t);
                    setOpen(false);
                  }}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <span className="flex-1">{t.name}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      tenant?.id === t.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Tenant
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
