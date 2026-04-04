
import { ChevronUp } from "lucide-react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useTheme } from "next-themes";
import type { Session } from "@/lib/session-types";

export function SidebarUserNav({ session }: { session: Session }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  if (!session?.user) {
    return null;
  }

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
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              data-testid="user-nav-button"
              className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10"
            >
              <Image
                src={
                  session?.user.image ||
                  `https://avatar.vercel.sh/${session?.user.email}`
                }
                alt={session?.user.email ?? "User Avatar"}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span data-testid="user-email" className="truncate">
                {session?.user.email ?? session?.user.name ?? "User"}
              </span>

              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            data-testid="user-nav-menu"
            side="top"
            align="start"
            style={{ width: "var(--radix-popper-anchor-width)" }}
          >
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => {
                if (session?.user.id) {
                  router.push(`/profile/${session?.user?.id}` as Route);
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
