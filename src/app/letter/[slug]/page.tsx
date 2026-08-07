import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sectionBySlug, sectionDefs } from "@/lib/content/sections";
import { fillName } from "@/lib/derive";
import { SectionScreen } from "@/components/wizard/SectionScreen";

export function generateStaticParams() {
  return sectionDefs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/letter/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const def = sectionBySlug(slug);
  return { title: def ? fillName(def.title, "your loved one") : "Letter section" };
}

export default async function SectionPage({ params }: PageProps<"/letter/[slug]">) {
  const { slug } = await params;
  if (!sectionBySlug(slug)) notFound();
  return <SectionScreen slug={slug} />;
}
