import type { ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DateTimePicker } from "./datetime-picker";

let container: HTMLDivElement;
let root: Root;

function render(ui: ReactNode) {
  act(() => {
    root.render(ui);
  });
}

function getTriggerButton() {
  const button = container.querySelector<HTMLButtonElement>("#datetime-picker");
  if (!button) throw new Error("DateTimePicker trigger button not found");
  return button;
}

describe("DateTimePicker", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders its label and placeholder when no value is selected", () => {
    render(<DateTimePicker label="Starts at" placeholder="Pick a moment" />);

    expect(container.querySelector("label")?.textContent).toBe("Starts at");
    expect(getTriggerButton().textContent).toContain("Pick a moment");
    expect(container.querySelector("[aria-label='Clear selected date and time']")).toBeNull();
  });

  it("uses the provided formatter for selected values", () => {
    const value = new Date("2026-05-29T10:30:00.000Z");

    render(
      <DateTimePicker
        value={value}
        formatDateTime={(date) => `Selected ${date.getUTCFullYear()}`}
      />,
    );

    expect(getTriggerButton().textContent).toContain("Selected 2026");
  });

  it("clears the selected value without opening the picker", () => {
    const onChange = vi.fn();
    const value = new Date("2026-05-29T10:30:00.000Z");

    render(
      <DateTimePicker value={value} onChange={onChange} formatDateTime={() => "Selected date"} />,
    );

    const clearButton = container.querySelector<HTMLButtonElement>(
      "[aria-label='Clear selected date and time']",
    );
    expect(clearButton).not.toBeNull();

    act(() => {
      clearButton!.click();
    });

    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(getTriggerButton().textContent).toContain("Select date and time");
  });

  it("disables the trigger when disabled", () => {
    render(<DateTimePicker disabled />);

    expect(getTriggerButton().disabled).toBe(true);
  });
});
