"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Loader2,
  LogOut,
  User,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useClientSession } from "@/lib/get-client-session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { data: session, isPending } = useClientSession();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Investment Process", href: "/investment-process" },
    { name: "Track Record", href: "/track-record" },
    { name: "Offerings", href: "/offerings" },
  ];

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          "w-full transition-all duration-200 z-40 fixed top-0",
          "bg-background/95 border-b border-border backdrop-blur",
        )}
      >
        <div className="mx-auto extra-big-container px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center">
              <span className="text-xl sm:text-2xl font-bold text-primary">
                DAC INVESTORS
              </span>
            </Link>

            <nav className="hidden lg:flex items-center space-x-6">
              {navItems.map((item) => {
                const isAboutRoute = item.href === "/about";
                const aboutSubRoutes = [
                  "/core-values",
                  "/why-choose-us",
                  "/testimonials",
                  "/mission-vision",
                  "/sector-expertise",
                  "/engage-with-us",
                  "/frequently-asked-questions",
                ];

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "text-sm font-medium text-foreground/80 transition-colors hover:text-foreground relative",
                      {
                        "text-foreground after:absolute after:bottom-[-0.2rem] after:left-0 after:w-full after:h-px after:bg-foreground":
                          item.href === "/"
                            ? pathname === "/"
                            : isAboutRoute
                              ? aboutSubRoutes.includes(pathname) ||
                                pathname === "/about"
                              : pathname.startsWith(item.href) ||
                                pathname === item.href,
                      },
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden lg:flex items-center gap-3 xl:gap-4">
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : session?.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="outline-none focus:outline-none">
                      <Avatar className="h-9 w-9 cursor-pointer">
                        <AvatarImage
                          src={session.user.image || undefined}
                          alt={
                            session.user.name || session.user.email || "User"
                          }
                        />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {session.user.name
                            ? session.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : (session.user.email?.[0]?.toUpperCase() ?? "U")}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {session.user.name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {session?.user?.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={async () => {
                        await authClient.signOut();
                        router.push("/");
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => router.push("/login")} size="sm">
                  Login
                </Button>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={cn(
                "lg:hidden p-2 -mr-2 rounded-md text-foreground hover:bg-muted transition-colors",
              )}
              aria-label="Open menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <div className="h-16 lg:h-20"></div>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          isMobileMenuOpen ? "visible" : "invisible",
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 bg-foreground/50 backdrop-blur-sm transition-opacity duration-300",
            isMobileMenuOpen ? "opacity-100" : "opacity-0",
          )}
          aria-hidden="true"
          onClick={() => setIsMobileMenuOpen(false)}
        />

          <div
            className={cn(
              "fixed inset-y-0 left-0 w-full sm:w-3/4 max-w-md bg-background border-r border-border transform transition-transform duration-200 ease-out",
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                DAC INVESTORS
              </Link>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 sm:p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Menu items */}
          <nav className="p-4 sm:p-6 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block py-2.5 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-medium text-foreground rounded-md hover:bg-muted transition-colors",
                      {
                        "bg-primary/10 text-primary": pathname === item.href,
                      },
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Auth section in mobile menu */}
            <div className="mt-8 pt-6 border-t border-border space-y-2">
              {isPending ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : session?.user ? (
                <>
                  <div className="flex items-center gap-3 py-2 px-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={session.user.image || undefined}
                        alt={session.user.name || session.user.email || "User"}
                      />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {session.user.name
                          ? session.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : (session.user.email?.[0]?.toUpperCase() ?? "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-foreground">
                        {session.user.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-foreground rounded-md hover:bg-muted transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Dashboard
                  </Link>
                  {session?.user?.role === "admin" && (
                    <Link
                      href="/admin"
                      className="flex items-center py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-foreground rounded-md hover:bg-muted transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      await authClient.signOut();
                      setIsMobileMenuOpen(false);
                      router.push("/");
                    }}
                    className="flex items-center w-full py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Log out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>

          </nav>
        </div>
      </div>
    </>
  );
}
