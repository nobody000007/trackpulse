"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, TrendingUp, Settings, ChevronRight } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plans", label: "Plans", icon: BookOpen },
  { href: "/employees", label: "Employees", icon: Users },
];

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
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.1em] px-3 mb-3">Menu</p>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? "bg-indigo-500/15 text-white"
                  : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"
              }`}
            >
              {active && (
                <span className="absolute left-3 w-0.5 h-5 bg-indigo-400 rounded-full" />
              )}
              <item.icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-400"}`} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-indigo-400/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-white/[0.06] pt-3">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
            pathname.startsWith("/settings")
              ? "bg-indigo-500/15 text-white"
              : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"
          }`}
        >
          <Settings className="w-4 h-4 shrink-0 text-slate-600 group-hover:text-slate-400" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
