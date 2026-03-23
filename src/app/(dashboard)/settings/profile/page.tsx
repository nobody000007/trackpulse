import { auth } from "@/backend/lib/auth";
import Link from "next/link";
import { User, Bell, Shield, ArrowLeft, Briefcase, Mail, Calendar } from "lucide-react";
import { ProfileForm } from "@/frontend/components/settings/profile-form";

export default async function ProfilePage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and preferences.</p>
      </div>

      <div className="grid grid-cols-4 gap-6 items-start">
        {/* Sidebar nav */}
        <div className="col-span-1">
          <nav className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {[
                { href: "/settings", label: "Account", icon: User, active: false },
                { href: "/settings/profile", label: "Profile", icon: User, active: true },
                { href: "/settings/notifications", label: "Notifications", icon: Bell, active: false },
                { href: "/settings/security", label: "Security", icon: Shield, active: false },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      item.active
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main content */}
        <div className="col-span-3 space-y-6">
          {/* Avatar card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Public Profile</h2>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {session?.user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?"}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{session?.user?.name}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5" /> {session?.user?.email}
                </p>
                <p className="text-xs text-gray-400 mt-1">Your initials are used as your avatar throughout TrackPulse.</p>
              </div>
            </div>
          </div>

          <ProfileForm user={{ name: session?.user?.name ?? "", email: session?.user?.email ?? "" }} />
        </div>
      </div>
    </div>
  );
}
