# Dependency-ordered delivery plan

This plan turns the approved specification into vertical, releasable phases. A later phase may consume an earlier contract, but it may not weaken an earlier invariant. Requirement status and evidence live in [the traceability matrix](traceability.md).

## Phase 0 — Foundation

Create the Bun/Turborepo monorepo and the four application boundaries, strict TypeScript/package rules, environment validation, local Docker PostgreSQL/Redis, CI, contracts/OpenAPI, typed client, shared errors/IDs/money/time, audit, transactional outbox, and worker job primitives. The API and worker remain separate commands from one modular backend source.

Exit: all four apps use real backend health/session seams; database and queue checks are runnable; CI is green; traceability and ADR checks pass.

## Phase 1 — Identity, tenancy, and admin

Implement shared Better Auth sessions, email verification, Organizations and invitations, independent memberships, role unions and Competition assignments, Platform Administrator workflows, tenant isolation, and controlled User anonymization without impersonation.

Exit: adversarial cross-tenant and permission tests pass, including overlapping memberships and verified/unverified users.

## Phase 2 — Athletes and Competition configuration

Implement the replaceable LBFA provider port, Athlete Seasons, independent Clubs, One-day Athletes and transactional Competition bibs, Competition lifecycle, Events/Rounds/Heats, eligibility, Combined Events, schedules, pricing, capacity, and publish validation.

Exit: an Organization can publish a valid Competition visible in EN/FR/NL, with lifecycle overrides audited.

## Phase 3 — Registration and waitlists

Implement Athlete selection, duplicate-aware One-day flow, Personal Best suggestions and edits, eligibility explanations/overrides, first-claim ownership, field-specific deadlines, atomic multi-Athlete carts, price snapshots, capacity reservations, FIFO waitlists, check-in, withdrawal/DNS, and transactional notification outbox events.

Exit: free registration, claim contention, atomic cart failure, deadline, and waitlist concurrency journeys pass.

## Phase 4 — Payments and settlement

Implement integer-cent EUR values, platform Stripe Checkout for cards and Bancontact, one fixed-plus-percentage Checkout Fee per paid cart, idempotent/out-of-order webhooks and expiry recovery, Organization settlement statements, external reimbursement recording boundaries, and platform chargeback-loss handling.

Exit: paid flows reconcile to the cent; the Organization receives Event Entry prices, the platform retains the Checkout Fee, and chargebacks do not reduce future settlements.

## Phase 5 — Web competition day

Implement Web-mode result sheets, typed performance/attempt values, deterministic ranking, competition-day status rules, Socket.IO authorized rooms and catch-up, public provisional results, whole-Competition officialization, revocation, correction, and immutable revisions.

Exit: a full Competition operates in Web mode and official-result correction requires revocation and a new revision.

## Phase 6 — AthleticsManager interchange

Implement AthleticsManager-compatible and generic participant CSV exports, secure bounded XML preview, mapping/conflict resolution, idempotent commit/reimport, result-mode reconciliation, normalized evidence retention, raw XML cleanup, and observability.

Exit: valid, malformed, ambiguous, and repeat fixtures are deterministic, secure, and audited.

## Phase 7 — Launch hardening

Complete EN/FR/NL accessibility, performance budgets, security scans, structured logs/metrics/traces, queue and provider alerts, backup/restore rehearsal, migration/rollback runbooks, immutable Docker images, Dokploy-compatible deployment, and compliance sign-offs.

Exit: every P0 traceability row is verified with passing evidence. Desktop automation, additional providers, multi-currency, SaaS plans, and impersonation remain later scope.

## Cross-phase risk controls

Tenant authorization, integer-cent money, database constraints, idempotency, audit events, input/output validation, structured redacted logs, and localization completeness are release gates for every phase that touches them. No phase may introduce a placeholder handler, fake production data, floating-point money, destructive deletion of financial/audit/result history, or a second result authority.
