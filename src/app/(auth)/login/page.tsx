import type { Metadata } from "next";

import { AuthForm } from "@/features/auth/components/AuthForm";

export const metadata: Metadata = { title: "Masuk · Kasbon" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh md:grid-cols-2">
      <section className="flex flex-col bg-accent p-6 text-bg md:p-8">
        <p className="text-[22px] font-extrabold tracking-tight">Kasbon.</p>
        <div className="hidden flex-1 md:block" />
        <h1 className="mt-10 text-4xl leading-[0.98] tracking-[-0.035em] text-balance md:mt-0 md:text-[52px]">
          Siapa utang siapa, gak usah diinget-inget.
        </h1>
        <div className="mt-6 mb-3.5 h-0.5 bg-bg" />
        <p className="text-sm">Catat, tandai lunas, beres.</p>
      </section>
      <section className="flex flex-col justify-center px-4 py-8 md:px-10">
        <div className="mx-auto w-full max-w-sm">
          <AuthForm />
        </div>
      </section>
    </main>
  );
}
