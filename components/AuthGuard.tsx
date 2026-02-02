"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading3D from "./Loading3D";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard component that protects routes requiring authentication.
 * It checks for valid auth tokens and gracefully redirects to login if needed.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Helper to check if JWT token is still valid
    const isTokenValid = (token: string): boolean => {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        const payload = JSON.parse(atob(parts[1]));
        // Check if token has not expired (exp is in seconds, Date.now() is in ms)
        return payload.exp * 1000 > Date.now();
      } catch {
        return false;
      }
    };

    const checkAuth = () => {
      try {
        const auth = localStorage.getItem("farmvoice_auth");
        const token = localStorage.getItem("farmvoice_token");

        if (auth === "true" && token && isTokenValid(token)) {
          setIsAuthenticated(true);
        } else {
          // Clear invalid/expired auth data
          localStorage.removeItem("farmvoice_auth");
          localStorage.removeItem("farmvoice_token");
          localStorage.removeItem("farmvoice_user");
          localStorage.removeItem("farmvoice_user_id");
          setIsAuthenticated(false);
          router.replace("/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        router.replace("/login");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  // Show loading while checking authentication
  if (isChecking || isAuthenticated === null) {
    return <Loading3D message="Verifying session..." />;
  }

  // If not authenticated, return null to prevent any UI flash
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}
