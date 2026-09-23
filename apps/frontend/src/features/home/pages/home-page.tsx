import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  buttonVariants,
  cn,
} from "@repo/ui";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  CompetitionCard,
  CompetitionCardSkeleton,
  browserLocale,
  usePublicCompetitions,
} from "@/features/competitions";
import { LivePip, LiveRail } from "@/features/home/components/live-rail";
import { mockLatestResults, mockLiveLeaders } from "@/features/home/data/mock-home-data";
import { SiteShell } from "@/features/layout";

function formatMockDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(browserLocale(locale), {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate({ from: "/" });
  const [search, setSearch] = useState("");
  const competitions = usePublicCompetitions({ limit: 3 });
  const upcoming = competitions.data?.pages[0]?.competitions ?? [];
  const language = i18n.resolvedLanguage ?? i18n.language;

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
              <form
                className="mt-8 grid max-w-xl gap-2 sm:grid-cols-[1fr_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  void navigate({
                    to: "/competitions",
                    search: { q: search.trim() || undefined, disciplineId: undefined },
                  });
                }}
              >
                <div className="relative flex-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="bg-card h-11 pl-10"
                    placeholder={t("competitions.searchPlaceholder")}
                    aria-label={t("competitions.searchLabel")}
                  />
                </div>
                <Button type="submit" size="lg" className="min-h-11 w-full sm:w-auto">
                  {t("common.search")}
                </Button>
              </form>
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
                {mockLiveLeaders.map((athlete) => (
                  <div
                    key={athlete.name}
                    className="grid grid-cols-[28px_1fr_auto] items-center gap-3 border-t py-3 first:border-t-0"
                  >
                    <b className="font-mono text-lg">{athlete.place}</b>
                    <span>
                      <strong className="block">{athlete.name}</strong>
                      <small className="text-muted-foreground">{athlete.club}</small>
                    </span>
                    <strong className="font-mono text-xl tracking-tight">{athlete.result}</strong>
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
              search={{ q: undefined, disciplineId: undefined }}
              className={cn(buttonVariants({ variant: "outline" }), "min-h-11 sm:min-h-8")}
            >
              {t("home.browse")}
              <ArrowRight />
            </Link>
          </div>
          {competitions.isPending ? (
            <div className="grid gap-4 lg:grid-cols-3" aria-label={t("common.loading")}>
              {Array.from({ length: 3 }, (_, index) => (
                <CompetitionCardSkeleton key={index} />
              ))}
            </div>
          ) : competitions.isError ? (
            <Alert variant="destructive">
              <AlertTitle>{t("competitions.loadErrorTitle")}</AlertTitle>
              <AlertDescription className="mt-3 space-y-3">
                <p>{t("home.competitionsLoadError")}</p>
                <Button variant="outline" onClick={() => void competitions.refetch()}>
                  {t("common.retry")}
                </Button>
              </AlertDescription>
            </Alert>
          ) : upcoming.length === 0 ? (
            <p className="text-muted-foreground rounded-xl border px-5 py-10 text-center text-sm">
              {t("home.noUpcoming")}
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {upcoming.map((competition) => (
                <CompetitionCard key={competition.id} competition={competition} />
              ))}
            </div>
          )}
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
              {mockLatestResults.map((result, index) => (
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
                    {formatMockDate(result.date, language)}
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
