"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/shared/lib/supabase/server";
import { credentialsSchema, type AuthResult } from "./schemas";

const INVALID_INPUT = "Email atau password-nya belum valid.";
const RATE_LIMITED = "Kebanyakan percobaan. Tunggu bentar terus coba lagi ya.";

export async function signIn(input: unknown): Promise<AuthResult> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return { error: INVALID_INPUT };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Supabase only reports this after the password matched, so it doesn't leak which emails exist.
    if (error.code === "email_not_confirmed") {
      return { error: "Email kamu belum dikonfirmasi. Cek inbox dulu ya." };
    }
    if (error.code === "over_request_rate_limit") return { error: RATE_LIMITED };
    return { error: "Email atau password-nya salah. Coba lagi ya." };
  }

  redirect("/");
}

export async function signUp(input: unknown): Promise<AuthResult> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return { error: INVALID_INPUT };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    if (error.code === "weak_password") {
      return { error: "Password-nya kurang kuat. Coba yang lebih susah ditebak." };
    }
    if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
      return { error: RATE_LIMITED };
    }
    // Deliberately vague about existing accounts to avoid email enumeration.
    return { error: "Gagal daftar. Kalau udah punya akun, langsung masuk aja." };
  }

  // With "Confirm email" on, Supabase returns no session until the link is clicked.
  if (!data.session) {
    return { notice: "Sip! Cek email kamu buat konfirmasi, abis itu masuk di sini." };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
