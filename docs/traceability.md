# Requirement traceability

This matrix is the delivery contract for the approved Competition Manager specification. Every Appendix A requirement is represented once, with a target implementation location and a target test seam. “Unverified” means the requirement has no implementation evidence yet; this is expected for the Phase 0 foundation because application implementation has not started.

## Status and verification policy

- `P0 · Unverified · Phase N` is the current status until the referenced implementation and test evidence exist.
- A requirement may move to `In progress` only when implementation has begun and its test evidence is being developed.
- A requirement may move to `Verified` only when the referenced tests/checks pass and the handoff records the evidence.
- The documentation check extracts Appendix A IDs, rejects missing or duplicate rows, and—once `apps/` or `packages/` exists—fails any row without both an implementation and test reference.

## Appendix A matrix

| ID | Requirement | Implementation location | Test evidence | Status |
| --- | --- | --- | --- | --- |
| ARC-001 | Four product surfaces plus a separate backend worker: API, frontend, manager, admin, worker | `apps/api`, `apps/worker`, `apps/frontend`, `apps/manager`, `apps/admin` | `tests/e2e/smoke.spec.ts:17-21` | P0 · Unverified · Phase 0 |
| ARC-002 | Modular monolith with API and worker commands | `apps/api`, `apps/worker`, shared `packages/domain` and `packages/contracts` | `tests/e2e/smoke.spec.ts:24-38` | P0 · Unverified · Phase 0 |
| ARC-003 | Typed REST/OpenAPI contracts and client | `packages/contracts`, `packages/api-client`, `apps/api/src/health.ts`, `docs/api/openapi.yaml` | `packages/contracts/src/openapi.test.ts`, `apps/api/src/health.test.ts` | P0 · Verified · Phase 0 |
| TEN-001 | Strict Organization isolation | `apps/api/src/modules/organizations`, `packages/domain/organizations` | `tests/integration/tenant-isolation.test.ts` | P0 · Unverified · Phase 1 |
| AUTH-001 | Shared email/password and Google authentication | `apps/api/src/lib/auth.ts`, `packages/api-client/src/auth.ts`, `packages/ui/src/app-shell.tsx` | `apps/api/src/lib/auth.test.ts`, `apps/api/tests/integration/auth.integration.test.ts`, `tests/e2e/smoke.spec.ts` | P0 · In progress · Phase 1 |
| AUTH-002 | Verified email gates sensitive actions | `apps/api/src/lib/verification.ts`, `apps/api/src/app.ts`, `packages/email/src/index.ts` | `apps/api/src/verified-user.test.ts`, `apps/api/src/lib/verification.test.ts`, `apps/api/tests/integration/verification.integration.test.ts`, `tests/e2e/smoke.spec.ts` | P0 · In progress · Phase 1 |
| RBAC-001 | Multi-role union with Competition assignments | `packages/domain/authorization`, `apps/api/src/modules/organizations/permissions` | `tests/unit/authorization/role-union.test.ts` | P0 · Unverified · Phase 1 |
| ADM-001 | Real User/Organization admin without impersonation | `apps/admin`, `apps/api/src/modules/admin` | `tests/e2e/admin-operations.spec.ts` | P0 · Unverified · Phase 1 |
| ATH-001 | LBFA provider behind a replaceable port | `packages/domain/athletes`, `apps/api/src/modules/athletes/providers` | `tests/integration/athlete-provider-sync.test.ts` | P0 · Unverified · Phase 2 |
| ATH-002 | Athlete has many Athlete Seasons with bib/Club | `packages/domain/athletes`, `apps/api/src/modules/athletes` | `tests/unit/athletes/athlete-seasons.test.ts` | P0 · Unverified · Phase 2 |
| ATH-003 | Club and Organization have no relation | `packages/domain/athletes`, `packages/domain/organizations` | `tests/unit/athletes/club-independence.test.ts` | P0 · Unverified · Phase 2 |
| ATH-004 | One-day Athlete and Competition bib | `packages/domain/athletes`, `apps/api/src/modules/competitions/bibs` | `tests/integration/one-day-bib-concurrency.test.ts` | P0 · Unverified · Phase 2 |
| CMP-001 | Competition lifecycle and audited overrides | `packages/domain/competitions/lifecycle`, `apps/api/src/modules/competitions` | `tests/unit/competitions/lifecycle.test.ts` | P0 · Unverified · Phase 2 |
| CMP-002 | Event/Round/Heat hierarchy and derived status | `packages/domain/results/structure`, `apps/api/src/modules/competitions/events` | `tests/unit/results/derived-status.test.ts` | P0 · Unverified · Phase 2 |
| CMP-003 | Combined parent registration and child results | `packages/domain/competitions/combined-events`, `apps/api/src/modules/competitions` | `tests/unit/competitions/combined-events.test.ts` | P0 · Unverified · Phase 2 |
| REG-001 | One Athlete Registration and first claim | `packages/domain/registrations/claims`, `apps/api/src/modules/registrations` | `tests/integration/registration-claim-race.test.ts` | P0 · Unverified · Phase 3 |
| REG-002 | Field-specific edit deadlines and cancellation | `packages/domain/registrations/deadlines`, `apps/manager/src/registrations` | `tests/unit/registrations/deadlines.test.ts` | P0 · Unverified · Phase 3 |
| REG-003 | Multi-Athlete atomic cart | `packages/domain/registrations/cart`, `apps/api/src/modules/registrations` | `tests/integration/atomic-cart.test.ts` | P0 · Unverified · Phase 3 |
| REG-004 | Explained eligibility with staff override | `packages/domain/registrations/eligibility`, `apps/api/src/modules/registrations` | `tests/unit/registrations/eligibility-errors.test.ts` | P0 · Unverified · Phase 3 |
| REG-005 | Transactional capacity and FIFO waitlist | `packages/domain/registrations/capacity`, `apps/api/src/modules/registrations/waitlists` | `tests/integration/capacity-waitlist-race.test.ts` | P0 · Unverified · Phase 3 |
| REG-006 | Suggested/editable PB until start | `packages/domain/registrations/personal-bests`, `apps/frontend/src/registration` | `tests/unit/registrations/personal-best.test.ts` | P0 · Unverified · Phase 3 |
| REG-007 | Competition check-in plus Event withdrawal/DNS | `packages/domain/registrations/attendance`, `apps/manager/src/check-in` | `tests/integration/check-in-withdrawal.test.ts` | P0 · Unverified · Phase 3 |
| PAY-001 | Integer-cent snapshots | `packages/domain/payments/money`, `apps/api/src/modules/payments` | `tests/unit/payments/money-snapshots.test.ts` | P0 · Unverified · Phase 4 |
| PAY-002 | Platform Stripe Checkout, EUR/card/Bancontact | `apps/api/src/modules/payments/stripe`, `packages/contracts/payments` | `tests/integration/stripe-checkout.test.ts` | P0 · Unverified · Phase 4 |
| PAY-003 | One fixed-plus-percentage Checkout Fee per paid cart | `packages/domain/payments/checkout-fee` | `tests/unit/payments/checkout-fee.test.ts` | P0 · Unverified · Phase 4 |
| PAY-004 | Organization receives exact Event revenue | `packages/domain/payments/settlement`, `apps/api/src/modules/payments/settlements` | `tests/integration/settlement-ledger.test.ts` | P0 · Unverified · Phase 4 |
| PAY-005 | Platform absorbs costs/disputes/chargebacks | `packages/domain/payments/chargebacks`, `apps/api/src/modules/payments` | `tests/integration/chargeback-loss.test.ts` | P0 · Unverified · Phase 4 |
| PAY-006 | Reimbursements external and untracked | `packages/domain/payments/reimbursements`, `apps/manager/src/registrations` | `tests/unit/payments/external-reimbursements.test.ts` | P0 · Unverified · Phase 4 |
| RES-001 | One result authority per Competition | `packages/domain/results/authority`, `apps/api/src/modules/results` | `tests/integration/result-authority.test.ts` | P0 · Unverified · Phase 5 |
| RES-002 | Typed results and deterministic ranking | `packages/domain/results/ranking`, `apps/manager/src/results` | `tests/unit/results/ranking.test.ts` | P0 · Unverified · Phase 5 |
| RES-003 | Public provisional live results | `apps/api/src/modules/results/realtime`, `apps/frontend/src/results` | `tests/e2e/provisional-live-results.spec.ts` | P0 · Unverified · Phase 5 |
| RES-004 | Whole-Competition officialization/revisions | `packages/domain/results/officialization`, `apps/api/src/modules/results` | `tests/integration/official-revisions.test.ts` | P0 · Unverified · Phase 5 |
| RES-005 | Correction requires revocation | `packages/domain/results/officialization`, `apps/manager/src/results` | `tests/unit/results/revocation-correction.test.ts` | P0 · Unverified · Phase 5 |
| INT-001 | AthleticsManager and generic participant CSV | `apps/api/src/modules/interchange/csv`, `apps/manager/src/interchange` | `tests/unit/interchange/csv-golden.test.ts` | P0 · Unverified · Phase 6 |
| INT-002 | Secure previewed idempotent XML import | `apps/api/src/modules/interchange/xml`, `apps/manager/src/interchange` | `tests/integration/xml-import-security.test.ts` | P0 · Unverified · Phase 6 |
| INT-003 | Result-mode reconciliation | `packages/domain/results/reconciliation`, `apps/api/src/modules/interchange` | `tests/integration/result-reconciliation.test.ts` | P0 · Unverified · Phase 6 |
| I18N-001 | Complete EN/FR/NL | `packages/ui`, `packages/email`, `apps/*/src/i18n` | `tests/component/translation-completeness.test.ts` | P0 · Unverified · Phase 7 |
| NTF-001 | Transactional email/outbox | `packages/email`, `apps/api/src/modules/notifications`, `apps/worker` | `tests/integration/notification-outbox.test.ts` | P0 · Unverified · Phase 3 |
| PRIV-001 | Public minimization and anonymization | `apps/api/src/modules/users/privacy`, `apps/frontend/src/account` | `tests/integration/anonymization-integrity.test.ts` | P0 · Unverified · Phase 7 |
| OPS-001 | Durable jobs, queue health, sanitized logs, and runbooks | `apps/worker/src`, `packages/backend-infrastructure/src/jobs.ts`, `apps/api/src/health.ts`, `docs/runbooks` | `packages/backend-infrastructure/src/jobs.integration.test.ts`, `apps/worker/src/handlers.test.ts`, `apps/api/src/health.test.ts` | P0 · Foundation slice · Phase 0 |
| QA-001 | Full CI quality gates | `.github/workflows/ci.yml`, `docs/ci.md`, `scripts/check-traceability.ts` | `.github/workflows/ci.yml` | P0 · Unverified · Phase 0 |
| DEP-001 | Docker/Dokploy delivery | `docker`, `deploy/dokploy`, `docs/deployment.md` | `tests/integration/deployment-smoke.test.ts` | P0 · Unverified · Phase 0 |

## Explicitly unverified P0 criteria

All 41 Appendix A requirements above are P0 scope and remain unverified. In particular, no application, API, worker, database, queue, authentication flow, payment flow, result flow, interchange flow, localization bundle, deployment image, or end-to-end journey has been implemented or tested in this repository yet. The planned paths and test seams are delivery targets, not evidence of completion.

## Dependency-ordered phase plan

| Phase | Scope | Depends on | Exit evidence |
| --- | --- | --- | --- |
| 0 · Foundation | Monorepo boundaries, env validation, Docker local stack, CI, tests, contracts/OpenAPI, IDs, money/time, audit, outbox, jobs | None | Four app health/session seams are real; foundation checks are green |
| 1 · Identity and tenancy | Better Auth, verification, Organizations, invitations, role unions, assignments, admin, anonymization | Phase 0 | Adversarial tenant and permission tests pass |
| 2 · Athletes and Competition configuration | Providers, Athlete Seasons, Clubs, One-day Athletes/bibs, lifecycle, events, eligibility, combined events, discovery | Phase 1 | A valid Competition publishes in EN/FR/NL |
| 3 · Registration and waitlists | Claims, deadlines, PBs, carts, snapshots, capacity, waitlists, check-in, notifications | Phase 2 | Free flow and concurrency journeys pass |
| 4 · Payments and settlement | Stripe Checkout, fee snapshots, webhook recovery, settlement, external reimbursements, chargebacks | Phase 3 | Paid flows reconcile to the cent |
| 5 · Web competition day | Check-in, withdrawals, Web results, ranking, realtime provisional results, officialization/revocation | Phase 4 | A full Competition operates in Web mode |
| 6 · AthleticsManager interchange | CSV exports, secure XML preview/mapping/commit, reconciliation, cleanup | Phase 5 | Fixture round trips and repeat imports are deterministic and audited |
| 7 · Launch hardening | Accessibility, performance, security, observability, alerts, runbooks, backup/restore, deployment and compliance | Phases 0–6 | Every P0 row is verified with evidence |

## Risk register

| Risk | Impact | Mitigation / trigger |
| --- | --- | --- |
| Tenant or role checks implemented inconsistently across apps | Cross-Organization data exposure | Centralize authorization policies, enforce scope in backend transactions, and make adversarial isolation tests a Phase 1 exit gate |
| Claims, bib allocation, capacity, waitlists, or webhook retries race | Duplicate registrations, oversubscription, or money mismatch | Database constraints plus short locked transactions, idempotency keys, outbox, and concurrency integration tests |
| Result authority or official revision semantics drift | Incorrect public results and irreversible history | Keep one authority per Competition, immutable official revisions, and reconciliation/officialization tests before Web mode exit |
| Raw XML or payment/provider payloads leak personal or secret data | Privacy, security, and compliance incident | Preview through a bounded parser, retain normalized evidence only, redact structured logs, and test cleanup/security cases |
| Redis, PostgreSQL, or deployment topology is treated as incidental | Lost jobs, unsafe releases, or unrecoverable data | Document Docker/Dokploy topology, health/readiness, backups, restore rehearsal, graceful shutdown, and operational alerts in Phase 0/7 |
| Legal interpretation of Checkout Fee and settlement presentation changes | Rework or non-compliant payment disclosure | Keep fee formula/versioning explicit and obtain Belgian/EU legal review before production |

## Traceability check contract

`bun run docs:check` validates that the matrix contains exactly the Appendix A IDs. Before implementation starts it validates the matrix shape and preserves the explicit unverified status. Once `apps/` or `packages/` exists, it additionally requires every row to contain non-placeholder implementation and test references; CI runs this check on every push and pull request.
