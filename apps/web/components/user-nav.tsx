import { ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/hooks/use-app-navigation";
import type { Session } from "@/lib/auth/session-types";

export function UserNav({ session }: { session: Session }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  if (!session?.user) {
    return null;
  }

  const email = session.user.email ?? session.user.name ?? "User";
  const initials = email.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          data-testid="user-nav-button"
          className="h-9 gap-2 px-2"
        >
          <Avatar className="size-7">
            <AvatarImage
              src={
                session.user.image ??
                `https://avatar.vercel.sh/${session.user.email}`
              }
              alt={email}
            />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span
            data-testid="user-email"
            className="hidden max-w-[140px] truncate text-sm sm:inline"
          >
            {email}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-testid="user-nav-menu"
        side="bottom"
        align="end"
        className="w-48"
      >
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={() => {
            if (session.user.id) {
              router.push(`/profile/${session.user.id}`);
            }
          }}
        >
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          Toggle Theme
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
