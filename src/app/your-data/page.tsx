import type { Metadata } from "next";
import { DataControls } from "@/components/data/DataControls";

export const metadata: Metadata = {
  title: "Your data — back up, move, or delete",
};

export default function YourDataPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl">Your data</h1>
      <p className="mt-3 max-w-prose text-lg text-body">
        Everything you've written lives on this device only. From here you can back it
        up, move it to another device, or erase it completely.
      </p>
      <div className="mt-8">
        <DataControls />
      </div>
    </div>
  );
}
