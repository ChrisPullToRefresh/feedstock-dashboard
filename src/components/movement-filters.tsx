"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Direction } from "@/generated/prisma/enums";
import {
  CLEARED_FILTERS_HREF,
  type CounterpartyFilterOption,
  DIRECTION_LABEL,
  filterHref,
  hasAnyFilter,
  type MovementFilterChange,
  type MovementFilterOptions,
  type MovementFilters,
} from "@/lib/movement-data";

/**
 * The three filters above the movement list.
 *
 * A client component wrapping controls that are otherwise static, which is the
 * cost `specs/2026-08-18-movement-list-and-totals/plan.md` § Decisions accepts
 * for a `Select` that navigates the moment it changes. Three Selects inside a
 * form with an **Apply** button was declined — it saves a round trip when
 * setting two filters at once and costs an extra tap in the common case, with
 * a submit pattern no other screen in this app uses.
 *
 * Every change goes through `filterHref`, so the other two filters ride along
 * and `limit` is dropped: a new filter selects a different set of rows and
 * starts over at the newest hundred.
 */

/**
 * Radix reserves the empty string to clear a `Select`, so "not filtered" needs
 * a value of its own. It never reaches the URL — the handler maps it back to
 * null, and `movement-data.ts` would treat it as unset even if it did.
 */
const ANY = "any";

/** One counterparty dropdown. Both are the same control over a different list,
 * so the words are the only thing either call site states. */
function CounterpartySelect({
  label,
  anyLabel,
  value,
  options,
  onSelect,
}: {
  label: string;
  anyLabel: string;
  value: string | null;
  options: readonly CounterpartyFilterOption[];
  onSelect: (id: string | null) => void;
}) {
  const fieldId = useId();

  return (
    <Field className="md:w-64">
      <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
      <Select
        value={value ?? ANY}
        onValueChange={(chosen) => onSelect(chosen === ANY ? null : chosen)}
      >
        <SelectTrigger id={fieldId} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {/* The group carries the popover's inner padding in this registry's
              select.tsx, as Phase 5's forms found. */}
          <SelectGroup>
            <SelectItem value={ANY}>{anyLabel}</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
                {option.isActive ? null : (
                  <Badge variant="outline" className="ml-2 font-normal">
                    Archived
                  </Badge>
                )}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

export function MovementFilters({
  filters,
  options,
}: {
  filters: MovementFilters;
  /** Every counterparty that has movements, archived included — the filters
   * follow the table, so a name in it can always be isolated. */
  options: MovementFilterOptions;
}) {
  const router = useRouter();
  const directionFieldId = useId();

  const go = (change: MovementFilterChange) => {
    router.push(filterHref(filters, change));
  };

  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
      <Field className="md:w-48">
        <FieldLabel htmlFor={directionFieldId}>Direction</FieldLabel>
        <Select
          value={filters.direction ?? ANY}
          onValueChange={(chosen) =>
            go({ direction: chosen === ANY ? null : (chosen as Direction) })
          }
        >
          <SelectTrigger id={directionFieldId} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={ANY}>All directions</SelectItem>
              {/* The yard's words, from the same constant the table renders. */}
              <SelectItem value={Direction.INBOUND}>
                {DIRECTION_LABEL[Direction.INBOUND]}
              </SelectItem>
              <SelectItem value={Direction.OUTBOUND}>
                {DIRECTION_LABEL[Direction.OUTBOUND]}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <CounterpartySelect
        label="Producer"
        anyLabel="All producers"
        value={filters.producerId}
        options={options.producers}
        onSelect={(producerId) => go({ producerId })}
      />

      <CounterpartySelect
        label="Sequestration site"
        anyLabel="All sequestration sites"
        value={filters.sequestrationSiteId}
        options={options.sites}
        onSelect={(sequestrationSiteId) => go({ sequestrationSiteId })}
      />

      {/* Only once something is narrowed: a control that clears nothing is a
          control that appears to do nothing. A link rather than a handler,
          because that is what it is. */}
      {hasAnyFilter(filters) ? (
        <Button asChild variant="ghost" className="md:mb-1 md:w-auto">
          <Link href={CLEARED_FILTERS_HREF}>Clear filters</Link>
        </Button>
      ) : null}
    </div>
  );
}
