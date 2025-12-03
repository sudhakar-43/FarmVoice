"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginPage from "@/components/LoginPage";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = localStorage.getItem("farmvoice_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
      router.push("/home");
    }
  }, [router]);

  if (isAuthenticated) {
    return null;
  }

  return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
}

