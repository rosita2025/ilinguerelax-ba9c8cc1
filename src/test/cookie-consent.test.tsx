import { cleanup, fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { CookieConsent, getCookieConsent } from "@/components/CookieConsent";

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
const show = (path = "/products/x") => { render(<MemoryRouter initialEntries={[path]}><CookieConsent /></MemoryRouter>); act(() => { vi.advanceTimersByTime(2500); }); };

describe("cookie consent version 2", () => {
  it("does not show the banner on checkout pages", () => {
    localStorage.setItem("ilr_country", "ES");
    show("/checkouts/patrones-ingles");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("shows the banner on product pages for European visitors", () => {
    localStorage.setItem("ilr_country", "ES");
    show("/products/patrones");
    expect(screen.queryByRole("dialog")).not.toBeNull();
  });
  it.each(["ES", "FR", "NO", "GB", "CH"])("renews old European acceptance in %s", country => {
    localStorage.setItem("ilr_country", country);
    localStorage.setItem("ilr_cookie_consent", "accepted");
    localStorage.setItem("ilr_cookie_consent_v", "1");
    show();
    expect(getCookieConsent()).toBeNull();
  });
  it.each(["MX", "PE", "US"])("leaves non-European consent unchanged in %s", country => {
    localStorage.setItem("ilr_country", country);
    localStorage.setItem("ilr_cookie_consent", "accepted");
    show();
    expect(getCookieConsent()).toBe("accepted");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("keeps a current European decision", () => {
    localStorage.setItem("ilr_country", "ES");
    localStorage.setItem("ilr_cookie_consent", "rejected");
    localStorage.setItem("ilr_cookie_consent_v", "2");
    show();
    expect(getCookieConsent()).toBe("rejected");
  });
  it.each(["accepted", "rejected"] as const)("stores version 2 and emits %s", decision => {
    localStorage.setItem("ilr_country", "ES");
    const listener = vi.fn();
    window.addEventListener("ilr-cookie-consent", listener);
    show();
    fireEvent.click(screen.getByRole("button", { name: decision === "accepted" ? "Aceptar" : "Rechazar" }));
    expect(getCookieConsent()).toBe(decision);
    expect(localStorage.getItem("ilr_cookie_consent_v")).toBe("2");
    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toBe(decision);
    window.removeEventListener("ilr-cookie-consent", listener);
  });
});