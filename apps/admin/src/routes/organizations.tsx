import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ENV } from "varlock/env";

export const Route = createFileRoute("/organizations")({
  component: OrganizationsPage,
});

function OrganizationsPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch(`${ENV.API_URL}/api/organizations`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        slug: form.get("slug"),
        ownerId: form.get("ownerId"),
      }),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setMessage(body.error ?? "Organization could not be created");
      return;
    }

    const organization = (await response.json()) as { name: string; ownerId: string };
    setMessage(`${organization.name} was created with owner ${organization.ownerId}.`);
    event.currentTarget.reset();
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Create organization</CardTitle>
        <CardDescription>Assign an existing user as the organization owner.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={createOrganization}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerId">Owner user ID</Label>
            <Input id="ownerId" name="ownerId" required minLength={32} maxLength={32} />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create organization"}
          </Button>
          {message && <p role="status">{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
