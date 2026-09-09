"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DatePicker from "@/components/ui/DatePicker";
import {
  Radar,
  Mail,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";

// Step 1: verify identity
const VerifySchema = z.object({
  email: z.string().email("Please enter a valid email"),
  dob: z.string().min(1, "Date of birth is required"),
});

// Step 2: new password
const ResetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type VerifyForm = z.infer<typeof VerifySchema>;
type ResetForm = z.infer<typeof ResetSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"verify" | "reset" | "success">("verify");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [verifiedDob, setVerifiedDob] = useState("");
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const verifyForm = useForm<VerifyForm>({ resolver: zodResolver(VerifySchema) });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(ResetSchema) });

  const onVerify = async (data: VerifyForm) => {
    setServerError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email: data.email, dob: data.dob }),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Verification failed");
        return;
      }
      setVerifiedEmail(data.email);
      setVerifiedDob(data.dob);
      setStep("reset");
    } catch {
      setServerError("Network error. Please try again.");
    }
  };

  const onReset = async (data: ResetForm) => {
    setServerError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset",
          email: verifiedEmail,
          dob: verifiedDob,
          newPassword: data.newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Reset failed");
        return;
      }
      setStep("success");
    } catch {
      setServerError("Network error. Please try again.");
    }
  };

  const labelStyle = {
    display: "block" as const,
    marginBottom: "6px",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
  };

  const errorStyle = { color: "#f87171", fontSize: "0.78rem", marginTop: "4px" };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
              boxShadow: "0 0 20px rgba(168,85,247,0.35)",
              flexShrink: 0,
            }}
          >
            <Radar size={22} color="white" />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                lineHeight: 1.2,
              }}
            >
              {step === "verify" && "Reset Password"}
              {step === "reset" && "New Password"}
              {step === "success" && "Password Reset!"}
            </h1>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>WatchRadar</p>
          </div>
        </div>

        {/* Step indicators */}
        {step !== "success" && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            {["verify", "reset"].map((s, i) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: "3px",
                  borderRadius: "2px",
                  background:
                    step === "verify" && i === 0
                      ? "var(--accent)"
                      : step === "reset"
                      ? "var(--accent)"
                      : "var(--bg-muted)",
                  opacity: step === "reset" && i === 0 ? 0.4 : 1,
                }}
              />
            ))}
          </div>
        )}

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

        {/* Step 1: Verify */}
        {step === "verify" && (
          <form onSubmit={verifyForm.handleSubmit(onVerify)} noValidate>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "20px" }}>
              Enter your email and date of birth to verify your identity.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="fp-email" style={labelStyle}>Email</label>
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
                  id="fp-email"
                  type="email"
                  placeholder="your@email.com"
                  className={`input ${verifyForm.formState.errors.email ? "input-error" : ""}`}
                  style={{ paddingLeft: "42px" }}
                  {...verifyForm.register("email")}
                />
              </div>
              {verifyForm.formState.errors.email && (
                <p style={errorStyle}>{verifyForm.formState.errors.email.message}</p>
              )}
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label htmlFor="fp-dob" style={labelStyle}>
                Date of Birth
              </label>
              <Controller
                control={verifyForm.control}
                name="dob"
                render={({ field }) => (
                  <DatePicker
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Select date of birth..."
                  />
                )}
              />
              {verifyForm.formState.errors.dob && (
                <p style={errorStyle}>{verifyForm.formState.errors.dob.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={verifyForm.formState.isSubmitting}
              className="btn btn-primary"
              style={{ width: "100%", marginBottom: "16px" }}
            >
              {verifyForm.formState.isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Verifying...</>
              ) : (
                "Verify Identity"
              )}
            </button>

            <Link
              href="/login"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                fontSize: "0.875rem",
                color: "var(--text-muted)",
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={14} /> Back to login
            </Link>
          </form>
        )}

        {/* Step 2: New Password */}
        {step === "reset" && (
          <form onSubmit={resetForm.handleSubmit(onReset)} noValidate>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "20px" }}>
              Identity verified for <strong style={{ color: "var(--text-primary)" }}>{verifiedEmail}</strong>. Set your new password.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="new-password" style={labelStyle}>New Password</label>
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
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  className={`input ${resetForm.formState.errors.newPassword ? "input-error" : ""}`}
                  style={{ paddingLeft: "42px", paddingRight: "48px" }}
                  {...resetForm.register("newPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
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
              {resetForm.formState.errors.newPassword && (
                <p style={errorStyle}>{resetForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label htmlFor="confirm-password" style={labelStyle}>Confirm Password</label>
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
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat new password"
                  className={`input ${resetForm.formState.errors.confirmPassword ? "input-error" : ""}`}
                  style={{ paddingLeft: "42px", paddingRight: "48px" }}
                  {...resetForm.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label="Toggle password visibility"
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
              {resetForm.formState.errors.confirmPassword && (
                <p style={errorStyle}>{resetForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={resetForm.formState.isSubmitting}
              className="btn btn-primary"
              style={{ width: "100%", marginBottom: "16px" }}
            >
              {resetForm.formState.isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Resetting...</>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

        {/* Success */}
        {step === "success" && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "rgba(34,197,94,0.1)",
                border: "2px solid rgba(34,197,94,0.3)",
                marginBottom: "20px",
              }}
            >
              <CheckCircle2 size={36} color="#22c55e" />
            </div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>
              Password Reset Successfully!
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px", fontSize: "0.875rem" }}>
              Your password has been updated. You can now sign in with your new password.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() => router.push("/login")}
            >
              Go to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
