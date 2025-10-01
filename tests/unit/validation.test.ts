import { validateWorkoutForm } from "@/lib/validation";

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
});
