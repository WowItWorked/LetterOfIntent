import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * The canonical section lockup: engraved eyebrow → serif title → sans lead.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "dark",
  as: Tag = "h2",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const onLight = tone === "dark";

  return (
    <div
      className={cn(
        "flex flex-col gap-3.5",
        align === "center" ? "mx-auto max-w-[760px] items-center text-center" : "items-start",
        className
      )}
    >
      {eyebrow ? (
        <Eyebrow align={align} tone={onLight ? "gold" : "light"}>
          {eyebrow}
        </Eyebrow>
      ) : null}
      <Tag
        className={cn(
          "m-0 font-serif text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.12] tracking-[-0.01em]",
          onLight ? "text-navy700" : "text-[#F5F2EB]"
        )}
      >
        {title}
      </Tag>
      {lead ? (
        <p
          className={cn(
            "m-0 max-w-[60ch] text-lg font-normal leading-[1.62]",
            onLight ? "text-muted" : "text-navy300"
          )}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}
