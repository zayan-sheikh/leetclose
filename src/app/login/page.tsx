"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // MVP: Simple localStorage auth
    const user = localStorage.getItem("closearena_user");
    if (user) {
      const onboarded = localStorage.getItem("closearena_onboarded");
      router.push(onboarded ? "/dashboard" : "/onboarding");
    } else {
      // Auto-create for MVP
      localStorage.setItem(
        "closearena_user",
        JSON.stringify({ email, createdAt: Date.now() })
      );
      router.push("/onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold">CA</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted mt-1">Log in to continue practicing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent"
              placeholder="Your password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
          >
            Log in
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => router.push("/signup")}
            className="text-accent hover:underline"
          >
            Sign up free
          </button>
        </p>
      </div>
    </div>
  );
}
