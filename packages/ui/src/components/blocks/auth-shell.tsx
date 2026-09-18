import { Trophy } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
};

function AuthShell({ children, eyebrow, title, description, className }: AuthShellProps) {
  return (
    <main
      className={cn(
        "grid min-h-screen bg-background text-foreground lg:grid-cols-[minmax(30rem,0.95fr)_minmax(30rem,1.05fr)]",
        className,
      )}
    >
      <section className="bg-primary text-primary-foreground relative hidden min-h-screen overflow-hidden px-10 py-9 lg:flex lg:flex-col xl:px-16 xl:py-12">
        <div
          className="border-primary-foreground/10 pointer-events-none absolute -right-44 -bottom-44 size-[34rem] rounded-full border"
          aria-hidden="true"
        />
        <div
          className="border-primary-foreground/10 pointer-events-none absolute -right-32 -bottom-32 size-[27rem] rounded-full border"
          aria-hidden="true"
        />
        <div
          className="border-primary-foreground/10 pointer-events-none absolute -right-20 -bottom-20 size-[20rem] rounded-full border"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-3">
          <span className="bg-primary-foreground text-primary grid size-10 place-items-center rounded-xl">
            <Trophy className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Competition Manager</span>
        </div>

        <div className="relative my-auto max-w-xl py-12">
          <p className="text-primary-foreground/70 mb-4 font-mono text-xs font-semibold tracking-[0.2em] uppercase">
            {eyebrow}
          </p>
          <h1 className="max-w-lg text-4xl leading-[1.04] font-semibold tracking-[-0.04em] text-balance xl:text-5xl">
            {title}
          </h1>
          <p className="text-primary-foreground/75 mt-5 max-w-lg text-base leading-7">
            {description}
          </p>

          <div className="bg-primary-foreground/5 ring-primary-foreground/15 mt-9 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
            <div className="border-primary-foreground/10 flex items-center justify-between border-b px-5 py-4">
              <span className="text-primary-foreground/70 font-mono text-[0.7rem] tracking-[0.18em] uppercase">
                Event flow
              </span>
              <span className="text-primary-foreground/70 flex items-center gap-2 text-xs font-medium">
                <span className="bg-accent size-2 rounded-full" aria-hidden="true" />
                Live plan
              </span>
            </div>
            <ol className="divide-primary-foreground/10 divide-y">
              <li className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-5 py-4">
                <span className="text-primary-foreground/70 font-mono text-xs">01</span>
                <span className="font-medium">Registration</span>
                <span className="bg-accent text-accent-foreground rounded-full px-2.5 py-1 font-mono text-[0.65rem] font-semibold tracking-wide uppercase">
                  Open
                </span>
              </li>
              <li className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-5 py-4">
                <span className="text-primary-foreground/70 font-mono text-xs">02</span>
                <span className="font-medium">Competition</span>
                <span className="text-primary-foreground/55 font-mono text-xs">Ready</span>
              </li>
              <li className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-5 py-4">
                <span className="text-primary-foreground/70 font-mono text-xs">03</span>
                <span className="font-medium">Results</span>
                <span className="text-primary-foreground/55 font-mono text-xs">Next</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-lg">
              <Trophy className="size-4" aria-hidden="true" />
            </span>
            <span className="font-semibold tracking-tight">Competition Manager</span>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

export { AuthShell, type AuthShellProps };
