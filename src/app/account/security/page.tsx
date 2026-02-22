"use client";

import { useState } from "react";
import { Shield, Key, Bell, Eye, Lock, Smartphone } from "lucide-react";
import Link from "next/link";

export default function SecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

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

      {/* Two-Factor Auth */}
      <div className="bg-warm-white p-6 border border-sand mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-terracotta" />
            <div>
              <h3
                className="font-display text-charcoal text-lg"
                style={{ fontWeight: 400 }}
              >
                Two-Factor Authentication
              </h3>
              <p className="font-body text-warm-gray text-sm">
                Add an extra layer of security to your account.
              </p>
            </div>
          </div>
          <button
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              twoFactorEnabled ? "bg-terracotta" : "bg-sand"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white transition-transform ${
                twoFactorEnabled ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Login Alerts */}
      <div className="bg-warm-white p-6 border border-sand mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-terracotta" />
            <div>
              <h3
                className="font-display text-charcoal text-lg"
                style={{ fontWeight: 400 }}
              >
                Login Alerts
              </h3>
              <p className="font-body text-warm-gray text-sm">
                Get notified when someone signs into your account from a new
                device.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLoginAlerts(!loginAlerts)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              loginAlerts ? "bg-terracotta" : "bg-sand"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white transition-transform ${
                loginAlerts ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
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
          <button className="block font-body text-charcoal text-sm hover:text-terracotta">
            Download My Data →
          </button>
          <button className="block font-body text-ember text-sm hover:text-terracotta">
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
        <button className="border border-ember text-ember px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-ember hover:text-warm-white transition-colors">
          Sign Out All Other Sessions
        </button>
      </div>
    </>
  );
}
