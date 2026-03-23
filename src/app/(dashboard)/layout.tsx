import { redirect } from "next/navigation";
import { auth } from "@/backend/lib/auth";
import { Sidebar } from "@/frontend/components/layout/sidebar";
import { Navbar } from "@/frontend/components/layout/navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0e14]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden rounded-l-2xl shadow-2xl" style={{ background: "radial-gradient(ellipse 80% 50% at 60% -10%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 100% 80%, rgba(139,92,246,0.08) 0%, transparent 60%), #f4f4f8" }}>
        <Navbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
