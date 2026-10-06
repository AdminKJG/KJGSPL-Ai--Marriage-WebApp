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
        <div className="stack-4" role="status">
          <h2 className="auth-title" style={{ fontSize: "1.6rem" }}>
            You&apos;re in
          </h2>
          <Text>{signup.data?.message ?? "Account created. Sign in to finish your profile."}</Text>
          <Button size="lg" style={{ width: "100%" }} onClick={() => navigate({ to: "/login" })}>
            Sign in
          </Button>
          <Text variant="small" style={{ textAlign: "center" }}>
            <button type="button" className="auth-link" onClick={() => navigate({ to: "/" })}>
              Back to home
            </button>
          </Text>
        </div>
      ) : (
        <form className="stack-4" onSubmit={handleSubmit((v) => signup.mutate(v))} noValidate>
          <Field id="name" label="Full name" autoComplete="name" placeholder="Aarav Sharma" {...register("name")} error={formState.errors.name?.message} />
          <Field id="email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} error={formState.errors.email?.message} />
          <Field
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 12 characters"
            {...register("password")}
            error={formState.errors.password?.message}
            action={
              <PasswordEyeToggle
                show={showPassword}
                onToggle={() => setShowPassword((s) => !s)}
              />
            }
          />
          <Field id="dateOfBirth" label="Date of birth" type="date" {...register("dateOfBirth")} error={formState.errors.dateOfBirth?.message} />
          <div className="row-2">
            <input id="adultConfirmed" type="checkbox" {...register("adultConfirmed")} />
            <Label htmlFor="adultConfirmed">I confirm I am 18 or older</Label>
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
          <Button type="submit" loading={signup.isPending} size="lg" style={{ width: "100%", marginTop: "0.25rem" }}>
            Create account
          </Button>

          <div style={{ textAlign: "center", paddingTop: "0.25rem" }}>
            <span style={{ fontSize: "0.88rem", color: "var(--muted, #64748b)" }}>
              Already have an account?{" "}
            </span>
            <button
              type="button"
              className="auth-link"
              onClick={() => navigate({ to: "/login" })}
              style={{
                fontSize: "0.88rem",
                fontWeight: 700,
                color: "var(--rose-active, #ea580c)",
                cursor: "pointer",
                background: "none",
                border: "none",
                textDecoration: "underline",
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
