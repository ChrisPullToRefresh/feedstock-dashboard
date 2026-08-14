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

const { ProducerToast } = await import("@/components/producer-toast");

function renderWith(search: string) {
  params = new URLSearchParams(search);
  render(<ProducerToast />);
}

describe("announcing what just happened", () => {
  beforeEach(() => {
    success.mockClear();
    replace.mockClear();
  });

  it.each([
    { search: "toast=created&name=Larch+Hollow", shown: "Larch Hollow added" },
    {
      search: "toast=archived&name=Larch+Hollow",
      shown: "Larch Hollow archived",
    },
    {
      search: "toast=restored&name=Larch+Hollow",
      shown: "Larch Hollow restored",
    },
    { search: "toast=renamed&name=Aspen", shown: "Renamed to Aspen" },
  ])("says $shown", ({ search, shown }) => {
    renderWith(search);

    expect(success).toHaveBeenCalledWith(shown);
  });

  it("clears the parameters so a refresh does not repeat it", () => {
    renderWith("toast=created&name=Larch+Hollow");

    expect(replace).toHaveBeenCalledWith("/producers");
  });

  it("says nothing when there is nothing to say", () => {
    renderWith("");

    expect(success).not.toHaveBeenCalled();
  });

  it.each(["valueOf", "toString", "constructor", "hasOwnProperty"])(
    "ignores %s, which a bare lookup would find on Object.prototype",
    (event) => {
      // `?toast=valueOf` used to pass the guard and hand sonner a plain object,
      // which React refuses to render — a crafted URL crashed the page.
      renderWith(`toast=${event}&name=x`);

      expect(success).not.toHaveBeenCalled();
      // Still cleared, so the crafted parameter does not linger.
      expect(replace).toHaveBeenCalledWith("/producers");
    },
  );
});
