import { describe, it, expect } from "vitest";
import { dlocalDocumentInfo } from "@/lib/dlocalCoverage";

describe("documento dLocal por país", () => {
  it("Colombia: limpia puntos/guiones y acepta cédula", () => {
    const d = dlocalDocumentInfo("CO");
    expect(d.normalize("1.023.456.789")).toBe("1023456789");
    expect(d.isValid("1023456789")).toBe(true);
    expect(d.isValid("12")).toBe(false);
  });
  it("México: CURP (18) o RFC (12-13)", () => {
    const d = dlocalDocumentInfo("MX");
    expect(d.isValid(d.normalize("gomc800101hdfrrl09"))).toBe(true);
    expect(d.isValid(d.normalize("GOMC800101AB1"))).toBe(true);
    expect(d.isValid("ABC")).toBe(false);
  });
  it("Chile RUT con K y Brasil CPF", () => {
    expect(dlocalDocumentInfo("CL").isValid(dlocalDocumentInfo("CL").normalize("12.345.678-k"))).toBe(true);
    expect(dlocalDocumentInfo("BR").isValid("12345678909")).toBe(true);
  });
  it("país sin regla propia usa una validación tolerante", () => {
    const d = dlocalDocumentInfo("ZZ");
    expect(d.isValid(d.normalize("AB-12345"))).toBe(true);
    expect(d.isValid("1")).toBe(false);
  });
});
