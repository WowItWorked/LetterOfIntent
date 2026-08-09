import type { Metadata } from "next";
import Link from "next/link";
import { DataControls } from "@/components/data/DataControls";

export const metadata: Metadata = {
  title: "Your data — back up, move, or delete",
  description:
    "Back up your letter, load a backup, download the documents, or erase everything " +
    "this tool has stored on this device.",
  alternates: { canonical: "/your-data" },
};

export default function YourDataPage() {
  return (
    <div
      className="mx-auto w-full"
      style={{
        maxWidth: "var(--container)",
        padding: "clamp(36px, 5vw, 72px) var(--gutter) 80px",
      }}
    >
      <div
        className="rounded-[var(--radius-md)]"
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          boxShadow: "var(--shadow-md)",
          padding: "clamp(26px, 3.4vw, 44px) clamp(24px, 3.4vw, 44px)",
        }}
      >
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

      <DataControls />
    </div>
  );
}
