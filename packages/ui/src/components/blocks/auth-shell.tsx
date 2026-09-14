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
        "grid min-h-screen bg-[#edf3f7] text-[#122335] lg:grid-cols-[minmax(0,1.1fr)_minmax(28rem,0.9fr)]",
        className,
      )}
    >
      <section className="relative hidden min-h-screen overflow-hidden bg-[#123654] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.14) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        <div className="relative flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#f5a36c] text-[#123654]">
            <Trophy className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Competition Manager</span>
        </div>

        <div className="relative max-w-2xl py-16">
          <p className="mb-5 font-mono text-xs font-semibold tracking-[0.22em] text-[#9dd8ee] uppercase">
            {eyebrow}
          </p>
          <h1 className="max-w-xl text-5xl leading-[1.02] font-semibold tracking-[-0.045em] text-balance xl:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#d4e3ec]">{description}</p>
        </div>

        <div className="relative max-w-xl border-t border-white/20 pt-5">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 font-mono text-xs tracking-[0.12em] uppercase">
            <span className="text-[#9dd8ee]">Next heat</span>
            <span className="h-px bg-white/20" aria-hidden="true" />
            <span className="rounded-full bg-[#f5a36c] px-3 py-1.5 font-bold text-[#123654]">
              Ready
            </span>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-9 place-items-center rounded-lg bg-[#123654] text-white">
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
