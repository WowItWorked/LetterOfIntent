import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SAMPLE_DOCS, sampleBySlug } from "@/lib/content/samples";
import { SampleViewer } from "@/components/samples/SampleViewer";

export function generateStaticParams() {
  return SAMPLE_DOCS.map((s) => ({ doc: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/samples/[doc]">): Promise<Metadata> {
  const { doc } = await params;
  const sample = sampleBySlug(doc);
  if (!sample) return { title: "Sample document" };
  return {
    title: `Sample — ${sample.title}`,
    description: sample.subtitle,
    alternates: { canonical: `/samples/${sample.slug}` },
    // A watermarked example is not what should surface in a search result for
    // the tool itself.
    robots: { index: false, follow: true },
  };
}

export default async function SamplePage({ params }: PageProps<"/samples/[doc]">) {
  const { doc } = await params;
  const sample = sampleBySlug(doc);
  if (!sample) notFound();

  return (
    <SampleViewer
      file={sample.pdf}
      title={sample.title}
      subtitle={sample.subtitle}
      note={sample.note}
    />
  );
}
