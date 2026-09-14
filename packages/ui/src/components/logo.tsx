import { Layers } from "lucide-react";

export const Logo = () => {
  return (
    <div className="flex items-center space-x-2">
      <Layers className="text-primary h-8 w-8" />
      <span className="text-primary text-2xl font-bold">TurboKit</span>
    </div>
  );
};
