"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useAuthStore } from "@/stores/auth";

const TERRACOTTA = "#A35A3F";

export default function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setHasPassword(data ? !!data.hasPassword : true);
      })
      .catch(() => {
        if (!cancelled) setHasPassword(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hasPassword ? { password } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setSubmitting(false);
        return;
      }
      // The server already cleared the session; clear everything on this device too
      useAuthStore.getState().logout();
      router.replace("/");
    } catch {
      setError("Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-charcoal/50 z-[200]"
        onClick={() => !submitting && onClose()}
        aria-hidden="true"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-body"
        className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
      >
        <form
          onSubmit={confirm}
          className="bg-warm-white border border-sand w-full max-w-md pointer-events-auto p-6 sm:p-8"
        >
          <div className="flex items-start justify-between mb-4">
            <h2
              id="delete-account-title"
              className="font-display text-charcoal"
              style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 300 }}
            >
              Leave{" "}
              <em className="italic" style={{ color: TERRACOTTA }}>
                calo.
              </em>
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="text-warm-gray hover:text-charcoal transition-colors ml-4"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p id="delete-account-body" className="font-body text-warm-gray text-sm leading-relaxed mb-6">
            This deletes your account and everything personal in it. We keep order records for tax,
            with your name removed. This can&apos;t be undone.
          </p>

          {hasPassword && (
            <div className="mb-6">
              <label
                htmlFor="delete-password"
                className="block font-body uppercase tracking-wider text-xs mb-2 text-charcoal"
              >
                Your password
              </label>
              <input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
              />
            </div>
          )}

          {error && (
            <p role="alert" className="font-body text-sm mb-4" style={{ color: TERRACOTTA }}>
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-3 font-body text-sm uppercase tracking-wider text-warm-gray hover:text-charcoal transition-colors"
            >
              Keep my account
            </button>
            <button
              type="submit"
              disabled={submitting || hasPassword === null}
              className="bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50"
            >
              {submitting ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
