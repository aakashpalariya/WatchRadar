"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Radar, Mail, Lock, User, Calendar, Loader2 } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";

const SignupSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(60, "Name too long"),
    email: z.string().email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
    dob: z
      .string()
      .min(1, "Date of birth is required")
      .refine((v) => {
        if (!v) return false;
        const d = new Date(v);
        const now = new Date();
        return d < now && d.getFullYear() > 1900;
      }, "Please enter a valid date of birth"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof SignupSchema>;

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {checks.map((c) => (
        <span
          key={c.label}
          style={{
            fontSize: "0.7rem",
            padding: "2px 8px",
            borderRadius: "99px",
            background: c.ok ? "rgba(34,197,94,0.1)" : "rgba(113,113,122,0.1)",
            color: c.ok ? "#22c55e" : "var(--text-muted)",
            border: `1px solid ${c.ok ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
          }}
        >
          {c.ok ? "✓" : "○"} {c.label}
        </span>
      ))}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(SignupSchema),
  });

  const password = watch("password", "");

  const onSubmit = async (data: SignupForm) => {
    setServerError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          dob: data.dob,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const errMsg = json.error ?? "Sign up failed";
        if (errMsg.toLowerCase().includes("email")) {
          setError("email", { type: "manual", message: errMsg });
        } else if (errMsg.toLowerCase().includes("password")) {
          setError("password", { type: "manual", message: errMsg });
        } else if (errMsg.toLowerCase().includes("name")) {
          setError("name", { type: "manual", message: errMsg });
        } else if (errMsg.toLowerCase().includes("date") || errMsg.toLowerCase().includes("dob")) {
          setError("dob", { type: "manual", message: errMsg });
        } else {
          setServerError(errMsg);
        }
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setServerError("Network error. Please try again.");
    }
  };

  const fieldStyle = {
    marginBottom: "16px",
  };

  const labelStyle = {
    display: "block" as const,
    marginBottom: "6px",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
  };

  const errorStyle = {
    color: "#f87171",
    fontSize: "0.78rem",
    marginTop: "4px",
  };

  return (
    <div className="auth-container">
      <div
        className="auth-card animate-fade-in"
        style={{ maxWidth: "480px" }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
              boxShadow: "0 0 30px rgba(168,85,247,0.4)",
              marginBottom: "12px",
            }}
          >
            <Radar size={28} color="white" />
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Create your account
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Start tracking what you want to watch
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "10px",
                color: "#f87171",
                fontSize: "0.875rem",
                marginBottom: "20px",
              }}
            >
              {serverError}
            </div>
          )}

          {/* Name */}
          <div style={fieldStyle}>
            <label htmlFor="name" style={labelStyle}>Full Name</label>
            <div style={{ position: "relative" }}>
              <User
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                className={`input ${errors.name ? "input-error" : ""}`}
                style={{ paddingLeft: "42px" }}
                {...register("name")}
              />
            </div>
            {errors.name && <p style={errorStyle}>{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div style={fieldStyle}>
            <label htmlFor="email" style={labelStyle}>Email</label>
            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`input ${errors.email ? "input-error" : ""}`}
                style={{ paddingLeft: "42px" }}
                {...register("email")}
              />
            </div>
            {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
          </div>

          {/* Date of Birth */}
          <div style={fieldStyle}>
            <label style={labelStyle}>
              Date of Birth
              <span
                style={{
                  marginLeft: "6px",
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  fontWeight: 400,
                }}
              >
                (used for password recovery)
              </span>
            </label>
            <Controller
              control={control}
              name="dob"
              render={({ field }) => (
                <DatePicker
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Select date of birth..."
                />
              )}
            />
            {errors.dob && <p style={errorStyle}>{errors.dob.message}</p>}
          </div>

          {/* Password */}
          <div style={fieldStyle}>
            <label htmlFor="password" style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a strong password"
                className={`input ${errors.password ? "input-error" : ""}`}
                style={{ paddingLeft: "42px", paddingRight: "48px" }}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrength password={password} />
            {errors.password && <p style={errorStyle}>{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div style={fieldStyle}>
            <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</label>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your password"
                className={`input ${errors.confirmPassword ? "input-error" : ""}`}
                style={{ paddingLeft: "42px", paddingRight: "48px" }}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                }}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p style={errorStyle}>{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: "100%", marginBottom: "16px", marginTop: "8px" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <p
            style={{
              textAlign: "center",
              fontSize: "0.875rem",
              color: "var(--text-muted)",
            }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "var(--accent)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
