import { AnimatedPageContent } from "@/components/animated-page-content";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <DashboardShell>
        <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col">
          <DashboardHeader />
          <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden">
            <AnimatedPageContent>{children}</AnimatedPageContent>
          </div>
        </SidebarInset>
      </DashboardShell>
    </SidebarProvider>
  );
}
