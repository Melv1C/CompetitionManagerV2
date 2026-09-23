import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  CompetitionCard,
  CompetitionCardSkeleton,
  selectTranslation,
  usePublicCompetitions,
} from "@/features/competitions";
import { PageIntro, SiteShell } from "@/features/layout";

const allDisciplines = "all";

export function CompetitionsPage() {
  const { t, i18n } = useTranslation();
  const search = useSearch({ from: "/competitions/" });
  const navigate = useNavigate({ from: "/competitions" });
  const competitions = usePublicCompetitions(search);
  const pages = competitions.data?.pages ?? [];
  const records = pages.flatMap((page) => page.competitions);
  const disciplines = pages[0]?.disciplines ?? [];
  const language = i18n.resolvedLanguage ?? i18n.language;

  const updateSearch = (next: { q?: string; disciplineId?: string }) => {
    void navigate({
      search: {
        q: next.q?.trim() || undefined,
        disciplineId: next.disciplineId || undefined,
      },
    });
  };

  return (
    <SiteShell>
      <main>
        <PageIntro
          eyebrow={t("competitions.eyebrow")}
          title={t("competitions.title")}
          intro={t("competitions.intro")}
        />
        <section className="mx-auto max-w-[1240px] px-4 lg:px-6">
          <div className="bg-card mb-6 grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_auto]">
            <form
              key={search.q ?? ""}
              className="grid gap-3 sm:grid-cols-[1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                const query = new FormData(event.currentTarget).get("q");
                updateSearch({ ...search, q: typeof query === "string" ? query : undefined });
              }}
            >
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  name="q"
                  defaultValue={search.q ?? ""}
                  className="h-10 pl-10"
                  placeholder={t("competitions.searchPlaceholder")}
                  aria-label={t("competitions.searchLabel")}
                />
              </div>
              <Button type="submit" variant="outline" className="h-10">
                {t("common.search")}
              </Button>
            </form>
            <Select
              value={search.disciplineId ?? allDisciplines}
              onValueChange={(value) =>
                updateSearch({
                  ...search,
                  disciplineId: !value || value === allDisciplines ? undefined : value,
                })
              }
            >
              <SelectTrigger
                className="h-10 w-full md:w-56"
                aria-label={t("competitions.discipline")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allDisciplines}>{t("competitions.allDisciplines")}</SelectItem>
                {disciplines.map((discipline) => (
                  <SelectItem key={discipline.id} value={discipline.id}>
                    {selectTranslation(discipline.translations, language, "EN")?.name ??
                      discipline.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {competitions.isPending ? (
            <div
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              aria-label={t("common.loading")}
            >
              {Array.from({ length: 6 }, (_, index) => (
                <CompetitionCardSkeleton key={index} />
              ))}
            </div>
          ) : competitions.isError && records.length === 0 ? (
            <Alert variant="destructive">
              <AlertTitle>{t("competitions.loadErrorTitle")}</AlertTitle>
              <AlertDescription className="mt-3 space-y-3">
                <p>{t("competitions.loadError")}</p>
                <Button variant="outline" onClick={() => void competitions.refetch()}>
                  {t("common.retry")}
                </Button>
              </AlertDescription>
            </Alert>
          ) : records.length === 0 ? (
            <div className="bg-card rounded-xl border px-5 py-12 text-center">
              <h2 className="text-xl font-semibold">{t("competitions.emptyTitle")}</h2>
              <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm">
                {t("competitions.emptyDescription")}
              </p>
              {(search.q || search.disciplineId) && (
                <Button variant="outline" className="mt-5" onClick={() => updateSearch({})}>
                  {t("competitions.clearFilters")}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {records.map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} />
                ))}
              </div>
              {competitions.hasNextPage && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    disabled={competitions.isFetchingNextPage}
                    onClick={() => void competitions.fetchNextPage()}
                  >
                    {competitions.isFetchingNextPage
                      ? t("common.loading")
                      : t("competitions.loadMore")}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </SiteShell>
  );
}
