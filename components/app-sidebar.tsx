import { FileUp, Home, Loader2, ThumbsUp } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UserButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigation } from "@/lib/navigation-context";

export function AppSidebar() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { navigating, navigatingTo, startNavigation } = useNavigation();
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  let userId = params.userId as string;

  // Check if the current path matches the menu item URL
  const isActive = (itemUrl: string) => {
    return pathname.startsWith(itemUrl);
  };

  // Track path changes to detect when navigation completes
  useEffect(() => {
    if (previousPath !== pathname) {
      setPreviousPath(pathname);
    }
  }, [pathname, previousPath]);

  const { user } = useUser();
  if (!userId) {
    userId = user?.id || "";
  }
  const role = useQuery(api.users.getUserRole, {
    userId,
  });

  // Menu items for the sidebar
  const items = [
    {
      title: "My Policies",
      url: `/dashboard/${role}/${userId}`,
      icon: Home,
    },
    {
      title: "Recommendations",
      url: `/home/${userId}`,
      icon: ThumbsUp,
    },
    {
      title: "Upload",
      url: `/upload/${role}/${userId}`,
      icon: FileUp,
    },
  ];

  // Handle navigation with loading state
  const handleNavigation = (url: string) => {
    startNavigation(url);
    router.push(url);
  };

  return (
    <Sidebar>
      <SidebarHeader onClick={() => handleNavigation("/")}>
        <h2 className="text-xl font-semibold px-4 cursor-pointer">
          Insurance AI
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url)}
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    disabled={navigating}
                    className={navigatingTo === item.url ? "relative" : ""}
                  >
                    {navigatingTo === item.url ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" />
                    ) : (
                      <item.icon className="h-4 w-4 mr-2" />
                    )}
                    {item.title}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-sidebar-border pt-2">
        <div className="flex items-center px-4 py-2">
          <UserButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
