"use client";

import { useRouter } from "next/navigation";
import { useLetterStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";

/**
 * The one start button. A new family goes to the onboarding questions; a
 * family whose answers are already in place goes straight into the form.
 */
export function StartButtons() {
  const router = useRouter();
  const meta = useLetterStore((s) => s.meta);

  const begin = () => {
    if (meta.onboardingDone) router.push("/letter/getting-started");
    else {
      const el = document.getElementById("start");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else router.push("/letter#start");
    }
  };

  return (
    <div className="mt-6 flex justify-center">
      <Button size="lg" variant="accent" className="px-8" onClick={begin}>
        {meta.onboardingDone ? "Continue your letter" : "Start your letter"}
      </Button>
    </div>
  );
}
