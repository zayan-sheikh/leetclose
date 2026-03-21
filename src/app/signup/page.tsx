"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // MVP: Simple localStorage auth
    localStorage.setItem(
      "closearena_user",
      JSON.stringify({ name, email, createdAt: Date.now() })
    );
    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold">CA</span>
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-muted mt-1">
            3-day free trial · Start practicing sales calls today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1.5">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent"
              placeholder="John Smith"
              required
            />
          </div>
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
              placeholder="Create a password"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
          >
            Create account
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-accent hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
