import { describe, expect, it } from "vitest";
import { getRealReviewStats, REAL_REVIEWS, REELS } from "@/components/landing/magliaRelaxData";

describe("Maglia Relax real review and video rules", () => {
  it("has no rating or review count when no real reviews were supplied", () => {
    expect(REAL_REVIEWS).toHaveLength(0);
    expect(getRealReviewStats()).toEqual({ count: 0, average: 0 });
  });

  it("includes exactly the three supplied videos", () => {
    expect(REELS).toHaveLength(3);
    expect(new Set(REELS.map((reel) => reel.src)).size).toBe(3);
    expect(REELS.every((reel) => reel.src.endsWith(".mp4") && reel.poster?.endsWith(".jpg"))).toBe(true);
  });
});