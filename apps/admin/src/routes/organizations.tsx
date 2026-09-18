import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { CreateOrganizationDialog, OrganizationsTable } from "@/features/organizations";

function OrganizationsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <OrganizationsTable onCreate={() => setCreateDialogOpen(true)} />
      <CreateOrganizationDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </>
  );
}

export const Route = createFileRoute("/organizations")({
  component: OrganizationsPage,
});
