"use client";

import { useEffect, useState } from "react";
import { publicDisplayName } from "@/lib/discretion";

export default function NicknameSection() {
  const [value, setValue] = useState("");
  const [placeholder, setPlaceholder] = useState("Your nickname");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [nick, me] = await Promise.all([
          fetch("/api/account/nickname").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)),
        ]);
        if (cancelled) return;
        if (nick?.nickname) setValue(nick.nickname);
        else if (me?.customer) setPlaceholder(publicDisplayName(me.customer));
      } catch {
        // leave defaults
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/nickname", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setValue(data.nickname);
        setMessage({ text: "Saved.", error: false });
      } else {
        setMessage({ text: data.error || "Something went wrong", error: true });
      }
    } catch {
      setMessage({ text: "Something went wrong", error: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-warm-white p-6 border border-sand mb-6">
      <p
        className="font-body uppercase tracking-wider text-xs mb-2"
        style={{ color: "#A35A3F" }}
      >
        Privacy
      </p>
      <h2
        className="font-display text-charcoal mb-2"
        style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 300 }}
      >
        How <em className="italic" style={{ color: "#A35A3F" }}>others</em> see you
      </h2>
      <p className="font-body text-warm-gray text-sm mb-4">
        Shown in live chat, reviews and shared lists. Never your real name.
      </p>
      <form onSubmit={save} className="space-y-4">
        <label htmlFor="nickname" className="sr-only">
          Your nickname
        </label>
        <input
          id="nickname"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          maxLength={24}
          autoComplete="off"
          className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
        />
        {message && (
          <p
            role="status"
            className="font-body text-xs"
            style={{ color: message.error ? "#A35A3F" : undefined }}
          >
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-60"
        >
          {saving ? "Saving" : "Save nickname"}
        </button>
      </form>
    </div>
  );
}
