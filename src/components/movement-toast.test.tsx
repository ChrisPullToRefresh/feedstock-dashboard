import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Direction } from "@/generated/prisma/enums";
import type {
  MovementFormAction,
  MovementFormState,
} from "@/lib/movement-data";

const success = vi.fn();

vi.mock("sonner", () => ({ toast: { success: (m: unknown) => success(m) } }));

const { MovementForm } = await import("@/components/movement-form");

/*
 * The save keeps the operator on the form, so the toast is the only proof a
 * movement was recorded — `plan.md` § Decisions. Nothing in this phase lists
 * movements, which is what makes these assertions worth having.
 */
const directions = [
  {
    name: "feedstock in",
    direction: Direction.INBOUND,
    submitLabel: "Record feedstock in",
    options: [{ id: "prd_1", name: "Aspen Ridge Timber" }],
    announced: "1,250.5 kg recorded from Aspen Ridge Timber",
  },
  {
    name: "feedstock out",
    direction: Direction.OUTBOUND,
    submitLabel: "Record feedstock out",
    options: [{ id: "sit_1", name: "Alkali Flat Storage" }],
    // Feedstock comes from a producer and goes to a sequestration site.
    announced: "1,250.5 kg recorded to Alkali Flat Storage",
  },
];

describe.each(directions)(
  "announcing a recorded $name movement",
  ({ direction, submitLabel, options, announced }) => {
    beforeEach(() => {
      success.mockClear();
    });

    function renderForm(state: MovementFormState) {
      const action = vi.fn<MovementFormAction>(async () => state);

      render(
        <MovementForm
          direction={direction}
          options={options}
          action={action}
          submitLabel={submitLabel}
        />,
      );
    }

    async function save(user: ReturnType<typeof userEvent.setup>) {
      await user.type(screen.getByLabelText("Weight (kg)"), "1250.5");
      await user.click(screen.getByRole("combobox"));
      await user.click(
        await screen.findByRole("option", { name: options[0].name }),
      );
      await user.click(screen.getByRole("button", { name: submitLabel }));
    }

    it("names the weight and the counterparty", async () => {
      const user = userEvent.setup();
      renderForm({
        status: "success",
        weightLabel: "1,250.5",
        counterpartyName: options[0].name,
      });

      await save(user);

      await waitFor(() => expect(success).toHaveBeenCalledWith(announced));
    });

    it("says nothing when the action refuses", async () => {
      const user = userEvent.setup();
      renderForm({
        status: "error",
        message: "Something the server did not like",
        field: "weight",
        submittedWeightKg: "1250.5",
        submittedCounterpartyId: options[0].id,
      });

      await save(user);

      expect(
        await screen.findByText("Something the server did not like"),
      ).toBeVisible();
      expect(success).not.toHaveBeenCalled();
    });

    it("does not re-announce on a later unrelated render", async () => {
      const user = userEvent.setup();
      renderForm({
        status: "success",
        weightLabel: "1,250.5",
        counterpartyName: options[0].name,
      });

      await save(user);
      await waitFor(() => expect(success).toHaveBeenCalledTimes(1));

      // Typing re-renders the form with the same settled state. A toast keyed
      // on anything but the state object itself would announce again here.
      await user.type(screen.getByLabelText("Weight (kg)"), "9");

      expect(success).toHaveBeenCalledTimes(1);
    });
  },
);
