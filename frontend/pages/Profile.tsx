import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { UserCircle, Mail, Lock, CheckCircle2, AlertTriangle } from "lucide-react";

export const Profile: React.FC = () => {
  const { currentUser, updateCurrentUser } = useAppContext();

  const [form, setForm] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    password: "",
    confirm: ""
  });
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (currentUser) {
      setForm((prev) => ({ ...prev, name: currentUser.name, email: currentUser.email }));
    }
  }, [currentUser]);

  if (!currentUser) {
    return null;
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setStatus("error");
      setFeedback("Name and email are required.");
      return;
    }
    if (form.password && form.password !== form.confirm) {
      setStatus("error");
      setFeedback("Passwords do not match.");
      return;
    }

    setStatus("saving");
    setFeedback("");
    try {
      await updateCurrentUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password ? form.password : undefined
      });
      setStatus("success");
      setFeedback("Profile updated successfully.");
      setForm((prev) => ({ ...prev, password: "", confirm: "" }));
    } catch (error: any) {
      setStatus("error");
      setFeedback(error?.message ?? "Unable to update profile. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-500 p-6 text-white shadow-xl lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 shadow-inner">
            <UserCircle size={40} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/70">Profile</p>
            <h2 className="mt-1 text-2xl font-semibold">{currentUser.name}</h2>
            <p className="text-sm text-white/80">{currentUser.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center text-sm text-white/80 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-white/60">Role</p>
            <p className="mt-1 text-base font-semibold">{currentUser.type}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-white/60">Joined</p>
            <p className="mt-1 text-base font-semibold">{new Date().getFullYear()}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur sm:block hidden">
            <p className="text-xs uppercase tracking-wide text-white/60">Status</p>
            <p className="mt-1 text-base font-semibold">Active</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Personal Details</h3>
              <p className="text-sm text-slate-500">Update your information and how you appear to other users.</p>
            </div>

            {status !== "idle" && feedback && (
              <div
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  status === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : status === "error"
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {status === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{feedback}</span>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-slate-600">Full Name</span>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="Jane Doe"
                  />
                  <UserCircle className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-300" />
                </div>
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-slate-600">Email</span>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="name@example.com"
                  />
                  <Mail className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-300" />
                </div>
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-slate-600">New Password</span>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="••••••••"
                  />
                  <Lock className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-300" />
                </div>
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-slate-600">Confirm Password</span>
                <div className="relative">
                  <input
                    type="password"
                    name="confirm"
                    value={form.confirm}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="Repeat password"
                  />
                  <Lock className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-300" />
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setForm({ name: currentUser.name, email: currentUser.email, password: "", confirm: "" });
                  setStatus("idle");
                  setFeedback("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Reset
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={status === "saving"}
              >
                {status === "saving" ? "Saving changes..." : "Save changes"}
              </button>
            </div>
          </form>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">Security tips</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-primary-400" />
              Use a mix of letters, numbers, and symbols for a stronger password.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-primary-400" />
              Avoid sharing your credentials and update them regularly.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-primary-400" />
              Keep your email up to date to receive important notifications.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

