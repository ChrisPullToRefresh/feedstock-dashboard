import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ReferenceForm } from "@/components/reference-form";
import {
  REFERENCE_NAME_MAX_LENGTH,
  type ReferenceFormAction,
} from "@/lib/reference-data";

/*
 * These drive the form the way an operator does. The action is a stand-in, so
 * what is being tested is whether a bad name ever reaches it — the client-side
 * half of the two-sided validation in `plan.md` § Decisions.
 *
 * Every case runs at both entities. The form is shared as of Phase 4, so a
 * change that works for producers and not for sequestration sites — or that
 * leaves one entity's words on the other's screen — fails here.
 */
const entities = [
  {
    entity: "producer",
    singular: "producer",
    createLabel: "Create producer",
    missing: "Enter a producer name",
    name: "Aspen Ridge Timber",
    other: "Riverbend Sawmill",
    archived: "Larch Hollow",
    archivedTyped: "larch hollow",
    taken: "Riverbend Sawmill is already a producer",
  },
  {
    entity: "sequestration site",
    singular: "sequestration site",
    createLabel: "Create sequestration site",
    missing: "Enter a sequestration site name",
    name: "Alkali Flat Storage",
    other: "Harney Basin Storage",
    archived: "Steens Basin",
    archivedTyped: "steens basin",
    taken: "Harney Basin Storage is already a sequestration site",
  },
];

describe.each(entities)(
  "the $entity form",
  ({ singular, createLabel, missing, name: validName, other, taken }) => {
    function renderForm() {
      const action = vi.fn<ReferenceFormAction>(async () => ({
        status: "idle",
      }));

      render(
        <ReferenceForm
          singular={singular}
          action={action}
          restore={vi.fn(async () => {})}
          submitLabel={createLabel}
        />,
      );

      return {
        action,
        user: userEvent.setup(),
        name: screen.getByLabelText("Name"),
        submit: screen.getByRole("button", { name: createLabel }),
      };
    }

    it("refuses an empty name without calling the action", async () => {
      const { action, user, submit } = renderForm();

      await user.click(submit);

      expect(await screen.findByText(missing)).toBeVisible();
      expect(action).not.toHaveBeenCalled();
    });

    it("refuses a whitespace-only name without calling the action", async () => {
      const { action, user, name, submit } = renderForm();

      await user.type(name, "   ");
      await user.click(submit);

      expect(await screen.findByText(missing)).toBeVisible();
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

      await user.type(name, validName);
      await user.click(submit);

      await waitFor(() => expect(action).toHaveBeenCalled());

      expect(action.mock.calls[0]?.[1].get("name")).toBe(validName);
    });

    it("prefills the current name when editing", () => {
      render(
        <ReferenceForm
          singular={singular}
          action={vi.fn(async () => ({ status: "idle" }) as const)}
          restore={vi.fn(async () => {})}
          defaultName={other}
          submitLabel="Save changes"
        />,
      );

      expect(screen.getByLabelText("Name")).toHaveValue(other);
    });

    it("shows an error the action returns", async () => {
      render(
        <ReferenceForm
          singular={singular}
          action={vi.fn<ReferenceFormAction>(async () => ({
            status: "error",
            message: taken,
            submitted: other,
          }))}
          restore={vi.fn(async () => {})}
          submitLabel={createLabel}
        />,
      );

      const user = userEvent.setup();
      await user.type(screen.getByLabelText("Name"), other);
      await user.click(screen.getByRole("button", { name: createLabel }));

      expect(await screen.findByText(taken)).toBeVisible();
    });
  },
);

describe.each(entities)(
  "a name that belongs to an archived $entity",
  ({ singular, createLabel, archived, archivedTyped }) => {
    function renderCollision() {
      const restore = vi.fn(async () => {});

      render(
        <ReferenceForm
          singular={singular}
          action={vi.fn<ReferenceFormAction>(async () => ({
            status: "archived-name",
            archivedId: "r9",
            name: archived,
            submitted: archivedTyped,
          }))}
          restore={restore}
          submitLabel={createLabel}
        />,
      );

      return { restore, user: userEvent.setup() };
    }

    async function submitCollision(user: ReturnType<typeof userEvent.setup>) {
      await user.type(screen.getByLabelText("Name"), archivedTyped);
      await user.click(screen.getByRole("button", { name: createLabel }));
    }

    it("offers to restore it rather than only refusing", async () => {
      const { user } = renderCollision();

      await submitCollision(user);

      // The offer is the point: with no screen listing archived rows, a bare
      // refusal would leave the name permanently unusable.
      expect(
        await screen.findByRole("button", { name: `Restore ${archived}` }),
      ).toBeVisible();
    });

    it("explains why the name is unavailable, in this entity's words", async () => {
      const { user } = renderCollision();

      await submitCollision(user);

      const alert = await screen.findByRole("alert");

      expect(alert).toHaveTextContent(/is archived/i);
      expect(alert).toHaveTextContent(`a new ${singular}`);
    });

    it("restores the archived row when the offer is taken", async () => {
      const { restore, user } = renderCollision();

      await submitCollision(user);
      await user.click(
        await screen.findByRole("button", { name: `Restore ${archived}` }),
      );

      expect(restore).toHaveBeenCalledTimes(1);
    });
  },
);

describe.each(entities)(
  "what the $entity form keeps when the server refuses",
  ({
    singular,
    createLabel,
    missing,
    archived,
    archivedTyped,
    other,
    taken,
  }) => {
    it("leaves the typed name in the field", async () => {
      // React 19 resets an uncontrolled form once the action settles, which
      // wiped the name on every refusal and made the operator retype it.
      render(
        <ReferenceForm
          singular={singular}
          action={vi.fn<ReferenceFormAction>(async (_state, formData) => ({
            status: "error",
            message: taken,
            submitted: String(formData.get("name")),
          }))}
          restore={vi.fn(async () => {})}
          submitLabel={createLabel}
        />,
      );

      const user = userEvent.setup();
      await user.type(screen.getByLabelText("Name"), other);
      await user.click(screen.getByRole("button", { name: createLabel }));

      expect(await screen.findByText(taken)).toBeVisible();
      expect(screen.getByLabelText("Name")).toHaveValue(other);
    });

    it("keeps the edited name rather than reverting to the original", async () => {
      render(
        <ReferenceForm
          singular={singular}
          action={vi.fn<ReferenceFormAction>(async (_state, formData) => ({
            status: "error",
            message: `${archived} is archived, so that name is taken`,
            submitted: String(formData.get("name")),
          }))}
          restore={vi.fn(async () => {})}
          defaultName={other}
          submitLabel="Save changes"
        />,
      );

      const user = userEvent.setup();
      const field = screen.getByLabelText("Name");
      await user.clear(field);
      await user.type(field, archived);
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(await screen.findByText(/is archived/)).toBeVisible();
      expect(field).toHaveValue(archived);
    });

    it("drops the restore offer once a client-side refusal replaces it", async () => {
      render(
        <ReferenceForm
          singular={singular}
          action={vi.fn<ReferenceFormAction>(async () => ({
            status: "archived-name",
            archivedId: "r9",
            name: archived,
            submitted: archivedTyped,
          }))}
          restore={vi.fn(async () => {})}
          submitLabel={createLabel}
        />,
      );

      const user = userEvent.setup();
      const field = screen.getByLabelText("Name");
      await user.type(field, archivedTyped);
      await user.click(screen.getByRole("button", { name: createLabel }));
      expect(
        await screen.findByRole("button", { name: `Restore ${archived}` }),
      ).toBeVisible();

      // Emptying the field and resubmitting is refused before the action runs,
      // so the offer no longer describes anything on screen.
      await user.clear(field);
      await user.click(screen.getByRole("button", { name: createLabel }));

      expect(await screen.findByText(missing)).toBeVisible();
      expect(
        screen.queryByRole("button", { name: `Restore ${archived}` }),
      ).not.toBeInTheDocument();
    });
  },
);
