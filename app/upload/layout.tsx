"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function UploadPage({
  children,
}: {
  children: React.ReactNode;
}) {
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
      </div>
    </SidebarProvider>
  );
}
