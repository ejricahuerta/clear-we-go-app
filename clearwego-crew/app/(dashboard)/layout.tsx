import { AppBottomNav } from "@/components/app-bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">
      <main className="flex-1 pb-14">
        {children}
      </main>
      <AppBottomNav />
    </div>
  );
}
