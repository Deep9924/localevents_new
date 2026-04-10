// src/components/AuthModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { signIn } from "next-auth/react";
import { Check, X, ArrowLeft, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

// ── Types ──────────────────────────────────────────────────────────────────

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "initial" | "login" | "signup" | "google-only";

// ── Constants ──────────────────────────────────────────────────────────────

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8,          label: "8+ characters" },
  { test: (p: string) => /[A-Z]/.test(p),        label: "Uppercase"     },
  { test: (p: string) => /[a-z]/.test(p),        label: "Lowercase"     },
  { test: (p: string) => /[0-9]/.test(p),        label: "Number"        },
  { test: (p: string) => /[^a-zA-Z0-9]/.test(p), label: "Special char"  },
] as const;

const STEP_TITLES: Record<Step, string> = {
  "initial":     "Sign in to LocalEvents",
  "login":       "Welcome back",
  "signup":      "Create your account",
  "google-only": "Use Google to sign in",
};

function getPasswordStrength(password: string) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const score  = passed + (password.length >= 12 ? 1 : 0);
  if (score <= 2) return { label: "Weak",   color: "text-rose-400"   };
  if (score <= 4) return { label: "Fair",   color: "text-amber-400"  };
  return           { label: "Strong", color: "text-emerald-500" };
}

// ── Login API helper ───────────────────────────────────────────────────────

async function loginViaApi(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? "Invalid password");
  }
}

// ── Shared primitives ──────────────────────────────────────────────────────

function FormError({ message }: { message: string }) {
  if (!message) return null;
  return <p className="text-xs text-rose-400">{message}</p>;
}

function EmailBadge({ email }: { email: string }) {
  return (
    <p className="truncate rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
      {email}
    </p>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-zinc-100" />
      <span className="text-xs text-zinc-400">or</span>
      <div className="h-px flex-1 bg-zinc-100" />
    </div>
  );
}

function GoogleButton({ isLoading, onClick, label = "Continue with Google" }: {
  isLoading: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 w-full border-zinc-200 text-sm font-normal text-zinc-700 hover:bg-zinc-100"
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading
        ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-zinc-400" />
        : <FcGoogle  className="mr-2 h-4 w-4" />
      }
      {label}
    </Button>
  );
}

function PrimaryButton({ isLoading, label }: {
  isLoading: boolean;
  label: string;
}) {
  return (
    <Button
      type="submit"
      className="h-10 w-full bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700"
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </Button>
  );
}

function PasswordRequirements({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  return (
    <div className="rounded-md bg-zinc-50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">Strength</span>
        <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {PASSWORD_RULES.map(({ test, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-500">
            {test(password)
              ? <Check className="h-3 w-3 shrink-0 text-emerald-500" />
              : <X     className="h-3 w-3 shrink-0 text-zinc-200"    />
            }
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step views ─────────────────────────────────────────────────────────────

function InitialStep({ email, error, isLoading, isGoogleLoading, onEmailChange, onContinue, onGoogleSignIn }: {
  email: string;
  error: string;
  isLoading: boolean;
  isGoogleLoading: boolean;
  onEmailChange: (v: string) => void;
  onContinue: () => void;
  onGoogleSignIn: () => void;
}) {
  return (
    <div className="space-y-4">
      <GoogleButton isLoading={isGoogleLoading} onClick={onGoogleSignIn} />
      <OrDivider />
      <form onSubmit={(e) => { e.preventDefault(); onContinue(); }} className="space-y-3">
        <div className="space-y-1.5">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={`h-10 text-sm ${error ? "border-rose-300 focus-visible:ring-rose-200" : ""}`}
          />
          <FormError message={error} />
        </div>
        <PrimaryButton isLoading={isLoading} label="Continue" />
      </form>
    </div>
  );
}

function LoginStep({ email, password, error, isLoading, onPasswordChange, onLogin }: {
  email: string;
  password: string;
  error: string;
  isLoading: boolean;
  onPasswordChange: (v: string) => void;
  onLogin: () => void;
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} className="space-y-4">
      <EmailBadge email={email} />
      <div className="space-y-1.5">
        <Input
          type="password"
          placeholder="Password"
          value={password}
          autoFocus
          onChange={(e) => onPasswordChange(e.target.value)}
          className={`h-10 text-sm ${error ? "border-rose-300 focus-visible:ring-rose-200" : ""}`}
        />
        <FormError message={error} />
      </div>
      <PrimaryButton isLoading={isLoading} label="Sign In" />
    </form>
  );
}

function SignupStep({ email, name, password, confirmPassword, error, isLoading,
  onNameChange, onPasswordChange, onConfirmChange, onSignup }: {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  error: string;
  isLoading: boolean;
  onNameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
  onSignup: () => void;
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSignup(); }} className="space-y-3">
      <EmailBadge email={email} />
      <Input
        type="text"
        placeholder="Full name"
        value={name}
        autoFocus
        className="h-10 text-sm"
        onChange={(e) => onNameChange(e.target.value)}
      />
      <div className="space-y-2">
        <Input
          type="password"
          placeholder="Create a password"
          value={password}
          className="h-10 text-sm"
          onChange={(e) => onPasswordChange(e.target.value)}
        />
        {password && <PasswordRequirements password={password} />}
      </div>
      <Input
        type="password"
        placeholder="Confirm password"
        value={confirmPassword}
        className="h-10 text-sm"
        onChange={(e) => onConfirmChange(e.target.value)}
      />
      <FormError message={error} />
      <PrimaryButton isLoading={isLoading} label="Create Account" />
    </form>
  );
}

function GoogleOnlyStep({ isGoogleLoading, onGoogleSignIn }: {
  isGoogleLoading: boolean;
  onGoogleSignIn: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        This email is linked to a Google account. Please sign in with Google to continue.
      </p>
      <GoogleButton
        isLoading={isGoogleLoading}
        onClick={onGoogleSignIn}
        label="Sign in with Google"
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const router                           = useRouter();
  const utils                            = trpc.useUtils();
  const [step, setStep]                  = useState<Step>("initial");
  const [email, setEmail]                = useState("");
  const [password, setPassword]          = useState("");
  const [confirmPassword, setConfirm]    = useState("");
  const [name, setName]                  = useState("");
  const [isLoading, setIsLoading]        = useState(false);
  const [isGoogleLoading, setGoogleLoad] = useState(false);
  const [error, setError]                = useState("");

  const checkEmail     = trpc.auth.checkEmail.useMutation();
  const signupMutation = trpc.auth.signup.useMutation();

  const clearError = () => setError("");

  const reset = () => {
    setStep("initial");
    setEmail(""); setPassword(""); setConfirm(""); setName(""); clearError();
  };

  const handleClose = () => { reset(); onClose(); };

  // Refresh server components + invalidate tRPC user cache — no hard reload
  const finish = () => {
    handleClose();
    router.refresh();
    utils.auth.me.invalidate();
    onSuccess();
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoad(true);
    // No try/catch — signIn redirects the page; errors come back as ?error= on callback URL
    await signIn("google", { callbackUrl: window.location.href });
  };

  const handleEmailContinue = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    clearError();
    try {
      const result = await checkEmail.mutateAsync({ email });
      if (!result.exists)                       setStep("signup");
      else if (result.loginMethod === "google") setStep("google-only");
      else                                      setStep("login");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password) { setError("Please enter your password"); return; }
    setIsLoading(true);
    clearError();
    try {
      await loginViaApi(email, password);
      finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name)                                           { setError("Please enter your name"); return; }
    if (!PASSWORD_RULES.every((r) => r.test(password))) { setError("Please meet all password requirements"); return; }
    if (password !== confirmPassword)                    { setError("Passwords do not match"); return; }
    setIsLoading(true);
    clearError();
    try {
      await signupMutation.mutateAsync({ email, password, name });
      await loginViaApi(email, password);
      finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader className="pb-1">
          <div className="flex items-center gap-2">
            {step !== "initial" && (
              <button
                type="button"
                onClick={reset}
                className="rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-600"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <DialogTitle className="text-base font-semibold text-zinc-900">
              {STEP_TITLES[step]}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {step === "initial" && (
            <InitialStep
              email={email} error={error}
              isLoading={isLoading} isGoogleLoading={isGoogleLoading}
              onEmailChange={(v) => { setEmail(v); clearError(); }}
              onContinue={handleEmailContinue}
              onGoogleSignIn={handleGoogleSignIn}
            />
          )}
          {step === "login" && (
            <LoginStep
              email={email} password={password} error={error} isLoading={isLoading}
              onPasswordChange={(v) => { setPassword(v); clearError(); }}
              onLogin={handleLogin}
            />
          )}
          {step === "signup" && (
            <SignupStep
              email={email} name={name} password={password}
              confirmPassword={confirmPassword} error={error} isLoading={isLoading}
              onNameChange={(v)     => { setName(v);     clearError(); }}
              onPasswordChange={(v) => { setPassword(v); clearError(); }}
              onConfirmChange={(v)  => { setConfirm(v);  clearError(); }}
              onSignup={handleSignup}
            />
          )}
          {step === "google-only" && (
            <GoogleOnlyStep isGoogleLoading={isGoogleLoading} onGoogleSignIn={handleGoogleSignIn} />
          )}

          <p className="text-center text-xs text-zinc-400">
            By continuing, you agree to our{" "}
            <span className="cursor-pointer underline underline-offset-2 hover:text-zinc-600">Terms</span>
            {" & "}
            <span className="cursor-pointer underline underline-offset-2 hover:text-zinc-600">Privacy Policy</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}