import React from "react";
import { Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoTextProps {
  className?: string;
  iconSize?: string;
  textSize?: string;
  subtextSize?: string;
  showSubtitle?: boolean;
}

export const LogoText: React.FC<LogoTextProps> = ({
  className,
  iconSize = "w-9 h-9",
  textSize = "text-lg",
  subtextSize = "text-[9px]",
  showSubtitle = true,
}) => {
  return (
    <div className={cn("flex items-center space-x-2.5 select-none", className)}>
      <div
        className={cn(
          "rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0",
          iconSize
        )}
      >
        <Boxes className="w-5 h-5" />
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent",
            textSize
          )}
        >
          Smart Inventory
        </span>
        {showSubtitle && (
          <span
            className={cn(
              "uppercase tracking-widest text-muted-foreground font-mono font-bold mt-1",
              subtextSize
            )}
          >
            ERP Platform
          </span>
        )}
      </div>
    </div>
  );
};
