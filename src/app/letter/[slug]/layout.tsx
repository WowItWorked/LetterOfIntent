import { MobileSections, WizardRail } from "@/components/wizard/WizardRail";

/**
 * The wizard's two columns. The rail only wraps the section screens — the
 * chooser and the review page are full-width pages of their own.
 */
export default function WizardLayout({ children }: LayoutProps<"/letter/[slug]">) {
  return (
    <div
      className="mx-auto flex w-full flex-1 flex-wrap items-start gap-[clamp(28px,4vw,56px)]"
      style={{
        maxWidth: "var(--container)",
        padding: "clamp(28px, 4vw, 48px) var(--gutter) 72px",
      }}
    >
      <div className="w-full lg:hidden">
        <MobileSections />
      </div>
      <aside className="print-hide hidden max-w-[300px] flex-[1_1_240px] lg:block">
        <WizardRail />
      </aside>
      <div className="min-w-0 flex-[999_1_340px]">{children}</div>
    </div>
  );
}
