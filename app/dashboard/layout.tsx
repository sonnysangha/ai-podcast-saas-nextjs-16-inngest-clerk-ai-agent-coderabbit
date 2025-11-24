import { Header } from "@/components/home/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-4 xl:pt-10">{children}</main>
    </div>
  );
}
