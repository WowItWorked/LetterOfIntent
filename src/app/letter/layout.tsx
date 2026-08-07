import { MobileSections, WizardRail } from "@/components/wizard/WizardRail";

export default function LetterLayout({ children }: LayoutProps<"/letter">) {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:py-10">
      <MobileSections />
      <div className="lg:grid lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-10">
        <div className="print-hide hidden lg:block">
          <WizardRail />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
