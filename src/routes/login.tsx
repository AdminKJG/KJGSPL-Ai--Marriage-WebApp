import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Text } from "@/components/ui";
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
      navigate({ to: redirect && redirect.startsWith("/") ? redirect : "/discover", replace: true });
    },
    onError: (err) => {
      if (/mfa|totp|code/i.test(err.message)) setNeedsMfa(true);
    },
  });

  const forgot = useMutation({ mutationFn: (v: ForgotValues) => authApi.forgotPassword(v.email) });

  return (
    <AuthLayout
      variant="login"
      eyebrow={mode === "forgot" ? "Reset access" : "Welcome back"}
      title={mode === "forgot" ? "Reset your password." : "Sign in to continue your story."}
      subtitle={
        mode === "forgot"
          ? "Enter your email and we'll slide a secure reset link your way."
          : "Your matches, messages and story picks are waiting where you left them."
      }
    >
      <div className="auth-viewport">
        <div className={`auth-track${mode === "forgot" ? " auth-track--forgot" : ""}`}>
          {/* View 1 — sign in */}
          <div className="auth-view" aria-hidden={mode !== "signin"}>
            <form className="stack-4" onSubmit={handleSubmit((v) => login.mutate(v))} noValidate>
              <Field id="email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} error={formState.errors.email?.message} />
              <div>
                <Field
                  id="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
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
                <Field id="mfaCode" label="Authenticator code" inputMode="numeric" maxLength={6} placeholder="6-digit code" {...register("mfaCode")} error={formState.errors.mfaCode?.message} />
              )}
              {login.error && (
                <p className="ds-field__hint ds-field__hint--error" role="alert">
                  {login.error.message}
                </p>
              )}
              <Button type="submit" loading={login.isPending} size="lg" style={{ width: "100%" }}>
                Sign in
              </Button>
              <Text variant="small" style={{ textAlign: "center" }}>
                New here?{" "}
                <button type="button" className="auth-link" onClick={() => navigate({ to: "/register" })}>
                  Create an account
                </button>
              </Text>
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
              <form className="stack-4" onSubmit={forgotForm.handleSubmit((v) => forgot.mutate(v))} noValidate>
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
