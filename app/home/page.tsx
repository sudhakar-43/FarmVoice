"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HomePage from "@/components/HomePage";
import Onboarding from "@/components/Onboarding";
import NewLoader from "@/components/NewLoader";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem("farmvoice_auth");
    if (auth !== "true") {
      router.push("/");
      return;
    }
    
    setIsAuthenticated(true);
    
    // Check onboarding status
    const checkOnboarding = async () => {
      try {
        const token = localStorage.getItem("farmvoice_token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/farmer/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          // We just check if profile exists/is valid, but we don't block for onboarding/crops anymore here
          // as those are handled in their respective routes/flows
        }
      } catch (err) {
        console.error("Error checking onboarding:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkOnboarding();
  }, [router]);

  if (!isAuthenticated || isLoading) {
    return <NewLoader />;
  }





  return <HomePage />;
}

