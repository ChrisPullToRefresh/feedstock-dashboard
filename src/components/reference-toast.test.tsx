import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const success = vi.fn();
const replace = vi.fn();
let params = new URLSearchParams();

vi.mock("sonner", () => ({ toast: { success: (m: unknown) => success(m) } }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => params,
  useRouter: () => ({ replace }),
}));

const { ReferenceToast } = await import("@/components/reference-toast");

/*
 * Every case runs at both entities. The toast is shared as of Phase 4, and the
 * list path it clears back to is the one prop that differs — a site archive
 * that redirected to /producers is the failure this guards.
 */
const entities = [
  { entity: "producers", listPath: "/producers", name: "Larch Hollow" },
  { entity: "sequestration sites", listPath: "/sites", name: "Steens Basin" },
];

describe.each(entities)(
  "announcing what just happened to $entity",
  ({ listPath, name }) => {
    function renderWith(search: string) {
      params = new URLSearchParams(search);
      render(<ReferenceToast listPath={listPath} />);
    }

    const encoded = encodeURIComponent(name);

    beforeEach(() => {
      success.mockClear();
      replace.mockClear();
    });

    it.each([
      { event: "created", shown: `${name} added` },
      { event: "archived", shown: `${name} archived` },
      { event: "restored", shown: `${name} restored` },
      { event: "renamed", shown: `Renamed to ${name}` },
    ])("says $shown", ({ event, shown }) => {
      renderWith(`toast=${event}&name=${encoded}`);

      expect(success).toHaveBeenCalledWith(shown);
    });

    it("clears the parameters so a refresh does not repeat it", () => {
      renderWith(`toast=created&name=${encoded}`);

      expect(replace).toHaveBeenCalledWith(listPath);
    });

    it("says nothing when there is nothing to say", () => {
      renderWith("");

      expect(success).not.toHaveBeenCalled();
    });

    it.each(["valueOf", "toString", "constructor", "hasOwnProperty"])(
      "ignores %s, which a bare lookup would find on Object.prototype",
      (event) => {
        // `?toast=valueOf` used to pass the guard and hand sonner a plain
        // object, which React refuses to render — a crafted URL crashed the
        // page.
        renderWith(`toast=${event}&name=x`);

        expect(success).not.toHaveBeenCalled();
        // Still cleared, so the crafted parameter does not linger.
        expect(replace).toHaveBeenCalledWith(listPath);
      },
    );
  },
);
