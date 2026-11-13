import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
invoke.mockImplementation(async (_fn: string, opts: { body: { country: string } }) => {
  if (opts.body.country === "CO") return { data: { available: true }, error: null };
  if (opts.body.country === "CL") return { data: null, error: { context: { json: async () => ({ reason: "not_configured" }) } } };
  throw new Error("sin red");
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));

import { WhopStatusCard } from "@/components/admin/WhopStatusCard";

describe("WhopStatusCard", () => {
  it("lista los países de Whop y comprueba cada uno", async () => {
    render(<WhopStatusCard />);
    expect(screen.getByText("Colombia")).toBeTruthy();
    expect(screen.getByText(/Nequi/)).toBeTruthy();
    expect(screen.getByText(/MODO/)).toBeTruthy();
    fireEvent.click(screen.getByText("Comprobar ahora"));
    await waitFor(() => expect(screen.getByText("Listo")).toBeTruthy());
    await waitFor(() => expect(screen.getAllByText("No disponible").length).toBe(2));
    expect(screen.getByText(/faltan los secretos/)).toBeTruthy();
    expect(invoke).toHaveBeenCalledTimes(3);
  });
});
