"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      "closearena_user",
      JSON.stringify({ name, email, createdAt: Date.now() }),
    );
    router.push("/onboarding");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div className="page-mesh-bg opacity-60" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="card-premium p-8 pt-9 shadow-2xl md:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex items-center justify-center">
              <Image
                src="/iconwhite.svg"
                alt="LeetClose"
                width={44}
                height={44}
                className="h-11 w-11"
              />
            </div>
            <p className="label-overline mb-2">Create account</p>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Start your trial
            </h1>
            <p className="mt-2 text-sm text-muted">
              3-day free trial · Premium AI practice environment
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-premium"
                placeholder="Jordan Lee"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
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
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-premium"
                placeholder="Min. 6 characters"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              className="btn-primary-glow mt-2 w-full rounded-xl py-3 text-sm font-semibold"
            >
              Create account
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="font-medium text-accent hover:text-accent-hover hover:underline"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
