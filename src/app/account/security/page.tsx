"use client";

import { useState } from "react";
import { Key, Eye, Lock } from "lucide-react";
import Link from "next/link";
import NicknameSection from "./NicknameSection";
import DeleteAccountDialog from "./DeleteAccountDialog";

export default function SecurityPage() {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeMessage, setRevokeMessage] = useState<string | null>(null);

  async function signOutOthers() {
    setRevoking(true);
    setRevokeMessage(null);
    try {
      const res = await fetch("/api/sessions/revoke-others", { method: "POST" });
      setRevokeMessage(
        res.ok
          ? "Signed out of all other sessions."
          : "Could not sign out other sessions. Please try again."
      );
    } catch {
      setRevokeMessage("Could not sign out other sessions. Please try again.");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <>
      <h1
        className="font-display text-charcoal mb-2"
        style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 300 }}
      >
        Security Settings
      </h1>
      <p className="font-body text-warm-gray text-sm mb-8">
        Protect your account and manage your privacy preferences.
      </p>

      <NicknameSection />

      {/* Change Password */}
      <div className="bg-warm-white p-6 border border-sand mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-terracotta" />
          <h3
            className="font-display text-charcoal text-lg"
            style={{ fontWeight: 400 }}
          >
            Change Password
          </h3>
        </div>
        <form className="space-y-4">
          <input
            type="password"
            placeholder="Current password"
            className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
          />
          <input
            type="password"
            placeholder="New password"
            className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
          />
          <button
            type="submit"
            className="bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Privacy */}
      <div className="bg-warm-white p-6 border border-sand mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Eye className="w-5 h-5 text-terracotta" />
          <h3
            className="font-display text-charcoal text-lg"
            style={{ fontWeight: 400 }}
          >
            Privacy
          </h3>
        </div>
        <div className="space-y-4">
          <Link
            href="/legal/privacy"
            className="block font-body text-charcoal text-sm hover:text-terracotta"
          >
            Privacy Policy →
          </Link>
          <Link
            href="/legal/discreet-billing"
            className="block font-body text-charcoal text-sm hover:text-terracotta"
          >
            Discreet Billing →
          </Link>
          <a
            href="/api/account/export"
            download
            className="block font-body text-charcoal text-sm hover:text-terracotta"
          >
            Download My Data →
          </a>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="block font-body text-ember text-sm hover:text-terracotta"
          >
            Delete Account →
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-ember/5 p-6 border border-ember/20">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-ember" />
          <h3
            className="font-display text-charcoal text-lg"
            style={{ fontWeight: 400 }}
          >
            Danger Zone
          </h3>
        </div>
        <p className="font-body text-warm-gray text-sm mb-4">
          Sign out of all other sessions. This will not sign you out of your
          current session.
        </p>
        <button
          type="button"
          onClick={signOutOthers}
          disabled={revoking}
          className="border border-ember text-ember px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-ember hover:text-warm-white transition-colors disabled:opacity-50"
        >
          Sign Out All Other Sessions
        </button>
        {revokeMessage && (
          <p role="status" className="font-body text-warm-gray text-sm mt-4">
            {revokeMessage}
          </p>
        )}
      </div>

      {deleteOpen && <DeleteAccountDialog onClose={() => setDeleteOpen(false)} />}
    </>
  );
}
