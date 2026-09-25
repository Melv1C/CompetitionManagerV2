# Competition Manager domain

Competition Manager is a multi-tenant SaaS for organizing athletics competitions, accepting athlete registrations, and publishing competition results.

## People and tenancy

**Organization**:
An independent athletics organization that owns competitions and forms the tenant boundary.
_Avoid_: Club, customer account, tenant account

**Organization Deactivation**:
The disabling of an Organization that has retained Competition history. It prevents new operations without deleting Competitions, registrations, payments, results, settlements, or audit history.
_Avoid_: Organization deletion, Competition archival

**Club**:
An athletics affiliation recorded on an Athlete or registration for sporting purposes. A Club is not an Organization, is not a tenant, and has no required relationship to an Organization; an Organization may itself happen to be a club without creating a domain link between the two concepts.
_Avoid_: Organization, tenant, organization membership

**User**:
An authenticated person who can browse competitions and register athletes. A User is not necessarily an Athlete or a member of an Organization.
_Avoid_: Athlete, account holder

**Athlete**:
A person who participates in athletics competitions and is identified independently from any User account.
_Avoid_: User, participant account

**Athlete External Identity**:
A provider-scoped identifier linking one Athlete to a federation or athletics data source. An Athlete may have identities from multiple providers without using a federation license as the Athlete's own identity.
_Avoid_: User account, Athlete ID, registration snapshot

**Athlete Merge**:
An audited operation that moves a duplicate One-day Athlete's records to a surviving Athlete before deleting the duplicate. Conflicting registrations, payments, or results require explicit staff reconciliation.
_Avoid_: Athlete reassignment, silent deduplication

**Athletics Season**:
A provider-scoped sporting period with a stable code and explicit start and end dates. Each Athletics Competition operates under one Athletics Season.
_Avoid_: Calendar year, Competition date range

**LRBA Season Calendar**:
The default LRBA Athletics Season runs from November 1 through October 31 and is named for its ending year. Its Indoor / Cross-Country phase runs through March 31 and its Outdoor phase begins April 1; both phases share Athlete Season bibs and Club affiliations.
_Avoid_: Separate Athlete Seasons for indoor and outdoor, inferred Competition date range

**Athlete Season**:
A record belonging to one Athlete and one Athletics Season that contains the Athlete's federation bib and Club affiliation for that period.
_Avoid_: Athlete identity, Competition registration

**Competition Bib**:
A bib snapshotted on Athlete Registration and unique within one Competition. It comes from the applicable Athlete Season for a Federated Athlete or an Organization-configured Competition range for a One-day Athlete.
_Avoid_: Athlete Season bib, Athlete identity

**Registrant**:
The User who submits or manages an Athlete's registration. Any verified User may be a Registrant for any eligible Athlete.
_Avoid_: Athlete owner, athlete account

**Organization Membership**:
An accepted, Organization-scoped relationship between a User and an Organization. A User may belong to multiple Organizations through email invitations and has independent role assignments in each.
_Avoid_: User account, Club affiliation, Platform Administrator

**Organization Owner**:
An Organization member with complete authority over the Organization, its membership, and its competitions. A Platform Administrator may also be an Organization Owner.
_Avoid_: superadmin

**Organization Staff**:
An Organization member whose assigned permissions authorize specific competition operations. Registration creation, management, transfer, and override are separate permissions inherited by the Organization Owner.
_Avoid_: Registrant, Platform Administrator, all Organization members

**Platform Administrator**:
A trusted operator of the Competition Manager SaaS who creates and manages Organizations, manages or suspends Users, transfers Organization ownership, inspects system health, and reviews platform audit history. A Platform Administrator may also hold an Organization Owner membership and cannot impersonate Users in the initial product.
_Avoid_: Competition Manager

## Competition

**Athletics Competition**:
A scheduled collection of track-and-field events owned and operated by one Organization.
_Avoid_: Generic competition, tournament

**Discipline**:
A reusable athletics definition, such as 100 metres or long jump, that may be offered by many Athletics Competitions. Differences in hurdle height or spacing and implement weight distinguish separate Disciplines; each belongs either to the platform catalog or to one Organization.
_Avoid_: Competition Event, scheduled event

**Competition Event**:
A scheduled offering of one Discipline within an Athletics Competition. A Competition Event may contain one or more Rounds.
_Avoid_: Athletics Competition, Round, Event Entry

**Competition Event Eligibility**:
The set of Athlete Categories allowed to enter one Competition Event. An Athlete may enter only when their assigned Athlete Category is explicitly listed; their category does not change on entry.
_Avoid_: Event Entry, athlete category snapshot

**Age Band**:
A Belgian Athletics age classification calculated from an Athlete's birth date and a reference date, such as BEN, PUP, MIN, or Masters 35 to 39. Age Bands are reused across Athletics Seasons.
_Avoid_: Athlete Category, Competition Event Eligibility

**Athlete Category**:
A reusable standard or Organization-specific classification used for Competition Event eligibility and rankings, independent of any one Athletics Season. A standard Belgian Athletics category combines an Age Band and gender, such as BEN M or BEN F; entries and results preserve the assigned category.
_Avoid_: Competition Event Eligibility, Club, age entered as free text

**Competition Venue**:
The single owned physical location assigned to an Athletics Competition and shared by all of its Competition Events. It retains the venue name, structured address, and optional coordinates for that Competition.
_Avoid_: Organization address, Competition Event venue

**Competition Translation**:
A localized Competition or Competition Event name and description. Each Competition has one primary locale used when an optional English, French, or Dutch translation is missing.
_Avoid_: Interface translation, separate localized Competition

**Competition Lifecycle**:
The operational progression Draft, Published, In Progress, Completed, and Archived. Scheduled transitions may be configured, but authorized Organization staff may explicitly override them with an audit entry.
_Avoid_: Result status, payment status

**Competition Publication Readiness**:
The completeness check a Draft Competition must pass before publication, covering its identity, dates, contact, Venue, Events, eligibility, schedules, and applicable prices.
_Avoid_: Draft validity, automatic publication

**Registration State**:
The independently controlled registration availability of an Athletics Competition: Scheduled, Open, or Closed. Configured times may drive transitions, but authorized Organization staff may explicitly override them with an audit entry.
_Avoid_: Competition lifecycle, Athlete Registration status

**Competition Officialization**:
The Competition-level action that makes the results of all its finished Competition Events official. Until this action, publicly visible results remain provisional even when their Competition Event is finished; correcting an official result requires revoking the Competition's official status, applying the correction, and officializing it again.
_Avoid_: Competition Event finish, result entry

**Competition Event Status**:
The status derived from the statuses of a Competition Event's Rounds: Not Started, Live, or Finished. Finishing a Competition Event stops ordinary result entry but does not by itself make its results official.
_Avoid_: Competition lifecycle, official result

**Round**:
An independently operated and scheduled stage of a Competition Event, such as a qualifying round or final, with status Not Started, Live, or Finished. A Competition Event's advertised start is derived from its earliest Round.
_Avoid_: Competition Event, attempt

**Start Group**:
An ordered group of Event Entries operated together within one Round. The interface may call it a heat for track disciplines or a flight for field disciplines. A Start Group has no independent scheduled time: Start Groups run sequentially from their Round's scheduled time.
_Avoid_: Round, Competition Event, athlete category

**Round Entry**:
An Event Entry's participation in one Round, including its Start Group, lane or order, advancement state, participation state, and Round Result.
_Avoid_: Event Entry, Competition result, Start Group

**Advancement Rule**:
A Round's structured rule for proposing qualifiers to a later Round by place and then by Performance. An official confirms the proposal, and manual changes require an audit reason.
_Avoid_: Confirmed Round Entry, hidden seeding logic

**Result Entry Mode**:
The choice, made separately for each Competition Event, of which system has authority to create and change its results: AthleticsManager or Competition Manager Web.
_Avoid_: Synchronization direction, display mode

**Official Result**:
A result accepted from the authority selected for its Competition Event and made official by Competition Officialization.
_Avoid_: Draft result, provisional entry

**Provisional Result**:
A publicly visible result that may still change and is explicitly marked as provisional until it is finalized as an Official Result.
_Avoid_: Official result, unsaved result

**Performance**:
An exact athletics mark represented in the Discipline's canonical integer unit: milliseconds for time, centimetres for distance and height, or integer points. Wind uses hundredths of a metre per second, while non-numeric outcomes use explicit statuses.
_Avoid_: Floating-point result, formatted result string, Personal Best

**Result Attempt**:
One ordered attempt within a Round Result, recording its status, Performance when applicable, and wind when applicable. The best valid attempt is derived from the attempts.
_Avoid_: Round Result, persisted best-attempt flag

**Scoring Rule Version**:
The immutable scoring formula used to convert a Combined Event component Performance into points. Accepted component results retain the applied version, while the Combined Event total is derived from those points.
_Avoid_: Mutable points table, Competition Event price

**Result Reconciliation**:
An explicit, reviewed process required to change a Competition Event's Result Entry Mode after results exist. It previews conflicts and requires a human choice of authoritative data rather than automatically merging writers.
_Avoid_: Automatic merge, silent overwrite

**Result Import Batch**:
An immutable record of one AthleticsManager result import, its source file, matched external mappings, proposed differences, and applied or unresolved rows.
_Avoid_: Live synchronization, unreviewed overwrite

## Registration

**Athlete Registration**:
The single active relationship between one Athlete and one Athletics Competition. It is Pending Payment or Confirmed while active and becomes Expired or Cancelled when it releases its Registration Claim; historical records are retained.
_Avoid_: Checkout, event registration, inscription line

**Event Entry**:
A registration's participation in one Competition Event, with an entry state of Pending, Confirmed, Waitlisted, or Cancelled and a separate participation state of Declared, Withdrawn, Did Not Start, or Started.
_Avoid_: Athlete registration, payment line

**Relay Entry**:
A Club and Athlete Category team's participation in one relay Competition Event, controlled by one Registrant or authorized Organization Staff member. Capacity and price apply once to the team.
_Avoid_: Athlete Event Entry, Relay Leg

**Relay Leg**:
One ordered Athlete Registration assignment within a Relay Entry. Relay legs may change until the relay Competition Event's first Round becomes Live.
_Avoid_: Relay Entry, individual Competition Event

**Combined Event**:
A Competition Event, such as a decathlon, whose standing aggregates results from a defined set of child Competition Events.
_Avoid_: Combined Event Entry, individual discipline

**Combined Event Component**:
The ordered inclusion of one child Competition Event in one Combined Event. A component is not shared with another Combined Event or a standalone Competition Event.
_Avoid_: Combined Event Entry, reusable Discipline

**Combined Event Entry**:
A single priced and capacity-controlled registration for a Combined Event. It automatically creates participation in the child Competition Events, whose results contribute to the aggregate standing.
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
An Athlete synchronized from the LRBA athlete source through a provider boundary that may support other federations later. Synchronization updates the global Athlete and its Athlete Seasons without changing the snapshots preserved on past registrations.
_Avoid_: One-day Athlete, User profile

**LRBA Athlete Directory Import**:
A confirmed synchronization of the LRBA athlete directory for one Athletics Season.
_Avoid_: Development seed, live synchronization, Organization import

**Registration Claim**:
The exclusive right of a Registrant to manage an Athlete Registration for one Competition. Submission claims it atomically; free registrations confirm immediately, while paid registrations and capacity reservations remain pending for a limited checkout window and are released if payment expires.
_Avoid_: Draft ownership, Athlete ownership

**Registration Control Transfer**:
An immediate, audited change of the verified User who manages an Athlete Registration. It does not change the original payer or payment history and generates a Transactional Notification for the new Registrant.
_Avoid_: Payment transfer, Athlete ownership, Organization Membership

**Staff Registration Override**:
An audited action by authorized Organization Staff that creates or changes an Athlete Registration outside ordinary ownership, capacity, or pricing rules. Capacity and price overrides require reasons and remain visible on the affected records.
_Avoid_: Platform Administrator edit, silent exception

**Registration Cart**:
A submitted checkout containing Event Entries for one or more Athletes. Browser-only drafts are not persisted; submission is atomic, and registrations remain individually identifiable after success even though they share one payment.
_Avoid_: Athlete Registration, Event Entry

**Capacity Reservation**:
A temporary claim on Competition Event capacity held by a submitted paid Registration Cart until its explicit expiry time. Expiry releases the related Registration Claims and capacity before waitlist promotion.
_Avoid_: Confirmed Event Entry, saved cart, Waitlist Entry

**Waitlist Entry**:
A queued request for an Event Entry after its capacity is full. When capacity becomes available, the first eligible request is offered the current applicable price in a limited payment window; expiry advances the queue, while a free Event Entry confirms immediately.
_Avoid_: Pending payment, confirmed Event Entry

## Commercial scope

**Competition Pricing Tier**:
A Competition-specific set of Event Entry prices assigned to selected Clubs. Each Club belongs to at most one non-default tier, and an Athlete without an assigned tier uses the default prices.
_Avoid_: Club eligibility, stacked discount, payment method fee

**Competition Club Eligibility**:
An optional allowlist restricting Athlete registration by Club independently from Competition Pricing Tiers. Without an allowlist, Club affiliation does not restrict eligibility.
_Avoid_: Organization Membership, Pricing Tier

**Event Entry Price Override**:
An audited price chosen by authorized Organization staff for one Event Entry instead of its applicable Pricing Tier price. The override requires a reason and does not change Competition pricing rules.
_Avoid_: Pricing Tier edit, automatic discount

**Registration Payment**:
A payment by a Registrant for one or more Athlete event entries, collected into the platform's single Stripe account. After the Competition and its configured refund window, the platform settles exactly the collected Event Entry prices to the Organization and retains the Checkout Fee; this does not include SaaS subscriptions or Organization billing.
_Avoid_: Subscription payment, plan purchase

**Payment Attempt**:
An immutable attempt to pay one Registration Payment through a single Stripe Checkout session. Retries create new attempts, and at most one attempt for a Registration Payment may succeed.
_Avoid_: Registration Payment, mutable checkout session

**Price Snapshot**:
The unit price recorded when an Event Entry enters checkout. Organizations may change a Competition Event price after registration opens only after acknowledging a strong warning; existing pending or paid lines retain their price, while new entries and promoted Waitlist Entries use the current applicable price.
_Avoid_: Current Competition Event price, recalculated invoice

**Checkout Fee**:
An additional payment-method-neutral platform service fee charged once per paid Registration Cart, initially €0.30 plus 10% of Event Entry prices, disclosed before submission, and retained entirely by the platform. Its versioned formula and calculated amount are snapshotted at submission; Event Entry prices remain owed in full to the Organization.
_Avoid_: Card surcharge, per-Athlete fee, Organization revenue

**Refund Policy**:
The Organization's rules and external process for reimbursing a Registrant. Competition Manager neither decides, initiates, nor tracks reimbursements; an Organization may reimburse by cash, bank transfer, or another method, and removing an Event Entry never implies a reimbursement.
_Avoid_: Stripe refund, platform refund workflow, automatic refund rule

**Organization Settlement**:
An immutable post-Competition allocation and transfer of collected Event Entry prices to the Organization after its configured refund window. Corrections use adjusting settlements; Checkout Fees and external reimbursements do not change the original settlement lines.
_Avoid_: Registrant refund, Stripe payout, Checkout Fee

**Chargeback Loss**:
A reversed or disputed registration payment absorbed by the platform, including when it occurs after Organization Settlement. It is not deducted from a future Organization Settlement.
_Avoid_: Organization debt, Registrant reimbursement

## Access and communication

**Verified User**:
A User whose email address is verified and who may register Athletes, pay, accept Organization invitations, or access Organization tools.
_Avoid_: Athlete verification, Organization Membership

**Account Anonymization**:
The response to a User deletion request: revoke access, remove or irreversibly anonymize personal profile data, and retain only legally required anonymized payment, Competition, and audit records.
_Avoid_: Destructive deletion of financial history, account suspension

**Audit Entry**:
An immutable Organization-scoped record of a significant domain action, its target, time, actor snapshot, required reason, and relevant structured details. Anonymizing the actor does not delete the entry.
_Avoid_: Application log, mutable note, payment record

**Transactional Notification**:
An email generated for account verification, registration control transfer, registration or payment status, waitlist promotion, material Competition changes, or official result publication. A transfer notification includes a payment link when money remains due; SMS is outside the initial scope.
_Avoid_: Marketing email, in-app-only alert

## Localization

**Initial Locale Set**:
English, French, and Dutch are equally supported initial product locales. Currency and integrated payments are EUR-only initially, using Stripe Checkout with cards and Bancontact.
_Avoid_: Translation fallback as completed localization, multi-currency support

## Interchange

**AthleticsManager Interchange**:
Manual AthleticsManager result XML import and participant CSV export performed in the Organization manager. Imports persist Athlete, Competition Event, Round, and Heat mappings, preview differences, update matched results idempotently, and never create duplicates; ambiguous rows remain unapplied until resolved. Exports include both an AthleticsManager-compatible CSV and a generic reporting CSV. A desktop bridge may automate interchange in a later release.
_Avoid_: Live synchronization, initial desktop dependency
