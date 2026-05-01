import { create } from "zustand";

/**
 * Lightweight shared state for the currently selected bundle on a product page.
 * Used so the StickyBuyBar can mirror the price of whichever bundle the user
 * has chosen in the BundleSelector, and the buy handler can dispatch the right
 * bundle when CTA is clicked from anywhere on the page.
 */
export type SelectedBundle = {
  id: string;
  label: string;
  total: number; // numeric price in USD
  retail: number;
  itemCount: number;
};

interface BundleStore {
  selected: SelectedBundle | null;
  setSelected: (b: SelectedBundle) => void;
  reset: () => void;
}

export const useBundleStore = create<BundleStore>((set) => ({
  selected: null,
  setSelected: (b) => set({ selected: b }),
  reset: () => set({ selected: null }),
}));