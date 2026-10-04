import { describe, expect, it } from "vitest";
import { slugify } from "./utils";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("slugify", () => {
  it("never produces an empty, leading-hyphen or trailing-hyphen slug", () => {
    const inputs = [
      "",
      "   ",
      "---",
      "😀😀😀",
      "!!!???...",
      "&&&",
      "सोफा सेट", // Hindi
      "  leading and trailing spaces  ",
    ];
    for (const input of inputs) {
      const slug = slugify(input);
      expect(slug.length).toBeGreaterThan(0);
      expect(slug).toMatch(SLUG_RE);
    }
  });

  it("handles a long name full of symbols without a trailing hyphen", () => {
    const name = 'Teak Wood Arnya 88.9" Modern 3 Seater Sofa Sofa Three Seater Sofa for Living Room Guest Room Hotels Office (White)';
    const slug = slugify(name);
    expect(slug).toMatch(SLUG_RE);
    expect(slug.length).toBeLessThanOrEqual(70);
    expect(slug.endsWith("-")).toBe(false);
    expect(slug.startsWith("-")).toBe(false);
  });

  it("converts & to and instead of dropping it", () => {
    expect(slugify("Beds & Mattresses")).toBe("beds-and-mattresses");
  });

  it("strips diacritics", () => {
    expect(slugify("Café Décor")).toBe("cafe-decor");
  });

  it("collapses runs of symbols and whitespace into one hyphen", () => {
    expect(slugify("Sofa   --  Set!!")).toBe("sofa-set");
  });

  it("keeps numbers", () => {
    expect(slugify('88.9" Sofa')).toBe("88-9-sofa");
  });

  it("truncates at a word boundary near the limit, not mid-word", () => {
    const name = "a".repeat(68) + " " + "b".repeat(20);
    const slug = slugify(name);
    expect(slug.length).toBeLessThanOrEqual(70);
    expect(slug).toBe("a".repeat(68));
  });

  it("is deterministic for the same input", () => {
    const name = "Teak Wood Dining Table";
    expect(slugify(name)).toBe(slugify(name));
  });

  it("produces a random fallback only for genuinely empty results", () => {
    const slug = slugify("🎉🎊✨");
    expect(slug.startsWith("product-")).toBe(true);
    expect(slug).toMatch(SLUG_RE);
  });
});
