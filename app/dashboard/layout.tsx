"use client";

import { SharedSidebarLayout } from "@/components/shared-sidebar-layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SharedSidebarLayout>{children}</SharedSidebarLayout>;
}
