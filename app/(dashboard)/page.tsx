import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { RingkasanDashboard } from "./ringkasan-dashboard";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan dan lanjutkan pekerjaan terakhir."
      >
        <Link
          href="/posting/baru"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Buat posting baru
        </Link>
      </PageHeader>

      <RingkasanDashboard />
    </div>
  );
}
