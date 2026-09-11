# Competition Manager: Build-From-Scratch Agent Prompt and Engineering Specification

Version: 2.0  
Status: Approved product direction  
Purpose: Copy-pasteable implementation brief for a coding agent  
Primary market: Belgian athletics organizations  
Initial locales: English, French, Dutch  

## 1. Copy-paste master prompt

You are the lead engineer responsible for building Competition Manager from scratch as a production-ready, multi-tenant SaaS for athletics competitions.

You are not performing an incremental cleanup of either existing Competition Manager repository. Create a clean monorepo and use the existing repositories only as behavioral evidence and technical reference:

- Legacy behavior reference: `https://github.com/Melv1C/CompetitionManagerSaaS` at commit `db2b5ffaa6e5b7eadfa7149ad604395d4167cc28`
- Incomplete rewrite reference: `https://github.com/Melv1C/CompetitionManager` at commit `9a8fe219690c78ebb2bd24bb0ac53ff38794b7f8`
- Preferred monorepo conventions: `https://github.com/Melv1C/fullstack-web-turbo-kit` at commit `4ad54460dbd3d535c084640a4b180ab5bb8e0e9c`

Read this entire specification before writing implementation code. Treat its locked decisions and invariants as authoritative. When a source repository conflicts with this specification, follow this specification. When behavior is not specified, inspect the source repositories, choose the smallest safe production-grade behavior, document it in an ADR when it is hard to reverse, and keep domain terminology current in `CONTEXT.md`.

Build the product in vertical slices and keep the repository releasable after every phase. Do not generate placeholder pages, fake production data, empty handlers, TODO implementations, or APIs that merely return success. A feature is complete only when its domain rules, authorization, persistence, UI states, audit trail, localization, tests, and operational failure behavior are complete.

The initial release has four application surfaces:

1. `backend`: HTTP API, authentication, realtime gateway, and a separate worker entrypoint.
2. `frontend`: public competition discovery/results plus authenticated Athlete registration and User account flows.
3. `manager`: Organization staff application for competitions, registrations, check-in, results, imports, exports, staff, and reports.
4. `admin`: platform operations for Users, Organizations, ownership, settlements, audit, and system health.

The desktop bridge is a later product phase. Do not put an Electron skeleton or desktop-only abstractions in the initial repository unless they are required by the documented AthleticsManager file formats.

Use a modular monolith, PostgreSQL, Prisma, Hono, Better Auth, React, TanStack Router/Query, Zod, Tailwind/shadcn, Redis-backed durable jobs, Socket.IO, Stripe Checkout, React Email, Bun workspaces, and Turborepo. Follow the pinned turbo kit's conventions where they do not conflict with this specification.

Before implementation:

1. Create `CONTEXT.md` with the glossary and forbidden term conflations from this specification.
2. Create concise ADRs for the application boundaries, result authority, competition-level officialization, platform-owned payments, external Organization reimbursements, revenue split, chargeback ownership, background jobs, and deployment topology.
3. Produce a requirement traceability matrix mapping every requirement ID to its implementation and tests.
4. Produce a dependency-ordered delivery plan using the phases in this specification.

Then implement. Run relevant checks after each slice. At every handoff, report completed requirement IDs, test evidence, remaining risks, migrations, deployment changes, and the exact next slice. Do not claim completion while any P0 acceptance criterion is unverified.

## 2. Decision precedence and rewrite intent

Use this precedence when requirements appear ambiguous:

1. Locked decisions and invariants in this document.
2. Explicit acceptance criteria in this document.
3. Domain behavior evidenced by the legacy repository.
4. Sound patterns from the incomplete rewrite.
5. Tooling and delivery conventions from the turbo kit.
6. The implementing agent's documented engineering judgment.

The repositories establish useful behavior, but none is the target architecture:

- The legacy repository demonstrates competition configuration, athlete lookup, seasonal club/bib data, one-day Athletes, multi-Athlete registrations, capacity, Stripe Checkout, confirmations, time/distance/height/points result entry, XML result import, live updates, translations, and operational exports. Its many Express services, duplicated schemas, custom JWT authorization, and weak transactional boundaries must not be copied.
- The incomplete rewrite demonstrates Hono, Better Auth Organizations, Prisma/PostgreSQL, React 19, TanStack Query, Tailwind/shadcn, Redis, Stripe, seasonal Athlete information, a registration wizard, Socket.IO, XML work, and an Electron experiment. It contains mocks, placeholders, unfinished result behavior, unsafe money types, missing tests, partial integrations, and production TODOs. Treat those as evidence, not reusable completion.
- The turbo kit establishes the preferred Bun/Turbo workspace, catalog dependencies, shared configuration, separate web applications, CI, Docker, Changesets, observability, and Dokploy patterns.

This is a clean-start product. There is no legacy database migration, dual-write, cutover, or historical data import requirement. Do not add one. Source data needed for initial operation comes from seed/reference data, the LBFA athlete provider, user actions, and explicit AthleticsManager interchange.

## 3. Product definition

Competition Manager is a multi-tenant SaaS for independent athletics Organizations to publish and operate track-and-field Competitions, accept paid or free Athlete registrations, run competition-day workflows, manage or import results, and publish provisional and official results.

### 3.1 Initial users

- Public Visitor: discovers published Competitions, participants, schedules, and public results.
- User: authenticated person with one account shared across applications.
- Verified User: email-verified User allowed to register Athletes, pay, and accept Organization invitations.
- Registrant: verified User controlling an Athlete's registration for a Competition. A Registrant need not be that Athlete or belong to the Athlete's Club.
- Organization Owner: complete Organization authority, membership control, and all Competition permissions.
- Competition Manager: creates and operates Competitions without Organization ownership powers.
- Registration Manager: manages registrations, check-in, withdrawals, and attendance.
- Result Manager: manages Web results or AthleticsManager imports under the selected result mode.
- Viewer: read-only access to private Organization and Competition information.
- Platform Administrator: trusted platform operator outside the Organization role model.

### 3.2 Locked scope

P0 initial scope includes:

- Athletics only, not a generic sports engine.
- Multi-tenant Organizations with strict isolation.
- Public/user frontend, Organization manager, platform admin, backend API, and worker.
- LBFA/Belgian federated Athlete synchronization behind a provider boundary.
- Athlete Season history containing season, bib, and Club.
- One-day Athletes.
- Multi-Athlete registration carts, Event eligibility, capacity, and waitlists.
- Free and paid Event Entries.
- EUR Stripe Checkout with cards and Bancontact.
- Live Web result entry and AthleticsManager XML result import.
- AthleticsManager participant CSV and generic CSV export.
- Provisional live results and Competition-level officialization.
- English, French, and Dutch.
- Transactional email.
- Platform-admin management of Users and Organizations.
- Auditing, observability, backup/restore documentation, CI, and production deployment.

### 3.3 Explicit non-goals

- No SaaS subscription plans, paid Organization options, coupons, or Organization billing.
- No legacy data migration.
- No desktop app in the initial release.
- No native mobile apps.
- No Club-as-tenant or required relationship between Clubs and Organizations.
- No user-to-Athlete ownership relationship.
- No in-app refunds or refund tracking.
- No user impersonation by Platform Administrators.
- No multi-currency support.
- No SMS.
- No generic configurable sports platform.
- No microservice split, GraphQL, Kubernetes, Kafka, or event sourcing without measured need and an ADR.

## 4. Locked domain language and invariants

The implementation must preserve these meanings in code, schemas, APIs, UI labels, and documentation.

### 4.1 Identity and tenancy

**Organization** is an independent competition operator and tenant boundary. An Organization owns Competitions, memberships, settings, and settlement details.

**Club** is an Athlete's sporting affiliation for a season. A Club is not an Organization, is not a tenant, and has no required database relationship to an Organization. An Organization may happen to be a real-world club, but that coincidence must not create a domain link.

**User** is an authenticated account holder. A User is not an Athlete.

**Athlete** is a global sporting identity independent from User accounts. Any verified User can attempt to register any eligible Athlete.

**Athlete Season** is a child of Athlete and is unique on `(athleteId, season)`. It carries the Athlete's bib and Club for that season. An Athlete has many Athlete Seasons.

**Organization Membership** is an accepted invitation relationship between User and Organization. A User can belong to multiple Organizations.

**Organization Role Assignment** grants one or more fixed roles Organization-wide. Additional Competition-specific assignments can supplement them. Effective permissions are the union. Competition assignments cannot reduce Owner authority.

**Platform Administrator** is a platform role and never an Organization membership shortcut. Every cross-tenant operation requires an explicit platform-admin permission and audit event.

### 4.2 Athlete sources

**Federated Athlete** is synchronized from LBFA/Belgian sources through an `AthleteProvider` port. Provider records are globally shared and not editable by Organization staff. The provider implementation must be replaceable without changing the domain model.

**One-day Athlete** exists only for one Competition when no suitable federated Athlete exists. A verified Registrant may create one during registration without preapproval. Duplicate candidates must be shown before confirmation. Organization staff can correct it with auditing.

Required One-day Athlete fields:

- first name;
- last name;
- full date of birth;
- sex/category basis needed for eligibility;
- nationality;
- optional Club text/reference;
- Competition bib assigned from the Competition's configured One-day range.

Federated Athletes use the applicable Athlete Season bib. One-day Competition bibs are unique within the Competition and allocated transactionally.

Historical registrations snapshot the Athlete display name, date/category basis needed for results, bib, Club, and season. Later provider synchronization updates the global Athlete and Athlete Seasons, never old registration snapshots.

### 4.3 Competition and result authority

An **Athletics Competition** is owned by exactly one Organization.

Competition operational lifecycle:

```text
DRAFT -> PUBLISHED -> REGISTRATION_OPEN -> REGISTRATION_CLOSED
      -> IN_PROGRESS -> COMPLETED -> ARCHIVED
```

- State changes are explicit domain commands.
- Scheduled transitions may request a change through the worker.
- Authorized staff can override a schedule only with a required reason.
- Invalid transitions fail; they do not silently coerce state.
- Archive is reversible only by an Owner or Competition Manager and is audited.

Each Competition selects exactly one **Result Entry Mode**:

- `WEB`: result entry in the Organization manager application is the only authoritative result writer.
- `ATHLETICSMANAGER`: validated AthleticsManager imports are the only authoritative result writer.

Changing mode before results exist is allowed and audited. Changing mode after any result exists requires a reconciliation preview and explicit Result Manager confirmation selecting the authoritative dataset. Never automatically merge concurrent result authorities.

Event result structure is:

```text
Competition Event -> Round -> Heat -> Participant Result -> Attempts/Performance
```

Field-event groups may be represented as Heat/Flight variants while retaining the same hierarchy. Each Round or Heat has `NOT_STARTED`, `LIVE`, or `FINISHED` status. Event status is derived upward and is never an independently contradictory value.

Finishing an Event stops ordinary writes but does not make its results official. Public results remain `PROVISIONAL` until authorized staff officialize the whole Competition. Officialization is permitted only when all result-bearing Events are finished and validation has no blocking errors. It creates an immutable official revision record and makes every included result official together.

To correct an official result:

1. Revoke official status for the whole Competition with a required reason.
2. Results immediately become clearly provisional.
3. Apply the correction through the selected Result Entry Mode.
4. Validate and officialize the Competition again, creating a new revision.

Never mutate an official revision in place.

### 4.4 Registration ownership and deadlines

An **Athlete Registration** is the single active registration relationship between one Athlete and one Competition. Enforce uniqueness in the database. One-day Athlete identity is resolved within the Competition before this constraint is applied.

The first successful submitted registration or waitlist action atomically creates the Athlete Registration and its **Registration Claim**. Drafts are private to their creator and do not claim the Athlete. Once claimed, another User cannot manage that Athlete's Competition registration. Authorized Organization staff can transfer the claim with before/after audit data and a reason.

Before Registration Close, the controlling Registrant can add or remove Event Entries, change Personal Bests, or cancel the registration, subject to eligibility, capacity, pricing, and payment rules.

After Registration Close and until Competition start, the Registrant can only:

- cancel the whole Athlete Registration;
- remove an Event Entry;
- change an Event Entry's Personal Best.

These actions never initiate a reimbursement. After Competition start, only authorized Organization staff can alter registration state, and every override is audited.

"Delete" in the UI means an audited cancellation/soft state, never destructive removal. Financial, audit, result, and official revision records are immutable or append-only as appropriate.

### 4.5 Eligibility and Personal Best

Eligibility is derived from Competition rules, Event categories, Athlete age/season, and sex/category basis. The registration quote endpoint must explain every ineligible Event using stable error codes. Authorized staff can override eligibility only with a reason and audit record.

The Personal Best on an Event Entry is a registration-time value for seeding, not a result and not an Athlete master record. The system suggests the latest compatible BeAthletics/federation performance. The Registrant may edit it until Competition start. Persist its value, unit, normalized comparison value, source, source date when known, and `isManualOverride`.

### 4.6 Combined Events

A Combined Event is selected, capacity-checked, and priced once at the parent level. Submission automatically creates the child-discipline participation records. Child disciplines cannot be bought independently through that Combined Event. Individual results live on child disciplines and roll up to the aggregate points/standing using versioned scoring rules.

### 4.7 Capacity and waitlists

Capacity belongs to a Competition Event or Combined Event parent. Count confirmed entries, unexpired payment reservations, and active waitlist invitations against capacity. Plain waitlist rows do not consume capacity.

Registration Cart submission is atomic. It can contain Event Entries for multiple Athletes, but if any Athlete claim, eligibility rule, price version, or capacity check fails, submit nothing and return a refreshable conflict response. Do not partially charge or create a partial cart.

When an Event is already full, a Registrant can explicitly join its FIFO waitlist. A released place causes the worker to invite the first eligible waitlist entry. A free entry confirms immediately. A paid entry receives a limited checkout window. On expiry or failure, release the reservation and invite the next eligible entry. Every promotion job and webhook is idempotent.

### 4.8 Check-in and withdrawal

Competition Check-in records Athlete presence once per Athlete Registration. Per-Event Entry state separately records withdrawal, DNS, or other start eligibility. Check-in does not fabricate a result, and payment confirmation does not imply presence.

## 5. Commercial and payment specification

### 5.1 Money invariants

- Store all EUR monetary amounts as integer cents. Never use binary floating point for money.
- Persist currency even though only EUR is supported initially.
- Every quote and checkout line has an immutable price snapshot.
- Recompute and revalidate server-side immediately before creating Stripe Checkout.
- Never trust client totals, fees, ownership, eligibility, or capacity.
- Stripe webhook state is authoritative for payment success or failure.
- Checkout creation and webhook handling use idempotency keys and unique constraints.

### 5.2 Event prices and price changes

Each Competition Event or Combined Event parent has an Organization-defined Event price. Free is zero.

Organization staff may change a price after registration opens only after acknowledging a prominent warning that existing and future Registrants may pay different prices. Existing draft quotes expire. Existing submitted, pending, or paid lines keep their snapshots. New additions use the current price. Reports group and total price cohorts correctly.

### 5.3 Registration Cart and Checkout Fee

One Registration Cart can contain Event Entries for multiple Athletes and produces one Stripe Checkout session.

For a paid cart, charge one payment-method-neutral **Checkout Fee** owned by the platform:

```text
checkoutFee = configuredFixedCents + round(configuredBasisPoints * eventPriceSubtotal / 10_000)
```

- The formula is configured platform-wide, not per Organization or Competition.
- Snapshot its inputs, result, version, and display label at submission.
- Show Event subtotal, Checkout Fee, and total before the Registrant commits.
- Apply the same formula regardless of card or Bancontact choice.
- Do not call it a card fee, Stripe fee, or payment-method surcharge in user-facing text.
- A Belgian/EU legal and accounting review of the fee, displayed total, receipts, VAT, and merchant responsibilities is a production launch gate.
- Free carts do not open Stripe Checkout and do not pay a Checkout Fee.

Stripe Checkout supports EUR, cards, and Bancontact initially. Payment is confirmed only from a verified webhook, never from the browser success redirect.

### 5.4 Revenue ownership and settlement

All charges use one platform-owned Stripe account in the initial release. Do not implement Stripe Connect.

Organization revenue equals exactly the Event Entry prices successfully collected for its Competition. The platform retains the Checkout Fee and absorbs Stripe processing costs, disputes, and chargebacks. Do not deduct a later chargeback from another Organization Settlement.

After a Competition is completed and its configured reimbursement window has ended, the worker prepares a settlement statement. A Platform Administrator verifies it, records the external bank transfer reference, and marks it paid. The statement must reconcile successful Event Entry price snapshots, Checkout Fees, failed/expired payments, cancellations without revenue reversal, platform-absorbed disputes, amount owed, amount transferred, timestamps, and actor data.

### 5.5 Reimbursements

Competition Manager has no refund workflow and does not call the Stripe Refund API in the initial release. An Organization decides its policy and may reimburse a Registrant externally by cash, bank transfer, or another method. The platform does not initiate or track that reimbursement. Cancellation and Event removal never imply reimbursement.

This is deliberate and must be explained in Organization and Registrant interfaces. Legal/accounting review must verify that this operating model is acceptable before production.

## 6. Authorization model

Authorization is deny-by-default and enforced in application services, not only routes or UI. Never trust an `organizationId`, `competitionId`, role, price, or User ID from the client without resolving it against the authenticated session and database.

Fixed Organization roles:

| Capability | Owner | Competition Manager | Registration Manager | Result Manager | Viewer |
| --- | ---: | ---: | ---: | ---: | ---: |
| Organization settings | Yes | No | No | No | Read |
| Membership and role management | Yes | No | No | No | No |
| Create/archive Competition | Yes | Yes | No | No | Read |
| Configure Competition/Event/pricing | Yes | Yes | No | No | Read |
| Publish/open/close/start/complete | Yes | Yes | No | No | Read |
| Registration and claim override | Yes | Yes | Yes | No | Read |
| Check-in/withdrawal | Yes | Yes | Yes | No | Read |
| Web result entry | Yes | Yes | No | Yes | Read |
| AthleticsManager import/reconciliation | Yes | Yes | No | Yes | Read |
| Officialize/revoke official status | Yes | Yes | No | Yes | Read |
| Exports and private reports | Yes | Yes | Yes | Result scope | Read |

Competition-specific assignments grant the corresponding role only for that Competition. A User may hold several roles. Effective permissions are the union of Organization-wide and Competition-specific grants.

Platform Administrator permissions are separate and include creating/editing/suspending Organizations, assigning/transferring Owners, inspecting/suspending/anonymizing Users through controlled workflows, reviewing Settlements, managing provider operations, and viewing platform audit/health. Platform Administrators cannot impersonate Users initially. Every cross-tenant support action is purpose-specific and audited.

## 7. Target monorepo and architecture

### 7.1 Repository layout

```text
.
├── apps/
│   ├── backend/              # Hono API, auth, Socket.IO, worker entrypoint
│   ├── frontend/             # public pages, registration, user account
│   ├── manager/              # Organization staff application
│   └── admin/                # platform administration
├── packages/
│   ├── api-client/           # generated/typed client from OpenAPI contracts
│   ├── contracts/            # Zod request, response, job, and socket schemas
│   ├── domain/               # pure policies, values, state machines, ranking
│   ├── email/                # localized React Email templates
│   ├── ui/                   # accessible shared design system
│   ├── config-eslint/
│   ├── config-typescript/
│   └── utils/
├── tests/
│   ├── e2e/
│   ├── fixtures/
│   └── performance/
├── docs/
│   ├── adr/
│   ├── api/
│   ├── runbooks/
│   └── traceability.md
├── scripts/
├── .changeset/
├── .github/workflows/
├── bun.lock
├── package.json
└── turbo.json
```

There is one lockfile. Use workspace/catalog dependencies. Enforce package boundaries with lint and a dependency-boundary tool.

### 7.2 Required stack

| Concern | Required choice |
| --- | --- |
| Runtime/package manager | Current stable Bun supported by dependencies; Bun workspaces |
| Task graph | Turborepo |
| Language | Strict TypeScript with `noUncheckedIndexedAccess`; no unchecked `any` |
| Backend | Hono modular monolith |
| Contracts | Zod 4, versioned REST, generated OpenAPI |
| Database | PostgreSQL, Prisma, `@prisma/adapter-pg` |
| Authentication | Better Auth with Organization/admin capabilities and secure cookies |
| Frontend | React 19, Vite, TanStack Router, TanStack Query |
| Forms | React Hook Form plus Zod resolver |
| UI | Tailwind 4, shadcn/Base UI conventions, Lucide icons |
| Localization | i18next/react-i18next with EN/FR/NL |
| Realtime | Socket.IO with typed authorized rooms and revision catch-up |
| Jobs | Redis and BullMQ-compatible durable queues |
| Payments | Stripe Checkout behind a payment adapter |
| Email | React Email behind a provider adapter |
| Testing | Vitest-compatible runner, Testing Library, Playwright |
| Environment | Varlock or equivalent generated/validated schema |
| Observability | JSON logs, Prometheus metrics, OpenTelemetry-ready tracing |
| Deployment | Docker images and Dokploy-compatible manifests |
| Releases | Changesets and application-specific image tags |

Do not add MUI, Axios, GraphQL, a second ORM, a second validation library, or frontend types inferred directly from Prisma.

### 7.3 Modular backend

Use one backend source with two production commands/images:

- API process: Hono HTTP, Better Auth, REST API, Socket.IO, health/readiness/metrics.
- Worker process: Athlete sync, emails, checkout expiry, waitlists, scheduled lifecycle transitions, import cleanup, and settlement preparation.

Modules have explicit ownership: auth, users, organizations, athletes, competitions, registrations, payments, results, interchange, notifications, admin, audit, and operations.

The request flow is:

```text
contract validation -> authentication -> authorization and tenant resolution
-> application service -> pure domain policy/state machine
-> repository transaction -> outbox/job enqueue -> response presenter
```

`packages/domain` must not import Hono, Prisma, React, Stripe, Redis, filesystem, or environment access. Repositories are explicit Prisma modules, not a generic repository framework.

### 7.4 API and client contracts

- Prefix application APIs with `/api/v1`.
- Generate OpenAPI from the same Zod contracts used at runtime.
- Provide a typed TypeScript client for all apps and future desktop tooling.
- Use cursor pagination and explicit stable sorting for growing lists.
- Timestamps are UTC ISO 8601 and render in Competition timezone.
- Money is `{ amountCents, currency }`.
- Use opaque public IDs; sequential IDs are never authorization boundaries.
- Use idempotency keys for retryable commands.
- Concurrency-sensitive aggregates expose revision/ETag and reject stale writes with `409`.

Standard error envelope:

```json
{
  "error": {
    "code": "REGISTRATION_CAPACITY_CHANGED",
    "message": "Localized display-safe message",
    "fieldErrors": { "entries.0.eventId": ["EVENT_FULL"] },
    "requestId": "opaque-id",
    "details": {}
  }
}
```

Stable codes are not translated. Human messages are localized at the presentation boundary.

### 7.5 Shared authentication and routing

Use one Better Auth user/session system across frontend, manager, and admin. Initial sign-in supports email/password and Google. Require verified email before registration/payment, Organization invitation acceptance, or manager access.

Prefer applications under one controlled parent domain with secure, HttpOnly, SameSite cookies and an explicit trusted-origin allowlist. Do not store bearer tokens in local storage. Manager Organization selection uses `/organizations/:slug/...` plus a switcher; the URL is navigation state, never authorization evidence.

### 7.6 Realtime contract

Use authorized Socket.IO rooms for public Competition results and private Organization/Competition operations. Joining a private room resolves permissions server-side. Recheck on reconnect and disconnect revoked memberships.

Every event contains schema version, Competition public ID, aggregate revision, event type, entity IDs, timestamp, and room-appropriate sanitized payload. Clients reconnect with their last revision. Replay missed events in order when available; otherwise instruct a refetch. Socket delivery never replaces database/API truth.

## 8. Data model requirements

Exact Prisma names may vary, but these concepts and constraints are mandatory.

### 8.1 Identity and tenancy

- User, Account, Session, Verification from Better Auth.
- Organization.
- OrganizationMembership unique on `(organizationId, userId)`.
- OrganizationRoleAssignment unique on membership and role.
- CompetitionStaffAssignment unique on `(competitionId, userId, role)`.
- OrganizationInvitation with normalized email, expiry, inviter, and status.
- PlatformRoleAssignment.

### 8.2 Athletes

- Athlete with global public ID and provider identity keys.
- AthleteSeason unique on `(athleteId, season)`.
- Club as global sporting reference with no Organization foreign key.
- AthleteProviderSource and ProviderSyncRun.
- OneDayAthlete scoped to Competition with duplicate review data.
- CompetitionBib unique on `(competitionId, bib)`.

### 8.3 Competition

- Competition with Organization, timezone, locale defaults, lifecycle, dates, result mode, reimbursement-window end, and revision.
- EventDefinition with type and canonical aliases.
- CategoryDefinition and versioned eligibility attributes.
- CompetitionEvent with Combined parent, integer price, capacity, schedule, and categories.
- Round ordered within CompetitionEvent.
- Heat ordered within Round with Heat/Flight discriminator when relevant.
- ResultPublicationRevision append-only.

### 8.4 Registration and payment

- AthleteRegistration unique on resolved Athlete identity and Competition, storing Registrant claim and historical snapshot.
- EventEntry unique on `(athleteRegistrationId, competitionEventId)` with PB, status, and price snapshot.
- RegistrationCart and immutable CartLine snapshots.
- CapacityReservation with expiry/state.
- WaitlistEntry with monotonic FIFO sequence and invitation state.
- CompetitionCheckIn unique on AthleteRegistration.
- PaymentOrder with subtotal, Checkout Fee snapshot, total, currency, state, and idempotency key.
- PaymentAttempt/StripeCheckoutSession with unique external IDs.
- ProcessedWebhookEvent unique on Stripe event ID.
- RegistrationConfirmation with a stable reference and the immutable registration/payment snapshot it confirms.
- OrganizationSettlement and immutable SettlementLines.

### 8.5 Results and interchange

- ParticipantResult unique on Heat and Event Entry/participant snapshot.
- ResultAttempt ordered and typed for discipline semantics.
- ResultRevision for every authoritative change.
- AthleticsManagerImport with checksum, preview/commit status, counts, and actor.
- ImportMapping for Competition Event, Round, Heat, Athlete, and status aliases.
- ImportConflict requiring explicit resolution.
- ExportRun with type, filters, checksum, and actor.

Raw XML is temporary. Retain normalized import summary, mappings, conflicts, audit data, and checksum, then delete raw bytes after commit or preview expiry.

### 8.6 Audit and operations

- AuditEvent is append-only with actor, effective role, scope, action, entity, safe before/after diff, reason, timestamp, and request ID.
- OutboxEvent couples side effects to database transactions.
- JobExecution records type, business key, attempts, outcome, and sanitized error.
- Never store secrets, tokens, unnecessary provider payloads, or complete payment payloads in audit/log tables.

## 9. Application requirements

### 9.1 Public and User frontend

Required public features:

- localized landing and Competition discovery;
- filters for date, location, Organization, and status;
- Competition overview, schedule, Events/categories, registration window, prices, availability, participants, and results;
- clear provisional/official badge and revision timestamp;
- accessible live updates with non-realtime fallback;
- stable public URLs and metadata.

Required authenticated features:

- signup, verification, Google login, reset, sessions, and account security;
- profile and locale/timezone preferences;
- federated Athlete search and One-day Athlete creation with duplicate review;
- multi-Athlete cart, eligibility explanations, PB suggestions/edits, capacity conflicts, and explicit waitlist action;
- Event subtotal, Checkout Fee, total, and terms before submission;
- Stripe redirect and pending/success/failure recovery driven by webhook state;
- controlled registrations with deadline-specific edit/cancel/remove behavior;
- localized confirmation page/document for free and successfully paid registrations, with stable reference and resend/download support;
- payment history and clear external-reimbursement explanation;
- account data export and anonymization request.

### 9.2 Organization manager

Required Organization features:

- Organization switcher and dashboard;
- invitations, roles, Competition assignments, and member removal;
- settings, contact data, locales/timezone, and settlement details;
- filtered audit view.

Required Competition features:

- create/edit/clone Competition;
- lifecycle actions and schedules;
- result mode and reconciliation;
- Event/category/Round/Heat/schedule/price/capacity/Combined Event/eligibility/bib-range configuration;
- publish preview with blocking validation;
- registrations, safe bulk actions, claim transfer, overrides, cancellations, capacity, and waitlists;
- Competition check-in and per-Event withdrawal/DNS;
- participant/start lists and printable views;
- keyboard/touch optimized Web result sheets;
- officialization, revocation, validation, and revision history;
- XML preview/mapping/conflict/commit;
- AthleticsManager and generic participant CSV;
- revenue/payment report separating Event revenue, Checkout Fees, state, cancellations, and settlement;
- notification history and safe resend.

### 9.3 Platform admin

No production screen may use mock data.

- Users: search, safe inspection, suspend/reactivate, anonymization workflow.
- Organizations: create, edit, suspend/reactivate, Owner assignment/transfer, counts.
- Settlements: review statement, export detail, record external bank reference, mark paid, append corrections.
- Provider operations: LBFA sync health, counts, sanitized failures, retry.
- Reference data: versioned Event/category aliases.
- Operations: API/worker health, queue depth, failed jobs, webhook/import status, release metadata.
- Audit: cross-tenant audit search with access itself audited.
- No User impersonation.

### 9.4 Backend and worker

The backend owns all business truth. Frontends may provide optimistic UX but never define authorization, price, eligibility, capacity, payment, lifecycle, or result outcomes.

Jobs have stable business keys, idempotency, bounded exponential retry with jitter, visible terminal failure, safe operator retry, and graceful shutdown. Do not rely on in-memory timers.

## 10. Required API surface

Exact grouping may vary, but support these endpoint families.

### 10.1 Authentication and Users

- Better Auth endpoints.
- `GET/PATCH /api/v1/me`
- session list/revoke.
- data export and anonymization request.

### 10.2 Public

- Competition list/detail.
- schedule, Events, participants, provisional/official results, and revisions.

Public serializers must exclude Registrant/User identity, full birth date, private contacts, notes, payment data, and private audit data.

### 10.3 Athletes and registration

- Athlete search and performance suggestions.
- One-day duplicate check/create.
- registration quote.
- Cart create/update/submit/status.
- current User registrations.
- permitted registration cancel/remove/PB commands.
- waitlist join/leave/status.

Quotes contain eligibility results, price snapshots, capacity observations, Checkout Fee, expiry, and revision. Submission repeats all checks transactionally.

### 10.4 Organization manager

- Organization membership/invitation/role commands.
- Competition CRUD and lifecycle commands.
- Event/Round/Heat/category/pricing/capacity configuration.
- registration query and staff commands.
- check-in and withdrawal commands.
- result entry, validation, officialize/revoke.
- XML preview, mapping resolution, commit, status.
- CSV export jobs/downloads.
- reports, notifications, and audit.

Use explicit command endpoints for consequential transitions rather than unrestricted PATCH, for example officialize, revoke-official, transfer-claim, open-registration, and start.

### 10.5 Platform admin

- User inspect/suspend/reactivate/anonymize.
- Organization create/update/suspend/Owner transfer.
- settlement review/export/mark-paid.
- provider sync runs/retry.
- queue/job/webhook/import operations.
- platform audit search.

## 11. Athletics result semantics

Support canonical Event types:

- `TIME`: lower valid normalized time ranks first.
- `DISTANCE`: highest valid attempt ranks first.
- `HEIGHT`: highest cleared height, then documented athletics countback.
- `POINTS`: higher points ranks first.
- `COMBINED`: aggregate versioned child-discipline points.

Support DNS, DNF, NM, DSQ, withdrawn, and no-valid-mark without magic numeric values. Store time as integer duration units, distance/height as integer millimeters, bounded-precision wind, integer points, and typed lane/place/qualification/reaction/attempt fields.

Ranking is a pure deterministic domain function with table-driven tests. Manual placing overrides require a reason/audit and never destroy raw performance.

## 12. AthleticsManager and CSV interoperability

### 12.1 Participant export

Provide:

1. exact AthleticsManager-compatible CSV with versioned headers, encoding, delimiter, dates, numeric formats, categories, bib, Club, and Event mappings;
2. generic UTF-8 reporting CSV with stable machine-readable values.

Protect against formula injection, quote correctly, stream large exports, and test against golden fixtures.

### 12.2 Result XML import

Only `ATHLETICSMANAGER` mode can commit imported authoritative results.

1. Upload with strict limits.
2. Parse with XXE/expansion protections.
3. Validate structure/version.
4. Normalize aliases and preview.
5. Match Competition/Event/Round/Heat/Athlete/bib/status using persisted mappings.
6. Show additions, changes, unchanged, unsupported, unmatched, and conflicts.
7. Require Result Manager resolutions.
8. Commit atomically or in deterministic restartable chunks only for proven size needs.
9. Record checksum/import revision.
10. Identical reimport is a no-op; changed import updates matches without duplicates.
11. Delete raw bytes after commit/expiry.

Malformed input creates no partial results. Never log full personal-data XML.

## 13. Notifications, localization, and accessibility

Transactional emails include verification, password/security, Organization invitation, registration changes, payment state, waitlist events, material Competition changes, and officialization/revocation. Use an outbox so committed actions cannot silently lose mail.

Templates and all apps support EN/FR/NL. Missing translations fail CI. Locale precedence is User, then Competition/Organization, then English.

Target WCAG 2.2 AA: keyboard navigation, visible focus, accessible errors/names, responsive layouts, no color-only state, and restrained live announcements.

## 14. Security, privacy, and reliability

### 14.1 Security

- OWASP ASVS Level 2 baseline.
- Secure HttpOnly cookies and CSRF protection.
- Explicit CORS/trusted origins.
- Rate-limit auth, search/provider, quote/submit, checkout, import/export, and admin routes.
- Strict size/content-type/unknown-field policy.
- Stripe signature verification on raw bytes.
- No secrets in clients, logs, responses, fixtures, or images.
- Dependency, secret, and container scans.
- CSV injection and XML attack protections.
- Audit roles, claims, overrides, prices, imports, officialization, admin access, and settlements.

### 14.2 Tenant isolation

Every Organization-owned query constrains by authorized Organization at the repository boundary. Adversarial tests use valid IDs from another tenant across HTTP, sockets, jobs, exports, object access, and audit.

### 14.3 Privacy

- Minimize public Athlete fields.
- Redact personal/payment data from logs and metrics.
- Support User data export.
- On deletion, revoke access and irreversibly anonymize profile data while retaining only legally required anonymized financial, Competition, result, and audit records.
- Define retention for drafts, carts, invitations, imports, provider cache, mail, logs, and audit.
- Belgian/EU privacy, consumer, payment, tax, and accounting review is a launch gate.

### 14.4 Reliability

- Database constraints defend invariants.
- Use transactions and locks for claims, bibs, capacity, waitlists, officialization, and settlement.
- No external provider call inside a long database transaction.
- Webhooks, jobs, imports, and commands are idempotent.
- Use transactional outbox for coupled side effects.
- Graceful shutdown drains API, sockets, and jobs.
- Automate backup and rehearse restore.
- Use forward-safe database migrations.

## 15. Observability and operations

Emit structured JSON logs with request/job ID, safe actor/scope IDs, operation, duration, outcome, and error class. Never log credentials, cookies, OAuth tokens, raw Stripe bodies, full XML, or unnecessary personal data.

Expose liveness/readiness, Prometheus-compatible metrics, queue depth/age/retries, webhook/provider/import/email/socket health, registration conflicts, checkout expiry, waitlist latency, result propagation, and settlement status.

Ship stdout logs for Dokploy/Loki. Provide alerts and runbooks for database/Redis failure, webhook backlog, queue delay, provider sync failure, import spikes, payment mismatch, and settlement failure.

## 16. Testing and CI

### 16.1 Unit/domain tests

Use table-driven tests for lifecycle, officialization, roles, Athlete Seasons/snapshots, eligibility, One-day duplicate/bib concurrency, registration deadlines/claims, fee calculations, capacity/waitlists, payment/webhook/settlement states, ranking/ties/statuses/attempts/countback/Combined Events, XML diff/idempotency, and CSV security/golden formats.

Critical money, authorization, eligibility, registration, capacity, payment, import, and result modules require at least 90% branch coverage.

### 16.2 Integration tests

Use isolated PostgreSQL and Redis for route errors, tenant isolation, concurrent claims/capacity/bibs/waitlists, rollback/outbox, duplicate/out-of-order webhooks, checkout expiry, provider sync snapshot preservation, result authority, official revisions, XML reimport, socket reconnect, anonymization integrity, and settlement.

### 16.3 Component/accessibility tests

Cover auth/invitations, Organization switcher, permissions, Competition editor, Athlete/One-day/PB/cart flows, fee disclosure, deadline states, waitlist countdown, check-in, every result sheet, XML conflicts, real admin tables, and EN/FR/NL keyboard/screen-reader behavior.

### 16.4 Required Playwright journeys

1. Signup, verify, password/Google login, reset, sign out.
2. Admin creates Organization/Owner; Owner invites scoped staff.
3. Owner configures and transitions a Competition through its lifecycle.
4. Free federated-Athlete registration.
5. One-day Athlete with concurrency-safe bib.
6. Multi-Athlete paid cart confirmed only by webhook.
7. Atomic cart failure during last-place race.
8. FIFO waitlist promotion, expiry, next promotion.
9. Claim blocks a second User; audited staff transfer changes control.
10. Deadline-specific edits before close, after close, and after start.
11. Competition check-in and independent Event withdrawal.
12. Web-mode result entry/live provisional publishing and rejection in AthleticsManager mode.
13. XML ambiguity resolution, commit, and duplicate-safe reimport.
14. Both participant CSV golden fixtures.
15. Whole-Competition officialization, revocation, correction, and new revision.
16. Price change snapshots old/new cohorts.
17. Settlement equals Event prices; Checkout Fee retained; chargeback not deducted.
18. Cross-tenant HTTP/socket/export/job denial without leakage.
19. User anonymization preserving required history.
20. Automated accessibility checks in EN/FR/NL.

### 16.5 Pull-request gates

Run frozen install; env generation/validation; Prisma format/validate/generate/migration; format/lint/boundaries/dead-code/types; unit/component/integration tests; all builds; containerized Playwright; schema migration from empty and previous version; OpenAPI diff; translation completeness; security scans; and actionable test artifacts.

Required root commands:

```text
bun run dev
bun run build
bun run check
bun run test
bun run test:integration
bun run e2e
bun run db:generate
bun run db:migrate
bun run db:deploy
bun run openapi:generate
bun run env:generate
bun run env:validate
```

## 17. Performance budgets

Benchmark with 100 Organizations, 1,000 Competitions, 100,000 Athletes, 250,000 Event Entries, a 2,000-participant Competition, and 1,000 live viewers.

- cached/indexed reads p95 under 250 ms at 50 requests/s on documented staging hardware;
- Competition detail/list and Athlete search p95 under 500 ms excluding degraded providers;
- registration quote p95 under 750 ms without provider lookup;
- result mutation acknowledgement p95 under 500 ms;
- socket propagation p95 under 1 second;
- 2,000-row CSV and representative XML preview under 30 seconds through jobs;
- no unbounded list or N+1 path in traces.

These are engineering budgets, not contractual SLAs. Record hardware, data, load, and results.

## 18. Deployment

Target local, test, staging, and production. Build immutable Docker images for backend API, backend worker, frontend, manager, and admin. Use backed-up PostgreSQL and Redis and Dokploy-compatible manifests patterned after the turbo kit. Static apps use Nginx or equivalent immutable serving.

Require environment validation, backups/restore, low-downtime migrations, health/readiness, graceful rolling shutdown, isolated staging credentials, release metadata, application rollback runbooks, forward-fix database strategy, and no public Prisma Studio/debug endpoints.

## 19. Delivery phases

Implement vertical slices and keep the system runnable.

### Phase 0: Foundation

Initialize monorepo, CONTEXT, ADRs, traceability, environments, Docker local stack, CI, tests, OpenAPI, package boundaries, errors, IDs, money/time, audit, outbox, and jobs.

Exit: all apps use real backend health/session endpoints and CI is green.

### Phase 1: Identity, tenancy, admin

Implement Better Auth, shared sessions, Organizations created by Platform Admin, invitations, multiple memberships, role unions, Competition assignments, real admin operations, audit, and anonymization.

Exit: adversarial tenant/permission tests pass.

### Phase 2: Athletes and Competition configuration

Implement Athlete/Season/Club, LBFA provider/jobs, lifecycle, Events/categories/eligibility, Combined Events, Rounds/Heats, schedule, prices, capacity, One-day bib ranges, discovery, and publish validation.

Exit: an Organization publishes a valid Competition visible in EN/FR/NL.

### Phase 3: Registration and waitlists

Implement Athlete selection, One-day duplicate flow, PB suggestions, quotes, multi-Athlete carts, claims, deadlines, snapshots, capacity reservations, waitlists, and emails.

Exit: free flow and concurrency journeys pass.

### Phase 4: Payments and settlement

Implement Checkout Fee/version, Stripe Checkout/webhooks, recovery, expiration, statements, external transfer recording, and chargeback-loss recording.

Exit: paid flows and settlement reconcile to the cent; legal presentation hooks exist.

### Phase 5: Web competition day

Implement check-in, withdrawals, all result sheets, statuses/ranking/revisions, Socket.IO, public provisional results, officialization/revocation/correction.

Exit: a full Competition operates in Web mode.

### Phase 6: AthleticsManager

Implement both CSV formats, secure XML preview/mapping/conflict/commit, mode reconciliation, cleanup, and observability.

Exit: fixture round trips and repeat imports are deterministic/audited.

### Phase 7: Launch hardening

Complete accessibility, performance, security, dashboards, alerts, runbooks, restore and rollback rehearsals, compliance sign-offs, deployment, and incident procedures.

Exit: every P0 traceability row has evidence.

Later only: desktop bridge, additional national Athlete providers, multi-currency, SaaS plans, and impersonation.

## 20. Definition of Done

A feature is done only when its invariant is documented; authorization/tenant scope are server-enforced; inputs/outputs/jobs/socket payloads are validated; writes and retries are safe; audit/notifications exist; EN/FR/NL loading/empty/error/conflict/degraded states exist; accessibility and meaningful tests pass; operator recovery exists; and no TODO, mock, unsafe `any`, floating money, or placeholder production behavior remains.

The release is done only when:

- four apps build/deploy separately with one shared verified account;
- tenant isolation and role union pass adversarial tests;
- real admin manages Users/Organizations without impersonation;
- LBFA sync and Athlete Season history preserve registration snapshots;
- One-day Athlete/bib behavior is concurrency safe;
- Organizations configure/publish valid Competitions;
- claims, deadlines, atomic carts, capacity, and FIFO waitlists work under race;
- free/paid flows reconcile in integer cents;
- revenue, Checkout Fee, settlement, and chargeback guarantees are tested;
- reimbursement remains external and clearly communicated;
- each result mode has one writer;
- results are provisional until whole-Competition officialization;
- correction creates a new official revision after revocation;
- XML is secure/previewed/mapped/idempotent and both CSVs match fixtures;
- live result catch-up, privacy/anonymization, retention, audit, restore, alerts, and runbooks work;
- EN/FR/NL accessibility and production gates pass;
- Belgian/EU compliance sign-off is complete.

## 21. Agent handoff contract

The agent inspects before editing, keeps changes small and dependency-ordered, updates CONTEXT/ADRs/OpenAPI/traceability, favors reversible migrations, proves work with commands/tests, asks only for materially product-changing decisions, never weakens invariants for tests, and ends phases with a runnable demonstration and risk register.

Every handoff includes completed requirement IDs, outcomes, changed modules, schema/API/job/socket changes, commands/tests/results, security/privacy/money/tenant checks, limitations, deployment/config changes, and the exact next slice.

## Appendix A: Requirement IDs

| ID | Requirement |
| --- | --- |
| ARC-001 | Four initial apps: backend, frontend, manager, admin |
| ARC-002 | Modular monolith with API and worker commands |
| ARC-003 | Typed REST/OpenAPI contracts and client |
| TEN-001 | Strict Organization isolation |
| AUTH-001 | Shared email/password and Google authentication |
| AUTH-002 | Verified email gates sensitive actions |
| RBAC-001 | Multi-role union with Competition assignments |
| ADM-001 | Real User/Organization admin without impersonation |
| ATH-001 | LBFA provider behind a replaceable port |
| ATH-002 | Athlete has many Athlete Seasons with bib/Club |
| ATH-003 | Club and Organization have no relation |
| ATH-004 | One-day Athlete and Competition bib |
| CMP-001 | Competition lifecycle and audited overrides |
| CMP-002 | Event/Round/Heat hierarchy and derived status |
| CMP-003 | Combined parent registration and child results |
| REG-001 | One Athlete Registration and first claim |
| REG-002 | Field-specific edit deadlines and cancellation |
| REG-003 | Multi-Athlete atomic cart |
| REG-004 | Explained eligibility with staff override |
| REG-005 | Transactional capacity and FIFO waitlist |
| REG-006 | Suggested/editable PB until start |
| REG-007 | Competition check-in plus Event withdrawal/DNS |
| PAY-001 | Integer-cent snapshots |
| PAY-002 | Platform Stripe Checkout, EUR/card/Bancontact |
| PAY-003 | One fixed-plus-percentage Checkout Fee per paid cart |
| PAY-004 | Organization receives exact Event revenue |
| PAY-005 | Platform absorbs costs/disputes/chargebacks |
| PAY-006 | Reimbursements external and untracked |
| RES-001 | One result authority per Competition |
| RES-002 | Typed results and deterministic ranking |
| RES-003 | Public provisional live results |
| RES-004 | Whole-Competition officialization/revisions |
| RES-005 | Correction requires revocation |
| INT-001 | AthleticsManager and generic participant CSV |
| INT-002 | Secure previewed idempotent XML import |
| INT-003 | Result-mode reconciliation |
| I18N-001 | Complete EN/FR/NL |
| NTF-001 | Transactional email/outbox |
| PRIV-001 | Public minimization and anonymization |
| OPS-001 | Durable jobs, metrics, logs, alerts, runbooks |
| QA-001 | Full CI quality gates |
| DEP-001 | Docker/Dokploy delivery |

## Appendix B: Seed and fixtures

Provide deterministic non-production seed data: two Organizations with overlapping memberships; all roles; verified/unverified Users; Clubs sharing Organization names to prove independence; Athletes with multiple seasons/changed bibs and Clubs; One-day duplicates; every Event type and eligibility boundary; Competitions in every lifecycle/mode; free/paid/full/waitlisted/expired/cancelled/claimed registrations; provisional/official result revisions; valid/malformed/ambiguous/repeat XML; golden CSVs; and Stripe success/failure/expiry/duplicate/out-of-order/dispute/chargeback webhooks.

## Appendix C: Mandatory ADRs

Record: separate apps; modular monolith/worker; deferred desktop; Club/Organization independence; single result authority; Competition-level officialization/revocation; platform-owned Stripe; Event revenue/Checkout Fee split; external reimbursements; platform chargeback absorption; Redis jobs; raw XML deletion; and Docker/Dokploy topology.

End of specification.
