"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HomePage from "@/components/HomePage";
import Loading3D from "@/components/Loading3D";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check auth immediately
    const checkAuth = () => {
      const auth = localStorage.getItem("farmvoice_auth");
      if (auth !== "true") {
        router.push("/");
        return false;
      }
      return true;
    };

    if (!checkAuth()) return;
    
    setIsAuthenticated(true);
    
    // Check profile with timeout to prevent hanging
    const checkProfile = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const token = localStorage.getItem("farmvoice_token");
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/farmer/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log("Profile check timed out, continuing...");
        } else {
          console.error("Profile check error:", err);
        }
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };
    
    checkProfile();
  }, [router]);

  if (isLoading) {
    return <Loading3D message="Loading your farm..." />;
  }

  if (!isAuthenticated) {
    return <Loading3D message="Redirecting..." />;
  }

  return <HomePage />;
}
