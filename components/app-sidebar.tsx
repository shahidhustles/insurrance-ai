import { FileUp, Home, ThumbsUp } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";

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
import { UserButton } from "@clerk/nextjs";

export function AppSidebar() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const userId = params.userId as string;

  // Check if the current path matches the menu item URL
  const isActive = (itemUrl: string) => {
    return pathname.startsWith(itemUrl);
  };

  // Menu items for the sidebar
  const items = [
    {
      title: "My Policies",
      url: `/dashboard/${userId}`,
      icon: Home,
    },
    {
      title: "Recommendations",
      url: `/home/${userId}`,
      icon: ThumbsUp,
    },
    {
      title: "Upload",
      url: `/upload/${userId}`,
      icon: FileUp,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader onClick={() => router.push("/")}>
        <h2 className="text-xl font-semibold px-4 cursor-pointer">Insurance AI</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => router.push(item.url)}
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
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
