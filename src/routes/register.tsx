import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Label, Text } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { Field } from "@/components/ui";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { authApi } from "@/lib/api/modules";
import { tokenStore } from "@/lib/api/client";
import { PasswordEyeToggle } from "@/components/PasswordEyeToggle";

function ageFrom(dob: string) {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age;
}

const schema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  password: z.string().min(12, "Use at least 12 characters").max(128),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose your date of birth")
    .refine((v) => {
      const a = ageFrom(v);
      return a >= 18 && a <= 99;
    }, "You must be 18 or older"),
  adultConfirmed: z.boolean().refine((v) => v, "Please confirm you are an adult"),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your account — AI Marriage" },
      { name: "description", content: "Join AI Marriage and start your journey to a meaningful match." },
      { property: "og:title", content: "Create your account — AI Marriage" },
      { property: "og:description", content: "Join AI Marriage and start your journey to a meaningful match." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { adultConfirmed: false },
  });
  const isAdultConfirmed = watch("adultConfirmed");

  const signup = useMutation({
    mutationFn: (v: FormValues) => authApi.register({ ...v, adultConfirmed: true }),
    onSuccess: async (data, variables) => {
      console.log("=== REGISTER API RESPONSE ===", data);
      console.log("data?.onboarding boolean value:", data?.onboarding);
      if (data?.onboarding === false) {
        console.log("--> Logging in immediately to obtain Bearer token for onboarding");
        try {
          const loginRes = await authApi.login({
            email: variables.email,
            password: variables.password,
          });
          tokenStore.set(loginRes.accessToken, loginRes.refreshToken);
        } catch (loginErr) {
          console.warn("Auto-login post-registration warning:", loginErr);
        }
        showSuccess("Account created! Let's set up your profile.", "Welcome");
        navigate({
          to: "/onboarding",
          search: {
            name: variables.name,
            dob: variables.dateOfBirth,
          },
          replace: true,
        });
      } else {
        console.log("--> Navigating to /login because onboarding is true (or undefined)");
        showSuccess("Account created successfully! Please sign in to continue.", "Account Created");
        navigate({ to: "/login", replace: true });
      }
    },
    onError: (err: Error) => {
      console.error("=== REGISTER API ERROR ===", err);
      showError(err.message || "Could not create account. Please check your details and try again.", "Registration Failed");
    },
  });

  const onInvalid = (errors: Record<string, any>) => {
    const firstKey = Object.keys(errors)[0];
    if (firstKey && errors[firstKey]?.message) {
      showError(errors[firstKey].message, "Validation Issue");
    } else {
      showError("Please fill out all required fields correctly.", "Form Error");
    }
  };

  return (
    <AuthLayout
      variant="register"
      eyebrow="Join AI Marriage"
      title="Begin with your story."
      subtitle="Two minutes today. One thoughtful community that values privacy and intent."
    >
      <form className="stack-4" onSubmit={handleSubmit((v) => signup.mutate(v), onInvalid)} noValidate>
        <Field
          id="name"
          label="Full Name"
          autoComplete="name"
          placeholder="Aarav Sharma"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
          {...register("name")}
          error={formState.errors.name?.message}
        />
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
        <Field
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="At least 12 characters"
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
        <Field
          id="dateOfBirth"
          label="Date of Birth"
          type="date"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
          {...register("dateOfBirth")}
          error={formState.errors.dateOfBirth?.message}
        />
        <div
          className="row-2"
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            background: "rgba(0,0,0,0.02)",
            border: "1px solid var(--border, #e2e8f0)",
          }}
        >
          <input
            id="adultConfirmed"
            type="checkbox"
            style={{ width: "1.1rem", height: "1.1rem", accentColor: "var(--rose-active, #ea580c)" }}
            {...register("adultConfirmed")}
          />
          <Label htmlFor="adultConfirmed" style={{ fontSize: "0.85rem", cursor: "pointer", userSelect: "none" }}>
            I confirm I am 18 years of age or older
          </Label>
        </div>
        {formState.errors.adultConfirmed && (
          <p className="ds-field__hint ds-field__hint--error" role="alert">
            {formState.errors.adultConfirmed.message}
          </p>
        )}
        {signup.error && (
          <p className="ds-field__hint ds-field__hint--error" role="alert">
            {signup.error.message}
          </p>
        )}
        <Button
          type="submit"
          disabled={!isAdultConfirmed || signup.isPending}
          loading={signup.isPending}
          size="lg"
          style={{
            width: "100%",
            marginTop: "0.25rem",
            background: !isAdultConfirmed
              ? "var(--border, #cbd5e1)"
              : "linear-gradient(135deg, #ea580c 0%, #be123c 100%)",
            border: "none",
            boxShadow: !isAdultConfirmed
              ? "none"
              : "0 4px 14px rgba(234, 88, 12, 0.35)",
            fontWeight: 600,
            letterSpacing: "0.02em",
            opacity: !isAdultConfirmed ? 0.6 : 1,
            cursor: !isAdultConfirmed ? "not-allowed" : "pointer",
          }}
        >
          Create account
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
            Already have an account?
          </Text>
          <button
            type="button"
            className="auth-link"
            onClick={() => navigate({ to: "/login" })}
            style={{
              fontSize: "0.88rem",
              fontWeight: 700,
              color: "var(--rose-active, #ea580c)",
              cursor: "pointer",
            }}
          >
            Sign in
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
