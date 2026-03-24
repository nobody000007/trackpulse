import { LoginForm } from "@/frontend/components/auth/login-form";
import { TrendingUp, BarChart3, Users, Brain, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-violet-700 p-12 flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">TrackPulse</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Track what matters.<br />Act before it&apos;s too late.
          </h2>
          <p className="text-indigo-200 text-lg mb-10">
            AI-powered employee progress tracking with real engagement insights.
          </p>
          <div className="space-y-4">
            {[
              { icon: Brain, text: "Generate training plans with AI in seconds" },
              { icon: BarChart3, text: "See real read time and scroll depth per employee" },
              { icon: Users, text: "No login required for employees — just a link" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-indigo-100 text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-indigo-300 text-xs">© {new Date().getFullYear()} TrackPulse</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">TrackPulse</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 mt-2">Sign in to your manager account</p>
          </div>
          <LoginForm />
          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-600 font-medium hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
