"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">CA</span>
          </div>
          <span className="font-bold text-lg">
            CloserArena <span className="text-muted font-medium text-sm">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/pricing")}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Pricing
          </button>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="text-sm px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
          >
            Start free 3-day trial
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-xs text-accent mb-6">
          Like Duolingo for sales calls
        </div>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Practice sales calls until
          <br />
          <span className="text-accent">closing feels automatic</span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto mb-10">
          Train against a live AI prospect, handle real objections, and get
          better at closing high-ticket fitness coaching clients.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="px-8 py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium text-lg transition-colors"
          >
            Start free 3-day trial
          </button>
          <button
            type="button"
            onClick={() => router.push("/call")}
            className="px-8 py-4 bg-card border border-border hover:bg-card-hover text-foreground rounded-xl font-medium text-lg transition-colors"
          >
            Try a demo call
          </button>
        </div>
      </section>

      {/* Call preview mockup */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-[#111] rounded-2xl border border-border overflow-hidden shadow-2xl">
          {/* Fake title bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-border">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-danger/60" />
              <div className="w-3 h-3 rounded-full bg-warning/60" />
              <div className="w-3 h-3 rounded-full bg-success/60" />
            </div>
            <span className="text-xs text-muted">CloserArena AI — Practice Call</span>
            <div className="w-12" />
          </div>
          {/* Mockup content */}
          <div className="p-8 flex items-center justify-center min-h-[300px]">
            <div className="text-center space-y-4">
              {/* Simple avatar preview */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#e8c4a0] to-[#d4a574] mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#3a2a1a] to-[#4a3a2a] rounded-t-full" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                  <div className="w-2.5 h-3 bg-white rounded-full" />
                  <div className="w-2.5 h-3 bg-white rounded-full" />
                </div>
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#c47070] rounded-full" />
              </div>
              <p className="text-sm text-muted">Sarah Mitchell — AI Prospect</p>
              <p className="text-foreground/60 text-sm max-w-sm">
                &quot;Hey! Yeah, I can hear you fine. So, tell me a bit about what you
                do...&quot;
              </p>
              {/* Audio wave visualization */}
              <div className="flex gap-1 justify-center items-center h-8">
                {[3, 5, 7, 4, 6, 8, 5, 3, 6, 4, 7, 5, 3].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-accent/40 rounded-full animate-pulse"
                    style={{
                      height: `${h * 3}px`,
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-12">
          Get reps where it matters most
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Live AI Prospect",
              desc: "Talk to a realistic AI that acts like a real lead on a Zoom call. It pushes back, hesitates, and responds to how well you sell.",
              icon: "🎯",
            },
            {
              title: "Real Objections",
              desc: "\"Too expensive,\" \"I need to think about it,\" \"Let me ask my spouse\" — handle the objections that kill deals.",
              icon: "🛡️",
            },
            {
              title: "Instant Feedback",
              desc: "After each call, see exactly where you lost the prospect and what you could have said differently.",
              icon: "📊",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-card border border-border rounded-2xl p-6 hover:border-muted transition-colors"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Objections section */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-4">
          Practice the objections that kill your deals
        </h2>
        <p className="text-muted text-center mb-10 max-w-xl mx-auto">
          Every fitness coach hears the same objections. Stop losing deals and
          start closing them.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            "Too expensive",
            "Need to think about it",
            "Ask my spouse",
            "Don't have time",
            "Tried it before",
            "Send me more info",
            "Want to wait",
            "Not sure it'll work",
          ].map((obj) => (
            <div
              key={obj}
              className="bg-card border border-border rounded-xl p-4 text-center text-sm text-foreground/80 hover:border-accent/50 transition-colors"
            >
              &quot;{obj}&quot;
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
        <div className="bg-gradient-to-b from-accent/10 to-transparent border border-accent/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">
            Stop losing deals you should be closing
          </h2>
          <p className="text-muted mb-8 max-w-lg mx-auto">
            Most coaches lose 50%+ of their sales calls to objections they
            could handle. Start practicing today.
          </p>
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="px-8 py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium text-lg transition-colors"
          >
            Start free 3-day trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-xs">CA</span>
            </div>
            <span className="text-sm text-muted">CloserArena AI</span>
          </div>
          <p className="text-xs text-muted">
            Practice sales calls until closing feels automatic.
          </p>
        </div>
      </footer>
    </div>
  );
}
