import * as React from "react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="flex flex-col items-center space-y-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-950/30">
          V
        </div>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-emerald-500" />
        <p className="text-xs font-medium text-zinc-400">Carregando...</p>
      </div>
    </div>
  );
}
