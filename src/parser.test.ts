import { describe, it, expect } from "vitest";
import { parseInput } from "./parser";

describe("parseInput", () => {
  it("parses ISO date format", () => {
    const result = parseInput("chicken 2026-07-03");
    expect(result).toEqual({
      name: "chicken",
      expiryDate: "2026-07-03",
    });
  });

  it("parses days from now", () => {
    const result = parseInput("milk 3d");
    expect(result).not.toBeNull();
    expect(result?.name).toBe("milk");
    expect(result?.expiryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("parses natural month format", () => {
    const result = parseInput("eggs july 3");
    expect(result).not.toBeNull();
    expect(result?.name).toBe("eggs");
    expect(result?.expiryDate).toMatch(/^\d{4}-07-03$/);
  });

  it("parses multi-word names", () => {
    const result = parseInput("greek yogurt 2026-07-10");
    expect(result).toEqual({
      name: "greek yogurt",
      expiryDate: "2026-07-10",
    });
  });

  it("parses UK format with slashes", () => {
    const result = parseInput("mozzarella tortellini 07/08/2026");
    expect(result).toEqual({
      name: "mozzarella tortellini",
      expiryDate: "2026-08-07",
    });
  });

  it("parses UK format with hyphens", () => {
    const result = parseInput("cheese 01-07-2026");
    expect(result).toEqual({
      name: "cheese",
      expiryDate: "2026-07-01",
    });
  });

  it("rejects invalid formats", () => {
    expect(parseInput("just a phrase")).toBeNull();
    expect(parseInput("")).toBeNull();
    expect(parseInput("item invalid-date")).toBeNull();
  });

  it("ignores commands", () => {
    expect(parseInput("/list")).toBeNull();
    expect(parseInput("/remove chicken")).toBeNull();
  });
});
