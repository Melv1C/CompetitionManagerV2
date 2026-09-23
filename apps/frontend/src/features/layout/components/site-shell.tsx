import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  cn,
} from "@repo/ui";
import { Link, useRouterState } from "@tanstack/react-router";
import { Check, ChevronDown, Languages, LogOut, Menu, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { usePrototypeSession } from "@/features/layout/session-context";
import { frontendLanguageStorageKey } from "@/lib/frontend-i18n";

function Mark() {
  return (
    <span
      className="bg-primary text-primary-foreground grid size-9 grid-cols-3 items-end gap-0.5 rounded-lg p-2"
      aria-hidden="true"
    >
      <i className="h-2 rounded-t-sm bg-current" />
      <i className="h-5 rounded-t-sm bg-current" />
      <i className="h-3 rounded-t-sm bg-current" />
    </span>
  );
}

function LanguageMenu() {
  const { i18n, t } = useTranslation();
  const current = (i18n.language.slice(0, 2) || "en").toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-11 px-2.5 md:h-7"
            aria-label={t("nav.changeLanguage")}
          />
        }
      >
        <Languages /> {current} <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {[
          { code: "en", label: "English" },
          { code: "fr", label: "Français" },
          { code: "nl", label: "Nederlands" },
        ].map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => {
              window.localStorage.setItem(frontendLanguageStorageKey, language.code);
              void i18n.changeLanguage(language.code);
            }}
          >
            {language.label}
            {i18n.language.startsWith(language.code) && <Check className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-[-0.03em]">
      <Mark />
      <span className="hidden sm:inline">Competition Manager</span>
    </Link>
  );
}

function SiteHeader() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { signedIn, setSignedIn } = usePrototypeSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const links = [
    {
      to: "/competitions" as const,
      label: t("nav.competitions"),
      active: pathname.startsWith("/competitions"),
    },
    { to: "/results" as const, label: t("nav.results"), active: pathname.startsWith("/results") },
    ...(signedIn
      ? [
          {
            to: "/registrations" as const,
            label: t("nav.registrations"),
            active: pathname.startsWith("/registrations"),
          },
        ]
      : []),
  ];
  return (
    <header className="bg-background/92 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-4 lg:px-6">
        <Brand />
        <nav
          className="hidden h-full flex-1 items-center justify-center gap-1 md:flex"
          aria-label={t("nav.primaryNavigation")}
        >
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-muted-foreground hover:text-foreground relative flex h-full items-center px-3 text-sm font-medium transition-colors",
                link.active &&
                  "text-foreground after:bg-primary after:absolute after:inset-x-3 after:bottom-[-1px] after:h-0.5",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <LanguageMenu />
          {signedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="h-11 rounded-full px-1.5 md:h-10"
                    aria-label={t("nav.openProfileMenu")}
                  />
                }
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary text-primary-foreground">AM</AvatarFallback>
                </Avatar>
                <span className="hidden px-1 text-sm sm:inline">Alex Morgan</span>
                <ChevronDown />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>alex.morgan@example.be</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="min-h-11 md:min-h-7" render={<Link to="/profile" />}>
                    <UserRound /> {t("nav.profile")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="min-h-11 md:min-h-7"
                    onClick={() => setSignedIn(false)}
                  >
                    <LogOut /> {t("nav.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button className="min-h-11 md:min-h-8" onClick={() => setSignedIn(true)}>
              {t("nav.signIn")}
            </Button>
          )}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 md:hidden"
                  aria-label={t("nav.menu")}
                />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(88vw,22rem)]">
              <SheetHeader className="border-b py-5">
                <SheetTitle>
                  <span className="flex items-center gap-2.5">
                    <Mark /> Competition Manager
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 p-4" aria-label={t("nav.menu")}>
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex min-h-12 items-center rounded-lg px-4 text-base font-medium",
                      link.active ? "bg-secondary text-secondary-foreground" : "hover:bg-muted",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {signedIn && (
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:bg-muted flex min-h-12 items-center gap-3 rounded-lg px-4 text-base font-medium"
                  >
                    <UserRound className="size-5" /> {t("nav.profile")}
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-card mt-20 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-[1240px] flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="flex items-center gap-2">
          <Mark />
          <span className="text-foreground font-medium">Competition Manager</span>
        </div>
        <span>English · Français · Nederlands</span>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen max-md:[&_[data-slot=select-trigger]]:min-h-11 max-md:[&_[role=tab]]:min-h-11 max-md:[&_button]:min-h-11 max-md:[&_button[aria-label]]:min-w-11 max-md:[&_input]:min-h-11">
      <SiteHeader />
      {children}
      <Footer />
    </div>
  );
}
