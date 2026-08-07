import type { Metadata } from "next";
import Link from "next/link";
import { firm } from "@/config/firm";

export const metadata: Metadata = {
  title: "Privacy & how your data works",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl">Your privacy, in plain words</h1>
      <p className="mt-4 text-lg text-body">{firm.privacyPromise}</p>

      <div className="mt-8 space-y-8 text-body">
        <section>
          <h2 className="text-xl">Where your answers live</h2>
          <p className="mt-2 max-w-prose">
            Everything you type is stored in your browser, on this device — a feature
            called local storage. It is never uploaded, transmitted, or synced by us.
            {" "}{firm.shortName} has no server that receives it, no database that
            holds it, and no way to see it. You can confirm this yourself: open your
            browser's developer tools while you type — the network tab stays quiet.
          </p>
        </section>

        <section>
          <h2 className="text-xl">What that means in practice</h2>
          <ul className="mt-2 max-w-prose list-disc space-y-2 pl-5">
            <li>
              <strong className="text-ink">Your work stays on this device.</strong>{" "}
              Another computer or phone won't see it — unless you move it yourself
              with a backup file.
            </li>
            <li>
              <strong className="text-ink">Clearing browser data erases your letter.</strong>{" "}
              If you (or a cleanup tool) clear this site's data, the letter is gone.
              Please{" "}
              <Link href="/your-data" className="text-accent underline underline-offset-4">
                download a backup file
              </Link>{" "}
              now and then — it takes one click.
            </li>
            <li>
              <strong className="text-ink">Private or shared computers:</strong> on a
              library or family computer, use the{" "}
              <Link href="/your-data" className="text-accent underline underline-offset-4">
                Delete all my data
              </Link>{" "}
              button when you finish, or work in a private/incognito window and export
              a backup before closing it.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl">Why we never ask for Social Security or account numbers</h2>
          <p className="mt-2 max-w-prose">
            A Letter of Intent is meant to be copied and handed around — to caregivers,
            schools, hospitals, a trustee. Documents that travel should not carry
            numbers that can be abused. So this tool never asks for Social Security
            numbers, account numbers, or policy numbers. Instead, the letter records
            where your family keeps those, so the right person can find them and
            nobody else can.
          </p>
        </section>

        <section>
          <h2 className="text-xl">No tracking of what you type</h2>
          <p className="mt-2 max-w-prose">
            This tool contains no analytics scripts, no ad pixels, and no session
            recording. Nothing you type into any field is captured by us or by anyone
            else through this site.
          </p>
        </section>

        <section>
          <h2 className="text-xl">The legal fine print, plainly</h2>
          <p className="mt-2 max-w-prose">{firm.disclaimerFull}</p>
          {firm.advertisingNotice ? (
            <p className="mt-3 max-w-prose text-sm text-muted">{firm.advertisingNotice}</p>
          ) : null}
        </section>

        <section>
          <h2 className="text-xl">Questions?</h2>
          <p className="mt-2 max-w-prose">
            Call {firm.name} at{" "}
            <a href={firm.phoneHref} className="text-accent underline underline-offset-4">
              {firm.phone}
            </a>{" "}
            or write to{" "}
            <a href={`mailto:${firm.email}`} className="text-accent underline underline-offset-4">
              {firm.email}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
