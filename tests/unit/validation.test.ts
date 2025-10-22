import { validateWorkoutForm, validateEmail, validatePassword } from "@/lib/validation";

describe("validateWorkoutForm", () => {
  it("returns valid for a title", () => {
    expect(validateWorkoutForm({ title: "Leg day" })).toEqual({ valid: true });
  });

  it("returns error when title is empty", () => {
    expect(validateWorkoutForm({ title: " " })).toEqual({
      valid: false,
      message: "A workout name is required",
    });
  });

  it("returns error when title is only whitespace", () => {
    expect(validateWorkoutForm({ title: "   " })).toEqual({
      valid: false,
      message: "A workout name is required",
    });
  });

  it("returns valid with optional fields", () => {
    expect(validateWorkoutForm({ 
      title: "Morning workout",
      scheduled_for: "2024-01-01",
      notes: "Focus on upper body"
    })).toEqual({ valid: true });
  });
});

describe("validateEmail", () => {
  it("returns true for valid email formats", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("test.email+tag@domain.co.uk")).toBe(true);
    expect(validateEmail("user123@sub.domain.com")).toBe(true);
  });

  it("returns false for invalid email formats", () => {
    expect(validateEmail("")).toBe(false);
    expect(validateEmail("invalid")).toBe(false);
    expect(validateEmail("@domain.com")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
    expect(validateEmail("user@domain")).toBe(false);
    expect(validateEmail("user.domain.com")).toBe(false);
  });
});

describe("validatePassword", () => {
  it("returns true for passwords with 8 or more characters", () => {
    expect(validatePassword("12345678")).toBe(true);
    expect(validatePassword("password123")).toBe(true);
    expect(validatePassword("a1b2c3d4e5f6")).toBe(true);
  });

  it("returns false for passwords with less than 8 characters", () => {
    expect(validatePassword("")).toBe(false);
    expect(validatePassword("1234567")).toBe(false);
    expect(validatePassword("short")).toBe(false);
  });

  it("returns true for exactly 8 characters", () => {
    expect(validatePassword("exactly8")).toBe(true);
  });
});
