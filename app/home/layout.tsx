"use client";

import AuthGuard from "@/components/AuthGuard";
import ErrorBoundary from "@/components/ErrorBoundary";

/**
 * Layout for the /home route group.
 * Wraps all child pages with AuthGuard for authentication protection
 * and ErrorBoundary for graceful error handling.
 */
export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <AuthGuard>
        {children}
      </AuthGuard>
    </ErrorBoundary>
  );
}
