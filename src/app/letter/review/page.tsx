import type { Metadata } from "next";
import { ReviewScreen } from "@/components/review/ReviewScreen";

export const metadata: Metadata = {
  title: "Review & download",
  alternates: { canonical: "/letter/review" },
};

export default function ReviewPage() {
  // Bare on purpose: the screen renders its own full-bleed header band and
  // centered content container.
  return <ReviewScreen />;
}
