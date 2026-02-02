"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SignupPage from "@/components/SignupPage";

export default function Signup() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const auth = localStorage.getItem("farmvoice_auth");
    const token = localStorage.getItem("farmvoice_token");

    if (auth === "true" && token) {
      // User is already logged in, redirect to home
      router.push("/home");
    } else {
      setIsAuthenticated(false);
    }
  }, [router]);

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return null;
  }

  const handleSignup = () => {
    setIsAuthenticated(true);
  };

  return <SignupPage onSignup={handleSignup} />;
}
