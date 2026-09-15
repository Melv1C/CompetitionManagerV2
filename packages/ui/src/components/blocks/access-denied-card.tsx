import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/utils";

type AccessDeniedCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

function AccessDeniedCard({
  eyebrow,
  title,
  description,
  children,
  className,
}: AccessDeniedCardProps) {
  return (
    <Card
      className={cn(
        "w-full max-w-md border-0 bg-card shadow-brand ring-1 ring-primary/10",
        className,
      )}
    >
      <CardHeader className="px-6 pt-3 sm:px-8">
        <div className="bg-accent text-accent-foreground mb-3 grid size-11 place-items-center rounded-xl">
          <ShieldAlert className="size-5" aria-hidden="true" />
        </div>
        <p className="font-data text-primary/70 text-xs font-semibold tracking-[0.18em] uppercase">
          {eyebrow}
        </p>
        <CardTitle className="pt-1 text-2xl font-semibold tracking-[-0.025em]">{title}</CardTitle>
        <CardDescription className="leading-6">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-6 pb-3 sm:flex-row sm:px-8">
        {children}
      </CardContent>
    </Card>
  );
}

export { AccessDeniedCard, type AccessDeniedCardProps };
