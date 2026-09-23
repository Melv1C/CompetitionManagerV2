# Public frontend experience

This document records the agreed frontend direction. Competition discovery, the Competition
calendar, overview, schedule, and public pricing read published Competition data from the API.
Participant, Event detail, registration, payment, and result screens remain a frontend-only
prototype with mock data.

## Audience and navigation

Anyone may browse Competitions, schedules, participants, Event Entries, Personal Bests, and results. Anonymous visitors see `Competitions`, `Results`, a language selector, and `Sign in`. Signed-in Users also see `My registrations` and an avatar menu with `Profile` and `Sign out`.

Starting a registration or opening private registration information requires sign-in. The production flow should return the User to the action that prompted authentication. Registration also requires a verified email.

## Routes and jobs

- `/` combines live results, the next six Competitions, and the three latest completed Competitions.
- `/competitions` lists upcoming Competitions across Organizations.
- `/competitions/:competitionId` contains Overview, Schedule, and Participants. Registration is a separate primary action.
- `/competitions/:competitionId/events/:eventId` keeps Entries available in every event state. Results appear when available and become the default while live or finished.
- `/results` puts active Competitions first, followed by recent results and archive search.
- `/registrations` groups action-needed, upcoming, past, cancelled, and expired Athlete Registrations.
- `/registrations/:registrationId` manages Event Entries, Personal Bests, cancellation, waitlist actions, and payment state.
- `/register` covers Athlete selection, Competition Event selection, Personal Bests, a multi-Athlete Registration Cart, and validation or payment.
- `/profile` contains personal information, preferred language, read-only email, email verification controls, password change, and sign out through the avatar menu.

## Schedule and result presentation

The timetable contains one row and one time per Round. A Round may expose its ordered heats or flights, but those Start Groups have no separate scheduled time. Selecting a Start Group shows its exact entries and results. Entries and Personal Bests remain available before, during, and after competition. Live results are explicitly marked provisional until Competition Officialization.

## Registration scope

The mock selects Federated Athletes only. One-day Athletes remain part of the wider product scope but are intentionally absent from this prototype. Registration detail supports adding an Event Entry before Registration Close, updating a Personal Best, removing an Event Entry, cancelling the Athlete Registration, retrying payment, and viewing the payment summary. Removing an entry or cancelling does not imply reimbursement.

## Language and visual system

Static interface copy uses English, French, and Dutch i18n resources. Competition content uses its selected translation with the primary locale as fallback. Dates and times must follow the active interface locale.

Mobile is the primary design target for the public frontend. New screens start with a complete phone layout at 390 x 844, remain usable from 360 to 430 CSS pixels, and add larger-screen structure progressively. Dense domain data may scroll within its own clearly signposted region, but the page itself must not overflow horizontally.

The prototype uses the shared shadcn color tokens from `packages/ui` and composes the shared shadcn components. Its distinctive element is the live timing rail. Dense schedule and result data use tabular numerals while the rest of the interface remains quiet and task-focused.
