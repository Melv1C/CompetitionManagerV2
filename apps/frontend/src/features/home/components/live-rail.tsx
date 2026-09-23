import { Button } from "@repo/ui";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LivePip() {
  return (
    <span className="relative flex size-2">
      <span className="bg-chart-5 absolute inline-flex size-full animate-ping rounded-full opacity-50 motion-reduce:animate-none" />
      <span className="bg-chart-5 relative inline-flex size-2 rounded-full" />
    </span>
  );
}

export function LiveRail() {
  const { t } = useTranslation();
  return (
    <section className="bg-primary text-primary-foreground border-y">
      <div className="mx-auto grid max-w-[1240px] md:grid-cols-[210px_1fr_auto]">
        <div className="border-primary-foreground/15 flex items-center gap-2 px-4 py-3 md:border-r lg:px-6">
          <LivePip />
          <span className="text-xs font-bold tracking-[0.16em] uppercase">
            {t("home.liveTitle")}
          </span>
        </div>
        <div className="min-w-0 overflow-hidden px-4 py-3">
          <div className="flex items-center gap-8 text-sm">
            <span>
              <b>Brussels Indoor</b> · Women 60 m final · L. Peeters{" "}
              <strong className="font-mono">7.31</strong>
            </span>
            <span className="hidden lg:inline">
              <b>Liège Throws</b> · Men shot put · T. Diallo{" "}
              <strong className="font-mono">17.42 m</strong>
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          nativeButton={false}
          className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground m-1 hidden md:flex"
          render={<Link to="/results" />}
        >
          {t("home.followLive")}
          <ArrowRight />
        </Button>
      </div>
    </section>
  );
}
