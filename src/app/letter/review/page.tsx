import type { Metadata } from "next";
import { ReviewScreen } from "@/components/review/ReviewScreen";

export const metadata: Metadata = {
  title: "Review & download",
};

export default function ReviewPage() {
  return <ReviewScreen />;
}
