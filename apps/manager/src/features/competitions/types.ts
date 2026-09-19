import type {
  CreateCompetition,
  UpdateCompetitionDetails,
  UpdateCompetitionPricing,
  UpsertCompetitionEvent,
} from "@repo/utils";
import type { InferResponseType } from "hono/client";

import type { apiClient } from "@/lib/api-client";

export type {
  CreateCompetition,
  UpdateCompetitionDetails,
  UpdateCompetitionPricing,
  UpsertCompetitionEvent,
};

type OrganizationsApi = (typeof apiClient)["api"]["manager"]["organizations"][":organizationId"];
type CompetitionsApi = OrganizationsApi["competitions"];

type CompetitionCatalogResponse = InferResponseType<OrganizationsApi["catalog"]["$get"], 200>;
type CompetitionsResponse = InferResponseType<CompetitionsApi["$get"], 200>;
type CompetitionResponse = InferResponseType<CompetitionsApi[":competitionId"]["$get"], 200>;

export type CompetitionCatalog = CompetitionCatalogResponse;
export type CompetitionSummary = CompetitionsResponse["competitions"][number];
export type Competition = CompetitionResponse["competition"];
export type CompetitionEvent = Competition["events"][number];
