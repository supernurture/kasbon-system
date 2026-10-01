import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { signOut } from "@/features/auth/actions";
import { Button } from "@/shared/components/ui/Button";
import { getCurrentUser } from "@/shared/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // proxy.ts already redirects guests; this is the second lock in case the matcher ever misses.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <header className="flex items-center gap-4 border-b-2 border-divider py-1.5 pr-1.5 pl-4 md:px-8 md:py-4">
        <span className="mr-auto text-xl font-extrabold tracking-tight md:text-[22px]">
          Kasbon<span className="text-accent">.</span>
        </span>
        <span className="hidden text-[13px] text-neutral-700 md:inline">{user.email}</span>
        <form action={signOut}>
          <Button
            type="submit"
            aria-label="Keluar"
            className="max-md:w-11 max-md:justify-center max-md:border-transparent max-md:px-0"
          >
            <LogOut className="size-5 md:size-4" aria-hidden />
            <span className="hidden md:inline">Keluar</span>
          </Button>
        </form>
      </header>
      {children}
    </>
  );
}
