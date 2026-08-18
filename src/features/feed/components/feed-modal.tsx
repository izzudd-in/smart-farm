"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

type FeedModalProps = {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
};

export function FeedModal({
  title,
  description,
  children,
  onClose,
}: FeedModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 cursor-default bg-black/40"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="feed-modal-title"
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-[12px]"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-white p-5">
          <div>
            <h2
              id="feed-modal-title"
              className="font-semibold text-foreground"
            >
              {title}
            </h2>

            {description ? (
              <p className="mt-1 text-sm text-muted">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-[#F3F4F6]"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}