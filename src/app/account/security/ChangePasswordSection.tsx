"use client";

import { useEffect, useState } from "react";
import { Key } from "lucide-react";

// Password changes go through the same emailed reset link as "forgot
// password": one tested path, and a stolen session alone cannot set a new
// password. Hidden for OAuth-only accounts, which have no password.
export default function ChangePasswordSection() {
  const [email, setEmail] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [account, me] = await Promise.all([
          fetch("/api/account").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)),
        ]);
        if (cancelled) return;
        setHasPassword(!!account?.hasPassword);
        setEmail(me?.customer?.email ?? null);
      } catch {
        // stay hidden
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function sendLink() {
    if (!email) return;
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setMessage(
        res.ok
          ? { text: `We have sent a reset link to ${email}. It expires in one hour.`, error: false }
          : { text: "Could not send the link. Please try again in a minute.", error: true }
      );
    } catch {
      setMessage({ text: "Could not send the link. Please try again in a minute.", error: true });
    } finally {
      setSending(false);
    }
  }

  if (!hasPassword || !email) return null;

  return (
    <div className="bg-warm-white p-6 border border-sand mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Key className="w-5 h-5 text-terracotta" />
        <h3 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
          Change Password
        </h3>
      </div>
      <p className="font-body text-warm-gray text-sm mb-4">
        We will email you a link to set a new password.
      </p>
      <button
        type="button"
        onClick={sendLink}
        disabled={sending}
        className="bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50"
      >
        {sending ? "Sending..." : "Email me a reset link"}
      </button>
      {message && (
        <p
          className="font-body text-sm mt-3"
          style={{ color: message.error ? "#A35A3F" : undefined }}
          role="status"
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
