import { Sidebar } from "@/components/sidebar";
import { AdminGuard } from "@/components/admin-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pt-16 lg:ml-64 lg:pt-0">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}

