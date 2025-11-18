import { Header } from "@/components/home/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Header showDashboardNav={true} />
      <main>{children}</main>
    </div>
  );
}
