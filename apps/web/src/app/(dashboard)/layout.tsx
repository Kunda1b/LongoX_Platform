import { DashboardLayout } from "@/components/dashboard-layout";
import AuthGuard from "@/features/auth/auth-guard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
