import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
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
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Flag, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  PublicCompetitionApiError,
  formatCompetitionDate,
  formatCompetitionDateRange,
  formatEuros,
  selectTranslation,
  usePublicCompetition,
} from "@/features/competitions";
import type { PublicCompetitionDetail } from "@/features/competitions/types";
import { SiteShell } from "@/features/layout";

function NotFound() {
  const { t } = useTranslation();
  return (
    <SiteShell>
      <main className="mx-auto max-w-[760px] px-4 py-16 lg:px-6">
        <h1 className="text-3xl font-semibold">{t("competitions.notFound")}</h1>
        <Link
          to="/competitions"
          search={{ q: undefined, disciplineId: undefined }}
          className={cn(buttonVariants({ variant: "outline" }), "mt-6 min-h-11")}
        >
          <ArrowLeft /> {t("detail.back")}
        </Link>
      </main>
    </SiteShell>
  );
}

function DetailLoading() {
  const { t } = useTranslation();
  return (
    <SiteShell>
      <main aria-label={t("common.loading")}>
        <div className="bg-card border-b">
          <div className="mx-auto max-w-[1240px] space-y-4 px-4 py-8 lg:px-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-12 w-3/5" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        </div>
        <div className="mx-auto max-w-[1240px] space-y-5 px-4 py-8 lg:px-6">
          <Skeleton className="h-11 w-64" />
          <Skeleton className="h-72 w-full" />
        </div>
      </main>
    </SiteShell>
  );
}

function RegistrationBadge({ competition }: { competition: PublicCompetitionDetail }) {
  const { t } = useTranslation();
  if (competition.lifecycleState === "IN_PROGRESS") {
    return <Badge className="bg-chart-5 text-white">{t("common.live")}</Badge>;
  }
  if (competition.registrationState === "OPEN") {
    return <Badge className="bg-accent text-accent-foreground">{t("common.open")}</Badge>;
  }
  if (competition.registrationState === "SCHEDULED") {
    return <Badge variant="secondary">{t("competitions.registrationScheduled")}</Badge>;
  }
  return <Badge variant="outline">{t("common.closed")}</Badge>;
}

function CompetitionHeading({ competition }: { competition: PublicCompetitionDetail }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const translation = selectTranslation(
    competition.translations,
    language,
    competition.primaryLocale,
  );
  return (
    <div className="bg-card border-b">
      <div className="mx-auto max-w-[1240px] px-4 py-8 lg:px-6">
        <Link
          to="/competitions"
          search={{ q: undefined, disciplineId: undefined }}
          className="text-muted-foreground hover:text-foreground mb-5 inline-flex min-h-11 items-center gap-2 text-sm md:min-h-0"
        >
          <ArrowLeft className="size-4" />
          {t("detail.back")}
        </Link>
        <RegistrationBadge competition={competition} />
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
          {translation?.name}
        </h1>
        <p className="text-muted-foreground mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6">
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0" />
            {formatCompetitionDateRange(
              competition.startsAt,
              competition.endsAt,
              language,
              competition.timeZone,
            )}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" />
            {competition.venue.name}, {competition.venue.city}
          </span>
          <span className="flex items-center gap-2">
            <Flag className="size-4 shrink-0" />
            {competition.organization.name}
          </span>
        </p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs font-semibold tracking-[0.12em] uppercase">
        {label}
      </span>
      <strong className="text-foreground mt-1 block font-medium">{value}</strong>
    </div>
  );
}

function Prices({ competition }: { competition: PublicCompetitionDetail }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("detail.pricesTitle")}</CardTitle>
        <CardDescription>{t("detail.pricesHint")}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <p className="text-muted-foreground border-y px-4 py-2 text-xs sm:hidden">
          {t("common.scrollHint")}
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.event")}</TableHead>
              {competition.pricingTiers.map((tier) => (
                <TableHead key={tier.name} className="min-w-40 align-top">
                  <span className="text-foreground block">
                    {tier.name}
                    {tier.isDefault && (
                      <Badge variant="secondary" className="ml-2">
                        {t("detail.defaultTier")}
                      </Badge>
                    )}
                  </span>
                  {!tier.isDefault && tier.clubs.length > 0 && (
                    <span className="mt-1 block text-xs font-normal whitespace-normal">
                      {tier.clubs
                        .map((club) =>
                          club.abbreviation ? `${club.abbreviation} · ${club.name}` : club.name,
                        )
                        .join(", ")}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {competition.events.map((event) => {
              const name = selectTranslation(
                event.translations,
                language,
                competition.primaryLocale,
              )?.name;
              return (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{name}</TableCell>
                  {competition.pricingTiers.map((tier) => {
                    const price = tier.prices.find(
                      ({ competitionEventId }) => competitionEventId === event.id,
                    );
                    return (
                      <TableCell key={tier.name} className="font-mono">
                        {!event.registerable
                          ? t("detail.notRegisterable")
                          : price?.priceCents === 0
                            ? t("detail.free")
                            : price
                              ? formatEuros(price.priceCents, language)
                              : "—"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Overview({ competition }: { competition: PublicCompetitionDetail }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const translation = selectTranslation(
    competition.translations,
    language,
    competition.primaryLocale,
  );
  const categories = new Map<string, string>();
  for (const event of competition.events) {
    for (const category of event.eligibility) {
      const selected = selectTranslation(
        category.translations,
        language,
        competition.primaryLocale,
      );
      categories.set(category.id, selected?.abbreviation || selected?.name || category.code);
    }
  }
  const contact = [competition.contactName, competition.contactEmail, competition.contactPhone]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t("detail.about")}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-6 text-sm leading-6">
          {translation?.description && (
            <p className="whitespace-pre-line">{translation.description}</p>
          )}
          <div className="grid gap-5 border-t pt-6 sm:grid-cols-2">
            <Info
              label={t("detail.registrationWindow")}
              value={formatCompetitionDateRange(
                competition.registrationOpensAt,
                competition.registrationClosesAt,
                language,
                competition.timeZone,
              )}
            />
            <Info
              label={t("detail.eligibility")}
              value={[...categories.values()].join(", ") || t("detail.noEligibility")}
            />
            <Info label={t("detail.contact")} value={contact || t("detail.noContact")} />
            <Info
              label={t("common.location")}
              value={[
                competition.venue.name,
                competition.venue.addressLine1,
                competition.venue.postalCode,
                competition.venue.city,
              ].join(", ")}
            />
          </div>
        </CardContent>
      </Card>
      <Prices competition={competition} />
    </div>
  );
}

function Schedule({ competition }: { competition: PublicCompetitionDetail }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const rows = competition.events
    .flatMap((event) => event.rounds.map((round) => ({ event, round })))
    .sort(
      (left, right) =>
        new Date(left.round.scheduledStartAt).getTime() -
        new Date(right.round.scheduledStartAt).getTime(),
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("detail.scheduleTitle")}</CardTitle>
        <CardDescription>{t("detail.scheduleHint")}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {rows.length === 0 ? (
          <p className="text-muted-foreground px-4 py-8 text-center text-sm">
            {t("detail.noSchedule")}
          </p>
        ) : (
          <div className="divide-y">
            {rows.map(({ event, round }) => {
              const name = selectTranslation(
                event.translations,
                language,
                competition.primaryLocale,
              )?.name;
              return (
                <div
                  key={round.id}
                  className="grid grid-cols-[72px_1fr] items-center gap-4 px-4 py-4 sm:grid-cols-[120px_1fr_auto]"
                >
                  <time dateTime={round.scheduledStartAt} className="font-mono font-semibold">
                    <span className="block text-lg">
                      {formatCompetitionDate(
                        round.scheduledStartAt,
                        language,
                        competition.timeZone,
                        { hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
                      )}
                    </span>
                    <span className="text-muted-foreground text-xs font-normal">
                      {formatCompetitionDate(
                        round.scheduledStartAt,
                        language,
                        competition.timeZone,
                        { day: "numeric", month: "short" },
                      )}
                    </span>
                  </time>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{name}</strong>
                      {round.status === "LIVE" && (
                        <Badge className="bg-chart-5 text-white">{t("common.live")}</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">{round.label}</p>
                  </div>
                  {round.startGroupCount > 0 && (
                    <Badge variant="outline" className="col-start-2 w-fit sm:col-start-auto">
                      {t("detail.startGroups", { count: round.startGroupCount })}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CompetitionDetailPage() {
  const { t } = useTranslation();
  const { competitionId } = useParams({ from: "/competitions/$competitionId/" });
  const competition = usePublicCompetition(competitionId);

  if (competition.isPending) return <DetailLoading />;
  if (competition.error instanceof PublicCompetitionApiError && competition.error.status === 404) {
    return <NotFound />;
  }
  if (competition.isError) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-[760px] px-4 py-16 lg:px-6">
          <Alert variant="destructive">
            <AlertTitle>{t("competitions.loadErrorTitle")}</AlertTitle>
            <AlertDescription className="mt-3 space-y-3">
              <p>{t("competitions.detailLoadError")}</p>
              <Button variant="outline" onClick={() => void competition.refetch()}>
                {t("common.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        </main>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <main>
        <CompetitionHeading competition={competition.data} />
        <div className="mx-auto max-w-[1240px] px-4 py-8 lg:px-6">
          <Tabs defaultValue="schedule">
            <TabsList variant="line" className="mb-8 w-full justify-start border-b pb-3">
              <TabsTrigger value="overview">{t("detail.overview")}</TabsTrigger>
              <TabsTrigger value="schedule">{t("detail.schedule")}</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <Overview competition={competition.data} />
            </TabsContent>
            <TabsContent value="schedule">
              <Schedule competition={competition.data} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </SiteShell>
  );
}
