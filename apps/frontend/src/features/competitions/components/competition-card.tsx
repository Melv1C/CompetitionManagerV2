import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  buttonVariants,
  cn,
} from "@repo/ui";
import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatCompetitionDate, selectTranslation } from "@/features/competitions/format";
import type { PublicCompetitionSummary } from "@/features/competitions/types";

function RegistrationBadge({ competition }: { competition: PublicCompetitionSummary }) {
  const { t, i18n } = useTranslation();
  if (competition.lifecycleState === "IN_PROGRESS") {
    return <Badge className="bg-chart-5 text-white">{t("common.live")}</Badge>;
  }
  if (competition.registrationState === "OPEN") {
    return <Badge className="bg-accent text-accent-foreground">{t("common.open")}</Badge>;
  }
  if (competition.registrationState === "SCHEDULED") {
    return (
      <Badge variant="secondary">
        {t("competitions.opens")}{" "}
        {formatCompetitionDate(
          competition.registrationOpensAt,
          i18n.resolvedLanguage ?? i18n.language,
          competition.timeZone,
          { day: "numeric", month: "short" },
        )}
      </Badge>
    );
  }
  return <Badge variant="outline">{t("common.closed")}</Badge>;
}

export function CompetitionCard({ competition }: { competition: PublicCompetitionSummary }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const translation = selectTranslation(
    competition.translations,
    language,
    competition.primaryLocale,
  );
  const disciplineNames = competition.disciplines.map((discipline) => {
    const selected = selectTranslation(
      discipline.translations,
      language,
      competition.primaryLocale,
    );
    return selected?.abbreviation || selected?.name || discipline.code;
  });
  const place = [competition.venue.name, competition.venue.city].filter(Boolean).join(", ");

  return (
    <Card className="group transition-transform hover:-translate-y-0.5">
      <CardHeader className="grid grid-cols-[58px_1fr] gap-4">
        <div className="bg-secondary flex h-16 flex-col items-center justify-center rounded-lg font-mono leading-none">
          <strong className="text-2xl">
            {formatCompetitionDate(competition.startsAt, language, competition.timeZone, {
              day: "2-digit",
            })}
          </strong>
          <span className="text-muted-foreground mt-1 text-[10px] font-bold tracking-[0.12em]">
            {formatCompetitionDate(competition.startsAt, language, competition.timeZone, {
              month: "short",
            }).toLocaleUpperCase(language)}
          </span>
        </div>
        <div className="min-w-0">
          <RegistrationBadge competition={competition} />
          <h3 className="mt-2 text-lg leading-none font-semibold">{translation?.name}</h3>
          <CardDescription>{competition.organization.name}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <p className="text-muted-foreground flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          {place}
        </p>
        <p className="text-muted-foreground flex items-start gap-2">
          <Trophy className="mt-0.5 size-4 shrink-0" />
          {disciplineNames.join(" · ")}
        </p>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <span className="text-muted-foreground text-xs">
          {competition.registrationState === "OPEN"
            ? `${t("competitions.closes")} ${formatCompetitionDate(
                competition.registrationClosesAt,
                language,
                competition.timeZone,
                { day: "numeric", month: "short" },
              )}`
            : t(
                competition.registrationState === "SCHEDULED"
                  ? "competitions.registrationScheduled"
                  : "common.closed",
              )}
        </span>
        <Link
          to="/competitions/$competitionId"
          params={{ competitionId: competition.id }}
          className={cn(buttonVariants({ variant: "outline" }), "min-h-11 md:min-h-8")}
        >
          {t("common.details")}
          <ArrowRight />
        </Link>
      </CardFooter>
    </Card>
  );
}
