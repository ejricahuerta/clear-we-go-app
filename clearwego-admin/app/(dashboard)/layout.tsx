import { AnimatedPageContent } from "@/components/animated-page-content";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <div className="flex min-h-0 flex-1 flex-col overflow-auto overflow-x-hidden">
          <AnimatedPageContent>{children}</AnimatedPageContent>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
