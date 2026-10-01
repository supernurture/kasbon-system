"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/components/ui/Button";
import { Field } from "@/shared/components/ui/Field";
import { Input } from "@/shared/components/ui/Input";
import { cn } from "@/shared/lib/cn";
import { signIn, signUp } from "../actions";
import { credentialsSchema, type AuthResult, type Credentials } from "../schemas";

type Mode = "signin" | "signup";

const copy = {
  signin: {
    title: "Halo lagi!",
    subtitle: "Masuk buat lihat catatan kamu.",
    submit: "Masuk",
    switchText: "Belum punya akun?",
    switchCta: "Daftar dulu",
  },
  signup: {
    title: "Bikin akun",
    subtitle: "Gratis, cuma butuh email sama password.",
    submit: "Daftar",
    switchText: "Udah punya akun?",
    switchCta: "Masuk aja",
  },
} satisfies Record<Mode, Record<string, string>>;

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [result, setResult] = useState<AuthResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });

  const text = copy[mode];

  function switchMode(next: Mode) {
    setMode(next);
    setResult(null);
  }

  const onSubmit = handleSubmit(async (values) => {
    setResult(null);
    // On success the action redirects, so a returned value always means "stay on this page".
    setResult(await (mode === "signin" ? signIn(values) : signUp(values)));
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4.5">
      <div role="group" aria-label="Pilih mode" className="flex self-start border border-divider">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => switchMode(m)}
            className={cn(
              "min-h-10 cursor-pointer px-3 text-[13px] not-first:border-l not-first:border-divider",
              mode === m ? "bg-accent text-bg" : "hover:bg-ink/7",
            )}
          >
            {copy[m].submit}
          </button>
        ))}
      </div>

      <div>
        <h2 className="text-3xl">{text.title}</h2>
        <p className="mt-1 text-sm text-neutral-700">{text.subtitle}</p>
      </div>

      <Field id="email" label="Email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="kamu@email.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
      </Field>

      <Field id="password" label="Password" error={errors.password?.message}>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="pr-11"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            // Keep focus (and the mobile keyboard) in the input while toggling.
            onMouseDown={(event) => event.preventDefault()}
            // The label itself states the action, so no aria-pressed (that would double up).
            aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
            aria-controls="password"
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-neutral-600 hover:text-ink"
          >
            {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        </div>
      </Field>

      {result && (
        <div
          role="status"
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 text-[13px]",
            "error" in result ? "bg-accent-100 text-accent-800" : "bg-positive-bg text-positive",
          )}
        >
          {"error" in result ? (
            <AlertCircle size={16} aria-hidden className="shrink-0" />
          ) : (
            <CheckCircle2 size={16} aria-hidden className="shrink-0" />
          )}
          {"error" in result ? result.error : result.notice}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="min-h-12 text-[15px]"
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {text.submit}
      </Button>

      <p className="text-[13px] text-neutral-700">
        {text.switchText}{" "}
        <button
          type="button"
          onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
          className="cursor-pointer text-accent underline underline-offset-3 hover:text-accent-600"
        >
          {text.switchCta}
        </button>
      </p>
    </form>
  );
}
