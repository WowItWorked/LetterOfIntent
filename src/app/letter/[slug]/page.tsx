import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allSectionSlugs, anySectionBySlug } from "@/lib/content/paths";
import { fillName } from "@/lib/derive";
import { SectionScreen } from "@/components/wizard/SectionScreen";

export function generateStaticParams() {
  return allSectionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/letter/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const def = anySectionBySlug(slug);
  return { title: def ? fillName(def.title, "your loved one") : "Letter section" };
}

export default async function SectionPage({ params }: PageProps<"/letter/[slug]">) {
  const { slug } = await params;
  if (!anySectionBySlug(slug)) notFound();
  return <SectionScreen slug={slug} />;
}
