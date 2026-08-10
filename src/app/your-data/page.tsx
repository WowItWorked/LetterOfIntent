import type { Metadata } from "next";
import Link from "next/link";
import { DataControls } from "@/components/data/DataControls";

export const metadata: Metadata = {
  title: "Your data: back up, move, or delete",
  description:
    "Download a backup file, load one back in, download the documents, or erase " +
    "everything this tool has stored on this device.",
  alternates: { canonical: "/your-data" },
};

export default function YourDataPage() {
  return (
    <>
      {/* Full-bleed header band, flush under the privacy strip — matches the
          home page hero rather than an inset box. */}
      <div
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          padding: "clamp(32px, 4.5vw, 56px) var(--gutter) clamp(34px, 4.5vw, 60px)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
        <p className="tw-engraved text-xs tracking-[0.22em] text-gold400">Your data</p>
        <h1 className="mt-3 font-serif text-[clamp(1.85rem,5.5vw,3rem)] font-semibold tracking-[-0.015em] text-onink">
          Everything you have written is on this device
        </h1>
        <p className="mt-4 max-w-[66ch] text-lg leading-[1.7] text-oninkbody">
          Nothing is ever transmitted, uploaded, or shared back to this site. From here
          you can back your letter up, move it to another device, download the documents,
          or erase it completely.
        </p>
        <hr
          className="mt-6 h-px border-0 opacity-70"
          style={{ background: "var(--gradient-gold)" }}
        />
        <p className="mt-4 text-[0.9375rem] text-oninkbody">
          <Link
            href="/privacy"
            className="font-semibold text-gold400 underline underline-offset-[3px]"
          >
            Read the privacy policy →
          </Link>
        </p>
        </div>
      </div>

      <div
        className="mx-auto w-full"
        style={{
          maxWidth: "var(--container)",
          padding: "clamp(10px, 2vw, 24px) var(--gutter) 80px",
        }}
      >
        <DataControls />
      </div>
    </>
  );
}
