import type { InferResponseType } from "hono/client";

import type { apiClient } from "@/lib/api-client";

type CompetitionsApi = (typeof apiClient)["api"]["competitions"];

export type PublicCompetitionsResponse = InferResponseType<CompetitionsApi["$get"], 200>;
export type PublicCompetitionSummary = PublicCompetitionsResponse["competitions"][number];
export type PublicCompetitionDetail = InferResponseType<
  CompetitionsApi[":competitionId"]["$get"],
  200
>["competition"];
export type PublicCompetitionEvent = PublicCompetitionDetail["events"][number];
export type PublicDiscipline = PublicCompetitionsResponse["disciplines"][number];
export type PublicTranslation = { locale: "EN" | "FR" | "NL"; name: string };
