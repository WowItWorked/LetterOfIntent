import type { Metadata } from "next";
import { ReviewScreen } from "@/components/review/ReviewScreen";

export const metadata: Metadata = {
  title: "Review & download",
  alternates: { canonical: "/letter/review" },
};

export default function ReviewPage() {
  return (
    <div
      className="mx-auto w-full"
      style={{
        maxWidth: "var(--container)",
        padding: "clamp(28px, 4vw, 52px) var(--gutter) 72px",
      }}
    >
      <ReviewScreen />
    </div>
  );
}
