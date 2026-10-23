import { describe, expect, it } from "vitest";
import { getRealReviewStats, getStickyTestimonials, REAL_REVIEWS, REELS } from "@/components/landing/magliaRelaxData";

describe("Maglia Relax real review and video rules", () => {
  it("does not invent sticky testimonials when reviews are empty", () => {
    expect(getStickyTestimonials()).toEqual([]);
  });

  it("includes four and five star reviews but excludes three star reviews", () => {
    const original = [...REAL_REVIEWS];
    try {
      REAL_REVIEWS.push(
        { name: "Fixture A", city: "Test city", stars: 4, text: "  Test   review  " },
        { name: "Fixture B", stars: 5, text: "Second test review" },
        { name: "Fixture C", stars: 3, text: "Excluded test review" },
      );
      expect(getStickyTestimonials()).toEqual([
        "Fixture A, Test city: Test review",
        "Fixture B: Second test review",
      ]);
    } finally {
      REAL_REVIEWS.splice(0, REAL_REVIEWS.length, ...original);
    }
  });

  it("shortens the sticky phrase to at most 90 characters plus an ellipsis without editing the review", () => {
    const original = [...REAL_REVIEWS];
    const text = "word ".repeat(30).trim();
    try {
      REAL_REVIEWS.push({ name: "Fixture", stars: 5, text });
      expect(getStickyTestimonials()).toEqual([`Fixture: ${"word ".repeat(18).trim()}…`]);
      expect(REAL_REVIEWS[REAL_REVIEWS.length - 1]?.text).toBe(text);
    } finally {
      REAL_REVIEWS.splice(0, REAL_REVIEWS.length, ...original);
    }
  });

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