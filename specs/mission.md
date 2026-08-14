# Mission

## What we're building

A web app that records the movement of feedstock in and out of a single processing
facility.

- When feedstock moves into the facility, we record its weight in kilograms and the
  feedstock producer it came from.
- When processed feedstock leaves the facility for a sequestration site, we record its
  weight in kilograms and the sequestration site it went to.
- Producers and sequestration sites are selected from dropdown lists when recording a
  movement.
- Producers and sequestration sites each have their own pages for creating, editing,
  listing, and archiving. Deletion is soft — archiving retires a record from the
  dropdowns and never removes it.
- A movement list with running totals gives desktop users a filterable record of every
  inbound and outbound movement, with totals by producer and by sequestration site.

Data entry happens in the field on phones. Review and analysis happen on desktop.

## Who it's for

- **Facility operators** — record inbound and outbound movements at the scale, on
  mobile. This is the primary user and the primary design target.
- **Facility managers and analysts** — review movements and totals on desktop.
- **Admins** — maintain the producer and sequestration site lists.

Arin (CEO) is the sponsor. Arin's requirement that field data entry work on mobile is
binding on the design.

## The problem it solves

There is no system today. Feedstock movements are not recorded in any single place, so
there is no reliable answer to how much material entered the facility, how much left
for sequestration, or which producers and sites those weights belong to. v0.1 
establishes that record.

## What success looks like for v0.1

v0.1 is done when the app is deployed and Arin can be walked through it end to end:
recording an inbound movement, recording an outbound movement, managing producers and
sequestration sites, and viewing the movement list with running totals — on a phone for
entry and on desktop for review.

## Non-goals

v0.1 will not do these things. People will ask for them anyway.

- **No IoT or automated weight capture.** Weights are entered by hand. Integration with
  an IoT framework (Viam or otherwise) comes after v0.1.
- **No external or customer-facing access.** Feedstock producers and sequestration site
  operators do not log in. Internal staff only.
- **No offline data entry.** The app requires a network connection. Entries are not
  queued or synced.
- **No compliance or regulatory reporting.** No carbon-credit, MRV, or regulator-facing
  report generation, even though the data will eventually support it.
- **No multi-facility support.** v0.1 serves one processing facility.

## Constraints

- **Mobile-first field entry.** Recording a movement must be usable one-handed on a
  phone at the scale. Desktop layouts follow from the mobile design, not the reverse.
- **Kilograms are the only unit.** All weights are stored and displayed in kilograms.
  No unit conversion, no per-user unit preference.
- **Movements are immutable once recorded.** A mistake is corrected by recording a new
  adjusting entry, never by editing or deleting history. Producers and sequestration
  sites remain editable.
- **Nothing is ever hard-deleted.** Producers and sequestration sites are archived, not
  removed, so every movement's counterparty stays resolvable for the life of the record.
  A producer created in error is corrected by editing it.
- **Aesthetic is fixed by VISION.md.** Clean and minimal, consistent spacing, neutral
  palette, generous whitespace, Tailwind's default type scale, rounded corners, subtle
  shadows. See `specs/tech-stack.md` for the accent color and font.

## Open questions

None outstanding for the mission. Deferred scope is tracked under "After v0.1" in
`specs/roadmap.md`.
