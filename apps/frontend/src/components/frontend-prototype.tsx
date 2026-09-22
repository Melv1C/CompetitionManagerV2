// Frontend-only product prototype. All records and mutations on these routes are in-memory mock data.
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  buttonVariants,
  cn,
} from "@repo/ui";
import { Link, useParams, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Flag,
  Languages,
  ListFilter,
  LockKeyhole,
  LogOut,
  MailCheck,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Trophy,
  UserRound,
  Wind,
  X,
} from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { frontendLanguageStorageKey, languageLocales } from "@/lib/frontend-i18n";

type SessionContextValue = { signedIn: boolean; setSignedIn: (value: boolean) => void };
const SessionContext = createContext<SessionContextValue | null>(null);

export function MockSessionProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  return (
    <SessionContext.Provider value={{ signedIn, setSignedIn }}>{children}</SessionContext.Provider>
  );
}

function useMockSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("MockSessionProvider is missing");
  return value;
}

const competitions = [
  {
    id: "brussels-open",
    date: "2027-05-24",
    title: "Brussels Open",
    organization: "Royal Brussels Athletics",
    place: "Stade des Trois Tilleuls, Forest",
    scope: "Sprints · Jumps · Middle distance",
    status: "open",
    registrationNote: { type: "closes", date: "2027-05-20" },
    registrationOpens: "2027-05-01",
    registrationCloses: "2027-05-20",
    price: "€6",
    featured: true,
  },
  {
    id: "antwerp-night",
    date: "2027-06-07",
    title: "Antwerp Track Night",
    organization: "Antwerp Athletics",
    place: "Sportcentrum Deurne, Antwerp",
    scope: "Track · Middle distance",
    status: "open",
    registrationNote: { type: "places", count: 42 },
    registrationOpens: "2027-05-10",
    registrationCloses: "2027-06-03",
    price: "€8",
    featured: false,
  },
  {
    id: "liege-summer",
    date: "2027-06-15",
    title: "Liège Summer Meeting",
    organization: "RFCL Athlétisme",
    place: "Naimette-Xhovémont, Liège",
    scope: "Track · Field",
    status: "soon",
    registrationNote: { type: "opens", date: "2027-05-24" },
    registrationOpens: "2027-05-24",
    registrationCloses: "2027-06-10",
    price: "€5",
    featured: false,
  },
  {
    id: "junior-cup",
    date: "2027-06-29",
    title: "Charleroi Junior Cup",
    organization: "Cercle Athlétique Charleroi",
    place: "Stade Jonet, Charleroi",
    scope: "U14 · U16 · U18",
    status: "open",
    registrationNote: { type: "closes", date: "2027-06-25" },
    registrationOpens: "2027-06-01",
    registrationCloses: "2027-06-25",
    price: "€4",
    featured: false,
  },
  {
    id: "flanders-relay",
    date: "2027-07-05",
    title: "Flanders Relay Cup",
    organization: "KAAG Atletiek",
    place: "Blaarmeersen, Ghent",
    scope: "Relay · Club teams",
    status: "closed",
    registrationNote: { type: "waitlist" },
    registrationOpens: "2027-06-01",
    registrationCloses: "2027-06-28",
    price: "€12",
    featured: false,
  },
  {
    id: "namur-classic",
    date: "2027-07-12",
    title: "Namur Athletics Classic",
    organization: "SMAC Namur",
    place: "ADEPS Jambes, Namur",
    scope: "Track · Throws",
    status: "open",
    registrationNote: { type: "closes", date: "2027-07-08" },
    registrationOpens: "2027-06-07",
    registrationCloses: "2027-07-08",
    price: "€5",
    featured: false,
  },
] as const;

const schedule = [
  {
    eventId: "women-long-jump",
    time: "13:30",
    discipline: "Women · Long jump",
    round: "Final",
    athletes: 12,
    groups: 1,
    state: "finished",
  },
  {
    eventId: "women-100m",
    time: "14:20",
    discipline: "Women · 100 m",
    round: "Heats",
    athletes: 24,
    groups: 3,
    state: "live",
  },
  {
    eventId: "men-100m",
    time: "14:55",
    discipline: "Men · 100 m",
    round: "Heats",
    athletes: 32,
    groups: 4,
    state: "next",
  },
  {
    eventId: "women-800m",
    time: "15:40",
    discipline: "Women · 800 m",
    round: "Final",
    athletes: 10,
    groups: 1,
    state: "scheduled",
  },
  {
    eventId: "men-high-jump",
    time: "16:15",
    discipline: "Men · High jump",
    round: "Final",
    athletes: 9,
    groups: 1,
    state: "scheduled",
  },
  {
    eventId: "women-100m",
    time: "17:45",
    discipline: "Women · 100 m",
    round: "Final",
    athletes: 8,
    groups: 1,
    state: "scheduled",
  },
] as const;

const registrationAthletes = [
  {
    id: "mila",
    name: "Mila Morgan",
    initials: "MM",
    meta: "U18 · RBA · 104589",
    detail: "U18 · Royal Brussels Athletics",
  },
  {
    id: "noah",
    name: "Noah Morgan",
    initials: "NM",
    meta: "U20 · RBA · 108244",
    detail: "U20 · Royal Brussels Athletics",
  },
] as const;

const registrationEvents = [
  {
    id: "100m",
    name: "Women · 100 m",
    price: 6,
    date: "2027-05-24",
    round: "Heats",
    time: "14:20",
    personalBest: "12.08",
    personalBestDate: "2027-04-12",
  },
  {
    id: "long-jump",
    name: "Women · Long jump",
    price: 6,
    date: "2027-05-24",
    round: "Final",
    time: "13:30",
    personalBest: "5.42 m",
    personalBestDate: "2027-05-04",
  },
  {
    id: "200m",
    name: "Women · 200 m",
    price: 6,
    date: "2027-05-24",
    round: "Heats",
    time: "16:30",
    personalBest: "25.14",
    personalBestDate: "2027-04-26",
  },
] as const;

const athletes = [
  {
    place: 1,
    lane: 4,
    bib: 184,
    name: "Louise Peeters",
    club: "VAC",
    category: "SEN",
    pb: "11.72",
    result: "11.84",
    qualified: true,
  },
  {
    place: 2,
    lane: 5,
    bib: 121,
    name: "Noor Claes",
    club: "RCG",
    category: "U23",
    pb: "11.81",
    result: "11.91",
    qualified: true,
  },
  {
    place: 3,
    lane: 3,
    bib: 207,
    name: "Sofie Aerts",
    club: "LYRA",
    category: "SEN",
    pb: "11.89",
    result: "11.96",
    qualified: false,
  },
  {
    place: 4,
    lane: 6,
    bib: 166,
    name: "Amélie Dubois",
    club: "CABW",
    category: "U23",
    pb: "11.93",
    result: "12.01",
    qualified: false,
  },
  {
    place: 5,
    lane: 2,
    bib: 145,
    name: "Emma Maes",
    club: "KAAG",
    category: "SEN",
    pb: "12.02",
    result: "12.08",
    qualified: false,
  },
  {
    place: 6,
    lane: 7,
    bib: 198,
    name: "Julie Lambert",
    club: "SMAC",
    category: "SEN",
    pb: "12.08",
    result: "12.21",
    qualified: false,
  },
] as const;

function dateFromIso(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

function formatDate(
  value: string,
  locale: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
) {
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...options }).format(
    dateFromIso(value),
  );
}

function formatDateRange(start: string, end: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).formatRange(dateFromIso(start), dateFromIso(end));
}

function useFrontendLocale() {
  const { i18n } = useTranslation();
  return localeFor(i18n.resolvedLanguage ?? i18n.language);
}

function competitionFromId(competitionId: string | undefined) {
  return competitions.find((competition) => competition.id === competitionId);
}

function scheduleEventFromId(eventId: string | undefined) {
  return schedule.find((item) => item.eventId === eventId);
}

function Mark({ children }: { children?: ReactNode }) {
  return (
    <span
      className="bg-primary text-primary-foreground grid size-9 grid-cols-3 items-end gap-0.5 rounded-lg p-2"
      aria-hidden="true"
    >
      <i className="h-2 rounded-t-sm bg-current" />
      <i className="h-5 rounded-t-sm bg-current" />
      <i className="h-3 rounded-t-sm bg-current" />
      {children}
    </span>
  );
}

function LanguageMenu() {
  const { i18n } = useTranslation();
  const current = (i18n.language.slice(0, 2) || "en").toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-11 px-2.5 md:h-7"
            aria-label="Change language"
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
  const { signedIn, setSignedIn } = useMockSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const links = [
    {
      to: "/competitions",
      label: t("nav.competitions"),
      active: pathname.startsWith("/competitions"),
    },
    { to: "/results", label: t("nav.results"), active: pathname.startsWith("/results") },
    ...(signedIn
      ? [
          {
            to: "/registrations",
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
          aria-label="Primary navigation"
        >
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "relative flex h-full items-center px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                link.active &&
                  "text-foreground after:absolute after:inset-x-3 after:bottom-[-1px] after:h-0.5 after:bg-primary",
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
                    aria-label="Open profile menu"
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
        <span>Frontend prototype · Mock data only</span>
      </div>
    </footer>
  );
}

function SignInRequired({ destination }: { destination: string }) {
  const { t } = useTranslation();
  const { setSignedIn } = useMockSession();
  return (
    <SiteShell>
      <main className="mx-auto grid min-h-[68vh] max-w-[520px] place-items-center px-4 py-16">
        <Card className="w-full text-center">
          <CardHeader>
            <div className="bg-secondary text-primary mx-auto mb-2 grid size-11 place-items-center rounded-full">
              <UserRound />
            </div>
            <CardTitle className="text-2xl">{t("auth.required")}</CardTitle>
            <CardDescription>
              {destination}. {t("auth.stay")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" onClick={() => setSignedIn(true)}>
              {t("nav.signIn")}
              <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      </main>
    </SiteShell>
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

function StatusBadge({
  status,
  opensAt,
}: {
  status: "open" | "soon" | "closed";
  opensAt?: string;
}) {
  const { t } = useTranslation();
  const locale = useFrontendLocale();
  if (status === "open")
    return <Badge className="bg-accent text-accent-foreground">{t("common.open")}</Badge>;
  if (status === "soon")
    return (
      <Badge variant="secondary">
        {t("competitions.opens")}{" "}
        {opensAt && formatDate(opensAt, locale, { day: "numeric", month: "short" })}
      </Badge>
    );
  return <Badge variant="outline">{t("common.closed")}</Badge>;
}

function CompetitionRegistrationNote({
  note,
}: {
  note: (typeof competitions)[number]["registrationNote"];
}) {
  const { t } = useTranslation();
  const locale = useFrontendLocale();

  if (note.type === "places")
    return (
      <>
        {note.count} {t("competitions.places")}
      </>
    );
  if (note.type === "waitlist") return <>{t("competitions.waitlist")}</>;

  return (
    <>
      {t(note.type === "opens" ? "competitions.opens" : "competitions.closes")}{" "}
      {"date" in note && formatDate(note.date, locale, { day: "numeric", month: "short" })}
    </>
  );
}

function LivePip() {
  return (
    <span className="relative flex size-2">
      <span className="bg-chart-5 absolute inline-flex size-full animate-ping rounded-full opacity-50 motion-reduce:animate-none" />
      <span className="bg-chart-5 relative inline-flex size-2 rounded-full" />
    </span>
  );
}

function LiveRail() {
  const { t } = useTranslation();
  return (
    <section className="bg-primary text-primary-foreground border-y">
      <div className="mx-auto grid max-w-[1240px] md:grid-cols-[210px_1fr_auto]">
        <div className="border-primary-foreground/15 flex items-center gap-2 px-4 py-3 md:border-r lg:px-6">
          <LivePip />
          <span className="text-xs font-bold tracking-[0.16em] uppercase">
            {t("home.liveTitle")}
          </span>
        </div>
        <div className="min-w-0 overflow-hidden px-4 py-3">
          <div className="flex items-center gap-8 text-sm">
            <span>
              <b>Brussels Indoor</b> · Women 60 m final · L. Peeters{" "}
              <strong className="font-mono">7.31</strong>
            </span>
            <span className="hidden lg:inline">
              <b>Liège Throws</b> · Men shot put · T. Diallo{" "}
              <strong className="font-mono">17.42 m</strong>
            </span>
          </div>
        </div>
        <Link
          to="/results"
          className="border-primary-foreground/15 hover:bg-primary-foreground/10 flex items-center gap-2 px-4 py-3 text-sm font-semibold md:border-l lg:px-6"
        >
          {t("home.followLive")}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

function PageIntro({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-10 md:grid-cols-[1fr_auto] md:items-end lg:px-6 lg:py-14">
      <div className="max-w-3xl">
        <p className="text-primary mb-3 text-xs font-bold tracking-[0.16em] uppercase">{eyebrow}</p>
        <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">{title}</h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-7">{intro}</p>
      </div>
      {children}
    </div>
  );
}

function CompetitionCard({
  competition,
  compact = false,
}: {
  competition: (typeof competitions)[number];
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const locale = useFrontendLocale();
  return (
    <Card
      className={cn(
        "group transition-transform hover:-translate-y-0.5",
        competition.featured && "ring-primary/30",
      )}
    >
      <CardHeader className="grid grid-cols-[58px_1fr_auto] gap-4">
        <div className="bg-secondary flex h-16 flex-col items-center justify-center rounded-lg font-mono leading-none">
          <strong className="text-2xl">
            {formatDate(competition.date, locale, { day: "2-digit" })}
          </strong>
          <span className="text-muted-foreground mt-1 text-[10px] font-bold tracking-[0.12em]">
            {formatDate(competition.date, locale, { month: "short" }).toLocaleUpperCase(locale)}
          </span>
        </div>
        <div className="min-w-0">
          <StatusBadge status={competition.status} opensAt={competition.registrationOpens} />
          <CardTitle className="mt-2 text-lg">{competition.title}</CardTitle>
          <CardDescription>{competition.organization}</CardDescription>
        </div>
        {competition.featured && (
          <Badge variant="outline" className="hidden self-start sm:flex">
            <Flag /> Featured
          </Badge>
        )}
      </CardHeader>
      <CardContent className={cn("grid gap-3 text-sm", !compact && "sm:grid-cols-2")}>
        <p className="text-muted-foreground flex items-start gap-2">
          <MapPin className="mt-0.5 size-4" />
          {competition.place}
        </p>
        <p className="text-muted-foreground flex items-start gap-2">
          <Trophy className="mt-0.5 size-4" />
          {competition.scope}
        </p>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <div>
          <span className="text-muted-foreground block text-xs">
            <CompetitionRegistrationNote note={competition.registrationNote} />
          </span>
          <strong className="text-sm">
            {t("common.from")} {competition.price}/{t("common.event")}
          </strong>
        </div>
        <Link
          to="/competitions/$competitionId"
          params={{ competitionId: competition.id }}
          className={cn(
            buttonVariants({
              variant: competition.status === "open" ? "default" : "outline",
            }),
            "min-h-11 md:min-h-8",
          )}
        >
          {competition.status === "open" ? t("common.register") : t("common.details")}
          <ArrowRight />
        </Link>
      </CardFooter>
    </Card>
  );
}

const latestResults = [
  {
    date: "2027-05-18",
    title: "Brussels Indoor",
    organization: "CABW",
    winner: "Louise Peeters",
    event: "Women · 60 m",
    mark: "7.31",
  },
  {
    date: "2027-05-17",
    title: "Liège Throws",
    organization: "RFCL",
    winner: "Thomas Diallo",
    event: "Men · Shot put",
    mark: "17.42 m",
  },
  {
    date: "2027-05-11",
    title: "Ghent Spring Meet",
    organization: "KAAG",
    winner: "Amélie Dubois",
    event: "Women · 800 m",
    mark: "2:04.18",
  },
] as const;

export function HomePage() {
  const { t } = useTranslation();
  const locale = useFrontendLocale();
  return (
    <SiteShell>
      <LiveRail />
      <main>
        <section className="bg-background relative overflow-hidden border-b">
          <div
            aria-hidden="true"
            className="border-primary/20 ring-primary/5 pointer-events-none absolute -right-24 -bottom-52 size-[520px] rounded-full border ring-[42px]"
          />
          <div className="relative mx-auto grid max-w-[1240px] gap-10 px-4 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:px-6 lg:py-20">
            <div>
              <p className="text-primary mb-4 text-xs font-bold tracking-[0.18em] uppercase">
                {t("home.eyebrow")}
              </p>
              <h1 className="max-w-3xl text-5xl leading-[0.94] font-semibold tracking-[-0.065em] sm:text-7xl">
                {t("home.title")}
              </h1>
              <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8">
                {t("home.intro")}
              </p>
              <div className="mt-8 grid max-w-xl gap-2 sm:grid-cols-[1fr_auto]">
                <div className="relative flex-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input className="bg-card h-11 pl-10" placeholder={t("home.search")} />
                </div>
                <Link
                  to="/competitions"
                  className={cn(buttonVariants({ size: "lg" }), "min-h-11 w-full sm:w-auto")}
                >
                  {t("common.search")}
                </Link>
              </div>
            </div>
            <Card className="bg-card/90 self-end shadow-xl">
              <CardHeader>
                <div className="text-chart-5 flex items-center gap-2 text-xs font-bold tracking-[0.14em] uppercase">
                  <LivePip /> Brussels Indoor
                </div>
                <CardTitle className="text-2xl">Women · 60 m final</CardTitle>
                <CardDescription>{t("home.updated")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {athletes.slice(0, 3).map((a) => (
                  <div
                    key={a.bib}
                    className="grid grid-cols-[28px_1fr_auto] items-center gap-3 border-t py-3 first:border-t-0"
                  >
                    <b className="font-mono text-lg">{a.place}</b>
                    <span>
                      <strong className="block">{a.name}</strong>
                      <small className="text-muted-foreground">{a.club}</small>
                    </span>
                    <strong className="font-mono text-xl tracking-tight">{a.result}</strong>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
        <section className="mx-auto max-w-[1240px] px-4 py-14 lg:px-6">
          <div className="mb-7 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-muted-foreground text-sm">{t("home.nextHint")}</p>
              <h2 className="text-3xl font-semibold tracking-[-0.045em]">{t("home.next")}</h2>
            </div>
            <Link
              to="/competitions"
              className={cn(buttonVariants({ variant: "outline" }), "min-h-11 sm:min-h-8")}
            >
              {t("home.browse")}
              <ArrowRight />
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {competitions.slice(0, 3).map((c) => (
              <CompetitionCard key={c.id} competition={c} compact />
            ))}
          </div>
        </section>
        <section className="bg-card border-y">
          <div className="mx-auto max-w-[1240px] px-4 py-14 lg:px-6">
            <div className="mb-7 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{t("home.latestHint")}</p>
                <h2 className="text-3xl font-semibold tracking-[-0.045em]">{t("home.latest")}</h2>
              </div>
              <Link
                to="/results"
                className={cn(buttonVariants({ variant: "outline" }), "min-h-11 sm:min-h-8")}
              >
                {t("home.allResults")}
                <ArrowRight />
              </Link>
            </div>
            <div className="grid border-y md:grid-cols-3">
              {latestResults.map((result, index) => (
                <Link
                  to="/results"
                  key={result.title}
                  className={cn(
                    "group py-6 md:px-6",
                    index > 0 && "border-t md:border-l md:border-t-0",
                    index === 0 && "md:pl-0",
                  )}
                >
                  <span className="text-muted-foreground font-mono text-xs uppercase">
                    {formatDate(result.date, locale, { day: "numeric", month: "short" })}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold">{result.title}</h3>
                  <p className="text-muted-foreground text-sm">{result.organization}</p>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <span className="text-sm">
                      <b className="block">{result.winner}</b>
                      {result.event}
                    </span>
                    <strong className="text-primary font-mono text-xl">{result.mark}</strong>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

export function CompetitionsPage() {
  const { t } = useTranslation();
  return (
    <SiteShell>
      <main>
        <PageIntro
          eyebrow={t("competitions.eyebrow")}
          title={t("competitions.title")}
          intro={t("competitions.intro")}
        />
        <section className="mx-auto max-w-[1240px] px-4 lg:px-6">
          <div className="bg-card mb-6 grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input className="h-10 pl-10" placeholder={t("home.search")} />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="h-10 w-full md:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("competitions.allRegions")}</SelectItem>
                <SelectItem value="brussels">Brussels</SelectItem>
                <SelectItem value="flanders">Flanders</SelectItem>
                <SelectItem value="wallonia">Wallonia</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="h-10 w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("competitions.allDisciplines")}</SelectItem>
                <SelectItem value="track">Track</SelectItem>
                <SelectItem value="field">Field</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-10">
              <ListFilter />
              {t("competitions.filters")}
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {competitions.map((c) => (
              <CompetitionCard key={c.id} competition={c} compact />
            ))}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

function CompetitionHeading({ competition }: { competition: (typeof competitions)[number] }) {
  const { t } = useTranslation();
  const locale = useFrontendLocale();
  const hasRegistration = competition.id === "brussels-open";
  return (
    <div className="bg-card border-b">
      <div className="mx-auto max-w-[1240px] px-4 py-8 lg:px-6">
        <Link
          to="/competitions"
          className="text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" />
          {t("detail.back")}
        </Link>
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <StatusBadge status={competition.status} opensAt={competition.registrationOpens} />
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
              {competition.title}
            </h1>
            <p className="text-muted-foreground mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                {formatDate(competition.date, locale)}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="size-4" />
                {competition.place}
              </span>
              <span className="flex items-center gap-2">
                <Flag className="size-4" />
                {competition.organization}
              </span>
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {hasRegistration && (
              <Link
                to="/registrations/$registrationId"
                params={{ registrationId: "registration-1" }}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "min-h-11 w-full sm:w-auto",
                )}
              >
                {t("detail.manage")}
              </Link>
            )}
            <Link
              to="/register"
              className={cn(buttonVariants({ size: "lg" }), "min-h-11 w-full sm:w-auto")}
            >
              {t("detail.registerAthlete")}
              <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompetitionDetailPage() {
  const { t } = useTranslation();
  const locale = useFrontendLocale();
  const { competitionId } = useParams({ strict: false });
  const competition = competitionFromId(competitionId ?? "brussels-open");

  if (!competition) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-[760px] px-4 py-16 lg:px-6">
          <h1 className="text-3xl font-semibold">{t("competitions.notFound")}</h1>
          <Link
            to="/competitions"
            className={cn(buttonVariants({ variant: "outline" }), "mt-6 min-h-11")}
          >
            <ArrowLeft /> {t("detail.back")}
          </Link>
        </main>
      </SiteShell>
    );
  }

  const hasRegistration = competition.id === "brussels-open";
  return (
    <SiteShell>
      <main>
        <CompetitionHeading competition={competition} />
        <div className="mx-auto max-w-[1240px] px-4 py-8 lg:px-6">
          <Tabs defaultValue="schedule">
            <TabsList
              variant="line"
              className="mb-8 w-full justify-start overflow-x-auto border-b pb-3"
            >
              <TabsTrigger value="overview">{t("detail.overview")}</TabsTrigger>
              <TabsTrigger value="schedule">{t("detail.schedule")}</TabsTrigger>
              <TabsTrigger value="participants">
                {t("detail.participants")} <Badge variant="secondary">86</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className={cn("grid gap-5", hasRegistration && "lg:grid-cols-[1fr_360px]")}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">{t("detail.about")}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground space-y-6 text-sm leading-6">
                    <p>
                      A full afternoon of track and field for U18, U23 and senior athletes.
                      Electronic timing is available for all track events.
                    </p>
                    <div className="grid gap-5 border-t pt-6 sm:grid-cols-2">
                      <Info
                        label={t("detail.registrationWindow")}
                        value={formatDateRange(
                          competition.registrationOpens,
                          competition.registrationCloses,
                          locale,
                        )}
                      />
                      <Info label={t("detail.eligibility")} value="U18, U23 and Senior" />
                      <Info label={t("detail.pricing")} value="€6 per event" />
                      <Info label={t("detail.contact")} value="meeting@rba.be" />
                    </div>
                  </CardContent>
                </Card>
                {hasRegistration && <RegistrationSummary />}
              </div>
            </TabsContent>
            <TabsContent value="schedule">
              <div className={cn("grid gap-5", hasRegistration && "lg:grid-cols-[1fr_290px]")}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">{t("detail.scheduleTitle")}</CardTitle>
                    <CardDescription>{t("detail.scheduleHint")}</CardDescription>
                    <CardAction>
                      <Button variant="outline" size="sm">
                        <Settings2 />
                        {t("detail.allRounds")}
                      </Button>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="divide-y">
                      {schedule.map((item) => (
                        <Link
                          key={`${item.time}-${item.discipline}-${item.round}`}
                          to="/competitions/$competitionId/events/$eventId"
                          params={{ competitionId: competition.id, eventId: item.eventId }}
                          className="group hover:bg-muted/55 grid grid-cols-[64px_1fr_auto] items-center gap-4 px-4 py-4"
                        >
                          <time className="font-mono text-lg font-semibold">{item.time}</time>
                          <div>
                            <div className="flex items-center gap-2">
                              <strong>{item.discipline}</strong>
                              {item.state === "live" && (
                                <Badge className="bg-chart-5 text-white">
                                  <LivePip /> {t("common.live")}
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground mt-1 text-sm">
                              {item.round} · {item.athletes} {t("detail.athletes")}
                              {item.groups > 1 &&
                                ` · ${item.groups} ${t("common.heat").toLowerCase()}s`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.groups > 1 && (
                              <Badge variant="outline" className="hidden sm:flex">
                                <Clock3 />
                                {t("detail.sequential")}
                              </Badge>
                            )}
                            <ArrowRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                {hasRegistration && <RegistrationSummary />}
              </div>
            </TabsContent>
            <TabsContent value="participants">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{t("detail.participantsTitle")}</CardTitle>
                  <CardAction>
                    <div className="relative">
                      <Search className="text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2" />
                      <Input className="pl-8" placeholder={t("common.search")} />
                    </div>
                  </CardAction>
                </CardHeader>
                <CardContent className="px-0">
                  <p className="text-muted-foreground border-y px-4 py-2 text-xs sm:hidden">
                    {t("common.scrollHint")}
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.bib")}</TableHead>
                        <TableHead>{t("common.athlete")}</TableHead>
                        <TableHead>{t("common.club")}</TableHead>
                        <TableHead>{t("common.category")}</TableHead>
                        <TableHead>{t("common.events")}</TableHead>
                        <TableHead>{t("common.personalBest")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {athletes.map((a) => (
                        <TableRow key={a.bib}>
                          <TableCell className="font-mono">{a.bib}</TableCell>
                          <TableCell className="font-medium">{a.name}</TableCell>
                          <TableCell>{a.club}</TableCell>
                          <TableCell>{a.category}</TableCell>
                          <TableCell>
                            <Link
                              to="/competitions/$competitionId/events/$eventId"
                              params={{
                                competitionId: competition.id,
                                eventId: "women-100m",
                              }}
                              className="text-primary hover:underline"
                            >
                              Women · 100 m
                            </Link>
                          </TableCell>
                          <TableCell className="font-mono">{a.pb}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </SiteShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs font-semibold tracking-[0.12em] uppercase">
        {label}
      </span>
      <strong className="text-foreground mt-1 block">{value}</strong>
    </div>
  );
}

function RegistrationSummary() {
  const { t } = useTranslation();
  return (
    <Card className="ring-primary/25 h-fit">
      <CardHeader>
        <CardDescription>{t("detail.yourRegistration")}</CardDescription>
        <CardTitle>Mila Morgan</CardTitle>
        <CardAction>
          <Badge className="bg-accent text-accent-foreground">
            <CircleCheck />
            {t("detail.confirmed")}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted rounded-lg p-3">
          <strong className="block">Women · 100 m</strong>
          <span className="text-muted-foreground text-sm">PB 12.08 · U18</span>
        </div>
        <div className="bg-muted rounded-lg p-3">
          <strong className="block">Women · Long jump</strong>
          <span className="text-muted-foreground text-sm">PB 5.42 m · U18</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link
          to="/registrations/$registrationId"
          params={{ registrationId: "registration-1" }}
          className={cn(buttonVariants({ variant: "outline" }), "min-h-11 w-full md:min-h-8")}
        >
          {t("detail.manage")}
          <ArrowRight />
        </Link>
      </CardFooter>
    </Card>
  );
}

export function EventDetailPage() {
  const { t } = useTranslation();
  const { competitionId, eventId } = useParams({ strict: false });
  const competition = competitionFromId(competitionId ?? "brussels-open");
  const event = scheduleEventFromId(eventId ?? "women-100m");
  const [heat, setHeat] = useState(event && event.groups > 1 ? "2" : "1");

  if (!competition || !event) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-[760px] px-4 py-16 lg:px-6">
          <h1 className="text-3xl font-semibold">{t("eventPage.notFound")}</h1>
          <Link
            to="/competitions"
            className={cn(buttonVariants({ variant: "outline" }), "mt-6 min-h-11")}
          >
            <ArrowLeft /> {t("detail.back")}
          </Link>
        </main>
      </SiteShell>
    );
  }

  const isLive = event.state === "live";
  const heatNumbers = Array.from({ length: event.groups }, (_, index) => String(index + 1));
  return (
    <SiteShell>
      <main>
        <div className="bg-card border-b">
          <div className="mx-auto max-w-[1240px] px-4 py-8 lg:px-6">
            <Link
              to="/competitions/$competitionId"
              params={{ competitionId: competition.id }}
              className="text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="size-4" />
              {t("eventPage.back")}
            </Link>
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                {isLive && (
                  <div className="flex gap-2">
                    <Badge className="bg-chart-5 text-white">
                      <LivePip />
                      {t("common.live")}
                    </Badge>
                    <Badge variant="outline">{t("common.provisional")}</Badge>
                  </div>
                )}
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
                  {event.discipline}
                </h1>
                <p className="text-muted-foreground mt-3">
                  {competition.title} · {event.round} · {t("eventPage.roundStarts")}{" "}
                  <strong className="text-foreground font-mono">{event.time}</strong>
                </p>
              </div>
              <div className="flex">
                <Button className="min-h-11 sm:min-h-8">
                  {event.round} · {event.time}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-8 lg:grid-cols-[220px_1fr] lg:px-6">
          <aside>
            <p className="text-muted-foreground mb-2 text-xs font-bold tracking-[0.15em] uppercase">
              {event.groups > 1 ? t("eventPage.heats") : t("eventPage.rounds")}
            </p>
            <div className="space-y-2">
              {heatNumbers.map((h) => (
                <Button
                  key={h}
                  variant={heat === h ? "default" : "outline"}
                  className="min-h-11 w-full justify-between"
                  onClick={() => setHeat(h)}
                >
                  {event.groups > 1 ? `${t("common.heat")} ${h}` : event.round}
                  <span className="font-mono">8 {t("detail.athletes")}</span>
                </Button>
              ))}
            </div>
            <Alert className="mt-4">
              <Clock3 />
              <AlertTitle>{event.time}</AlertTitle>
              {event.groups > 1 && <AlertDescription>{t("eventPage.heatNote")}</AlertDescription>}
            </Alert>
          </aside>
          <Tabs
            defaultValue={isLive || event.state === "finished" ? "results" : "entries"}
            className="min-w-0"
          >
            <TabsList className="mb-5">
              <TabsTrigger value="results" className="min-h-11 sm:min-h-8">
                {t("eventPage.liveResults")}
              </TabsTrigger>
              <TabsTrigger value="entries" className="min-h-11 sm:min-h-8">
                {t("eventPage.startList")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="results" className="min-w-0">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>
                    {event.groups > 1 ? `${t("common.heat")} ${heat}` : event.round} ·{" "}
                    {t("eventPage.liveResults")}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Wind className="size-4" />
                    {t("eventPage.wind")} +0.6 m/s · Updated 14:27:18
                  </CardDescription>
                </CardHeader>
                <CardContent className="min-w-0 px-0">
                  <p className="text-muted-foreground border-y px-4 py-2 text-xs sm:hidden">
                    {t("common.scrollHint")}
                  </p>
                  <ResultTable showResults />
                </CardContent>
                <CardFooter className="justify-between">
                  <span className="text-muted-foreground text-xs">
                    Top 2 in each heat + 2 fastest times
                  </span>
                  <Badge variant="outline">{t("common.provisional")}</Badge>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="entries" className="min-w-0">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>
                    {event.groups > 1 ? `${t("common.heat")} ${heat}` : event.round} ·{" "}
                    {t("common.entries")}
                  </CardTitle>
                  <CardDescription>{t("eventPage.selectHeat")}</CardDescription>
                </CardHeader>
                <CardContent className="min-w-0 px-0">
                  <p className="text-muted-foreground border-y px-4 py-2 text-xs sm:hidden">
                    {t("common.scrollHint")}
                  </p>
                  <ResultTable showResults={false} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </SiteShell>
  );
}

function ResultTable({ showResults }: { showResults: boolean }) {
  const { t } = useTranslation();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showResults && <TableHead>{t("eventPage.place")}</TableHead>}
          <TableHead>{t("eventPage.lane")}</TableHead>
          <TableHead>{t("common.bib")}</TableHead>
          <TableHead>{t("common.athlete")}</TableHead>
          <TableHead>{t("common.club")}</TableHead>
          <TableHead>{t("common.personalBest")}</TableHead>
          {showResults && (
            <>
              <TableHead>{t("eventPage.mark")}</TableHead>
              <TableHead>{t("eventPage.status")}</TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {athletes.map((a) => (
          <TableRow key={a.bib}>
            {showResults && (
              <TableCell className="font-mono text-lg font-semibold">{a.place}</TableCell>
            )}
            <TableCell className="font-mono">{a.lane}</TableCell>
            <TableCell className="text-muted-foreground font-mono">{a.bib}</TableCell>
            <TableCell>
              <strong>{a.name}</strong>
              <span className="text-muted-foreground ml-2 text-xs">{a.category}</span>
            </TableCell>
            <TableCell>{a.club}</TableCell>
            <TableCell className="font-mono">{a.pb}</TableCell>
            {showResults && (
              <>
                <TableCell className="text-primary font-mono text-lg font-semibold">
                  {a.result}
                </TableCell>
                <TableCell>
                  {a.qualified && (
                    <Badge className="bg-accent text-accent-foreground">
                      Q · {t("eventPage.qualified")}
                    </Badge>
                  )}
                </TableCell>
              </>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ResultsPage() {
  const { t } = useTranslation();
  return (
    <SiteShell>
      <LiveRail />
      <main>
        <PageIntro
          eyebrow={t("resultsPage.eyebrow")}
          title={t("resultsPage.title")}
          intro={t("resultsPage.intro")}
        >
          <div className="relative w-full md:w-80">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input className="bg-card h-10 pl-10" placeholder={t("resultsPage.placeholder")} />
          </div>
        </PageIntro>
        <section className="mx-auto max-w-[1240px] space-y-12 px-4 lg:px-6">
          <div>
            <div className="mb-5 flex items-center gap-2">
              <LivePip />
              <h2 className="text-2xl font-semibold tracking-tight">{t("resultsPage.liveNow")}</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <LiveMeeting
                title="Brussels Indoor"
                organization="CABW"
                events="4 live · 12 finished"
                primary
              />
              <LiveMeeting
                title="Liège Throws"
                organization="RFCL Athlétisme"
                events="2 live · 8 finished"
              />
            </div>
          </div>
          <div>
            <div className="mb-5 flex items-end justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">{t("resultsPage.recent")}</h2>
              <Button variant="outline">
                <ListFilter />
                {t("competitions.filters")}
              </Button>
            </div>
            <Card>
              <CardContent className="px-0">
                <div className="divide-y">
                  {latestResults.map((result) => (
                    <Link
                      to="/competitions/$competitionId/events/$eventId"
                      params={{ competitionId: "brussels-open", eventId: "women-100m" }}
                      key={result.title}
                      className="hover:bg-muted/55 grid gap-3 px-4 py-4 sm:grid-cols-[100px_1fr_1fr_auto] sm:items-center"
                    >
                      <span className="text-muted-foreground font-mono text-xs">{result.date}</span>
                      <span>
                        <strong className="block">{result.title}</strong>
                        <small className="text-muted-foreground">{result.organization}</small>
                      </span>
                      <span>
                        <strong className="block">{result.event}</strong>
                        <small className="text-muted-foreground">{result.winner}</small>
                      </span>
                      <span className="flex items-center gap-4">
                        <b className="text-primary font-mono text-lg">{result.mark}</b>
                        <Badge variant="outline">{t("common.official")}</Badge>
                        <ArrowRight className="size-4" />
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

function LiveMeeting({
  title,
  organization,
  events,
  primary = false,
}: {
  title: string;
  organization: string;
  events: string;
  primary?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Card className={cn(primary && "ring-primary/35")}>
      <CardHeader>
        <div className="text-chart-5 flex items-center gap-2 text-xs font-bold tracking-[.14em] uppercase">
          <LivePip />
          {t("common.live")}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>
          {organization} · {events}
        </CardDescription>
        <CardAction>
          <Link
            to="/competitions/$competitionId/events/$eventId"
            params={{ competitionId: "brussels-open", eventId: "women-100m" }}
            className={cn(
              buttonVariants({ variant: primary ? "default" : "outline" }),
              "min-h-11 md:min-h-8",
            )}
          >
            {t("home.followLive")}
            <ArrowRight />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="bg-muted grid grid-cols-[1fr_auto] gap-2 rounded-lg p-3">
          <span>
            <strong className="block">Women · 100 m</strong>
            <small className="text-muted-foreground">Heat 2 of 3 · provisional</small>
          </span>
          <strong className="font-mono text-xl">11.84</strong>
        </div>
      </CardContent>
    </Card>
  );
}

export function RegistrationsPage() {
  const { t } = useTranslation();
  const { signedIn } = useMockSession();
  if (!signedIn) return <SignInRequired destination={t("nav.registrations")} />;
  return (
    <SiteShell>
      <main>
        <PageIntro
          eyebrow={t("registrations.eyebrow")}
          title={t("registrations.title")}
          intro={t("registrations.intro")}
        >
          <Link
            to="/register"
            className={cn(buttonVariants({ size: "lg" }), "min-h-11 w-full md:w-auto")}
          >
            <Plus />
            {t("detail.registerAthlete")}
          </Link>
        </PageIntro>
        <section className="mx-auto max-w-[980px] space-y-10 px-4 lg:px-6">
          <div>
            <h2 className="text-destructive mb-4 text-sm font-bold tracking-[.14em] uppercase">
              {t("registrations.actionNeeded")}
            </h2>
            <Alert className="border-chart-4/50 bg-chart-4/10 pb-3 sm:pr-24">
              <CircleDollarSign />
              <AlertTitle>Mila Morgan · Antwerp Track Night</AlertTitle>
              <AlertDescription>{t("registrations.paymentPending")} · €18.40</AlertDescription>
              <Button
                className="col-span-2 mt-2 min-h-11 w-full sm:absolute sm:top-1/2 sm:right-3 sm:mt-0 sm:min-h-7 sm:w-auto sm:-translate-y-1/2"
                size="sm"
              >
                {t("registrations.payNow")}
              </Button>
            </Alert>
          </div>
          <div>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">
              {t("registrations.upcoming")}
            </h2>
            <div className="space-y-4">
              <RegistrationCard
                competition="Brussels Open"
                date="2027-05-24"
                changesClose="2027-05-20"
                athlete="Mila Morgan"
                events="100 m · Long jump"
              />
              <RegistrationCard
                competition="Antwerp Track Night"
                date="2027-06-07"
                changesClose="2027-06-03"
                athlete="Noah Morgan"
                events="800 m · 1500 m"
                pending
              />
            </div>
          </div>
          <div>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">
              {t("registrations.past")}
            </h2>
            <RegistrationCard
              competition="Ghent Spring Meet"
              date="2027-05-11"
              changesClose="2027-05-07"
              athlete="Mila Morgan"
              events="200 m · Long jump"
              past
            />
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

function RegistrationCard({
  competition,
  date,
  changesClose,
  athlete,
  events,
  pending = false,
  past = false,
}: {
  competition: string;
  date: string;
  changesClose: string;
  athlete: string;
  events: string;
  pending?: boolean;
  past?: boolean;
}) {
  const { t } = useTranslation();
  const locale = useFrontendLocale();
  return (
    <Card>
      <CardHeader className="grid grid-cols-[48px_minmax(0,1fr)] gap-3 sm:grid-cols-[48px_1fr_auto]">
        <div className="bg-secondary grid size-12 place-items-center rounded-full">
          <UserRound className="text-primary size-5" />
        </div>
        <div>
          <CardTitle>{athlete}</CardTitle>
          <CardDescription>
            {competition} · {formatDate(date, locale)}
          </CardDescription>
        </div>
        <div className="col-span-2 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:justify-self-end">
          {pending ? (
            <Badge variant="outline" className="text-chart-5">
              {t("registrations.paymentPending")}
            </Badge>
          ) : (
            <Badge className="bg-accent text-accent-foreground">
              <Check />
              {past ? t("common.completed") : t("registrations.confirmed")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {events.split(" · ").map((event) => (
            <Badge variant="secondary" key={event}>
              {event}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted-foreground text-xs">
          {t("registrations.deadline")}{" "}
          {formatDate(changesClose, locale, { day: "numeric", month: "short" })}
        </span>
        <Link
          to="/registrations/$registrationId"
          params={{ registrationId: "registration-1" }}
          className={cn(buttonVariants({ variant: "outline" }), "min-h-11 sm:min-h-8")}
        >
          {t("registrations.manage")}
          <ArrowRight />
        </Link>
      </CardFooter>
    </Card>
  );
}

export function RegistrationDetailPage() {
  const { t } = useTranslation();
  const locale = useFrontendLocale();
  const { signedIn } = useMockSession();
  if (!signedIn) return <SignInRequired destination={t("nav.registrations")} />;
  return (
    <SiteShell>
      <main>
        <div className="mx-auto max-w-[980px] px-4 py-10 lg:px-6">
          <Link
            to="/registrations"
            className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="size-4" />
            {t("nav.registrations")}
          </Link>
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge className="bg-accent text-accent-foreground">
                <Check />
                {t("registrations.confirmed")}
              </Badge>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em]">Mila Morgan</h1>
              <p className="text-muted-foreground mt-2">
                Brussels Open · {formatDate("2027-05-24", locale)}
              </p>
            </div>
            <Button>
              <Plus />
              {t("registrations.addEvent")}
            </Button>
          </div>
          <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
            <Card>
              <CardHeader>
                <CardTitle>{t("registrations.entries")}</CardTitle>
                <CardDescription>
                  {t("registrations.deadline")} {formatDate("2027-05-20", locale)}, 23:59
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <EntryRow event="Women · 100 m" pb="12.08" />
                <EntryRow event="Women · Long jump" pb="5.42 m" />
              </CardContent>
            </Card>
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>{t("registrations.payment")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>2 events</span>
                    <span>€12.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("register.fee")}</span>
                    <span>€0.40</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>{t("registrations.total")}</span>
                    <span>€12.40</span>
                  </div>
                </CardContent>
              </Card>
              <Button variant="destructive" className="w-full">
                <X />
                {t("registrations.cancel")}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}

function EntryRow({ event, pb }: { event: string; pb: string }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
      <div>
        <strong>{event}</strong>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("common.personalBest")}: <span className="font-mono">{pb}</span>
        </p>
      </div>
      <Button variant="outline" size="sm" className="min-h-11 sm:min-h-7">
        {t("registrations.updatePb")}
      </Button>
      <Button variant="ghost" size="sm" className="text-destructive min-h-11 sm:min-h-7">
        {t("registrations.remove")}
      </Button>
    </div>
  );
}

export function RegistrationWizardPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [athlete, setAthlete] = useState("mila");
  const [selected, setSelected] = useState(["100m", "long-jump"]);
  const steps = [
    t("register.stepAthlete"),
    t("register.stepEvents"),
    t("register.stepBests"),
    t("register.stepReview"),
  ];
  const { signedIn } = useMockSession();
  if (!signedIn) return <SignInRequired destination={t("detail.registerAthlete")} />;
  const next = () => setStep(Math.min(3, step + 1));
  const back = () => setStep(Math.max(0, step - 1));
  return (
    <SiteShell>
      <main className="mx-auto max-w-[980px] px-4 py-10 lg:px-6">
        <Link
          to="/competitions/$competitionId"
          params={{ competitionId: "brussels-open" }}
          className="text-muted-foreground mb-6 inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" />
          Brussels Open
        </Link>
        <p className="text-primary text-xs font-bold tracking-[.15em] uppercase">
          {t("register.eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">
          {t("register.title")}
        </h1>
        <div className="mt-8">
          <Progress value={(step + 1) * 25} />
          <ol className="mt-3 grid grid-cols-4 gap-2">
            {steps.map((label, index) => (
              <li
                key={label}
                className={cn(
                  "text-xs font-medium text-muted-foreground",
                  index <= step && "text-foreground",
                )}
              >
                <span
                  className={cn(
                    "mr-2 inline-grid size-6 place-items-center rounded-full bg-muted font-mono",
                    index < step && "bg-accent text-accent-foreground",
                    index === step && "bg-primary text-primary-foreground",
                  )}
                >
                  {index < step ? <Check className="size-3" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </li>
            ))}
          </ol>
        </div>
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl">
              {
                [
                  t("register.athleteTitle"),
                  t("register.eventsTitle"),
                  t("register.bestsTitle"),
                  t("register.reviewTitle"),
                ][step]
              }
            </CardTitle>
            {step === 0 && <CardDescription>{t("register.athleteHint")}</CardDescription>}
          </CardHeader>
          <CardContent>
            {step === 0 && <AthleteStep value={athlete} setValue={setAthlete} />}{" "}
            {step === 1 && <EventsStep selected={selected} setSelected={setSelected} />}{" "}
            {step === 2 && <BestsStep selected={selected} />}{" "}
            {step === 3 && <ReviewStep athleteId={athlete} selected={selected} />}
          </CardContent>
          <CardFooter className="justify-between">
            {step > 0 ? (
              <Button variant="outline" className="min-h-11 sm:min-h-8" onClick={back}>
                <ArrowLeft />
                {t("register.back")}
              </Button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <Button
                className="min-h-11 sm:min-h-8"
                disabled={step === 1 && selected.length === 0}
                onClick={next}
              >
                {t("register.continue")}
                <ArrowRight />
              </Button>
            ) : (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button variant="outline" className="min-h-11 w-full sm:min-h-8 sm:w-auto">
                  <Plus />
                  {t("register.addAnother")}
                </Button>
                <Button className="min-h-11 w-full sm:min-h-8 sm:w-auto">
                  <CreditCard />
                  {t("register.confirmPay")}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </main>
    </SiteShell>
  );
}

function AthleteStep({ value, setValue }: { value: string; setValue: (v: string) => void }) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => setValue(String(v))}
      className="grid gap-3 sm:grid-cols-2"
    >
      {registrationAthletes.map((a) => (
        <Label
          key={a.id}
          className={cn(
            "flex cursor-pointer items-center gap-4 rounded-xl border p-4",
            value === a.id && "border-primary bg-secondary",
          )}
        >
          <RadioGroupItem value={a.id} />
          <Avatar>
            <AvatarFallback>
              {a.name
                .split(" ")
                .map((x) => x[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span>
            <strong className="block">{a.name}</strong>
            <small className="text-muted-foreground">{a.meta}</small>
          </span>
        </Label>
      ))}
    </RadioGroup>
  );
}
function EventsStep({
  selected,
  setSelected,
}: {
  selected: string[];
  setSelected: (v: string[]) => void;
}) {
  const { t } = useTranslation();
  const locale = useFrontendLocale();
  return (
    <div className="space-y-3">
      {registrationEvents.map((event) => {
        const checked = selected.includes(event.id);
        return (
          <Label
            key={event.id}
            className={cn(
              "grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border p-4 sm:grid-cols-[auto_1fr_auto] sm:gap-4",
              checked && "border-primary bg-secondary",
            )}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={() =>
                setSelected(
                  checked ? selected.filter((x) => x !== event.id) : [...selected, event.id],
                )
              }
            />
            <span>
              <strong className="block">{event.name}</strong>
              <small className="text-muted-foreground">
                {formatDate(event.date, locale, { day: "numeric", month: "short" })} · {event.round}{" "}
                {event.time}
              </small>
            </span>
            <span className="col-start-2 text-left sm:col-start-3 sm:text-right">
              <b className="block">€{event.price}</b>
              <small className="text-accent-foreground">{t("register.eligible")}</small>
            </span>
          </Label>
        );
      })}
    </div>
  );
}
function BestsStep({ selected }: { selected: string[] }) {
  const { t } = useTranslation();
  const locale = useFrontendLocale();
  const selectedEvents = registrationEvents.filter((event) => selected.includes(event.id));
  return (
    <div className="space-y-4">
      {selectedEvents.map((event, index) => (
        <div key={event.id}>
          {index > 0 && <Separator className="mb-4" />}
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <Label>
              {event.name}
              <span className="mt-2 block">
                <Input defaultValue={event.personalBest.replace(" m", "")} />
              </span>
            </Label>
            <Info
              label={t("common.personalBest")}
              value={`${event.personalBest} · ${formatDate(event.personalBestDate, locale)}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
function ReviewStep({ athleteId, selected }: { athleteId: string; selected: string[] }) {
  const { t, i18n } = useTranslation();
  const athlete =
    registrationAthletes.find((registrationAthlete) => registrationAthlete.id === athleteId) ??
    registrationAthletes[0];
  const selectedEvents = registrationEvents.filter((event) => selected.includes(event.id));
  const subtotal = selectedEvents.reduce((total, event) => total + event.price, 0);
  const paymentFee = 0.4;
  const currency = new Intl.NumberFormat(localeFor(i18n.resolvedLanguage ?? i18n.language), {
    style: "currency",
    currency: "EUR",
  });
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
      <div className="rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{athlete.initials}</AvatarFallback>
          </Avatar>
          <div>
            <strong>{athlete.name}</strong>
            <p className="text-muted-foreground text-sm">{athlete.detail}</p>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="space-y-3">
          {selectedEvents.map((event) => (
            <div key={event.id} className="flex justify-between gap-3">
              <span>
                {event.name}{" "}
                <small className="text-muted-foreground">PB {event.personalBest}</small>
              </span>
              <b>{currency.format(event.price)}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-muted rounded-xl p-4 text-sm">
        <div className="flex justify-between">
          <span>
            {selectedEvents.length} {t("common.events")}
          </span>
          <span>{currency.format(subtotal)}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span>{t("register.fee")}</span>
          <span>{currency.format(paymentFee)}</span>
        </div>
        <Separator className="my-3" />
        <div className="flex justify-between text-base font-semibold">
          <span>{t("register.total")}</span>
          <span>{currency.format(subtotal + paymentFee)}</span>
        </div>
        <p className="text-muted-foreground mt-4 flex gap-2 text-xs">
          <LockKeyhole className="size-4" />
          {t("register.secure")}
        </p>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { signedIn } = useMockSession();
  const [verified, setVerified] = useState(false);
  if (!signedIn) return <SignInRequired destination={t("nav.profile")} />;
  return (
    <SiteShell>
      <main>
        <PageIntro
          eyebrow={t("profile.eyebrow")}
          title={t("profile.title")}
          intro={t("profile.intro")}
        />
        <section className="mx-auto grid max-w-[980px] gap-5 px-4 lg:grid-cols-[1fr_340px] lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t("profile.personal")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="profile-name">{t("profile.name")}</Label>
                <Input id="profile-name" className="mt-2 h-10" defaultValue="Alex Morgan" />
              </div>
              <div>
                <Label htmlFor="profile-email">{t("profile.email")}</Label>
                <Input
                  id="profile-email"
                  className="mt-2 h-10"
                  defaultValue="alex.morgan@example.be"
                  disabled
                />
                <p className="text-muted-foreground mt-2 text-xs">{t("profile.emailHint")}</p>
              </div>
              <div>
                <Label>{t("profile.language")}</Label>
                <Select
                  value={i18n.language.slice(0, 2)}
                  onValueChange={(value) => {
                    window.localStorage.setItem(frontendLanguageStorageKey, String(value));
                    void i18n.changeLanguage(String(value));
                  }}
                >
                  <SelectTrigger className="mt-2 h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="nl">Nederlands</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button>{t("profile.save")}</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t("profile.security")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cn(
                  "rounded-lg p-3",
                  verified ? "bg-accent" : "border border-chart-4/50 bg-chart-4/10",
                )}
              >
                <div className="flex items-start gap-3">
                  <MailCheck className="mt-0.5 size-5" />
                  <div>
                    <strong>{t(verified ? "profile.verified" : "profile.unverified")}</strong>
                    <p className="text-muted-foreground mt-1 text-sm">alex.morgan@example.be</p>
                  </div>
                </div>
                {!verified && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => setVerified(true)}
                  >
                    {t("profile.resend")}
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-primary size-5" />
                  <div>
                    <strong>{t("profile.password")}</strong>
                    <p className="text-muted-foreground text-xs">Updated 3 months ago</p>
                  </div>
                </div>
                <PasswordDialog />
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </SiteShell>
  );
}

function PasswordDialog() {
  const { t } = useTranslation();
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        {t("profile.changePassword")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("profile.changePassword")}</DialogTitle>
          <DialogDescription>Use at least 8 characters.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("profile.currentPassword")}</Label>
            <Input type="password" className="mt-2" />
          </div>
          <div>
            <Label>{t("profile.newPassword")}</Label>
            <Input type="password" className="mt-2" />
          </div>
        </div>
        <DialogFooter>
          <Button>{t("profile.updatePassword")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function localeFor(language: string) {
  return (
    languageLocales[language.slice(0, 2) as keyof typeof languageLocales] ?? languageLocales.en
  );
}
