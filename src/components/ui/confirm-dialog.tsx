"use client";

import type { ReactNode } from "react";
import { AlertTriangle, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  title,
  description,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  variant = "destructive",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Tutup dialog konfirmasi"
        disabled={isLoading}
        className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative max-h-[92vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-md sm:rounded-[12px]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border bg-white p-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
                variant === "destructive"
                  ? "bg-danger-soft text-danger"
                  : "bg-primary-soft text-primary-hover"
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>

            <h2
              id="confirm-dialog-title"
              className="text-base font-semibold text-foreground"
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Tutup"
            disabled={isLoading}
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-[#F3F4F6] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-3 p-5 text-sm text-muted">
          {typeof description === "string" ? (
            <p>{description}</p>
          ) : (
            description
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border bg-[#F9FAFB] p-4">
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={onClose}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={variant}
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </footer>
      </section>
    </div>
  );
}
