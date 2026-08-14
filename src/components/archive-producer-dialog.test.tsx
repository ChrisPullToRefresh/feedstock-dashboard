import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ArchiveProducerDialog } from "@/components/archive-producer-dialog";

function renderDialog() {
  const archive = vi.fn(async () => {});

  render(
    <ArchiveProducerDialog producerName="Larch Hollow" archive={archive} />,
  );

  return { archive, user: userEvent.setup() };
}

describe("archiving a producer", () => {
  it("does not archive on the first click", async () => {
    const { archive, user } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Archive" }));

    expect(archive).not.toHaveBeenCalled();
  });

  it("names the producer in the confirmation", async () => {
    const { user } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Archive" }));

    expect(
      await screen.findByRole("heading", { name: "Archive Larch Hollow?" }),
    ).toBeVisible();
  });

  it("says the record is kept, not deleted", async () => {
    const { user } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Archive" }));

    expect(await screen.findByText(/nothing is deleted/i)).toBeVisible();
  });

  it("archives once confirmed", async () => {
    const { archive, user } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Archive" }));
    await user.click(
      await screen.findByRole("button", { name: "Archive producer" }),
    );

    expect(archive).toHaveBeenCalledTimes(1);
  });

  it("does not archive when dismissed", async () => {
    const { archive, user } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Archive" }));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(archive).not.toHaveBeenCalled();
  });
});
