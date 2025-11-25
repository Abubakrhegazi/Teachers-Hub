import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { UserType } from "../types";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login, loading } = useAppContext();

  const quickLogins = useMemo(
    () => [
      { email: "admin@example.com", password: "password123", label: "Admin", role: UserType.Admin },
      { email: "alice.teacher@example.com", password: "password123", label: "Teacher", role: UserType.Teacher },
      { email: "bob.student@example.com", password: "password123", label: "Student", role: UserType.Student }
    ],
    []
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const ok = await login(email, password);
      if (!ok) {
        setError("Invalid email or password. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (emailValue: string, passwordValue: string) => {
    setEmail(emailValue);
    setPassword(passwordValue);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 flex flex-col items-center justify-center px-6 py-10">
    <div className="w-full max-w-5xl space-y-8">
      <header className="flex flex-col gap-2 text-white/85 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary-200/80">Teacher's hub</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight">Welcome back</h1>
          <p className="text-sm text-white/60">Sign in to manage classes, assignments, and performance insights across your network.</p>
        </div>
        <Link
          to="/signup"
          className="inline-flex items-center justify-center rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Need an account? Register
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <Card className="relative overflow-hidden border-none bg-white text-slate-900 shadow-xl">
          <div className="absolute -top-20 -right-24 h-60 w-60 rounded-full bg-primary-100/60 blur-3xl" aria-hidden />
          <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-indigo-100/60 blur-3xl" aria-hidden />
          <div className="relative space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">Teacher's hub</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Sign in to your workspace</h1>
              <p className="mt-2 text-sm text-slate-600">
                Access personalised dashboards, assignments, and performance insights designed for IGCSE success.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-900/20 transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                {submitting ? "Signing you in..." : "Login"}
              </button>

              {(loading || submitting) && (
                <p className="text-center text-xs text-slate-500">Authenticating with the server...</p>
              )}
              <p className="text-center text-xs text-slate-500">
                First time here? <Link to="/signup" className="font-semibold text-primary-500 hover:text-primary-400">Create an account</Link>
              </p>
            </form>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border-none bg-white/90 text-slate-800 shadow-xl">
            <h3 className="text-lg font-semibold">Quick access (demo)</h3>
            <p className="mt-1 text-xs text-slate-500">
              Use these demo accounts to explore the platform. All passwords are <span className="font-semibold text-slate-600">password123</span>.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {quickLogins.map((user) => (
                <button
                  key={user.email}
                  onClick={() => handleQuickLogin(user.email, user.password)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-primary-400 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  <p className="font-semibold text-slate-900">{user.label}</p>
                  <p className="text-xs uppercase tracking-wide text-primary-600">{user.role}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="border-none bg-white/80 text-slate-700 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Why educators love Teacher's Hub</h3>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary-400" />
                Real-time dashboards that highlight learner progress and areas needing intervention.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                Audio and text feedback tools that keep communication personal and effective.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                Parent and student views so everyone stays aligned on learning goals.
              </li>
            </ul>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
};
