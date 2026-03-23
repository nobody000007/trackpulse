"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, TrendingUp, Settings, ChevronRight, BarChart2, Inbox } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plans", label: "Plans", icon: BookOpen },
  { href: "/employees", label: "Employees", icon: Users },
];

const insightItems = [
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/inbox", label: "Inbox", icon: Inbox },
];

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
        active
          ? "bg-indigo-500/15 text-white"
          : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-400"}`} />
      <span className="flex-1">{label}</span>
      {active && <ChevronRight className="w-3 h-3 text-indigo-400/60" />}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-[#0c0e14] flex flex-col h-screen shrink-0 border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/40 shrink-0">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-white tracking-tight">TrackPulse</span>
          <p className="text-[10px] text-slate-500 leading-none mt-0.5">Training Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.1em] px-3 mb-2">Menu</p>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={active} />;
          })}
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.1em] px-3 mb-2">Insights</p>
          {insightItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={active} />;
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-3">
        <NavLink
          href="/settings"
          label="Settings"
          icon={Settings}
          active={pathname.startsWith("/settings")}
        />
      </div>
    </aside>
  );
}
