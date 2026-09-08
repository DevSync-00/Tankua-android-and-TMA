import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_30rem)] bg-background">
      <Sidebar />
      <main className="min-w-0 lg:ml-64">
        {children}
      </main>
    </div>
  );
}

