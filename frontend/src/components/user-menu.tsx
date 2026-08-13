"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Sun, Moon, Monitor, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useSession();
  const { theme, setTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-9 gap-2 px-2 hover:bg-muted"
            aria-label="Open user menu"
          />
        }
      >
        <Avatar size="sm">
          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-32 truncate text-sm font-medium md:block">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        {user.roles.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Roles</DropdownMenuLabel>
            {user.roles.map((role) => (
              <DropdownMenuItem key={role.id} disabled className="text-xs">
                <UserRound className="size-3.5" aria-hidden="true" />
                {role.name}
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Theme</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
          <Sun
            className={cn(
              "size-4 mr-2",
              theme === "light" ? "text-foreground" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
          <Moon
            className={cn(
              "size-4 mr-2",
              theme === "dark" ? "text-foreground" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
          <Monitor
            className={cn(
              "size-4 mr-2",
              theme === "system" ? "text-foreground" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
          System
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="size-4" aria-hidden="true" />
          )}
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
