import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MovementForm } from "@/components/movement-form";
import { Direction } from "@/generated/prisma/enums";
import {
  WEIGHT_REFUSALS,
  type MovementFormAction,
  type MovementFormState,
} from "@/lib/movement-data";

/*
 * These drive the form the way an operator does. The action is a stand-in, so
 * what is being tested is whether a bad entry ever reaches it — the client-side
 * half of the two-sided validation in `plan.md` § Decisions.
 *
 * Every case runs at both directions. The form is one component, so a change
 * that works for feedstock in and not for feedstock out — or that leaves one
 * direction's words on the other's screen — fails here.
 */
const directions = [
  {
    name: "feedstock in",
    direction: Direction.INBOUND,
    label: "Producer",
    placeholder: "Select a producer",
    missing: "Select a producer",
    submitLabel: "Record feedstock in",
    options: [
      { id: "prd_1", name: "Aspen Ridge Timber" },
      { id: "prd_2", name: "Riverbend Sawmill" },
    ],
  },
  {
    name: "feedstock out",
    direction: Direction.OUTBOUND,
    label: "Sequestration site",
    placeholder: "Select a sequestration site",
    missing: "Select a sequestration site",
    submitLabel: "Record feedstock out",
    options: [
      { id: "sit_1", name: "Alkali Flat Storage" },
      { id: "sit_2", name: "Harney Basin Storage" },
    ],
  },
];

describe.each(directions)(
  "the $name form",
  ({ direction, label, placeholder, missing, submitLabel, options }) => {
    function renderForm(state?: MovementFormState) {
      const action = vi.fn<MovementFormAction>(
        async () => state ?? { status: "idle" },
      );

      render(
        <MovementForm
          direction={direction}
          options={options}
          action={action}
          submitLabel={submitLabel}
        />,
      );

      return { action };
    }

    /** Opens the dropdown and picks a row by its name. */
    async function choose(user: ReturnType<typeof userEvent.setup>, name: string) {
      await user.click(screen.getByRole("combobox"));
      await user.click(await screen.findByRole("option", { name }));
    }

    const weight = () => screen.getByLabelText("Weight (kg)");
    const save = () => screen.getByRole("button", { name: /Record feedstock/ });

    it("labels the counterparty with this direction's word", () => {
      renderForm();

      expect(screen.getByText(label)).toBeVisible();
      expect(screen.getByText(placeholder)).toBeVisible();
    });

    it("preselects nothing", () => {
      renderForm();

      // The placeholder is on screen, so no counterparty is chosen — a
      // movement can never be recorded against one nobody picked.
      expect(screen.getByRole("combobox")).toHaveTextContent(placeholder);
    });

    it.each([
      { entered: "", refusal: WEIGHT_REFUSALS.empty },
      { entered: "abc", refusal: WEIGHT_REFUSALS.notANumber },
      { entered: "0", refusal: WEIGHT_REFUSALS.notPositive },
      { entered: "-5", refusal: WEIGHT_REFUSALS.notPositive },
      { entered: "12.3456", refusal: WEIGHT_REFUSALS.tooPrecise },
      { entered: "1000000000", refusal: WEIGHT_REFUSALS.tooLarge },
    ])("refuses $entered without calling the action", async ({
      entered,
      refusal,
    }) => {
      const user = userEvent.setup();
      const { action } = renderForm();

      await choose(user, options[0].name);
      if (entered !== "") await user.type(weight(), entered);
      await user.click(save());

      expect(await screen.findByText(refusal)).toBeVisible();
      expect(action).not.toHaveBeenCalled();
    });

    it("refuses a submit with no counterparty chosen", async () => {
      const user = userEvent.setup();
      const { action } = renderForm();

      await user.type(weight(), "1250");
      await user.click(save());

      // Queried by role, not by text: the refusal and the dropdown's own
      // placeholder are deliberately the same words, so the text alone
      // matches two nodes.
      expect(await screen.findByRole("alert")).toHaveTextContent(missing);
      expect(action).not.toHaveBeenCalled();
    });

    it("sends the typed weight and the chosen counterparty", async () => {
      const user = userEvent.setup();
      const { action } = renderForm();

      await user.type(weight(), "1250.5");
      await choose(user, options[1].name);
      await user.click(save());

      await waitFor(() => expect(action).toHaveBeenCalled());

      const submitted = action.mock.calls[0][1];

      expect(submitted.get("weightKg")).toBe("1250.5");
      expect(submitted.get("counterpartyId")).toBe(options[1].id);
    });

    it("leaves the typed weight on screen when the action refuses", async () => {
      const user = userEvent.setup();
      renderForm({
        status: "error",
        message: "Something the server did not like",
        field: "weight",
        submittedWeightKg: "1250.5",
        submittedCounterpartyId: options[0].id,
      });

      await user.type(weight(), "1250.5");
      await choose(user, options[0].name);
      await user.click(save());

      expect(
        await screen.findByText("Something the server did not like"),
      ).toBeVisible();
      // React 19 resets an uncontrolled form once its action settles. Both
      // fields are controlled precisely so a refusal does not wipe the entry.
      expect(weight()).toHaveValue("1250.5");
    });

    it("clears both fields when the action reports success", async () => {
      const user = userEvent.setup();
      renderForm({
        status: "success",
        weightLabel: "1,250.5",
        counterpartyName: options[0].name,
      });

      await user.type(weight(), "1250.5");
      await choose(user, options[0].name);
      await user.click(save());

      await waitFor(() => expect(weight()).toHaveValue(""));
      expect(screen.getByRole("combobox")).toHaveTextContent(placeholder);
    });

    it("disables Save while the write is in flight", async () => {
      const user = userEvent.setup();
      let release: (state: MovementFormState) => void = () => {};
      const action = vi.fn<MovementFormAction>(
        () =>
          new Promise<MovementFormState>((resolve) => {
            release = resolve;
          }),
      );

      render(
        <MovementForm
          direction={direction}
          options={options}
          action={action}
          submitLabel={submitLabel}
        />,
      );

      await user.type(weight(), "1250");
      await choose(user, options[0].name);
      await user.click(save());

      // A double-tap at the scale would otherwise write two rows that nothing
      // can undo — movements are append-only.
      const saving = await screen.findByRole("button", { name: "Saving…" });
      expect(saving).toBeDisabled();

      release({ status: "success", weightLabel: "1,250", counterpartyName: options[0].name });
      await waitFor(() => expect(save()).toBeEnabled());
      expect(action).toHaveBeenCalledTimes(1);
    });
  },
);
