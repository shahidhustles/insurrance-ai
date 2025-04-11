"use client";

import { Loader2 } from "lucide-react";
import { useNavigation } from "@/lib/navigation-context";
import { cn } from "@/lib/utils";

export function PageLoading() {
  const { navigating } = useNavigation();

  if (!navigating) return null;

  return (
    <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-sidebar p-4 rounded-lg shadow-lg flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sidebar-foreground font-medium">Loading...</span>
      </div>
    </div>
  );
}

export function PageTransitionLoader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { navigating } = useNavigation();

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 h-1 bg-primary/20 overflow-hidden z-50",
        navigating
          ? "opacity-100"
          : "opacity-0 transition-opacity duration-500",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full bg-primary",
          navigating ? "animate-progress-indeterminate" : ""
        )}
      />
    </div>
  );
}
