import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Skeleton,
} from "@repo/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCompetitionCatalog, useCreateCompetition } from "@/features/competitions";

export const Route = createFileRoute("/organizations/$organizationId/competitions/new")({
  component: NewCompetitionPage,
});

function NewCompetitionPage() {
  const { organizationId } = Route.useParams();
  const navigate = useNavigate();
  const catalog = useCompetitionCatalog(organizationId);
  const createCompetition = useCreateCompetition(organizationId);
  const [name, setName] = useState("");
  const [primaryLocale, setPrimaryLocale] = useState<"EN" | "FR" | "NL">("EN");
  const [athleticsSeasonId, setAthleticsSeasonId] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await createCompetition.mutateAsync({
        name,
        primaryLocale,
        athleticsSeasonId,
      });
      toast.success("Draft created");
      await navigate({
        to: "/organizations/$organizationId/competitions/$competitionId",
        params: { organizationId, competitionId: result.competition.id },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Draft could not be created");
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-5 md:p-8">
      <Button
        variant="ghost"
        className="mb-5 -ml-2"
        render={
          <Link to="/organizations/$organizationId/competitions" params={{ organizationId }} />
        }
      >
        <ArrowLeft /> Competitions
      </Button>
      <div className="mb-7">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-cyan-800 uppercase">
          New Draft
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Name the Competition</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          These details establish the Draft. The primary locale cannot change later.
        </p>
      </div>
      <Card className="bg-background/95">
        <CardHeader>
          <CardTitle>Competition basics</CardTitle>
          <CardDescription>You can save the remaining setup sections afterward.</CardDescription>
        </CardHeader>
        <CardContent>
          {catalog.isPending ? (
            <Skeleton className="h-52" />
          ) : catalog.isError ? (
            <p className="text-destructive text-sm">{catalog.error.message}</p>
          ) : (
            <form className="space-y-5" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="competition-name">Competition name</Label>
                <Input
                  id="competition-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Brussels Summer Meeting"
                  required
                  maxLength={160}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primary-locale">Primary locale</Label>
                  <select
                    id="primary-locale"
                    value={primaryLocale}
                    onChange={(event) =>
                      setPrimaryLocale(event.target.value as typeof primaryLocale)
                    }
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  >
                    <option value="EN">English</option>
                    <option value="FR">French</option>
                    <option value="NL">Dutch</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="athletics-season">Athletics Season</Label>
                  <select
                    id="athletics-season"
                    value={athleticsSeasonId}
                    onChange={(event) => setAthleticsSeasonId(event.target.value)}
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                    required
                  >
                    <option value="">Select a season</option>
                    {catalog.data.seasons.map((season) => (
                      <option key={season.id} value={season.id}>
                        {season.code} · {season.provider}
                      </option>
                    ))}
                  </select>
                  {catalog.data.seasons.length === 0 ? (
                    <p className="text-destructive text-xs">
                      No Athletics Seasons are available. Ask a platform administrator to load the
                      catalog.
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex justify-end border-t pt-5">
                <Button
                  type="submit"
                  disabled={createCompetition.isPending || !name.trim() || !athleticsSeasonId}
                >
                  {createCompetition.isPending ? "Creating…" : "Create Draft"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
