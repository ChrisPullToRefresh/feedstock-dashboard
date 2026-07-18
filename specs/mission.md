# Product Mission

## Pitch

A mobile-friendly web app that records the movement of garbage in and out of a
processing facility: the weight of feedstock arriving from producers, and the
weight of processed material leaving for sequestration sites.

## Problem

The processing facility is new — there is no existing paper log or spreadsheet
process to replace. Without a purpose-built tool, the facility would default to
ad hoc tracking (paper tickets, generic spreadsheets) that is error-prone in a
field environment and doesn't tie incoming feedstock weight to outgoing
processed weight in one place. The app exists to give the facility a single,
structured system of record from day one.

## Users

### Primary Customers

- Processing facilities that take in feedstock from producers and ship
  processed material out to sequestration sites, and need an auditable record
  of both legs of the movement.

### User Personas

**Facility Scale Operator** (primary)
- **Role:** Staff stationed at the facility who weigh trucks/loads as they
  arrive and depart.
- **Context:** Works in the field, often outdoors near a scale, entering data
  on a phone or tablet as each load is processed — not at a desk.
- **Needs:** Fast, low-friction entry of a weight and a producer/site
  selection per transaction; a UI usable one-handed or in a hurry.

## Differentiators

- **Mobile-first structured entry, from day one:** Because the facility has
  no legacy process, the app is built mobile-first with dropdown-driven
  producer/site selection instead of the paper or spreadsheet tracking that
  would otherwise fill the gap.
- **One system for both legs of the movement:** Incoming feedstock weight and
  outgoing processed weight are recorded in the same system, tied to the same
  facility, enabling mass-balance and yield reporting that separate/ad hoc
  logs can't easily support.
- **Built for future automation:** Post-1.0, the app is intended to integrate
  with an IoT framework (e.g. Viam) to capture weights automatically —
  designed so manual entry can be phased out without a rebuild.

## Key Features

- Record incoming feedstock: weight (kg) + feedstock producer.
- Record outgoing processed feedstock: weight (kg) + sequestration site.
- Producer and site selection via dropdown lists at time of entry.
- Dedicated pages for creating new feedstock producers.
- Dedicated pages for creating new sequestration sites.
- Mobile-friendly interface for field data entry, per Arin (CEO); data
  analysis is done primarily on desktop.
