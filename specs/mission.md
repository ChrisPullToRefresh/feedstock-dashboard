# Mission

## What we're building

A web app that records the movement of feedstock in and out of a single processing
facility.

- When feedstock moves into the facility, we record its weight in kilograms and the
  feedstock supplier it came from.
- When processed feedstock leaves the facility for a sequestration site, we record its
  weight in kilograms and the sequestration site it went to.
- Feedstock suppliers and sequestration sites are selected from dropdown lists when
  recording a movement.
- Recording and reviewing happen on one screen. The logging view is where the app opens:
  a direction picker and the entry form above a line, and the transactions in reverse
  chronological order below it, so recent movements confirm themselves at a glance.
- Every movement carries a readable receipt number and downloads on its own, as a CSV row
  and as a printable PDF receipt, for auditing.
- Feedstock suppliers and sequestration sites each have their own pages for creating,
  editing, listing, and archiving, and each row shows what it moved today, last calendar
  month, and since the first of this month. The lists sort by those totals, so the most
  active counterparties stay at the top.
- Deletion is soft — archiving retires a record from the dropdowns and hides its
  movements, and never removes anything.

Data entry happens in the field on phones. Review and analysis happen on desktop.

## Who it's for

- **Facility operators** — record inbound and outbound movements at the scale, on
  mobile. This is the primary user and the primary design target.
- **Facility managers and analysts** — review movements and totals on desktop.
- **Admins** — maintain the feedstock supplier and sequestration site lists.

Arin (CEO) is the sponsor. Arin's requirement that field data entry work on mobile is
binding on the design.

## The problem it solves

Feedstock movements live in spreadsheets, so there is no reliable answer to how much
material entered the facility, how much left for sequestration, or which suppliers and
sites those weights belong to. v0.1 established that record. v0.2 is what gets the
facility off the spreadsheets: Arin asks for these features "so we can get this into
production and stop using spreadsheets" — `specs/vision0.2/v01feedback.md` — and the
monthly totals it adds are what an invoice is written from.

## What success looks like for v0.2

v0.2 is done when the facility works from the app instead of a spreadsheet: an operator
in gloves records a weight on the logging view in a few large taps, sees it appear in the
list underneath, and a manager reads a supplier's month off the supplier list and writes
an invoice from it. Every movement is downloadable for audit, and the app is live in
production with Arin walked through it.

v0.1's criteria were met and are recorded, checked, in `specs/roadmap.md`
§ v0.1 — Definition of done.

## Non-goals

v0.2 will not do these things. People will ask for them anyway.

- **No IoT or automated weight capture.** Weights are entered by hand. Integration with
  an IoT framework (Viam or otherwise) comes after v0.2.
- **No delete.** Arin asked for a hard delete — "let's also have delete, which will fully
  eliminate any record from the database. While we are still testing, that hard delete is
  useful to get rid of all the test data" — and it is declined. Test data is cleared with
  SQL run directly against the database by an engineer, which is what the request is
  actually for; a delete control in the app would put an irreversible one in the hands of
  an operator in gloves, and the invoicing and audit trail v0.2 builds rests on movements
  nobody can remove. Archiving is the in-app answer: it takes a counterparty's movements
  out of every view, reversibly.
- **No external or customer-facing access.** Feedstock suppliers and sequestration site
  operators do not log in. Internal staff only.
- **No offline data entry.** The app requires a network connection. Entries are not
  queued or synced.
- **No compliance or regulatory reporting.** No carbon-credit, MRV, or regulator-facing
  report generation, even though the data will eventually support it.
- **No multi-facility support.** v0.2 serves one processing facility.

## Constraints

- **Mobile-first field entry.** Recording a movement must be usable one-handed on a
  phone at the scale. Desktop layouts follow from the mobile design, not the reverse.
- **Kilograms are the only unit.** All weights are stored and displayed in kilograms.
  No unit conversion, no per-user unit preference.
- **Movements are immutable once recorded.** A mistake is corrected by recording a new
  adjusting entry, never by editing or deleting history. Feedstock suppliers and
  sequestration sites remain editable.
- **Nothing is ever hard-deleted.** Feedstock suppliers and sequestration sites are
  archived, not removed, so every movement's counterparty stays resolvable for the life of
  the record. A supplier created in error is corrected by editing it. Nothing in the app
  deletes a row, and the database refuses to update or delete a movement.
- **Archiving hides a counterparty's movements.** Archiving a feedstock supplier or a
  sequestration site takes its movements out of the list, out of its own totals, and out
  of the facility totals — "we need the kg logged to also get archived and disappear from
  the logs and per-site totals", `specs/vision0.2/v01feedback.md`. The rows are not
  touched, so unarchiving brings all of it back.
- **Entry controls are usable in gloves.** The weight steppers and the counterparty
  picker are sized for a gloved hand at the scale. This is why weight can be set without
  typing at all.
- **Aesthetic is fixed by `specs/vision0.1/VISION.md`.** Clean and minimal, consistent
  spacing, neutral palette, generous whitespace, Tailwind's default type scale, rounded
  corners, subtle shadows. See `specs/tech-stack.md` for the accent color and font.

## Open questions

None outstanding for the mission. Deferred scope is tracked under "After v0.2" in
`specs/roadmap.md`.
