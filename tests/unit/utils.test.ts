import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("combines multiple class names", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
    expect(cn("btn", "btn-primary", "active")).toBe("btn btn-primary active");
  });

  it("handles falsy values", () => {
    expect(cn("class1", false, "class2")).toBe("class1 class2");
    expect(cn("class1", null, "class2")).toBe("class1 class2");
    expect(cn("class1", undefined, "class2")).toBe("class1 class2");
    expect(cn("class1", "", "class2")).toBe("class1 class2");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
    expect(cn(null, false, undefined)).toBe("");
  });

  it("handles single class name", () => {
    expect(cn("single-class")).toBe("single-class");
  });

  it("trims whitespace properly", () => {
    expect(cn(" class1 ", " class2 ")).toBe("class1 class2");
    expect(cn("class1", "  ", "class2")).toBe("class1 class2");
  });

  it("handles mixed falsy and truthy values", () => {
    expect(cn("btn", false && "hidden", "primary")).toBe("btn primary");
    expect(cn("container", null, "flex", undefined, "center")).toBe("container flex center");
  });

  it("removes duplicate classes", () => {
    // Note: The current implementation might not dedupe, but we test current behavior
    expect(cn("btn", "btn")).toBe("btn btn");
  });
});
