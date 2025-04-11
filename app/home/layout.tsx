"use client";

import { SharedSidebarLayout } from "@/components/shared-sidebar-layout";

export default function RecommendationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SharedSidebarLayout>{children}</SharedSidebarLayout>;
}
