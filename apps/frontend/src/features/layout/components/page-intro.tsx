import type { ReactNode } from "react";

export function PageIntro({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-10 md:grid-cols-[1fr_auto] md:items-end lg:px-6 lg:py-14">
      <div className="max-w-3xl">
        <p className="text-primary mb-3 text-xs font-bold tracking-[0.16em] uppercase">{eyebrow}</p>
        <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">{title}</h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-7">{intro}</p>
      </div>
      {children}
    </div>
  );
}
