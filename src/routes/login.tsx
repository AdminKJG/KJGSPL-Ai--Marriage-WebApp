import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Text } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { Field } from "@/components/ui";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { authApi } from "@/lib/api/modules";
import { tokenStore } from "@/lib/api/client";
import { signedIn, useAppDispatch } from "@/store";
import { PasswordEyeToggle } from "@/components/PasswordEyeToggle";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
  mfaCode: z
    .string()
    .regex(/^\d{6}$/, "Enter the 6-digit code")
    .optional()
    .or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

const forgotSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});
type ForgotValues = z.infer<typeof forgotSchema>;

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => (typeof s.redirect === "string" ? { redirect: s.redirect } : {}),
  head: () => ({
    meta: [
      { title: "Sign in — AI Marriage" },
      { name: "description", content: "Sign in to your AI Marriage member account." },
      { property: "og:title", content: "Sign in — AI Marriage" },
      { property: "og:description", content: "Sign in to your AI Marriage member account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const dispatch = useAppDispatch();
  const { showError, showSuccess } = useToast();
  const [needsMfa, setNeedsMfa] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Inline view swap (Shakuro-style): slide between sign-in and forgot
  // without leaving the card, like the reference GIF.
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const forgotForm = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

  const login = useMutation({
    mutationFn: async (v: FormValues) => {
      const res = await authApi.login({ email: v.email, password: v.password, mfaCode: v.mfaCode || undefined });
      if (res.user.role !== "member") throw new Error("This portal is for members. Please use the admin portal.");
      return res;
    },
    onSuccess: (res) => {
      tokenStore.set(res.accessToken, res.refreshToken);
      dispatch(signedIn(res.user));
      showSuccess(`Welcome back, ${res.user.name || "Member"}!`, "Sign In Successful");
      const target =
        redirect && redirect.startsWith("/")
          ? redirect
          : (res.user as any).onboardingComplete === false
          ? "/onboarding"
          : "/discover";
      navigate({ to: target, replace: true });
    },
    onError: (err: Error) => {
      if (/mfa|totp|code/i.test(err.message)) setNeedsMfa(true);
      showError(err.message || "Invalid credentials or sign-in error", "Sign In Failed");
    },
  });

  const forgot = useMutation({
    mutationFn: (v: ForgotValues) => authApi.forgotPassword(v.email),
    onSuccess: () => {
      showSuccess("If an account exists for that email, a password reset link has been sent.", "Reset Email Sent");
    },
    onError: (err: Error) => {
      showError(err.message || "Unable to process password reset. Please try again.", "Reset Failed");
    },
  });

  const onInvalidLogin = (errors: Record<string, any>) => {
    const firstKey = Object.keys(errors)[0];
    if (firstKey && errors[firstKey]?.message) {
      showError(errors[firstKey].message, "Invalid Input");
    } else {
      showError("Please check your email and password.", "Login Error");
    }
  };

  const onInvalidForgot = (errors: Record<string, any>) => {
    if (errors.email?.message) {
      showError(errors.email.message, "Invalid Email");
    }
  };


  return (
    <AuthLayout
      variant="login"
      eyebrow={mode === "forgot" ? "Reset access" : undefined}
      title={mode === "forgot" ? "Reset your password." : "Find Your Perfect Match."}
      subtitle={
        mode === "forgot"
          ? "Enter your email and we'll send a secure reset link your way."
          : "Your AI matches, active conversations, and shortlisted profiles are waiting for you."
      }
    >
      <div className="auth-viewport">
        <div className={`auth-track${mode === "forgot" ? " auth-track--forgot" : ""}`}>
          {/* View 1 — sign in */}
          <div className="auth-view" aria-hidden={mode !== "signin"}>
            <form className="stack-4" onSubmit={handleSubmit((v) => login.mutate(v), onInvalidLogin)} noValidate>
              <Field
                id="email"
                label="Email Address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                }
                {...register("email")}
                error={formState.errors.email?.message}
              />
              <div>
                <Field
                  id="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  }
                  {...register("password")}
                  error={formState.errors.password?.message}
                  action={
                    <PasswordEyeToggle
                      show={showPassword}
                      onToggle={() => setShowPassword((s) => !s)}
                    />
                  }
                />
                <div className="auth-links" style={{ marginTop: "0.5rem", justifyContent: "flex-end" }}>
                  <button type="button" className="auth-link" onClick={() => { forgot.reset(); setMode("forgot"); }}>
                    Forgot password?
                  </button>
                </div>
              </div>
              {needsMfa && (
                <Field
                  id="mfaCode"
                  label="Authenticator code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  }
                  {...register("mfaCode")}
                  error={formState.errors.mfaCode?.message}
                />
              )}
              {login.error && (
                <p className="ds-field__hint ds-field__hint--error" role="alert">
                  {login.error.message}
                </p>
              )}
              <Button
                type="submit"
                loading={login.isPending}
                size="lg"
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "9999px",
                  background: "linear-gradient(135deg, #ea580c 0%, #be123c 100%)",
                  border: "none",
                  boxShadow: "0 4px 14px rgba(234, 88, 12, 0.35)",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                Sign in to your account
              </Button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  paddingTop: "0.5rem",
                  borderTop: "1px solid var(--border, #f1f5f9)",
                  marginTop: "0.5rem",
                }}
              >
                <Text variant="small" style={{ color: "var(--muted, #64748b)" }}>
                  Don&apos;t have an account yet?
                </Text>
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => navigate({ to: "/register" })}
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "var(--rose-active, #ea580c)",
                  }}
                >
                  Create an account
                </button>
              </div>
            </form>
          </div>

          {/* View 2 — forgot (slides in from the right, like the GIF) */}
          <div className="auth-view" aria-hidden={mode !== "forgot"}>
            {forgot.isSuccess ? (
              <div className="stack-4" role="status">
                <Text>
                  {forgot.data?.message ??
                    "If an account exists for that email, a reset link is on its way. Check your inbox and spam folder."}
                </Text>
                <Button size="lg" style={{ width: "100%" }} onClick={() => setMode("signin")}>
                  Back to sign in
                </Button>
                <Text variant="small" style={{ textAlign: "center" }}>
                  Have a reset token?{" "}
                  <button type="button" className="auth-link" onClick={() => navigate({ to: "/forgot-password" })}>
                    Set a new password
                  </button>
                </Text>
              </div>
            ) : (
              <form className="stack-4" onSubmit={forgotForm.handleSubmit((v) => forgot.mutate(v), onInvalidForgot)} noValidate>
                <button type="button" className="auth-back" onClick={() => setMode("signin")}>
                  ← Back to sign in
                </button>
                <Field
                  id="forgot-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...forgotForm.register("email")}
                  error={forgotForm.formState.errors.email?.message}
                />
                {forgot.error && (
                  <p className="ds-field__hint ds-field__hint--error" role="alert">
                    {forgot.error.message}
                  </p>
                )}
                <Button type="submit" loading={forgot.isPending} size="lg" style={{ width: "100%" }}>
                  Send reset link
                </Button>
                <Text variant="small" style={{ textAlign: "center" }}>
                  Remembered it?{" "}
                  <button type="button" className="auth-link" onClick={() => setMode("signin")}>
                    Sign in
                  </button>
                </Text>
              </form>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
