import type { Metadata } from "next";
import { ReadScreen } from "@/components/letter/ReadScreen";

export const metadata: Metadata = {
  title: "Your letter so far",
  alternates: { canonical: "/letter/read" },
};

export default function ReadPage() {
  // Bare on purpose: the screen renders its own full-bleed header band and
  // centered content container. (A static route, so it wins over
  // /letter/[slug] and never reaches the section screen's notFound.)
  return <ReadScreen />;
}
