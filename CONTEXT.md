# Competition Manager Domain

Competition Manager is a multi-tenant SaaS for organizing athletics competitions, accepting athlete registrations, and publishing competition results.

## People and tenancy

**Organization**:
An independent athletics organization that owns competitions and forms the tenant boundary.
_Avoid_: Club, customer account, tenant account

**Club**:
An athletics affiliation recorded on an Athlete or registration for sporting purposes. A Club is not an Organization, is not a tenant, and has no required relationship to an Organization; an Organization may itself happen to be a club without creating a domain link between the two concepts.
_Avoid_: Organization, tenant, organization membership

**User**:
An authenticated person who can browse competitions and register athletes. A User is not necessarily an Athlete or a member of an Organization.
_Avoid_: Athlete, account holder

**Athlete**:
A person who participates in athletics competitions and is identified independently from any User account.
_Avoid_: User, participant account

**Athlete Season**:
A season-specific record belonging to one Athlete and containing that season's bib and Club affiliation. One Athlete may have many Athlete Seasons, but only one record for a given season.
_Avoid_: Athlete identity, Competition registration

**Competition Bib**:
A bib unique within one Competition and assigned from an Organization-configured range to a One-day Athlete. Federated Athletes instead use the bib stored on their applicable Athlete Season.
_Avoid_: Athlete Season bib, Athlete identity

**Registrant**:
The User who submits or manages an Athlete's registration. Any verified User may be a Registrant for any eligible Athlete.
_Avoid_: Athlete owner, athlete account

**Organization Membership**:
An accepted, Organization-scoped relationship between a User and an Organization. A User may belong to multiple Organizations through email invitations and has independent role assignments in each.
_Avoid_: User account, Club affiliation, Platform Administrator

**Organization Owner**:
An Organization member with complete authority over the Organization, its membership, and its competitions.
_Avoid_: Platform admin, superadmin

**Platform Administrator**:
A trusted operator of the Competition Manager SaaS who creates and manages Organizations, manages or suspends Users, transfers Organization ownership, inspects system health, and reviews platform audit history. A Platform Administrator is outside every Organization's membership and role model and cannot impersonate Users in the initial product.
_Avoid_: Organization Owner, Competition Manager

## Competition

**Athletics Competition**:
A scheduled collection of track-and-field events owned and operated by one Organization.
_Avoid_: Generic competition, tournament

**Competition Lifecycle**:
The operational progression Draft, Published, Registration Open, Registration Closed, In Progress, Completed, and Archived. Scheduled transitions may be configured, but authorized Organization staff may explicitly override them with an audit entry.
_Avoid_: Result status, payment status

**Competition Officialization**:
The Competition-level action that makes the results of all its finished Events official. Until this action, publicly visible results remain provisional even when their Event is finished; correcting an official result requires revoking the Competition's official status, applying the correction, and officializing it again.
_Avoid_: Event finish, result entry

**Event Status**:
The status derived from the statuses of its Rounds: Not Started, Live, or Finished. Finishing an Event stops ordinary result entry but does not by itself make its results official.
_Avoid_: Competition lifecycle, official result

**Round**:
An independently operated stage of a Competition Event, such as a qualifying round, heat, or final, with status Not Started, Live, or Finished.
_Avoid_: Competition Event, attempt

**Result Entry Mode**:
The Competition-level choice of which system has authority to create and change results: AthleticsManager or Competition Manager Web.
_Avoid_: Synchronization direction, display mode

**Official Result**:
The Competition outcome accepted from the system selected by the Result Entry Mode and made official by Competition Officialization.
_Avoid_: Draft result, provisional entry

**Provisional Result**:
A publicly visible result that may still change and is explicitly marked as provisional until it is finalized as an Official Result.
_Avoid_: Official result, unsaved result

**Result Reconciliation**:
An explicit, reviewed process required to change Result Entry Mode after results exist. It previews conflicts and requires a human choice of authoritative data rather than automatically merging writers.
_Avoid_: Automatic merge, silent overwrite

## Registration

**Athlete Registration**:
The single active relationship between one Athlete and one Athletics Competition. It is controlled by the first successful Registrant unless authorized Organization staff transfer control; deletion means cancellation with an audit trail, not destructive record removal.
_Avoid_: Checkout, event registration, inscription line

**Event Entry**:
An Athlete Registration's participation in one Competition Event.
_Avoid_: Athlete registration, payment line

**Combined Event Entry**:
A single priced and capacity-controlled registration for a Combined Event such as a decathlon. It automatically creates participation in the child disciplines, whose results contribute to the aggregate standing.
_Avoid_: Separate purchase of each child discipline

**Personal Best**:
The performance supplied for an Event Entry and used for competition preparation such as seeding. The system suggests the latest available BeAthletics or federation performance, but the Registrant may change it until the Competition starts, including after registration closes.
_Avoid_: Competition result, athlete master record

**Competition Check-in**:
The Athlete Registration-level record that an Athlete is present at the Competition. Withdrawal or Did Not Start is recorded separately for each Event Entry.
_Avoid_: Event result, payment confirmation

**Registration Close**:
The deadline after which a Registrant cannot add Event Entries or make unrestricted registration edits. Until the Competition starts, the Registrant may still cancel the Athlete Registration, remove Event Entries without an automatic refund, and update Personal Bests.
_Avoid_: Competition start, payment deadline

**One-day Athlete**:
An Athlete created for a specific Competition when no suitable federated Athlete record exists. One-day Athlete registration is part of the initial product scope.
_Avoid_: Guest User, temporary login

**Federated Athlete**:
An Athlete synchronized from the LBFA/Belgian athlete source through a provider boundary that may support other federations later. Synchronization updates the global Athlete and its Athlete Seasons without changing the snapshots preserved on past registrations.
_Avoid_: One-day Athlete, User profile

**Registration Claim**:
The exclusive right of a Registrant to manage an Athlete Registration for one Competition. Submission claims it atomically; free registrations confirm immediately, while paid registrations and capacity reservations remain pending for a limited checkout window and are released if payment expires.
_Avoid_: Draft ownership, Athlete ownership

**Registration Cart**:
A single checkout containing Event Entries for one or more Athletes. Submission is atomic: if any claim or capacity check fails, nothing is submitted and the Registrant must review the cart; registrations remain individually identifiable after a successful submission even though they share one payment.
_Avoid_: Athlete Registration, Event Entry

**Waitlist Entry**:
A queued request for an Event Entry after its capacity is full. When capacity becomes available, the first eligible request is automatically invited into a limited payment window; expiry advances the queue, while a free Event Entry confirms immediately.
_Avoid_: Pending payment, confirmed Event Entry

## Commercial scope

**Registration Payment**:
A payment by a Registrant for one or more Athlete event entries, collected into the platform's single Stripe account. After the Competition and its configured refund window, the platform settles exactly the collected Event Entry prices to the Organization and retains the Checkout Fee; this does not include SaaS subscriptions or Organization billing.
_Avoid_: Subscription payment, plan purchase

**Price Snapshot**:
The unit price recorded on an Event Entry or checkout line when it is submitted. Organizations may change an Event price after registration opens only after acknowledging a strong warning; existing pending or paid lines retain their price and new additions use the new price.
_Avoid_: Current Event price, recalculated invoice

**Checkout Fee**:
An additional payment-method-neutral platform service fee charged once per paid Registration Cart, calculated from a platform-wide fixed EUR amount plus a percentage of Event Entry prices, disclosed before submission, and retained entirely by the platform. It is snapshotted at submission and separate from Event Entry prices, which are owed in full to the Organization.
_Avoid_: Card surcharge, per-Athlete fee, Organization revenue

**Refund Policy**:
The Organization's rules and external process for reimbursing a Registrant. Competition Manager neither decides, initiates, nor tracks reimbursements; an Organization may reimburse by cash, bank transfer, or another method, and removing an Event Entry never implies a reimbursement.
_Avoid_: Stripe refund, platform refund workflow, automatic refund rule

**Organization Settlement**:
The post-Competition transfer from the platform to the Organization after its configured refund window. The amount equals the Event Entry prices collected for the Competition; the Checkout Fee remains with the platform, and reimbursements performed externally by the Organization do not change the platform ledger.
_Avoid_: Registrant refund, Stripe payout, Checkout Fee

**Chargeback Loss**:
A reversed or disputed registration payment absorbed by the platform, including when it occurs after Organization Settlement. It is not deducted from a future Organization Settlement.
_Avoid_: Organization debt, Registrant reimbursement

## Access and communication

**Verified User**:
A User whose email address is verified and who may register Athletes, pay, accept Organization invitations, or access Organization tools. Initial authentication supports email/password and Google through one account shared across applications.
_Avoid_: Athlete verification, Organization Membership

**Account Anonymization**:
The response to a User deletion request: revoke access, remove or irreversibly anonymize personal profile data, and retain only legally required anonymized payment, Competition, and audit records.
_Avoid_: Destructive deletion of financial history, account suspension

**Transactional Notification**:
An email generated for account verification, registration or payment status, waitlist promotion, material Competition changes, or official result publication. SMS is outside the initial scope.
_Avoid_: Marketing email, in-app-only alert

## Localization

**Initial Locale Set**:
English, French, and Dutch are equally supported initial product locales. Currency and integrated payments are EUR-only initially, using Stripe Checkout with cards and Bancontact.
_Avoid_: Translation fallback as completed localization, multi-currency support

## Interchange

**AthleticsManager Interchange**:
Manual AthleticsManager result XML import and participant CSV export performed in the Organization manager. Imports persist Athlete, Event, Round, and Heat mappings, preview differences, update matched results idempotently, and never create duplicates; ambiguous rows remain unapplied until resolved. Exports include both an AthleticsManager-compatible CSV and a generic reporting CSV. A desktop bridge may automate interchange in a later release.
_Avoid_: Live synchronization, initial desktop dependency
