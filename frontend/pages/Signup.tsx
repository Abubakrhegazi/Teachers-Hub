import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { useAppContext } from "../context/AppContext";
import { UserType } from "../types";
import { apiPost } from "../api";

const userTypeOptions = [
  { value: UserType.Teacher, label: "Teacher" },
  { value: UserType.Student, label: "Student" },
  { value: UserType.Parent, label: "Parent" }
];

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  type: UserType;
  parentStudentEmail: string;
};

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAppContext();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    type: UserType.Teacher,
    parentStudentEmail: ""
  });
  const [requestError, setRequestError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const canSubmitForm = useMemo(() => {
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) return false;
    if (form.password !== form.confirmPassword) return false;
    if (form.type === UserType.Parent && !form.parentStudentEmail.trim()) return false;
    return true;
  }, [form]);

  const submitRegistrationRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmitForm) return;
    setSubmitting(true);
    setRequestError(null);
    try {
      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        type: form.type
      };
      if (form.type === UserType.Parent) {
        payload.studentEmail = form.parentStudentEmail.trim();
      }
      const response = await apiPost<{ tokenId: string; expiresAt: string; devOtp?: string }>("/auth/register/request", payload);
      setTokenId(response.tokenId);
      setDevOtp(response.devOtp ?? null);
      setStep("verify");
    } catch (error: any) {
      setRequestError(error.message ?? "Unable to start registration");
    } finally {
      setSubmitting(false);
    }
  };

  const submitOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tokenId || otp.length < 4) return;
    setVerifyError(null);
    setVerifying(true);
    try {
      await apiPost("/auth/register/verify", { tokenId, otp });
      const loggedIn = await login(form.email, form.password);
      if (loggedIn) {
        navigate("/");
      }
    } catch (error: any) {
      setVerifyError(error.message ?? "Failed to verify OTP");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 px-6 py-10 text-white/90">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary-200/80">Teacher's Hub</p>
            <h1 className="text-3xl font-semibold leading-tight">Create your account</h1>
            <p className="text-sm text-white/60">Unified onboarding for teachers, students, and parents across your network.</p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Already have an account? Log in
          </Link>
        </header>

        {step === "form" && (
          <Card className="border-none bg-white text-slate-800 shadow-xl">
            <form onSubmit={submitRegistrationRequest} className="space-y-6">
              {requestError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                  {requestError}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Full name
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="Jane Doe"
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Email address
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleFormChange}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="you@example.com"
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Phone number (optional)
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="+1 555 123 4567"
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Account type
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    {userTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              {form.type === UserType.Parent && (
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Student's email address
                  <input
                    name="parentStudentEmail"
                    type="email"
                    value={form.parentStudentEmail}
                    onChange={handleFormChange}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="student@example.com"
                  />
                </label>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Password
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleFormChange}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="Create a strong password"
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Confirm password
                  <input
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleFormChange}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || !canSubmitForm}
                className="w-full rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-900/20 transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:bg-primary-400/70"
              >
                {submitting ? "Sending OTP..." : "Continue"}
              </button>
            </form>
          </Card>
        )}

        {step === "verify" && (
          <Card className="border-none bg-white text-slate-800 shadow-xl">
            <form onSubmit={submitOtp} className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Verify your email</h2>
                <p className="mt-2 text-sm text-slate-600">
                  We sent a one-time password to <span className="font-semibold">{form.email}</span>. Enter it below to activate your account.
                </p>
                {devOtp && (
                  <p className="mt-2 text-xs font-semibold text-emerald-500">Development OTP: {devOtp}</p>
                )}
              </div>

              {verifyError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                  {verifyError}
                </div>
              )}

              <label className="space-y-1 text-sm font-medium text-slate-700">
                One-time password
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-lg tracking-[0.5em] text-center shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="000000"
                />
              </label>

              <button
                type="submit"
                disabled={verifying || otp.length < 4}
                className="w-full rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-900/20 transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:bg-primary-400/70"
              >
                {verifying ? "Verifying..." : "Verify and enter"}
              </button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};
