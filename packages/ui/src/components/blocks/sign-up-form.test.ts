import { describe, expect, it } from "vitest";

import { createSignUpFormSchema } from "./sign-up-form";

const translate = (key: string) => key;

describe("sign-up form validation", () => {
  const schema = createSignUpFormSchema(translate);

  it("accepts a complete account", () => {
    const result = schema.safeParse({
      name: "Alex Morgan",
      email: "alex@example.com",
      password: "scoreboard-12",
      confirmPassword: "scoreboard-12",
    });

    expect(result.success).toBe(true);
  });

  it("requires at least eight password characters", () => {
    const result = schema.safeParse({
      name: "Alex Morgan",
      email: "alex@example.com",
      password: "short",
      confirmPassword: "short",
    });

    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ message: "signUpForm.errors.passwordLength" }),
    );
  });

  it("rejects passwords that do not match", () => {
    const result = schema.safeParse({
      name: "Alex Morgan",
      email: "alex@example.com",
      password: "scoreboard-12",
      confirmPassword: "different-12",
    });

    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        message: "signUpForm.errors.passwordMismatch",
        path: ["confirmPassword"],
      }),
    );
  });

  it("keeps password whitespace significant", () => {
    const result = schema.safeParse({
      name: "Alex Morgan",
      email: "alex@example.com",
      password: " scoreboard-12 ",
      confirmPassword: "scoreboard-12",
    });

    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        message: "signUpForm.errors.passwordMismatch",
        path: ["confirmPassword"],
      }),
    );
  });
});
