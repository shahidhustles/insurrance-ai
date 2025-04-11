"use client";

import { useEffect, ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PageLoading } from "@/components/ui/page-loading";
import { useNavigation } from "@/lib/navigation-context";
import { usePathname } from "next/navigation";

interface SharedSidebarLayoutProps {
  children: ReactNode;
}

export function SharedSidebarLayout({ children }: SharedSidebarLayoutProps) {
  const { navigatingTo, endNavigation } = useNavigation();
  const pathname = usePathname();

  // Reset navigation state when page finishes loading
  useEffect(() => {
    if (navigatingTo) {
      // Small delay to ensure the page is fully loaded
      const timer = setTimeout(() => {
        endNavigation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname, navigatingTo, endNavigation]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1">
          <div className="container py-6 relative">
            <SidebarTrigger className="absolute top-6 left-6" />
            {children}
          </div>
        </main>
        <PageLoading />
      </div>
    </SidebarProvider>
  );
}
