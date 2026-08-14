import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ProducerForm,
  type ProducerFormAction,
} from "@/components/producer-form";
import { PRODUCER_NAME_MAX_LENGTH } from "@/lib/producers";

/*
 * These drive the form the way an operator does. The action is a stand-in, so
 * what is being tested is whether a bad name ever reaches it — the client-side
 * half of the two-sided validation in `plan.md` § Decisions.
 */
function renderForm() {
  const action = vi.fn<ProducerFormAction>(async () => ({ status: "idle" }));

  render(<ProducerForm action={action} submitLabel="Create producer" />);

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
    const tooLong = "a".repeat(PRODUCER_NAME_MAX_LENGTH + 1);
    await user.click(name);
    (name as HTMLInputElement).value = tooLong;
    await user.click(submit);

    expect(
      await screen.findByText(
        `Use ${PRODUCER_NAME_MAX_LENGTH} characters or fewer`,
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
        defaultName="Riverbend Sawmill"
        submitLabel="Save changes"
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue("Riverbend Sawmill");
  });

  it("shows an error the action returns", async () => {
    render(
      <ProducerForm
        action={vi.fn(async () => ({
          status: "error" as const,
          message: "Riverbend Sawmill is already a producer",
        }))}
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
