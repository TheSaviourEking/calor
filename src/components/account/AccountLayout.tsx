"use client";

import ClientWrapper from "@/components/layout/ClientWrapper";
import AccountNav from "@/components/account/AccountNav";
import { Loader2 } from "lucide-react";

interface AccountLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  requiresAuth?: boolean;
  isAuthenticated?: boolean;
}

export default function AccountLayout({
  children,
  title,
  subtitle,
  loading = false,
  requiresAuth = true,
  isAuthenticated = true,
}: AccountLayoutProps) {
  // Loading state
  if (loading) {
    return (
      <ClientWrapper>
        <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
        </div>
      </ClientWrapper>
    );
  }

  // Not authenticated state (for pages that require auth)
  if (requiresAuth && !isAuthenticated) {
    return (
      <ClientWrapper>
        <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
          <div className="text-center">
            <p className="font-body text-warm-gray mb-4">
              Please log in to access this page
            </p>
            <Link
              href="/account"
              className="px-6 py-3 bg-terracotta text-cream font-body text-sm uppercase tracking-wider"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </ClientWrapper>
    );
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <AccountNav />
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Header */}
              {(title || subtitle) && (
                <div className="mb-8">
                  {title && (
                    <h1
                      className="font-display text-charcoal mb-2"
                      style={{
                        fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                        fontWeight: 300,
                      }}
                    >
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="font-body text-warm-gray">{subtitle}</p>
                  )}
                </div>
              )}

              {/* Page Content */}
              {children}
            </div>
          </div>
        </div>
      </div>
    </ClientWrapper>
  );
}
