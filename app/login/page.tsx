"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginPage from "@/components/LoginPage";

export default function Login() {
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

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return <LoginPage onLogin={handleLogin} />;
}
