import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { useCreateOrganization, useOrganizationOwnerCandidates } from "../use-organizations";

type CreateOrganizationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateOrganizationDialog({ open, onOpenChange }: CreateOrganizationDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const createOrganization = useCreateOrganization();
  const owners = useOrganizationOwnerCandidates(ownerSearch);

  const ownerItems =
    owners.data?.map((user) => ({
      value: user.id,
      label: `${user.name} · ${user.email}`,
    })) ?? [];

  const reset = () => {
    setName("");
    setSlug("");
    setOwnerId("");
    setOwnerSearch("");
    setSlugEdited(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createOrganization.mutateAsync({
      name: name.trim(),
      slug: slug.trim(),
      ownerId,
    });
    handleOpenChange(false);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugEdited) setSlug(toSlug(value));
  };

  const isValid = name.trim().length > 0 && slug.trim().length > 0 && ownerId.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
          <DialogDescription>
            Choose the user who will own and manage this organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="organization-name">Name</Label>
            <Input
              id="organization-name"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="Brussels Athletics"
              maxLength={120}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization-slug">Slug</Label>
            <Input
              id="organization-slug"
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(toSlug(event.target.value));
              }}
              placeholder="brussels-athletics"
              maxLength={80}
              required
            />
            <p className="text-muted-foreground text-xs">
              Used in links and integrations. Lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization-owner">Owner</Label>
            <Input
              aria-label="Search owners"
              value={ownerSearch}
              onChange={(event) => {
                setOwnerSearch(event.target.value);
                setOwnerId("");
              }}
              placeholder="Search by name or email"
            />
            <Select
              value={ownerId || null}
              onValueChange={(value) => setOwnerId(value ?? "")}
              items={ownerItems}
              disabled={owners.isPending || owners.isError}
            >
              <SelectTrigger id="organization-owner" className="w-full">
                <SelectValue
                  placeholder={owners.isPending ? "Loading users..." : "Select an owner"}
                />
              </SelectTrigger>
              <SelectContent>
                {ownerItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {owners.isError && (
              <p className="text-destructive text-xs">Could not load eligible owners.</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || createOrganization.isPending}>
              {createOrganization.isPending && <Loader2 className="size-4 animate-spin" />}
              Create organization
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
