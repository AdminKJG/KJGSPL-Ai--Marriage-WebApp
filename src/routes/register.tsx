import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Label, Text } from "@/components/ui";
import { Field } from "@/components/ui";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { authApi } from "@/lib/api/modules";
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
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { adultConfirmed: false },
  });
  const signup = useMutation({
    mutationFn: (v: FormValues) => authApi.register({ ...v, adultConfirmed: true }),
  });

  return (
    <AuthLayout
      variant="register"
      eyebrow="Join AI Marriage"
      title="Begin with your story."
      subtitle="Two minutes today. One thoughtful community that values privacy and intent."
    >
      {signup.isSuccess ? (
        <div
          className="stack-4"
          role="status"
          style={{
            textAlign: "center",
            padding: "1.5rem 1rem",
            background: "rgba(234, 88, 12, 0.04)",
            borderRadius: "1rem",
            border: "1px solid rgba(234, 88, 12, 0.2)",
          }}
        >
          <div
            style={{
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: "9999px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              fontSize: "1.75rem",
              boxShadow: "0 6px 18px rgba(16, 185, 129, 0.3)",
            }}
          >
            ✓
          </div>
          <h2 className="auth-title" style={{ fontSize: "1.6rem", margin: 0 }}>
            Welcome to AI Marriage
          </h2>
          <Text style={{ color: "var(--muted, #64748b)" }}>
            {signup.data?.message ?? "Your account has been created successfully. Sign in now to finish setting up your candidate profile."}
          </Text>
          <Button
            size="lg"
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #ea580c 0%, #be123c 100%)",
              border: "none",
              boxShadow: "0 4px 14px rgba(234, 88, 12, 0.35)",
              fontWeight: 600,
            }}
            onClick={() => navigate({ to: "/login" })}
          >
            Sign in to your account
          </Button>
        </div>
      ) : (
        <form className="stack-4" onSubmit={handleSubmit((v) => signup.mutate(v))} noValidate>
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
            loading={signup.isPending}
            size="lg"
            style={{
              width: "100%",
              marginTop: "0.25rem",
              background: "linear-gradient(135deg, #ea580c 0%, #be123c 100%)",
              border: "none",
              boxShadow: "0 4px 14px rgba(234, 88, 12, 0.35)",
              fontWeight: 600,
              letterSpacing: "0.02em",
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
      )}
    </AuthLayout>
  );
}
