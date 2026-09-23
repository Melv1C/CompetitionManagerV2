import { Hono } from "hono";

import { catalogueRoutes } from "./manager-competitions/catalogue";
import { competitionRoutes } from "./manager-competitions/competitions";
import { eventRoutes } from "./manager-competitions/events";
import { lifecycleRoutes } from "./manager-competitions/lifecycle";
import { CompetitionRouteError } from "./manager-competitions/shared";

export const managerCompetitionsRoutes = new Hono()
  .onError((error, c) => {
    if (error instanceof CompetitionRouteError) {
      return c.json({ error: error.message }, error.status);
    }
    throw error;
  })
  .route("/", catalogueRoutes)
  .route("/", competitionRoutes)
  .route("/", eventRoutes)
  .route("/", lifecycleRoutes);
