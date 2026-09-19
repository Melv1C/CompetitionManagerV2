import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@repo/ui";

import type { DetailsDraft } from "./details-draft";
import { Field } from "./form-field";

type Props = {
  draft: DetailsDraft;
  disabled: boolean;
  update: (patch: Partial<DetailsDraft>) => void;
};

export function ContactSection({ draft, disabled, update }: Props) {
  return (
    <Card className="bg-background/95">
      <CardHeader>
        <CardTitle>Contact</CardTitle>
        <CardDescription>The public contact for registration questions.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2">
        <Field label="Contact name" htmlFor="contact-name">
          <Input
            id="contact-name"
            value={draft.contactName}
            disabled={disabled}
            onChange={(event) => update({ contactName: event.target.value })}
          />
        </Field>
        <Field label="Contact email" htmlFor="contact-email">
          <Input
            id="contact-email"
            type="email"
            value={draft.contactEmail}
            disabled={disabled}
            onChange={(event) => update({ contactEmail: event.target.value })}
          />
        </Field>
        <Field label="Contact phone" htmlFor="contact-phone">
          <Input
            id="contact-phone"
            value={draft.contactPhone}
            disabled={disabled}
            onChange={(event) => update({ contactPhone: event.target.value })}
          />
        </Field>
      </CardContent>
    </Card>
  );
}

export function VenueSection({ draft, disabled, update }: Props) {
  const setVenue = (patch: Partial<DetailsDraft["venue"]>) =>
    update({ venue: { ...draft.venue, ...patch } });

  return (
    <Card className="bg-background/95">
      <CardHeader>
        <CardTitle>Venue</CardTitle>
        <CardDescription>One physical Venue is shared by every Competition Event.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2">
        <Field label="Venue name" htmlFor="venue-name">
          <Input
            id="venue-name"
            value={draft.venue.name}
            disabled={disabled}
            onChange={(event) => setVenue({ name: event.target.value })}
          />
        </Field>
        <Field label="Address line 1" htmlFor="venue-address">
          <Input
            id="venue-address"
            value={draft.venue.addressLine1}
            disabled={disabled}
            onChange={(event) => setVenue({ addressLine1: event.target.value })}
          />
        </Field>
        <Field label="Address line 2" htmlFor="venue-address-2">
          <Input
            id="venue-address-2"
            value={draft.venue.addressLine2}
            disabled={disabled}
            onChange={(event) => setVenue({ addressLine2: event.target.value })}
          />
        </Field>
        <Field label="Postal code" htmlFor="venue-postal">
          <Input
            id="venue-postal"
            value={draft.venue.postalCode}
            disabled={disabled}
            onChange={(event) => setVenue({ postalCode: event.target.value })}
          />
        </Field>
        <Field label="City" htmlFor="venue-city">
          <Input
            id="venue-city"
            value={draft.venue.city}
            disabled={disabled}
            onChange={(event) => setVenue({ city: event.target.value })}
          />
        </Field>
        <Field label="Region" htmlFor="venue-region">
          <Input
            id="venue-region"
            value={draft.venue.region}
            disabled={disabled}
            onChange={(event) => setVenue({ region: event.target.value })}
          />
        </Field>
        <Field label="Country code" htmlFor="venue-country">
          <Input
            id="venue-country"
            maxLength={2}
            value={draft.venue.countryCode}
            disabled={disabled}
            onChange={(event) => setVenue({ countryCode: event.target.value.toUpperCase() })}
          />
        </Field>
        <Field label="Latitude" htmlFor="venue-latitude">
          <Input
            id="venue-latitude"
            type="number"
            step="any"
            value={draft.venue.latitude}
            disabled={disabled}
            onChange={(event) => setVenue({ latitude: event.target.value })}
          />
        </Field>
        <Field label="Longitude" htmlFor="venue-longitude">
          <Input
            id="venue-longitude"
            type="number"
            step="any"
            value={draft.venue.longitude}
            disabled={disabled}
            onChange={(event) => setVenue({ longitude: event.target.value })}
          />
        </Field>
      </CardContent>
    </Card>
  );
}
