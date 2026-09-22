import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/competitions/$competitionId")({ component: Outlet });
