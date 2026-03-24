import { RegisterForm } from "@/frontend/components/auth/register-form";
import { TrendingUp, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
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
            Get started in<br />under 5 minutes.
          </h2>
          <p className="text-indigo-200 text-lg mb-10">
            Create your account, build a plan with AI, and assign it to your first employee today.
          </p>
          <div className="space-y-3">
            {[
              "Free to use — no credit card needed",
              "AI-generated plans from any job description",
              "Real-time engagement tracking per employee",
              "Smart nudge emails for employees falling behind",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-indigo-300 shrink-0" />
                <p className="text-indigo-100 text-sm">{item}</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
            <p className="text-gray-500 mt-2">Start tracking your team&apos;s progress today</p>
          </div>
          <RegisterForm />
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
