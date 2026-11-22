import { AdminShell } from "@/components/sidebar";
import { AdminGuard } from "@/components/admin-guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard><AdminShell>{children}</AdminShell></AdminGuard>;
}
