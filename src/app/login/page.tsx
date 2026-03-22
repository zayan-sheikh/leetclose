"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = localStorage.getItem("closearena_user");
    if (user) {
      const onboarded = localStorage.getItem("closearena_onboarded");
      router.push(onboarded ? "/dashboard" : "/onboarding");
    } else {
      localStorage.setItem(
        "closearena_user",
        JSON.stringify({ email, createdAt: Date.now() })
      );
      router.push("/onboarding");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div className="page-mesh-bg opacity-60" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="card-premium p-8 pt-9 shadow-2xl md:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 p-[2px] shadow-[0_0_24px_-4px_var(--glow-cyan)]">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0c0c0e]">
                <span className="font-display text-sm font-bold text-cyan-300">CA</span>
              </div>
            </div>
            <p className="label-overline mb-2">Welcome back</p>
            <h1 className="font-display text-2xl font-bold tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm text-muted">Continue your practice streak</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-premium"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-premium"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary-glow mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white"
            >
              Log in
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
            >
              Sign up free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
