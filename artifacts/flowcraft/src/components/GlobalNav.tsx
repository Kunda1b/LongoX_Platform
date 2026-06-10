import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAppStore } from "@/stores/app-store";
import { TenantSwitcher } from "@/components/TenantSwitcher";
import { EnvironmentSwitcher } from "@/components/EnvironmentSwitcher";
import { NotificationCenter } from "@/components/NotificationCenter";
import { CommandPalette, useCommandPalette } from "@/components/command-palette";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Search, LogOut, Settings, User, Keyboard } from "lucide-react";

export function GlobalNav() {
  const { user, logout } = useAuth();
  const { breadcrumbs } = useAppStore();
  const { open, setOpen } = useCommandPalette();
  const [searchOpen, setSearchOpen] = useState(false);

  const userInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <>
      <header className="h-14 flex items-center gap-3 border-b border-border bg-card px-4 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TenantSwitcher />
          <EnvironmentSwitcher />
          {breadcrumbs.length > 0 && (
            <>
              <span className="text-muted-foreground/30 mx-1">|</span>
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, i) => (
                    <BreadcrumbItem key={i}>
                      {crumb.href ? (
                        <BreadcrumbLink href={crumb.href} className="text-xs">
                          {crumb.label}
                        </BreadcrumbLink>
                      ) : (
                        <span className="text-xs font-medium text-foreground">
                          {crumb.label}
                        </span>
                      )}
                      {i < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </BreadcrumbItem>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-xs text-muted-foreground hidden md:flex"
            onClick={() => setOpen(true)}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>

          <NotificationCenter />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user?.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user?.email}
                  </span>
                  {user?.role && (
                    <Badge variant="outline" className="mt-1 text-[10px] w-fit capitalize">
                      {user.role}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => window.location.href = "/settings"}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = "/rbac"}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Access Control</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
