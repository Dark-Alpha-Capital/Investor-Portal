"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Linkedin,
  Calendar,
  Loader2,
  LogOut,
  User,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import MainLogo from "@/public/one-bridge-logo.png";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
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
  const { data: session, isPending } = authClient.useSession();
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
          "w-full transition-all duration-300 z-40 fixed top-0",
          "bg-white py-5"
        )}
      >
        <div className="mx-auto extra-big-container">
          <div className="flex items-center justify-between">
            <Link href="/" className="">
              <span className="text-2xl font-bold text-blue-400">
                DAC INVESTORS
              </span>
            </Link>

            <nav className="hidden lg:flex items-center space-x-8">
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
                      "text-sm font-medium text-black transition-colors hover:text-blue-900 relative",
                      {
                        "text-blue-900 after:absolute after:bottom-[-0.2rem] after:left-0 after:w-full after:h-0.5 after:bg-blue-900":
                          item.href === "/"
                            ? pathname === "/"
                            : isAboutRoute
                              ? aboutSubRoutes.includes(pathname) ||
                                pathname === "/about"
                              : pathname.startsWith(item.href) ||
                                pathname === item.href,
                      }
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden lg:flex items-center gap-4">
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
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
                        <AvatarFallback className="bg-blue-100 text-blue-900">
                          {session.user.name
                            ? session.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : session.user.email?.[0].toUpperCase() || "U"}
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
                    {session.user.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-600"
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
                <Button
                  onClick={() => router.push("/login")}
                  variant="default"
                  size="default"
                >
                  Login
                </Button>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={cn("lg:hidden p-2 rounded-md text-black")}
              aria-label="Open menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <div className="h-[80px]"></div>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          isMobileMenuOpen ? "visible" : "invisible"
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300",
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        <div
          className={cn(
            "fixed inset-y-0 left-0 w-full sm:w-3/4 md:w-2/3 lg:w-1/2 max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="">
                <Image
                  src={MainLogo}
                  alt="Meridian Partners Logo"
                  className="h-10 sm:h-12 md:h-16 w-auto"
                  priority
                />
              </Link>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 sm:p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Menu items */}
          <nav className="p-4 sm:p-5 h-[calc(100vh-80px)] overflow-y-auto">
            <ul className="space-y-2 sm:space-y-3">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block py-1.5 sm:py-2 px-2 sm:px-3 text-sm sm:text-base font-medium text-slate-700 rounded-md hover:bg-slate-100 transition-colors",
                      {
                        "bg-blue-50 text-blue-600": pathname === item.href,
                      }
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Auth section in mobile menu */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200 space-y-2 sm:space-y-3">
              {isPending ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                </div>
              ) : session?.user ? (
                <>
                  <div className="flex items-center gap-3 py-2 px-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={session.user.image || undefined}
                        alt={session.user.name || session.user.email || "User"}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-900">
                        {session.user.name
                          ? session.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : session.user.email?.[0].toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-slate-900">
                        {session.user.name || "User"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Dashboard
                  </Link>
                  {session.user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="flex items-center py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
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
                    className="flex items-center w-full py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Log out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>

            {/* CTA buttons in mobile menu */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200 space-y-2 sm:space-y-3">
              <p className="text-xs sm:text-sm font-medium text-slate-500 mb-2 sm:mb-3">
                Quick Actions
              </p>

              <Link
                href="/contact"
                className="flex items-center py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-white bg-slate-800 rounded-md hover:bg-slate-700 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Set an Appointment
              </Link>
            </div>

            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200">
              <p className="text-xs sm:text-sm font-medium text-slate-500 mb-2 sm:mb-3">
                Contact Us
              </p>
              <Link
                href="tel:+918561046369"
                className="block py-1.5 sm:py-2 text-xs sm:text-sm text-slate-700 hover:text-blue-600"
              >
                +91 8561046369
              </Link>
              <Link
                href="mailto:info@onebridgekp.com"
                className="block py-1.5 sm:py-2 text-xs sm:text-sm text-slate-700 hover:text-blue-600"
              >
                pragya@onebridgeknowledgepartners.com
              </Link>
              <div className="flex space-x-3 sm:space-x-4 mt-3 sm:mt-4">
                <Link
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-blue-600 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
