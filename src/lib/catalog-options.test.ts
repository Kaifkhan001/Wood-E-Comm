import { describe, expect, it } from "vitest";
import { canonicalizeMaterial } from "./catalog-options";

describe("canonicalizeMaterial", () => {
  it("maps variants of a known material to the one canonical spelling", () => {
    expect(canonicalizeMaterial("teak")).toBe("Teak wood");
    expect(canonicalizeMaterial("Teak Wood")).toBe("Teak wood");
    expect(canonicalizeMaterial("teak wood")).toBe("Teak wood");
    expect(canonicalizeMaterial("  TEAK   WOOD  ")).toBe("Teak wood");
  });

  it("keeps an unrecognised value but title-cases it", () => {
    expect(canonicalizeMaterial("ash wood")).toBe("Ash Wood");
  });

  it("passes empty input through unchanged", () => {
    expect(canonicalizeMaterial("")).toBe("");
  });
});
