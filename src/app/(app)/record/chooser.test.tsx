import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RecordPage from "@/app/(app)/record/page";

/*
 * `/record` was a PlaceholderPage until Phase 5. These assert the swap
 * happened. Phase 6 took the last placeholder — `/` — and deleted the
 * component with it; `src/app/(app)/movements-page.test.tsx` asserts that.
 */
describe("the record chooser", () => {
  it("renders the two directions, not the placeholder", () => {
    render(<RecordPage />);

    expect(screen.queryByText(/Arrives in Phase/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Record" })).toBeVisible();
  });

  it.each([
    { label: "Feedstock in", href: "/record/inbound" },
    { label: "Feedstock out", href: "/record/outbound" },
  ])("links $label to $href", ({ label, href }) => {
    render(<RecordPage />);

    // The words on screen are the yard's and the path is the enum's. A link
    // whose label and href disagree would send an operator to the wrong form
    // and record a movement in the wrong direction, which nothing can undo.
    expect(
      screen.getByRole("link", { name: new RegExp(label) }),
    ).toHaveAttribute("href", href);
  });

  it("offers both directions and nothing else", () => {
    render(<RecordPage />);

    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
