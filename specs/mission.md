# Product Mission

## Pitch

A mobile-friendly web app that records the movement of garbage in and out of a
processing facility: the weight of feedstock arriving from feedstock
suppliers, and the weight of processed material leaving for sequestration
sites.

## Problem

The processing facility is new — there is no existing paper log or spreadsheet
process to replace. Without a purpose-built tool, the facility would default to
ad hoc tracking (paper tickets, generic spreadsheets) that is error-prone in a
field environment and doesn't tie incoming feedstock weight to outgoing
processed weight in one place. The app exists to give the facility a single,
structured system of record from day one.

## Users

### Primary Customers

- Processing facilities that take in feedstock from feedstock suppliers and
  ship processed material out to sequestration sites, and need an auditable
  record of both legs of the movement.

### User Personas

**Facility Scale Operator** (primary)
- **Role:** Staff stationed at the facility who weigh trucks/loads as they
  arrive and depart.
- **Context:** Works in the field, often outdoors near a scale, entering data
  on a phone or tablet as each load is processed — not at a desk. Frequently
  logs 100+ transactions in a row for the same feedstock supplier or
  sequestration site.
- **Needs:** Fast, low-friction entry of a weight and a feedstock
  supplier/site selection per transaction; a UI usable one-handed or in a
  hurry; the app should default to the most-recently-used supplier/site so
  back-to-back entries don't require re-selecting it each time.

**Supplier/Site Auditor** (future, v2 planning)
- **Role:** Staff at an external feedstock supplier or sequestration site who
  need to verify what the facility recorded on their behalf.
- **Context:** Accesses the portal remotely, not on-site at the facility.
- **Needs:** A stripped-down, read-only view of their own transaction
  history for auditing purposes — no data-entry ability, and no visibility
  into other suppliers' or sites' data.

## Differentiators

- **Mobile-first structured entry, from day one:** Because the facility has
  no legacy process, the app is built mobile-first with dropdown-driven
  feedstock supplier/site selection instead of the paper or spreadsheet
  tracking that would otherwise fill the gap.
- **One system for both legs of the movement:** Incoming feedstock weight and
  outgoing processed weight are recorded in the same system, tied to the same
  facility, enabling mass-balance and yield reporting that separate/ad hoc
  logs can't easily support.
- **Built for future automation:** Post-1.0, the app is intended to integrate
  with an IoT framework (e.g. Viam) to capture weights automatically —
  designed so manual entry can be phased out without a rebuild.

## Key Features

- Record incoming feedstock: weight (kg) + feedstock supplier.
- Record outgoing processed feedstock: weight (kg) + sequestration site.
- Feedstock supplier and site selection via dropdown lists at time of entry.
- Dedicated pages for creating new feedstock suppliers.
- Dedicated pages for creating new sequestration sites.
- Mobile-friendly interface for field data entry, per Arin (CEO); data
  analysis is done primarily on desktop.
- Edit and archive (soft-delete) feedstock suppliers and sequestration
  sites — archiving hides them from active entry dropdowns while preserving
  their historical transactions, so the record stays auditable.
- Precise weight entry via whole-kg and 0.1kg increment controls.
- The app defaults to the most-recently-used feedstock supplier/site on
  load, so repeat entries against the same supplier don't require
  re-selecting it each time.
- A single consolidated "Logging" view (incoming/outgoing selected via
  dropdown, transaction list below) as the default landing page, replacing
  separate incoming/outgoing/history tabs.
- At-a-glance per-supplier totals (today, last calendar month, month-to-date)
  on the Feedstock Suppliers tab, sortable by any of the three.
