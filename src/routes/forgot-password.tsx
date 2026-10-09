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
import { PasswordEyeToggle } from "@/components/PasswordEyeToggle";

const requestSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});
type RequestValues = z.infer<typeof requestSchema>;

const resetSchema = z
  .object({
    password: z.string().min(12, "Use at least 12 characters").max(128),
    confirm: z.string().min(1, "Repeat your new password"),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] });
type ResetValues = z.infer<typeof resetSchema>;

export const Route = createFileRoute("/forgot-password")({
  validateSearch: (s: Record<string, unknown>): { token?: string } =>
    typeof s.token === "string" ? { token: s.token } : {},
  head: () => ({
    meta: [
      { title: "Reset your password — AI Marriage" },
      { name: "description", content: "Request a secure password reset link for your AI Marriage account." },
      { property: "og:title", content: "Reset your password — AI Marriage" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const isReset = Boolean(token);
  const { showError, showSuccess } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const requestForm = useForm<RequestValues>({ resolver: zodResolver(requestSchema) });
  const resetForm = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  const request = useMutation({
    mutationFn: (v: RequestValues) => authApi.forgotPassword(v.email),
    onSuccess: () => {
      showSuccess("Password reset instructions have been sent to your email.", "Reset Email Sent");
    },
    onError: (err: Error) => {
      showError(err.message || "Failed to send reset link. Please check your email.", "Error");
    },
  });

  const reset = useMutation({
    mutationFn: (v: ResetValues) => authApi.resetPassword({ token: token!, password: v.password }),
    onSuccess: () => {
      showSuccess("Your password has been successfully updated!", "Password Updated");
    },
    onError: (err: Error) => {
      showError(err.message || "Failed to reset password. The link may have expired.", "Reset Failed");
    },
  });

  const onRequestInvalid = (errors: Record<string, any>) => {
    if (errors.email?.message) {
      showError(errors.email.message, "Invalid Email");
    }
  };

  const onResetInvalid = (errors: Record<string, any>) => {
    const firstKey = Object.keys(errors)[0];
    if (firstKey && errors[firstKey]?.message) {
      showError(errors[firstKey].message, "Password Error");
    }
  };


  return (
    <AuthLayout
      variant="forgot"
      eyebrow={isReset ? "Choose a new password" : "Forgot password"}
      title={isReset ? "Set a fresh password." : "We'll email you a reset link."}
      subtitle={
        isReset
          ? "Use at least 12 characters. You'll sign in again on all devices."
          : "Enter the email you joined with. The link expires in 60 minutes."
      }
    >
      {isReset ? (
        <form className="stack-4" onSubmit={resetForm.handleSubmit((v) => reset.mutate(v), onResetInvalid)} noValidate>
          {reset.isSuccess ? (
            <div className="stack-4" role="status">
              <Text>{reset.data?.message ?? "Password updated. Sign in with your new password."}</Text>
              <Button size="lg" style={{ width: "100%" }} onClick={() => navigate({ to: "/login" })}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <Field
                id="password"
                label="New password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 12 characters"
                {...resetForm.register("password")}
                error={resetForm.formState.errors.password?.message}
                action={
                  <PasswordEyeToggle
                    show={showPassword}
                    onToggle={() => setShowPassword((s) => !s)}
                  />
                }
              />
              <Field
                id="confirm"
                label="Confirm new password"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your new password"
                {...resetForm.register("confirm")}
                error={resetForm.formState.errors.confirm?.message}
                action={
                  <PasswordEyeToggle
                    show={showConfirm}
                    onToggle={() => setShowConfirm((s) => !s)}
                  />
                }
              />
              {reset.error && (
                <p className="ds-field__hint ds-field__hint--error" role="alert">
                  {reset.error.message}
                </p>
              )}
              <Button type="submit" loading={reset.isPending} size="lg" style={{ width: "100%" }}>
                Update password
              </Button>
              <Text variant="small" style={{ textAlign: "center" }}>
                <button type="button" className="auth-link" onClick={() => navigate({ to: "/login" })}>
                  Back to sign in
                </button>
              </Text>
            </>
          )}
        </form>
      ) : (
        <form className="stack-4" onSubmit={requestForm.handleSubmit((v) => request.mutate(v), onRequestInvalid)} noValidate>
          {request.isSuccess ? (
            <div className="stack-4" role="status">
              <Text>
                {request.data?.message ??
                  "If an account exists for that email, a reset link is on its way. Check your inbox and spam folder."}
              </Text>
              <Button size="lg" style={{ width: "100%" }} onClick={() => navigate({ to: "/login" })}>
                Back to sign in
              </Button>
              <Text variant="small" style={{ textAlign: "center" }}>
                Didn&apos;t get it?{" "}
                <button type="button" className="auth-link" onClick={() => request.reset()}>
                  Try a different email
                </button>
              </Text>
            </div>
          ) : (
            <>
              <Field
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...requestForm.register("email")}
                error={requestForm.formState.errors.email?.message}
              />
              {request.error && (
                <p className="ds-field__hint ds-field__hint--error" role="alert">
                  {request.error.message}
                </p>
              )}
              <Button type="submit" loading={request.isPending} size="lg" style={{ width: "100%" }}>
                Send reset link
              </Button>
              <div className="auth-links" style={{ justifyContent: "center" }}>
                <button type="button" className="auth-link" onClick={() => navigate({ to: "/login" })}>
                  Back to sign in
                </button>
                <span aria-hidden="true" style={{ color: "var(--muted)" }}>
                  ·
                </span>
                <button type="button" className="auth-link" onClick={() => navigate({ to: "/register" })}>
                  Create an account
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </AuthLayout>
  );
}
