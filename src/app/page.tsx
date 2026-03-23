import Link from "next/link";
import { BarChart3, Brain, Mail, Shield, TrendingUp, Users, ArrowRight, CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">TrackPulse</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-28 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/30 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-violet-600/20 rounded-full blur-3xl" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-8">
          <Brain className="w-4 h-4" /> Powered by Llama 3 AI · Free to start
        </div>

        <h1 className="text-6xl sm:text-7xl font-extrabold leading-tight mb-6 max-w-4xl mx-auto">
          Training plans your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            team actually completes
          </span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          AI builds the plan. Employees follow a simple link — no login needed.
          You see every open, every scroll, every minute read. Real accountability.
        </p>

        <div className="flex items-center justify-center gap-4 mb-16">
          <Link href="/register" className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/25 text-base">
            Start building plans <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="px-8 py-4 text-slate-300 border border-white/10 hover:border-white/20 hover:text-white rounded-xl transition-colors text-base font-medium">
            Sign in
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 text-sm text-slate-400">
          {["No employee login needed", "AI-generated in seconds", "Azure-powered infrastructure"].map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {s}
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-white/10 bg-white/5 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-3xl font-bold mb-12">How it works</h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              { step: "01", title: "Describe the role", desc: "Paste a job description or a few sentences. AI generates a full multi-phase training plan in seconds." },
              { step: "02", title: "Assign to employees", desc: "Send a unique link — no app download, no password. The employee clicks and sees their plan instantly." },
              { step: "03", title: "Track real engagement", desc: "See exactly who opened what, how long they read, and who needs a nudge. AI surfaces the risks." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Everything in one place</h2>
          <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">
            Not just a checklist tool — TrackPulse tracks real engagement so you know when to act.
          </p>
          <div className="grid grid-cols-3 gap-5">
            {[
              { icon: Brain, color: "text-violet-400 bg-violet-400/10 border-violet-400/20", title: "AI Plan Generation", desc: "Turn a job description into a structured multi-phase plan with tasks, priorities, and task types." },
              { icon: TrendingUp, color: "text-blue-400 bg-blue-400/10 border-blue-400/20", title: "Engagement Tracking", desc: "Track document opens, read time per session, scroll depth, and link clicks — automatically." },
              { icon: BarChart3, color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20", title: "Risk Dashboard", desc: "Green, yellow, red risk scores per employee. See who's on track and who needs attention at a glance." },
              { icon: Mail, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", title: "Smart Nudges", desc: "AI drafts a personalised follow-up email for any employee. You review, then send with one click." },
              { icon: Users, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", title: "Zero-friction Access", desc: "Employees need only a link. No app, no account, no password. Just click and start." },
              { icon: Shield, color: "text-orange-400 bg-orange-400/10 border-orange-400/20", title: "Audit Trail", desc: "Every interaction is logged. Full event history per employee and task for compliance needs." },
            ].map((f) => (
              <div key={f.title} className="p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-white/20 transition-all">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Start tracking in minutes</h2>
          <p className="text-slate-400 text-lg mb-8">Free to start. No credit card. Built on Azure.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors text-base shadow-lg shadow-indigo-500/25"
          >
            Create your free account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} TrackPulse · Built with Next.js + Azure
      </footer>
    </div>
  );
}
