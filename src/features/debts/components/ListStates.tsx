import { AlertCircle, Plus } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col gap-2.5 py-10 md:max-w-md">
      <p
        aria-hidden
        className="text-6xl leading-none font-extrabold tracking-[-0.04em] text-neutral-300"
      >
        Rp 0
      </p>
      <h2 className="text-xl">Belum ada catatan.</h2>
      <p className="text-[13px] text-neutral-700">
        Ada temen yang pinjem duit? Atau kamu yang pinjem? Catat di sini biar gak lupa.
      </p>
      <Button variant="primary" onClick={onCreate} className="mt-1.5 self-start">
        <Plus size={16} strokeWidth={2.4} aria-hidden />
        Catat yang pertama
      </Button>
    </div>
  );
}

export function NoResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-divider py-10">
      <p className="text-[15px]">Gak ada yang cocok sama filter ini.</p>
      <Button variant="ghost" onClick={onReset}>
        Reset filter
      </Button>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="-mt-0.5 flex flex-col gap-2.5 border-t-6 border-accent py-8 md:max-w-md"
    >
      <AlertCircle size={32} className="text-accent" aria-hidden />
      <h2 className="text-xl">Waduh, gagal ngambil data.</h2>
      <p className="text-[13px] text-neutral-700">{message} Data kamu aman kok.</p>
      <Button onClick={onRetry} className="mt-1.5 self-start">
        Coba lagi
      </Button>
    </div>
  );
}

const SKELETON_WIDTHS = ["w-36", "w-24", "w-40", "w-28"];

export function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Lagi ngambil data" className="animate-pulse">
      {SKELETON_WIDTHS.map((width) => (
        <div key={width} className="flex flex-col gap-2 border-b border-divider py-3.5">
          <div className="flex justify-between">
            <div className={`h-3 ${width} bg-neutral-300`} />
            <div className="h-3 w-18 bg-neutral-300" />
          </div>
          <div className="h-2 w-30 bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}
