import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ProducerForm,
  type ProducerFormAction,
} from "@/components/producer-form";
import { REFERENCE_NAME_MAX_LENGTH } from "@/lib/reference-data";

/*
 * These drive the form the way an operator does. The action is a stand-in, so
 * what is being tested is whether a bad name ever reaches it — the client-side
 * half of the two-sided validation in `plan.md` § Decisions.
 */
function renderForm() {
  const action = vi.fn<ProducerFormAction>(async () => ({ status: "idle" }));

  render(
    <ProducerForm
      action={action}
      restore={vi.fn(async () => {})}
      submitLabel="Create producer"
    />,
  );

  return {
    action,
    user: userEvent.setup(),
    name: screen.getByLabelText("Name"),
    submit: screen.getByRole("button", { name: "Create producer" }),
  };
}

describe("the producer form", () => {
  it("refuses an empty name without calling the action", async () => {
    const { action, user, submit } = renderForm();

    await user.click(submit);

    expect(await screen.findByText("Enter a producer name")).toBeVisible();
    expect(action).not.toHaveBeenCalled();
  });

  it("refuses a whitespace-only name without calling the action", async () => {
    const { action, user, name, submit } = renderForm();

    await user.type(name, "   ");
    await user.click(submit);

    expect(await screen.findByText("Enter a producer name")).toBeVisible();
    expect(action).not.toHaveBeenCalled();
  });

  it("refuses a name longer than the limit", async () => {
    const { action, user, name, submit } = renderForm();

    // The input caps typing, so the over-long value is set directly — the
    // schema is the thing under test, not the browser's maxLength.
    const tooLong = "a".repeat(REFERENCE_NAME_MAX_LENGTH + 1);
    await user.click(name);
    (name as HTMLInputElement).value = tooLong;
    await user.click(submit);

    expect(
      await screen.findByText(
        `Use ${REFERENCE_NAME_MAX_LENGTH} characters or fewer`,
      ),
    ).toBeVisible();
    expect(action).not.toHaveBeenCalled();
  });

  it("submits a valid name to the action", async () => {
    const { action, user, name, submit } = renderForm();

    await user.type(name, "Aspen Ridge Timber");
    await user.click(submit);

    await waitFor(() => expect(action).toHaveBeenCalled());

    expect(action.mock.calls[0]?.[1].get("name")).toBe("Aspen Ridge Timber");
  });

  it("prefills the current name when editing", () => {
    render(
      <ProducerForm
        action={vi.fn(async () => ({ status: "idle" }) as const)}
        restore={vi.fn(async () => {})}
        defaultName="Riverbend Sawmill"
        submitLabel="Save changes"
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue("Riverbend Sawmill");
  });

  it("shows an error the action returns", async () => {
    render(
      <ProducerForm
        action={vi.fn<ProducerFormAction>(async () => ({
          status: "error",
          message: "Riverbend Sawmill is already a producer",
          submitted: "Riverbend Sawmill",
        }))}
        restore={vi.fn(async () => {})}
        submitLabel="Create producer"
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Name"), "Riverbend Sawmill");
    await user.click(screen.getByRole("button", { name: "Create producer" }));

    expect(
      await screen.findByText("Riverbend Sawmill is already a producer"),
    ).toBeVisible();
  });
});

describe("a name that belongs to an archived producer", () => {
  function renderCollision() {
    const restore = vi.fn(async () => {});

    render(
      <ProducerForm
        action={vi.fn<ProducerFormAction>(async () => ({
          status: "archived-name",
          archivedId: "p9",
          name: "Larch Hollow",
          submitted: "larch hollow",
        }))}
        restore={restore}
        submitLabel="Create producer"
      />,
    );

    return { restore, user: userEvent.setup() };
  }

  it("offers to restore it rather than only refusing", async () => {
    const { user } = renderCollision();

    await user.type(screen.getByLabelText("Name"), "larch hollow");
    await user.click(screen.getByRole("button", { name: "Create producer" }));

    // The offer is the point: with no screen listing archived producers, a
    // bare refusal would leave the name permanently unusable.
    expect(
      await screen.findByRole("button", { name: "Restore Larch Hollow" }),
    ).toBeVisible();
  });

  it("explains why the name is unavailable", async () => {
    const { user } = renderCollision();

    await user.type(screen.getByLabelText("Name"), "larch hollow");
    await user.click(screen.getByRole("button", { name: "Create producer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/is archived/i);
  });

  it("restores the archived producer when the offer is taken", async () => {
    const { restore, user } = renderCollision();

    await user.type(screen.getByLabelText("Name"), "larch hollow");
    await user.click(screen.getByRole("button", { name: "Create producer" }));
    await user.click(
      await screen.findByRole("button", { name: "Restore Larch Hollow" }),
    );

    expect(restore).toHaveBeenCalledTimes(1);
  });
});

describe("what the form keeps when the server refuses", () => {
  it("leaves the typed name in the field", async () => {
    // React 19 resets an uncontrolled form once the action settles, which
    // wiped the name on every refusal and made the operator retype it.
    render(
      <ProducerForm
        action={vi.fn<ProducerFormAction>(async (_state, formData) => ({
          status: "error",
          message: "Riverbend Sawmill is already a producer",
          submitted: String(formData.get("name")),
        }))}
        restore={vi.fn(async () => {})}
        submitLabel="Create producer"
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Name"), "Riverbend Sawmill");
    await user.click(screen.getByRole("button", { name: "Create producer" }));

    expect(
      await screen.findByText("Riverbend Sawmill is already a producer"),
    ).toBeVisible();
    expect(screen.getByLabelText("Name")).toHaveValue("Riverbend Sawmill");
  });

  it("keeps the edited name rather than reverting to the original", async () => {
    render(
      <ProducerForm
        action={vi.fn<ProducerFormAction>(async (_state, formData) => ({
          status: "error",
          message: "Larch Hollow is archived, so that name is taken",
          submitted: String(formData.get("name")),
        }))}
        restore={vi.fn(async () => {})}
        defaultName="Aspen Ridge Timber"
        submitLabel="Save changes"
      />,
    );

    const user = userEvent.setup();
    const field = screen.getByLabelText("Name");
    await user.clear(field);
    await user.type(field, "Larch Hollow");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText(/is archived/)).toBeVisible();
    expect(field).toHaveValue("Larch Hollow");
  });

  it("drops the restore offer once a client-side refusal replaces it", async () => {
    render(
      <ProducerForm
        action={vi.fn<ProducerFormAction>(async () => ({
          status: "archived-name",
          archivedId: "p9",
          name: "Larch Hollow",
          submitted: "larch hollow",
        }))}
        restore={vi.fn(async () => {})}
        submitLabel="Create producer"
      />,
    );

    const user = userEvent.setup();
    const field = screen.getByLabelText("Name");
    await user.type(field, "larch hollow");
    await user.click(screen.getByRole("button", { name: "Create producer" }));
    expect(
      await screen.findByRole("button", { name: "Restore Larch Hollow" }),
    ).toBeVisible();

    // Emptying the field and resubmitting is refused before the action runs,
    // so the offer no longer describes anything on screen.
    await user.clear(field);
    await user.click(screen.getByRole("button", { name: "Create producer" }));

    expect(await screen.findByText("Enter a producer name")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Restore Larch Hollow" }),
    ).not.toBeInTheDocument();
  });
});
