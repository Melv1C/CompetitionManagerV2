import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Switch,
  Textarea,
} from "@repo/ui";
import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  useSaveCompetitionDetails,
  type Competition,
  type CompetitionCatalog,
} from "@/features/competitions";
import { instantToZonedInput, zonedInputToInstant } from "@/features/competitions/date-time";

const locales = ["EN", "FR", "NL"] as const;

export function CompetitionDetailsForm({
  competition,
  catalog,
  disabled,
}: {
  competition: Competition;
  catalog: CompetitionCatalog;
  disabled: boolean;
}) {
  const save = useSaveCompetitionDetails(competition.organizationId, competition.id);
  const initialTimeZone = competition.timeZone ?? "Europe/Brussels";
  const [dirty, setDirty] = useState(false);
  const [timeZone, setTimeZone] = useState(initialTimeZone);
  const [translations, setTranslations] = useState(
    () =>
      Object.fromEntries(
        locales.map((locale) => {
          const translation = competition.translations.find((item) => item.locale === locale);
          return [
            locale,
            { name: translation?.name ?? "", description: translation?.description ?? "" },
          ];
        }),
      ) as Record<(typeof locales)[number], { name: string; description: string }>,
  );
  const [startsAt, setStartsAt] = useState(() =>
    instantToZonedInput(competition.startsAt, initialTimeZone),
  );
  const [endsAt, setEndsAt] = useState(() =>
    instantToZonedInput(competition.endsAt, initialTimeZone),
  );
  const [registrationOpensAt, setRegistrationOpensAt] = useState(() =>
    instantToZonedInput(competition.registrationOpensAt, initialTimeZone),
  );
  const [registrationClosesAt, setRegistrationClosesAt] = useState(() =>
    instantToZonedInput(competition.registrationClosesAt, initialTimeZone),
  );
  const [contactName, setContactName] = useState(competition.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(competition.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(competition.contactPhone ?? "");
  const [maxEntries, setMaxEntries] = useState(
    competition.maxEventEntriesPerAthlete?.toString() ?? "",
  );
  const [oneDayEnabled, setOneDayEnabled] = useState(competition.oneDayRegistrationEnabled);
  const [bibStart, setBibStart] = useState(competition.oneDayBibStart?.toString() ?? "");
  const [bibEnd, setBibEnd] = useState(competition.oneDayBibEnd?.toString() ?? "");
  const [reservationMinutes, setReservationMinutes] = useState(
    competition.capacityReservationMinutes.toString(),
  );
  const [settlementDays, setSettlementDays] = useState(competition.settlementDelayDays.toString());
  const [venue, setVenue] = useState({
    name: competition.venue?.name ?? "",
    addressLine1: competition.venue?.addressLine1 ?? "",
    addressLine2: competition.venue?.addressLine2 ?? "",
    postalCode: competition.venue?.postalCode ?? "",
    city: competition.venue?.city ?? "",
    region: competition.venue?.region ?? "",
    countryCode: competition.venue?.countryCode ?? "BE",
    latitude: competition.venue?.latitude?.toString() ?? "",
    longitude: competition.venue?.longitude?.toString() ?? "",
  });
  const [clubEligibilityIds, setClubEligibilityIds] = useState(() =>
    competition.clubEligibility.map((entry) => entry.clubId),
  );

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const primaryLabel = useMemo(
    () => ({ EN: "English", FR: "French", NL: "Dutch" })[competition.primaryLocale],
    [competition.primaryLocale],
  );
  const change = () => setDirty(true);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const hasVenue = Object.values(venue).some((value) => value.trim());
    try {
      await save.mutateAsync({
        expectedUpdatedAt: new Date(competition.updatedAt),
        translations: locales
          .filter((locale) => translations[locale].name.trim())
          .map((locale) => ({ locale, ...translations[locale] })),
        startsAt: startsAt ? new Date(zonedInputToInstant(startsAt, timeZone)!) : null,
        endsAt: endsAt ? new Date(zonedInputToInstant(endsAt, timeZone)!) : null,
        timeZone: timeZone.trim() || null,
        registrationOpensAt: registrationOpensAt
          ? new Date(zonedInputToInstant(registrationOpensAt, timeZone)!)
          : null,
        registrationClosesAt: registrationClosesAt
          ? new Date(zonedInputToInstant(registrationClosesAt, timeZone)!)
          : null,
        contactName: contactName.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        maxEventEntriesPerAthlete: positiveNumber(maxEntries),
        oneDayRegistrationEnabled: oneDayEnabled,
        oneDayBibStart: oneDayEnabled ? positiveNumber(bibStart) : null,
        oneDayBibEnd: oneDayEnabled ? positiveNumber(bibEnd) : null,
        capacityReservationMinutes: positiveNumber(reservationMinutes) ?? 15,
        settlementDelayDays: nonNegativeNumber(settlementDays) ?? 0,
        venue: hasVenue
          ? {
              name: venue.name,
              addressLine1: venue.addressLine1,
              addressLine2: venue.addressLine2.trim() || null,
              postalCode: venue.postalCode,
              city: venue.city,
              region: venue.region.trim() || null,
              countryCode: venue.countryCode,
              latitude: decimalNumber(venue.latitude),
              longitude: decimalNumber(venue.longitude),
            }
          : null,
        clubEligibilityIds,
      });
      setDirty(false);
      toast.success("Details saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Details could not be saved");
    }
  };

  return (
    <form className="space-y-5" onSubmit={submit} onChange={change}>
      <Card className="bg-background/95">
        <CardHeader>
          <CardTitle>Identity and translations</CardTitle>
          <CardDescription>
            {primaryLabel} is the permanent primary locale. Other translations are optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {locales.map((locale) => (
            <div key={locale} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">
                  {{ EN: "English", FR: "French", NL: "Dutch" }[locale]}
                </p>
                {locale === competition.primaryLocale ? (
                  <span className="text-xs font-medium text-cyan-800">Primary</span>
                ) : null}
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${locale}`}>Name</Label>
                  <Input
                    id={`name-${locale}`}
                    value={translations[locale].name}
                    required={locale === competition.primaryLocale}
                    disabled={disabled}
                    onChange={(event) =>
                      setTranslations((current) => ({
                        ...current,
                        [locale]: { ...current[locale], name: event.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`description-${locale}`}>Description</Label>
                  <Textarea
                    id={`description-${locale}`}
                    value={translations[locale].description}
                    disabled={disabled}
                    onChange={(event) =>
                      setTranslations((current) => ({
                        ...current,
                        [locale]: { ...current[locale], description: event.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-background/95">
        <CardHeader>
          <CardTitle>Competition and registration schedule</CardTitle>
          <CardDescription>
            Times are entered and displayed in the selected IANA time zone.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="Time zone" htmlFor="time-zone">
            <Input
              id="time-zone"
              list="time-zone-options"
              value={timeZone}
              disabled={disabled}
              onChange={(event) => setTimeZone(event.target.value)}
              required
            />
            <datalist id="time-zone-options">
              <option value="Europe/Brussels" />
              <option value="Europe/Amsterdam" />
              <option value="Europe/Paris" />
              <option value="UTC" />
            </datalist>
          </Field>
          <div />
          <DateField
            id="starts-at"
            label="Competition starts"
            value={startsAt}
            onChange={setStartsAt}
            disabled={disabled}
          />
          <DateField
            id="ends-at"
            label="Competition ends"
            value={endsAt}
            onChange={setEndsAt}
            disabled={disabled}
          />
          <DateField
            id="registration-opens"
            label="Registration opens"
            value={registrationOpensAt}
            onChange={setRegistrationOpensAt}
            disabled={disabled}
          />
          <DateField
            id="registration-closes"
            label="Registration closes"
            value={registrationClosesAt}
            onChange={setRegistrationClosesAt}
            disabled={disabled}
          />
          <Field label="Maximum Events per Athlete" htmlFor="max-entries">
            <Input
              id="max-entries"
              type="number"
              min="1"
              value={maxEntries}
              disabled={disabled}
              onChange={(event) => setMaxEntries(event.target.value)}
              placeholder="Unlimited"
            />
          </Field>
          <Field label="Checkout reservation, minutes" htmlFor="reservation-minutes">
            <Input
              id="reservation-minutes"
              type="number"
              min="1"
              value={reservationMinutes}
              disabled={disabled}
              onChange={(event) => setReservationMinutes(event.target.value)}
              required
            />
          </Field>
          <Field label="Settlement delay, days" htmlFor="settlement-days">
            <Input
              id="settlement-days"
              type="number"
              min="0"
              value={settlementDays}
              disabled={disabled}
              onChange={(event) => setSettlementDays(event.target.value)}
              required
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="bg-background/95">
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription>The public contact for registration questions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="Contact name" htmlFor="contact-name">
            <Input
              id="contact-name"
              value={contactName}
              disabled={disabled}
              onChange={(event) => setContactName(event.target.value)}
            />
          </Field>
          <Field label="Contact email" htmlFor="contact-email">
            <Input
              id="contact-email"
              type="email"
              value={contactEmail}
              disabled={disabled}
              onChange={(event) => setContactEmail(event.target.value)}
            />
          </Field>
          <Field label="Contact phone" htmlFor="contact-phone">
            <Input
              id="contact-phone"
              value={contactPhone}
              disabled={disabled}
              onChange={(event) => setContactPhone(event.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="bg-background/95">
        <CardHeader>
          <CardTitle>Venue</CardTitle>
          <CardDescription>
            One physical Venue is shared by every Competition Event.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="Venue name" htmlFor="venue-name">
            <Input
              id="venue-name"
              value={venue.name}
              disabled={disabled}
              onChange={(event) => setVenue({ ...venue, name: event.target.value })}
            />
          </Field>
          <Field label="Address line 1" htmlFor="venue-address">
            <Input
              id="venue-address"
              value={venue.addressLine1}
              disabled={disabled}
              onChange={(event) => setVenue({ ...venue, addressLine1: event.target.value })}
            />
          </Field>
          <Field label="Address line 2" htmlFor="venue-address-2">
            <Input
              id="venue-address-2"
              value={venue.addressLine2}
              disabled={disabled}
              onChange={(event) => setVenue({ ...venue, addressLine2: event.target.value })}
            />
          </Field>
          <Field label="Postal code" htmlFor="venue-postal">
            <Input
              id="venue-postal"
              value={venue.postalCode}
              disabled={disabled}
              onChange={(event) => setVenue({ ...venue, postalCode: event.target.value })}
            />
          </Field>
          <Field label="City" htmlFor="venue-city">
            <Input
              id="venue-city"
              value={venue.city}
              disabled={disabled}
              onChange={(event) => setVenue({ ...venue, city: event.target.value })}
            />
          </Field>
          <Field label="Region" htmlFor="venue-region">
            <Input
              id="venue-region"
              value={venue.region}
              disabled={disabled}
              onChange={(event) => setVenue({ ...venue, region: event.target.value })}
            />
          </Field>
          <Field label="Country code" htmlFor="venue-country">
            <Input
              id="venue-country"
              maxLength={2}
              value={venue.countryCode}
              disabled={disabled}
              onChange={(event) =>
                setVenue({ ...venue, countryCode: event.target.value.toUpperCase() })
              }
            />
          </Field>
          <Field label="Latitude" htmlFor="venue-latitude">
            <Input
              id="venue-latitude"
              type="number"
              step="any"
              value={venue.latitude}
              disabled={disabled}
              onChange={(event) => setVenue({ ...venue, latitude: event.target.value })}
            />
          </Field>
          <Field label="Longitude" htmlFor="venue-longitude">
            <Input
              id="venue-longitude"
              type="number"
              step="any"
              value={venue.longitude}
              disabled={disabled}
              onChange={(event) => setVenue({ ...venue, longitude: event.target.value })}
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="bg-background/95">
        <CardHeader>
          <CardTitle>One-day Athletes</CardTitle>
          <CardDescription>
            Reserve a Competition-only bib range when one-day registration is allowed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Allow one-day Athlete registration</p>
              <p className="text-muted-foreground text-xs">
                Federated Athletes continue to use their season bib.
              </p>
            </div>
            <Switch
              checked={oneDayEnabled}
              disabled={disabled}
              onCheckedChange={(checked) => {
                setOneDayEnabled(checked);
                change();
              }}
            />
          </div>
          {oneDayEnabled ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First bib" htmlFor="bib-start">
                <Input
                  id="bib-start"
                  type="number"
                  min="1"
                  value={bibStart}
                  disabled={disabled}
                  onChange={(event) => setBibStart(event.target.value)}
                />
              </Field>
              <Field label="Last bib" htmlFor="bib-end">
                <Input
                  id="bib-end"
                  type="number"
                  min="1"
                  value={bibEnd}
                  disabled={disabled}
                  onChange={(event) => setBibEnd(event.target.value)}
                />
              </Field>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="bg-background/95">
        <CardHeader>
          <CardTitle>Club eligibility</CardTitle>
          <CardDescription>Leave every Club unchecked to allow all Clubs.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {catalog.clubs.map((club) => (
            <label key={club.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <Checkbox
                checked={clubEligibilityIds.includes(club.id)}
                disabled={disabled}
                onCheckedChange={(checked) => {
                  setClubEligibilityIds((current) =>
                    checked ? [...current, club.id] : current.filter((id) => id !== club.id),
                  );
                  change();
                }}
              />
              <span>
                {club.name}
                {club.abbreviation ? ` · ${club.abbreviation}` : ""}
              </span>
            </label>
          ))}
          {catalog.clubs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No Clubs are available in the catalog.</p>
          ) : null}
        </CardContent>
      </Card>

      {!disabled ? (
        <div className="bg-background/95 sticky bottom-3 flex items-center justify-end gap-3 rounded-xl border p-3 shadow-lg backdrop-blur">
          <span className="text-muted-foreground mr-auto text-xs">
            {dirty ? "Unsaved changes" : "All details saved"}
          </span>
          <Button type="submit" disabled={!dirty || save.isPending}>
            <Save /> {save.isPending ? "Saving…" : "Save details"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function DateField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <Input
        id={id}
        type="datetime-local"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function positiveNumber(value: string) {
  const number = Number(value);
  return value && Number.isInteger(number) && number > 0 ? number : null;
}
function nonNegativeNumber(value: string) {
  const number = Number(value);
  return value && Number.isInteger(number) && number >= 0 ? number : null;
}
function decimalNumber(value: string) {
  const number = Number(value);
  return value && Number.isFinite(number) ? number : null;
}
