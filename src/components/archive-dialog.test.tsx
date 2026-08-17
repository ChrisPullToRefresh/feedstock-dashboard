import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ArchiveDialog } from "@/components/archive-dialog";

/*
 * Every case runs at both entities. The dialog is shared as of Phase 4, and
 * the copy that differs — which dropdown the row leaves — comes from the
 * caller, so both callers' wording is asserted here.
 */
const entities = [
  {
    entity: "producer",
    name: "Larch Hollow",
    description:
      "It stops appearing in the producers list and in the inbound movement dropdown. Its record and its movement history stay intact, and nothing is deleted.",
    confirmLabel: "Archive producer",
    dropdown: /inbound movement dropdown/i,
  },
  {
    entity: "sequestration site",
    name: "Steens Basin",
    description:
      "It stops appearing in the sequestration sites list and in the outbound movement dropdown. Its record and its movement history stay intact, and nothing is deleted.",
    confirmLabel: "Archive sequestration site",
    dropdown: /outbound movement dropdown/i,
  },
];

describe.each(entities)(
  "archiving a $entity",
  ({ name, description, confirmLabel, dropdown }) => {
    function renderDialog() {
      const archive = vi.fn(async () => {});

      render(
        <ArchiveDialog
          name={name}
          description={description}
          confirmLabel={confirmLabel}
          archive={archive}
        />,
      );

      return { archive, user: userEvent.setup() };
    }

    it("does not archive on the first click", async () => {
      const { archive, user } = renderDialog();

      await user.click(screen.getByRole("button", { name: "Archive" }));

      expect(archive).not.toHaveBeenCalled();
    });

    it("names the row in the confirmation", async () => {
      const { user } = renderDialog();

      await user.click(screen.getByRole("button", { name: "Archive" }));

      expect(
        await screen.findByRole("heading", { name: `Archive ${name}?` }),
      ).toBeVisible();
    });

    it("says the record is kept, not deleted", async () => {
      const { user } = renderDialog();

      await user.click(screen.getByRole("button", { name: "Archive" }));

      expect(await screen.findByText(/nothing is deleted/i)).toBeVisible();
    });

    it("says which dropdown the row leaves", async () => {
      const { user } = renderDialog();

      await user.click(screen.getByRole("button", { name: "Archive" }));

      expect(await screen.findByText(dropdown)).toBeVisible();
    });

    it("archives once confirmed", async () => {
      const { archive, user } = renderDialog();

      await user.click(screen.getByRole("button", { name: "Archive" }));
      await user.click(
        await screen.findByRole("button", { name: confirmLabel }),
      );

      expect(archive).toHaveBeenCalledTimes(1);
    });

    it("does not archive when dismissed", async () => {
      const { archive, user } = renderDialog();

      await user.click(screen.getByRole("button", { name: "Archive" }));
      await user.click(await screen.findByRole("button", { name: "Cancel" }));

      expect(archive).not.toHaveBeenCalled();
    });
  },
);
