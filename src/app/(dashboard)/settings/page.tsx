import { auth } from "@/backend/lib/auth";
import { SettingsForm } from "@/frontend/components/settings/settings-form";
import Link from "next/link";
import { User } from "lucide-react";

export default async function SettingsPage() {
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
                { href: "/settings", label: "Account", icon: User, active: true },
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
        <div className="col-span-3">
          <SettingsForm user={{ name: session?.user?.name ?? "", email: session?.user?.email ?? "" }} />
        </div>
      </div>
    </div>
  );
}
